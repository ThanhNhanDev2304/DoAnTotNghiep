import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/lib/decorator/metadata';
import { LoginDto, RegisterDto } from '@/auth/dto/create-auth.dto';
import type { Request, Response } from 'express';
import { GoogleUserDecorator, User } from '@/lib/decorator/user.decorator';
import type { GoogleUser } from '@/auth/passport/google/google-user.interface';
import { UserEntity } from '@/users/entities/user.entity';
import { LocalAuthGuard } from '@/lib/passport/local-auth.guard';
import { GoogleAuthGuard } from '@/lib/passport/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';

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
    @ApiOperation({ summary: 'Register a new user' }) // Add Swagger documentation for this endpoint
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
    @ApiOperation({ summary: 'Login a user for a session and cookie management' }) // Add Swagger documentation for this endpoint
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
    @ApiOperation({ summary: 'Refresh access token using a valid refresh token stored in cookies' }) // Add Swagger documentation for this endpoint
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

    @Get('profile')
    @ApiOperation({ summary: 'Get the profile of the currently authenticated user' }) // Add Swagger documentation for this endpoint
    async getProfile(@User() user: UserEntity) {
        try {
            return {
            message: 'Profile retrieved successfully',
            user: user,
        };
        } catch (error) {
            throw new BadRequestException('Failed to retrieve profile', (error as Error).message);
        }
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout the currently authenticated user' }) // Add Swagger documentation for this endpoint
    async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request, @User() user: UserEntity) {
        const oldCookieRefreshToken = req.cookies[this.refreshTokenName];
        if (!oldCookieRefreshToken) {
            throw new BadRequestException('Refresh token is missing in cookies');
        }
        const result: boolean = await this.authService.logout(user, oldCookieRefreshToken, res);
        return { message: 'Logout successful', result };
    }

    @Post('logout-all')
    @ApiOperation({ summary: 'Logout the currently authenticated user from all devices' }) // Add Swagger documentation for this endpoint
    async logoutAll(@Res({ passthrough: true }) res: Response, @User() user: UserEntity) {
        const result: boolean = await this.authService.logoutAll(user, res);
        return { message: 'All sessions logged out successfully', result };
    }

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google')
    @ApiOperation({ summary: 'Initiate Google Login', description: 'With this endpoint, you can set cookie deviceId and then start google login' })
    async googleAuth() {
        // Guard redirects to Google, no implementation needed here
    }

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    @ApiOperation({ summary: 'Google Auth Callback' })
    async googleAuthRedirect(
        @GoogleUserDecorator() googleUser: GoogleUser,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        // Thực tế có thể lưu deviceId vào cookie trước khi gọi /auth/google và lấy ra ở đây.
        const deviceId = req.cookies['deviceId'];
        if(!deviceId){
            throw new BadRequestException('Device id is missing in cookies');
        }

        const result = await this.authService.googleLogin(googleUser, res, deviceId);
        
        // Sau khi đăng nhập thành công, bạn thường sẽ muốn redirect người dùng về giao diện Frontend
        // Ví dụ: return res.redirect('http://localhost:3000/dashboard');
        return {
            message: 'Google Login successful',
            accessToken: result.accessToken,
            user: result.user,
        };
    }
}
