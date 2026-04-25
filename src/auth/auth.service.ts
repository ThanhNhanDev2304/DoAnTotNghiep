import { PrismaService } from '@/prisma/prisma.service';
import { SessionService } from '@/session/session.service';
import { UsersService } from '@/users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from '@/auth/dto/create-auth.dto';
import type { GoogleUser } from '@/auth/passport/google/google-user.interface';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { comparePassword } from '@/lib/bcrypt/bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from '@/users/entities/user.entity';
import type { Response } from 'express';
import ms from 'ms';
import { CreateSessionDto } from '@/session/dto/create-session.dto';

@Injectable()
export class AuthService {
    private readonly CookieSameSite: 'lax' | 'strict' | 'none' = 'lax'; // You can adjust this based on your needs, defaulting is 'lax'
    private readonly refreshTokenName: string;
    private readonly expiresInRefresh: string;
    private readonly refreshTokenSecret: string;
    private readonly defaultRoleName: string;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly sessionService: SessionService

    ) {
        this.refreshTokenName = this.configService.get<string>('NAME_COOKIE_REFRESH_TOKEN_BROWSER')!;
        this.expiresInRefresh = this.configService.get<string>('JWT_REFRESH_EXPIRE')!;
        this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET')!;
        if (!this.refreshTokenName || this.refreshTokenName.trim() === '') {
            throw new Error('Refresh token cookie name is not defined in environment variables');
        }
        if (!this.expiresInRefresh || this.expiresInRefresh.trim() === '') {
            throw new Error('JWT refresh token expiration is not defined in environment variables');
        }
        if (!this.refreshTokenSecret || this.refreshTokenSecret.trim() === '') {
            throw new Error('JWT refresh token secret is not defined in environment variables');
        }

        this.defaultRoleName = this.configService.get<string>('NAME_ROLE_USER') || 'USER';
    }

    private async generateRefreshToken(payload: { userId: string; _sub: string, deviceId: string }): Promise<string> {
        const expiresIn = this.expiresInRefresh;
        const secret = this.refreshTokenSecret;
        if (!expiresIn || !secret) {
            throw new Error('JWT refresh token or secret is not defined in environment variables');
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
            throw new BadRequestException('This account uses Google Sign-In',);
        }
        if (!user.password) {
            throw new BadRequestException('This account does not support password login');
        }
        const authPass = await comparePassword(password, user.password);
        if (!authPass) {
            return null;
        }
        const getRoleUser = user.roleId ? await this.prismaService.role.findUnique({ where: { id: user.roleId.toString() } }) : null;
        return plainToInstance(UserEntity, { ...user, roleName: getRoleUser ? getRoleUser.roleName : null }, { excludeExtraneousValues: false });
    }

    async register(registerDto: RegisterDto) {
        try {
            const { userName, email, password } = registerDto;
            const CreateUserDto: CreateUserDto = {
                email,
                userName,
                password,
                roleName: this.defaultRoleName
            };
            const result = await this.usersService.create(CreateUserDto);
            return result;
        } catch (error: any) {
            console.error('Error registering user:', error);
            throw new BadRequestException('Failed to register user', error.message);
        }
    }

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
                throw new BadRequestException('Failed to create or update session in database');
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
            throw new BadRequestException('Failed to login user', (error as Error).message);
        }
    }

    async refreshToken(oldCookieRefreshToken: string, res: Response) {
        try {
            if (!oldCookieRefreshToken || oldCookieRefreshToken.trim() === '' || oldCookieRefreshToken === 'undefined') {
                throw new BadRequestException('Refresh token is missing !');
            }
            const decodedRefreshToken = this.jwtService.verify(oldCookieRefreshToken, { secret: this.refreshTokenSecret });
            if (!decodedRefreshToken || typeof decodedRefreshToken === 'string' || !decodedRefreshToken.userId || !decodedRefreshToken._sub || !decodedRefreshToken.deviceId) {
                throw new BadRequestException('Invalid refresh token payload');
            }
            const session = await this.sessionService.findSessionByRefreshTokenAndDeviceId(oldCookieRefreshToken, decodedRefreshToken.deviceId);
            if (!session) {
                throw new BadRequestException('Invalid refresh token or session not found');
            }
            const userFetch = await this.prismaService.user.findUnique({ where: { id: session.userId }, include: { role: true } });
            if (!userFetch || userFetch.id !== decodedRefreshToken.userId) {
                throw new BadRequestException('User not found for the given refresh token');
            }
            const userEntity = plainToInstance(UserEntity, { ...userFetch, roleName: userFetch.role ? userFetch.role.roleName : null }, { excludeExtraneousValues: false });
            res.clearCookie(this.refreshTokenName); // Clear old refresh token cookie
            return await this.login(userEntity, res, decodedRefreshToken.deviceId); // Reuse login logic to generate new tokens and set cookie
        } catch (error: any) {
            throw new BadRequestException('Failed to refresh token', error.message);
        }
    }

    async googleLogin( googleUser: GoogleUser, res: Response, deviceId: string, ) {
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
            throw new BadRequestException('This email address has already been registered with Google.',);
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
                throw new BadRequestException(
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

            user = await this.prismaService.user.create({
                data: {
                    email: googleUser.email,
                    userName: baseUsername,
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
                throw new BadRequestException('Invalid refresh token payload');
            }
            const result = await this.sessionService.deleteSessionByDeviceId(user.id, decodedRefreshToken.deviceId);
            if (!result) {
                throw new BadRequestException('Failed to delete session for the given device');
            }
            res.clearCookie(this.refreshTokenName); // Clear refresh token cookie on logout
            return result;
        } catch (error: any) {
            throw new BadRequestException('Failed to logout user', error.message);
        }
    }

    async logoutAll(user: UserEntity, res: Response): Promise<boolean> {
        try {
            const result = await this.sessionService.deleteSessionsByUserId(user.id);
            if (!result) {
                throw new BadRequestException('Failed to delete sessions for the given user');
            }
            res.clearCookie(this.refreshTokenName); // Clear refresh token cookie on logout
            return result;
        } catch (error: any) {
            throw new BadRequestException('Failed to logout user from all sessions', error.message);
        }
    }
}
