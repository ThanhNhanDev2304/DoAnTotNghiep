import { PrismaService } from '@/prisma/prisma.service';
import { SessionService } from '@/session/session.service';
import { UsersService } from '@/users/users.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {  RegisterDto, VerifyRegisterOtpDto, ResendRegisterOtpDto } from '@/auth/dto/create-auth.dto';
import type { GoogleUser } from '@/auth/passport/google/google-user.interface';
import { comparePassword, generatePasswordHash } from '@/lib/bcrypt/bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from '@/users/entities/user.entity';
import type { Response } from 'express';
import ms from 'ms';
import { CreateSessionDto } from '@/session/dto/create-session.dto';
import { generateNumericOtp } from '@/common/otp/generate-otp';
import { EmailService } from '@/email/email.service';
import { ConflictException, InternalServerException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import { IApiResponse } from '@/common/interceptors/transform.interceptor';

@Injectable()
export class AuthService {
    private readonly CookieSameSite: 'lax' | 'strict' | 'none' = 'lax'; // You can adjust this based on your needs, defaulting is 'lax'
    private readonly refreshTokenName: string;
    private readonly expiresInRefresh: string;
    private readonly refreshTokenSecret: string;
    private readonly defaultRoleName: string;
    private readonly saltRounds: number;
    private readonly otpExpire: string;
    private readonly otpLength: number;
    private readonly otpMaxAttempts: number;
    private readonly otpResendCooldown: string;


    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly sessionService: SessionService,
        private readonly emailService: EmailService

    ) {
        this.refreshTokenName = this.configService.get<string>('NAME_COOKIE_REFRESH_TOKEN_BROWSER')!;
        this.expiresInRefresh = this.configService.get<string>('JWT_REFRESH_EXPIRE')!;
        this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET')!;
        this.saltRounds = Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10');

        this.otpExpire = this.configService.get<string>('OTP_EXPIRE')!;
        this.otpLength = Number(this.configService.get<string>('OTP_LENGTH'));
        this.otpMaxAttempts = Number(this.configService.get<string>('OTP_MAX_ATTEMPTS'));
        this.otpResendCooldown = this.configService.get<string>('OTP_RESEND_COOLDOWN')!;
        if (!this.refreshTokenName || this.refreshTokenName.trim() === '') {
            throw new Error('Refresh token cookie name is not defined in environment variables');
        }
        if (!this.expiresInRefresh || this.expiresInRefresh.trim() === '') {
            throw new Error('JWT refresh token expiration is not defined in environment variables');
        }
        if (!this.refreshTokenSecret || this.refreshTokenSecret.trim() === '') {
            throw new Error('JWT refresh token secret is not defined in environment variables');
        }
        if (!this.otpExpire || this.otpExpire.trim() === '') {
            throw new Error('OTP_EXPIRE is not defined in environment variables');
        }
        if (!this.otpLength || !Number.isInteger(this.otpLength) || this.otpLength < 4) {
            throw new Error('OTP_LENGTH is not defined or must be an integer >= 4');
        }
        if (!this.otpMaxAttempts || !Number.isInteger(this.otpMaxAttempts) || this.otpMaxAttempts <= 0) {
            throw new Error('OTP_MAX_ATTEMPTS is not defined or must be a positive integer in environment variables');
        }
        if (!this.otpResendCooldown || this.otpResendCooldown.trim() === '') {
            throw new Error('OTP_RESEND_COOLDOWN is not defined in environment variables');
        }

        this.defaultRoleName = this.configService.get<string>('NAME_ROLE_USER') || 'USER';
    }

    async registerWithOTP(registerDto: RegisterDto): Promise<string> {
        try {
            const now = new Date();
            const { userName, email, password } = registerDto;

            const existedUser = await this.usersService.checkEmailOrUsernameExists(email, userName);
            if (existedUser.exists) {
                if (existedUser.field === 'email') {
                    throw new ConflictException('Email already exists');
                }
                throw new ConflictException('Username already exists');
            }

            const pendingByEmail = await this.prismaService.pendingRegistration.findUnique({ where: { email } });
            const pendingByUsername = await this.prismaService.pendingRegistration.findUnique({ where: { userName } });
            if (pendingByEmail && pendingByEmail.otpExpiresAt <= now) {
                await this.prismaService.pendingRegistration.delete({
                    where: { email: pendingByEmail.email },
                });
            }
            if (pendingByUsername && pendingByUsername.otpExpiresAt <= now && pendingByUsername.email !== email) {
                await this.prismaService.pendingRegistration.delete({
                    where: { email: pendingByUsername.email },
                });
            }

            const activePendingByEmail = await this.prismaService.pendingRegistration.findUnique({ where: { email } });
            const activePendingByUsername = await this.prismaService.pendingRegistration.findUnique({ where: { userName } });
            if (activePendingByEmail || activePendingByUsername) {
                throw new ConflictException(`A pending registration with this ${activePendingByEmail ? 'email' : 'username'} already exists. Please verify OTP or wait until it expires.`);
            }

            const passwordHash = await generatePasswordHash(password, this.saltRounds);
            const otp = generateNumericOtp(this.otpLength);
            const otpHash = await generatePasswordHash(otp, this.saltRounds);
            const otpExpiresAt = new Date(
                Date.now() + ms(this.otpExpire as ms.StringValue),
            );

            const pendingRegistration = await this.prismaService.pendingRegistration.upsert({
                where: { email },
                update: {
                    userName, passwordHash, otpHash, otpExpiresAt,
                    attemptCount: 0, // Reset attempt count and resendAfter on new registration or when re-registering after expiration
                    resendAfter: null,
                },
                create: {
                    email, userName, passwordHash, otpHash, otpExpiresAt,
                    attemptCount: 0,
                    resendAfter: null,
                },
            });

            // if pendingRegistration error 
            try {
                await this.emailService.sendRegisterOtp(email, userName, otp, this.otpExpire);
            } catch (error) {
                await this.prismaService.pendingRegistration.deleteMany({
                    where: {
                        email: pendingRegistration.email,
                    },
                });
                throw new ConflictException(
                    'Failed to send OTP email. Please try registering again.',
                );
            }

            console.log(`Generated OTP for ${email}: ${otp} (expires at ${otpExpiresAt.toISOString()})`); // Log OTP for testing purposes. Remove in production.
            return otp;
        } catch (error: any) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerException(`Failed to register user: ${error.message}`);
        }
    }


    async verifyRegisterOtp(verifyRegisterOtpDto: VerifyRegisterOtpDto): Promise<UserEntity> {
        try {
            const { email, otp } = verifyRegisterOtpDto;
            if (otp.length !== this.otpLength) {
                throw new ConflictException(`OTP must be exactly ${this.otpLength} digits`);
            }


            const pendingRegistration = await this.prismaService.pendingRegistration.findUnique({ where: { email } });
            if (!pendingRegistration) {
                throw new ConflictException('No pending registration found for this email');
            }
            if (pendingRegistration.otpExpiresAt <= new Date()) {
                throw new ConflictException('OTP has expired');
            }
            if (pendingRegistration.attemptCount >= this.otpMaxAttempts) {
                throw new ConflictException(
                    `OTP has been locked because too many incorrect attempts were made. Maximum allowed attempts is ${this.otpMaxAttempts}. Please request a new OTP after ${this.otpExpire} to continue.`,
                );
            }
            const isOtpValid = await comparePassword(
                otp,
                pendingRegistration.otpHash,
            );

            if (!isOtpValid) {
                const updatedPendingRegistration = await this.prismaService.pendingRegistration.update({
                    where: { email: pendingRegistration.email },
                    data: {
                        attemptCount: {
                            increment: 1,
                        },
                    },
                });

                const remainingAttempts = this.otpMaxAttempts - updatedPendingRegistration.attemptCount;

                if (remainingAttempts <= 0) {
                    throw new ConflictException('OTP has been locked because too many incorrect attempts were made.');
                }
                throw new ConflictException(`Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.` );
            }

            const existedUser = await this.prismaService.user.findFirst({
                where: {
                    OR: [
                        { email: pendingRegistration.email },
                        { userName: pendingRegistration.userName },
                    ],
                },
            });

            if (existedUser) {
                throw new ConflictException('User already exists with this email or username' );
            }

            const defaultRole = await this.prismaService.role.findUnique({
                where: {
                    roleName: this.defaultRoleName,
                },
            });
            if (!defaultRole) {
                throw new NotFoundException('Default role not found');
            }
            const createdUser = await this.prismaService.$transaction(async (tx) => {
                const newUser = await tx.user.create({
                    data: {
                        email: pendingRegistration.email,
                        userName: pendingRegistration.userName,
                        password: pendingRegistration.passwordHash,
                        roleId: defaultRole.id,
                        accountType: 'local',
                    },
                });

                await tx.pendingRegistration.delete({
                    where: { email: pendingRegistration.email },
                });

                return newUser;
            });

            return plainToInstance(UserEntity, createdUser, {
                    excludeExtraneousValues: false,
                })
        } catch (error: any) {
            if (error instanceof ConflictException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerException( `Failed to verify registration OTP: ${error.message}` );
        }
    }

    async resendRegisterOtp(resendRegisterOtpDto: ResendRegisterOtpDto): Promise<string> {
        try {
            const { email } = resendRegisterOtpDto;
            const now = new Date();

            const pendingRegistration = await this.prismaService.pendingRegistration.findUnique({ where: { email } });
            if (!pendingRegistration) {
                throw new ConflictException('No pending registration found for this email. Please register first.');
            }

            if (pendingRegistration.otpExpiresAt <= now) {
                throw new ConflictException('OTP has expired. Please register again to get a new OTP.');
            }

            // Check resend cooldown
            if (pendingRegistration.resendAfter && pendingRegistration.resendAfter > now) {
                const remainingMs = pendingRegistration.resendAfter.getTime() - now.getTime();
                const remainingSeconds = Math.ceil(remainingMs / 1000);
                throw new ConflictException(
                    `You can only resend OTP after ${remainingSeconds} second(s). Please wait before requesting a new OTP.`,
                );
            }

            // Reset attempt count on resend
            const otp = generateNumericOtp(this.otpLength);
            const otpHash = await generatePasswordHash(otp, this.saltRounds);
            const otpExpiresAt = new Date(Date.now() + ms(this.otpExpire as ms.StringValue));
            const resendAfter = new Date(Date.now() + ms(this.otpResendCooldown as ms.StringValue));

            const updatedPendingRegistration = await this.prismaService.pendingRegistration.update({
                where: { email },
                data: {
                    otpHash,
                    otpExpiresAt,
                    resendAfter,
                    attemptCount: 0, // Reset attempts on resend
                },
            });

            // Send new OTP email
            try {
                await this.emailService.sendRegisterOtp(email, updatedPendingRegistration.userName, otp, this.otpExpire);
            } catch (error) {
                throw new ConflictException('Failed to send OTP email. Please try again.');
            }

            console.log(`Resent OTP for ${email}: ${otp} (expires at ${otpExpiresAt.toISOString()})`); // Log OTP for testing purposes. Remove in production.

            return this.otpExpire;
        } catch (error: any) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new InternalServerException(`Failed to resend OTP: ${error.message}`);
        }
    }

    private async generateRefreshToken(payload: { userId: string; _sub: string, deviceId: string }): Promise<string> {
        const expiresIn = this.expiresInRefresh;
        const secret = this.refreshTokenSecret;
        if (!expiresIn || !secret) {
            throw new NotFoundException('JWT refresh token or secret is not defined in environment variables');
        }
        const expiresInMs: number = ms(expiresIn as ms.StringValue) / 1000; // Convert to seconds for JWT
        return this.jwtService.sign(payload, { expiresIn: expiresInMs, secret: secret });
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
        const getRoleUser = user.roleId ? await this.prismaService.role.findUnique({ where: { id: user.roleId.toString() } }) : null;
        return plainToInstance(UserEntity, { ...user, roleName: getRoleUser ? getRoleUser.roleName : null }, { excludeExtraneousValues: false });
    }

    // async register(registerDto: RegisterDto) {
    //     try {
    //         const { userName, email, password } = registerDto;
    //         const CreateUserDto: CreateUserDto = {
    //             email,
    //             userName,
    //             password,
    //             roleName: this.defaultRoleName
    //         };
    //         const result = await this.usersService.create(CreateUserDto);
    //         return result;
    //     } catch (error: any) {
    //         console.error('Error registering user:', error);
    //         throw new BadRequestException('Failed to register user', error.message);
    //     }
    // }

    async login(user: UserEntity, res: Response, deviceId: string): Promise<{ accessToken: string; user: Omit<UserEntity, 'password' | 'createdAt' | 'updatedAt'> }> {
        try {
            const refreshToken = await this.generateRefreshToken({ userId: user.id, _sub: user.roleName || user.email, deviceId });
            const createSessionDto: CreateSessionDto = {
                userId: user.id,
                refreshToken,
                deviceId
            };
            const setSessionDB = await this.sessionService.upsertSession(createSessionDto);
            if (!setSessionDB) {
                throw new ConflictException('Failed to create or update session in database');
            }
            const expiresInRefreshToken = this.expiresInRefresh;
            if (!expiresInRefreshToken) {
                throw new Error('JWT refresh token expiration is not defined in environment variables');
            }
            res.cookie(this.refreshTokenName, refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: this.CookieSameSite,
                maxAge: ms(expiresInRefreshToken as ms.StringValue) // Set cookie expiration to match refresh token expiration
            })
            const payload: Omit<UserEntity, 'password' | 'createdAt' | 'updatedAt'> = {
                id: user.id,
                email: user.email,
                avatarUrl: user.avatarUrl,
                backgroundUrl: user.backgroundUrl,
                description: user.description,
                userName: user.userName,
                accountType: user.accountType,
                roleId: user.roleId,
                roleName: user.roleName
            }
            return { accessToken: this.jwtService.sign(payload), user: payload };
        } catch (error) {
            throw new InternalServerException(`Failed to login user: ${(error as Error).message}`);
        }
    }

    async refreshToken(oldCookieRefreshToken: string, res: Response) {
        try {
            if (!oldCookieRefreshToken || oldCookieRefreshToken.trim() === '' || oldCookieRefreshToken === 'undefined') {
                throw new ValidationException('Refresh token is missing !');
            }
            const decodedRefreshToken = this.jwtService.verify(oldCookieRefreshToken, { secret: this.refreshTokenSecret });
            if (!decodedRefreshToken || typeof decodedRefreshToken === 'string' || !decodedRefreshToken.userId || !decodedRefreshToken._sub || !decodedRefreshToken.deviceId) {
                throw new ValidationException('Invalid refresh token payload');
            }
            const session = await this.sessionService.findSessionByRefreshTokenAndDeviceId(oldCookieRefreshToken, decodedRefreshToken.deviceId);
            if (!session) {
                throw new ValidationException('Invalid refresh token or session not found');
            }
            const userFetch = await this.prismaService.user.findUnique({ where: { id: session.userId }, include: { role: true } });
            if (!userFetch || userFetch.id !== decodedRefreshToken.userId) {
                throw new ValidationException('User not found for the given refresh token');
            }
            const userEntity = plainToInstance(UserEntity, { ...userFetch, roleName: userFetch.role ? userFetch.role.roleName : null }, { excludeExtraneousValues: false });
            res.clearCookie(this.refreshTokenName); // Clear old refresh token cookie
            return await this.login(userEntity, res, decodedRefreshToken.deviceId); // Reuse login logic to generate new tokens and set cookie
        } catch (error: any) {
            throw new InternalServerException(`Failed to refresh token: ${error.message}`);
        }
    }

    // Google login flow:
    async googleLogin(googleUser: GoogleUser, res: Response, deviceId: string,) {
        // Tìm user theo email trước
        let user = await this.prismaService.user.findUnique({
            where: {
                email: googleUser.email,
            },
            include: {
                role: true,
            },
        });

        /**
         * Business rule:
         * Nếu email đã tồn tại nhưng là local account
         * -> không cho login bằng Google trực tiếp
         */
        if (user && user.accountType === 'local') {
            throw new ConflictException('This email is already associated with a local account. Please sign in using your email and password instead of Google Login.');
        }

        /**
         * Nếu chưa có user -> tạo mới account Google còn không thì chuyển qua trang login luôn
         */
        if (!user) {
            const defaultRole = await this.prismaService.role.findUnique({
                where: {
                    roleName: this.defaultRoleName,
                },
            });
            if (!defaultRole) {
                throw new NotFoundException(
                    'Default role not found',
                );
            }

            /**
             * Tránh duplicate username:
             * abc@gmail.com
             * abc@yahoo.com
             * -> abc_17123456789
             */
            const baseUsername = googleUser.email.split('@')[0];
            // const baseUsername = googleUser.email.toLowerCase().trim();
            const username = `${baseUsername}_${Date.now()}`;
            // const username = googleUser.email.toLowerCase();

            user = await this.prismaService.user.create({
                data: {
                    email: googleUser.email,
                    userName: username,
                    googleId: googleUser.googleId,
                    accountType: 'google',

                    avatarUrl: googleUser.avatarUrl,

                    password: null,

                    roleId: defaultRole.id,
                },
                include: {
                    role: true,
                },
            });
        }

        /**
         * Convert sang UserEntity
         */
        const userEntity = plainToInstance(
            UserEntity,
            {
                ...user,
                roleName: user.role?.roleName ?? null,
            },
            {
                excludeExtraneousValues: false,
            },
        );

        /**
         * Reuse login() để:
         * - tạo accessToken
         * - tạo refreshToken
         * - lưu session DB
         * - set cookie
         */
        return this.login(
            userEntity,
            res,
            deviceId,
        );
    }

    async logout(user: UserEntity, oldCookieRefreshToken: string, res: Response): Promise<boolean> {
        try {
            const decodedRefreshToken = this.jwtService.verify(oldCookieRefreshToken, { secret: this.refreshTokenSecret });
            if (!decodedRefreshToken || typeof decodedRefreshToken === 'string' || !decodedRefreshToken.userId || !decodedRefreshToken._sub || !decodedRefreshToken.deviceId) {
                throw new ValidationException('Invalid refresh token payload');
            }
            const result = await this.sessionService.deleteSessionByDeviceId(user.id, decodedRefreshToken.deviceId);
            if (!result) {
                throw new ValidationException('Failed to delete session for the given device');
            }
            res.clearCookie(this.refreshTokenName); // Clear refresh token cookie on logout
            return result;
        } catch (error: any) {
            throw new InternalServerException(`Failed to logout user: ${error.message}`);
        }
    }

    async logoutAll(user: UserEntity, res: Response): Promise<boolean> {
        try {
            const result = await this.sessionService.deleteSessionsByUserId(user.id);
            if (!result) {
                throw new ValidationException('Failed to delete sessions for the given user');
            }
            res.clearCookie(this.refreshTokenName); // Clear refresh token cookie on logout
            return result;
        } catch (error: any) {
            throw new InternalServerException(`Failed to logout user from all sessions: ${error.message}`);
        }
    }
}
