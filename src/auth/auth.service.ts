import { PrismaService } from '@/prisma/prisma.service';
import { SessionService } from '@/session/session.service';
import { UsersService } from '@/users/users.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '@/auth/dto/create-auth.dto';
import { CreateUserDto } from '@/users/dto/create-user.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly sessionService: SessionService

    ) { }
    private readonly refresh_token: string = "";

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
            console.log('Registered user:', result);
            return result;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }
}
