import { PrismaService } from '@/prisma/prisma.service';
import { SessionService } from '@/session/session.service';
import { UsersService } from '@/users/users.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, VerifyRegisterOtpDto, ResendRegisterOtpDto, VerifyEmailDto, ChangePasswordVerifyDto } from '@/auth/dto/create-auth.dto';
import type { GoogleUser } from '@/auth/passport/google/google-user.interface';
import { comparePassword } from '@/lib/bcrypt/bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from '@/users/entities/user.entity';
import type { Response } from 'express';
import { ConflictException, InternalServerException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import { TokenService } from '@/auth/services/token.service';
import { GoogleService } from '@/auth/services/google.service';
import { PasswordService } from '@/auth/services/password.service';
import { RegisterService } from '@/auth/services/register.service';

@Injectable()
export class AuthService {
    private readonly refreshTokenName: string;
    private readonly refreshTokenSecret: string;


    constructor(
        // Services for specific features
        private readonly tokenService: TokenService,
        private readonly googleService: GoogleService,
        private readonly passwordService: PasswordService,
        private readonly registerService: RegisterService,
        // Common services
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly sessionService: SessionService
    ) {
        this.refreshTokenName = this.configService.get<string>('NAME_COOKIE_REFRESH_TOKEN_BROWSER')!;
        this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET')!;

        if (!this.refreshTokenName || this.refreshTokenName.trim() === '') {
            throw new Error('Refresh token cookie name is not defined in environment variables');
        }
        if (!this.refreshTokenSecret || this.refreshTokenSecret.trim() === '') {
            throw new Error('JWT refresh token secret is not defined in environment variables');
        }
    }

    async registerWithOTP(registerDto: RegisterDto): Promise<{ otpExpire: string }> {
        try {
            return this.registerService.register(registerDto);
        } catch (error: any) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerException(`Failed to register user: ${error.message}`);
        }
    }

    async verifyRegisterOtp(verifyRegisterOtpDto: VerifyRegisterOtpDto): Promise<UserEntity> {
        try {
            return this.registerService.verifyOtp(verifyRegisterOtpDto);
        } catch (error: any) {
            if (error instanceof ConflictException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerException(`Failed to verify registration OTP: ${error.message}`);
        }
    }

    async resendRegisterOtp(resendRegisterOtpDto: ResendRegisterOtpDto): Promise<{ otpExpire: string }> {
        try {
            return this.registerService.resendOtp(resendRegisterOtpDto.email);
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerException(`Failed to resend OTP: ${(error as Error).message}`);
        }
    }

    async sendChangePasswordOtp(verifyEmailDto: VerifyEmailDto): Promise<{ otpExpire: string }> {
        try {
            return this.passwordService.sendOtp(verifyEmailDto);
        } catch (error: any) {
            if (error instanceof ConflictException || error instanceof ValidationException) {
                throw error;
            }
            throw new InternalServerException(`Failed to send change password OTP: ${error.message}`);
        }
    }

    async verifyChangePasswordOtp(changePasswordVerifyDto: ChangePasswordVerifyDto): Promise<UserEntity> {
        try {
            return this.passwordService.verifyAndChange(changePasswordVerifyDto);
        } catch (error: any) {
            if (error instanceof ConflictException ||
                error instanceof NotFoundException ||
                error instanceof ValidationException) {
                throw error;
            }
            throw new InternalServerException(`Failed to verify change password OTP: ${error.message}`);
        }
    }

    async validateUser(userNameOrEmail: string, password: string) {
        const user = await this.usersService.searchUserByEmailOrUsername(userNameOrEmail);
        if (!user) {
            return null;
        }
        if (user.accountType !== 'local') {
            throw new ConflictException('This account uses Google Sign-In',);
        }
        if (!user.password) {
            throw new ConflictException('This account does not support password login');
        }
        const authPass = await comparePassword(password, user.password);
        if (!authPass) {
            return null;
        }
        return plainToInstance(UserEntity, user, { excludeExtraneousValues: false });
    }

    async login(user: UserEntity, res: Response, deviceId: string): Promise<{ accessToken: string; user: Omit<UserEntity, 'password' | 'createdAt' | 'updatedAt'> }> {
        try {
            return this.tokenService.login(user, res, deviceId);
        } catch (error: any) {
            throw new InternalServerException(`Failed to login user: ${error.message}`);
        }
    }

    async refreshToken(oldCookieRefreshToken: string, res: Response) {
        try {
            if (!oldCookieRefreshToken || oldCookieRefreshToken.trim() === '' || oldCookieRefreshToken === 'undefined') {
                throw new ValidationException('Refresh token is missing !');
            }
            const decodedRefreshToken = this.jwtService.verify(oldCookieRefreshToken, { secret: this.refreshTokenSecret });
            if (!decodedRefreshToken || typeof decodedRefreshToken === 'string' || !decodedRefreshToken.userId || 
                !decodedRefreshToken._sub || !decodedRefreshToken.deviceId || typeof decodedRefreshToken.userId !== 'string' ||
                typeof decodedRefreshToken._sub !== 'object' || typeof decodedRefreshToken._sub.email !== 'string' ||
                typeof decodedRefreshToken._sub.roleName !== 'string' || typeof decodedRefreshToken.deviceId !== 'string'
            ) {
                console.error('Decoded refresh token payload is invalid:', decodedRefreshToken);
                throw new ValidationException('Invalid refresh token payload');
            }
            const session = await this.sessionService.findSessionByRefreshTokenAndDeviceId(oldCookieRefreshToken, decodedRefreshToken.deviceId);
            if (!session) {
                throw new ValidationException('Invalid refresh token or session not found');
            }
            const userFetch = await this.prismaService.user.findUnique({ where: { id: session.userId }, include: { role: { select: { roleName: true } } } });
            if (!userFetch || userFetch.id !== decodedRefreshToken.userId) {
                throw new ValidationException('User not found for the given refresh token');
            }
            const { role, ...userData } = userFetch; // destructure to separate role from user data 
            res.clearCookie(this.refreshTokenName); // Clear old refresh token cookie
            return await this.login(plainToInstance(UserEntity, { ...userData, roleName: userFetch.role ? userFetch.role.roleName : null }, { excludeExtraneousValues: false }), res, decodedRefreshToken.deviceId); // Reuse login logic to generate new tokens and set cookie
        } catch (error: any) {
            throw new InternalServerException(`Failed to refresh token: ${error.message}`);
        }
    }

    // Google login flow:
    async googleLogin(googleUser: GoogleUser, res: Response, deviceId: string,) {
        try {
            return this.googleService.login(googleUser, res, deviceId);
        } catch (error) {
            throw new InternalServerException(`Failed to login with Google: ${(error as Error).message}`);
        }
    }

    async logout(user: UserEntity, oldCookieRefreshToken: string, res: Response): Promise<boolean> {
        try {
            return this.tokenService.logout(user.id, oldCookieRefreshToken, res);
        } catch (error: any) {
            throw new InternalServerException(`Failed to logout user: ${error.message}`);
        }
    }

    async logoutAll(user: UserEntity, res: Response): Promise<boolean> {
        try {
            return this.tokenService.logoutAll(user.id, res);
        } catch (error: any) {
            throw new InternalServerException(`Failed to logout user from all sessions: ${error.message}`);
        }
    }
}
