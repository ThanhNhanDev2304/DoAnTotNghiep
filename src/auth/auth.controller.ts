import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/lib/decorator/metadata';
import { RegisterDto } from '@/auth/dto/create-auth.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from '@/lib/passport/jwt-auth.guard';
import { User } from '@/lib/decorator/user.decorator';
import { UserEntity } from '@/users/entities/user.entity';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {

    }

    @Public() // Mark this route as public, allowing access without JWT authentication.
    @Post('register')
    async register(
        @Body() registerDto: RegisterDto,
        @Res({ passthrough: true }) res: Response
     ) {
        const newAccount = await this.authService.register(registerDto);
        return {
            message: 'User registered successfully',
            result: newAccount,
        };
    }

    @Public()
    @UseGuards(JwtAuthGuard) // Apply the JWT authentication guard to this route
    @Post('login')
    async login(@Res({ passthrough: true }) res: Response, @User() user: UserEntity) {
        return await this.authService.login(user, res);

    }
}
