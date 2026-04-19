import { PrismaService } from '@/prisma/prisma.service';
import { SessionService } from '@/session/session.service';
import { UsersService } from '@/users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from '@/auth/dto/create-auth.dto';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { comparePassword } from '@/lib/bcrypt/bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from '@/users/entities/user.entity';
import type { Response } from 'express';
import ms from 'ms';
import { CreateSessionDto } from '@/session/dto/create-session.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly sessionService: SessionService

    ) { }
    private readonly refresh_token: string = "refresh_token";

    private async generateRefreshToken(payload: { userId: string; _sub: string, deviceId: string }): Promise<string> {
        const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRE');
        const secret = this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET');
        if (!expiresIn || !secret) {
            throw new Error('JWT refresh token or secret is not defined in environment variables');
        }
        const expiresInMs: number = ms(expiresIn as ms.StringValue) / 1000; // Convert to seconds for JWT
        return this.jwtService.sign(payload, { expiresIn: expiresInMs, secret: secret });
    }

    async validateUser(userNameOrEmail: string, password: string) {
        const user = await this.usersService.searchUserByEmailOrUsername(userNameOrEmail);
        if(!user){
            return null;
        }
        const getRoleUser = user.roleId ? await this.prismaService.role.findUnique({ where: { id: user.roleId.toString() } }) : null;
        const authPass = await comparePassword(password, user.password);
        if(!authPass){
            return null;
        }
        return plainToInstance(UserEntity, { ...user, roleName: getRoleUser ? getRoleUser.roleName : null }, { excludeExtraneousValues: false });
    }

    async register(registerDto: RegisterDto) {
        try {
            const { userName, email, password } = registerDto;
            const CreateUserDto: CreateUserDto = {
                email,
                userName,
                password,
                roleName: this.configService.get<string>('NAME_ROLE_USER') || 'USER'
            };
            const result = await this.usersService.create(CreateUserDto);
            return result;
        } catch (error: any) {
            console.error('Error registering user:', error);
            throw new BadRequestException('Failed to register user', error.message);
        }
    }

    async login(user: UserEntity, res: Response, loginDto: LoginDto) {
        const refreshToken = await this.generateRefreshToken({ userId: user.id, _sub: user.roleName || user.email, deviceId: loginDto.deviceId });
        const createSessionDto: CreateSessionDto = {
            userId: user.id,
            refreshToken,
            deviceId: loginDto.deviceId
        };
        const setSessionDB = await this.sessionService.upsertSession(createSessionDto);
        if (!setSessionDB) {
            throw new BadRequestException('Failed to create or update session in database');
        }
        const expiresInRefreshToken = this.configService.get<string>('JWT_REFRESH_EXPIRE');
        if (!expiresInRefreshToken) {
            throw new Error('JWT refresh token expiration is not defined in environment variables');
        }
        res.cookie( this.refresh_token, refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: ms(expiresInRefreshToken as ms.StringValue) // Set cookie expiration to match refresh token expiration
        })
        const payload: Omit<UserEntity, 'password' | 'createdAt' | 'updatedAt'> = {
            id: user.id,
            email: user.email,
            avatarUrl: user.avatarUrl,
            backgroundUrl: user.backgroundUrl,
            description: user.description,
            userName: user.userName,
            roleId: user.roleId,
            roleName: user.roleName
        }
        return { accessToken: this.jwtService.sign(payload), user: payload };
    }
}
