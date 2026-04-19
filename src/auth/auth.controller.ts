import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/lib/decorator/metadata';
import { RegisterDto } from '@/auth/dto/create-auth.dto';
import type { Response } from 'express';

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
}
