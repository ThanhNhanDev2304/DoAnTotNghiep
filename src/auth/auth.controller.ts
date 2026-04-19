import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/lib/decorator/metadata';
import { LoginDto, RegisterDto } from '@/auth/dto/create-auth.dto';
import type { Response } from 'express';
import { User } from '@/lib/decorator/user.decorator';
import { UserEntity } from '@/users/entities/user.entity';
import { LocalAuthGuard } from '@/lib/passport/local-auth.guard';

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
    @UseGuards(LocalAuthGuard) // Apply the local authentication guard to this route
    @Post('login')
    async login(@Res({ passthrough: true }) res: Response, @User() user: UserEntity, @Body() loginDto: LoginDto ) {
        const result = await this.authService.login(user, res, loginDto);
        return {
            message: 'Login successful',
            accessToken: result.accessToken,
            user: result.user,
        };
    }


}
