import { BadRequestException, Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/lib/decorator/metadata';
import { LoginDto, RegisterDto } from '@/auth/dto/create-auth.dto';
import type { Request, Response } from 'express';
import { User } from '@/lib/decorator/user.decorator';
import { UserEntity } from '@/users/entities/user.entity';
import { LocalAuthGuard } from '@/lib/passport/local-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    private readonly refreshTokenName: string;
    constructor(
        private readonly authService: AuthService,
        private readonly ConfigService: ConfigService
    ) {
        this.refreshTokenName = this.ConfigService.get<string>('NAME_COOKIE_REFRESH_TOKEN_BROWSER')!;
        if (!this.refreshTokenName || this.refreshTokenName.trim() === '') {
            throw new Error('Refresh token cookie name is not defined in environment variables');
        }

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
        const result = await this.authService.login(user, res, loginDto.deviceId);
        return {
            message: 'Login successful',
            accessToken: result.accessToken,
            user: result.user,
        };
    }


    @Public()
    @Post('refresh')
    async refreshToken(@Res({ passthrough: true }) res: Response, @Req() req: Request ){
        const oldCookieRefreshToken = req.cookies[this.refreshTokenName];
        if (!oldCookieRefreshToken) {
            throw new BadRequestException('Refresh token is missing in cookies');
        }
        const result = await this.authService.refreshToken(oldCookieRefreshToken, res);
        return {
            message: 'Token refreshed successfully',
            accessToken: result.accessToken,
            user: result.user,
        };
    }

}
