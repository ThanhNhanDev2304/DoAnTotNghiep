import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/common/decorators/metadata';
import { LoginDto, RegisterDto, VerifyRegisterOtpDto, ResendRegisterOtpDto } from '@/auth/dto/create-auth.dto';
import type { Request, Response } from 'express';
import { UserGoogle, User, DeviceId } from '@/common/decorators/user.decorator';
import type { GoogleUser } from '@/auth/passport/google/google-user.interface';
import { UserEntity } from '@/users/entities/user.entity';
import { LocalAuthGuard } from '@/lib/passport/local-auth.guard';
import { GoogleAuthGuard } from '@/lib/passport/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiOperation } from '@nestjs/swagger';
import { IApiResponse } from '@/common/interceptors/transform.interceptor';
import { ConflictException, InternalServerException, NotFoundException } from '@/common/exceptions/app.exception';

@Controller('auth')
export class AuthController {
    private readonly refreshTokenName: string;
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService
    ) {
        this.refreshTokenName = this.configService.get<string>('NAME_COOKIE_REFRESH_TOKEN_BROWSER')!;
        if (!this.refreshTokenName || this.refreshTokenName.trim() === '') {
            throw new Error('Refresh token cookie name is not defined in environment variables');
        }

    }

    @Public() // Mark this route as public, allowing access without JWT authentication.
    @ApiOperation({ summary: 'Register a new user' }) // Add Swagger documentation for this endpoint
    @Post('register')
    async register(@Body() registerDto: RegisterDto): Promise<IApiResponse<any>> {
        await this.authService.registerWithOTP(registerDto);
        return { statusCode: 201, message: 'Registration initiated successfully. Please verify the OTP sent to your email to complete registration.', data: null };
    }

    @Public()
    @Post('verify-register-otp')
    @ApiOperation({ summary: 'Verify OTP and complete account registration' })
    async verifyRegisterOtp(@Body() verifyRegisterOtpDto: VerifyRegisterOtpDto): Promise<IApiResponse<UserEntity>> {
        const user = await this.authService.verifyRegisterOtp(verifyRegisterOtpDto);
        return { statusCode: 200, message: 'Account verified and created successfully', data: user };
    }

    @Public()
    @Post('resend-register-otp')
    @ApiOperation({ summary: 'Resend OTP to registered email during registration process' })
    async resendRegisterOtp(@Body() resendRegisterOtpDto: ResendRegisterOtpDto): Promise<IApiResponse<any>> {
        const data = await this.authService.resendRegisterOtp(resendRegisterOtpDto);
        return { statusCode: 200, message: 'OTP has been resent successfully to your email', data };
    }


    @Public()
    @UseGuards(LocalAuthGuard) // Apply the local authentication guard to this route
    @ApiOperation({ summary: 'Login a user for a session and cookie management' }) // Add Swagger documentation for this endpoint
    @Post('login')
    async login(@Res({ passthrough: true }) res: Response, @User() user: UserEntity, @Body() loginDto: LoginDto, @DeviceId() deviceId: string): Promise<IApiResponse<any>> {
        const result = await this.authService.login(user, res, deviceId);
        return {
            statusCode: 200,
            message: 'Login successful',
            data: {
                accessToken: result.accessToken,
                user: result.user,
            },
        };
    }


    @Public()
    @ApiOperation({ summary: 'Refresh access token using a valid refresh token stored in cookies' }) // Add Swagger documentation for this endpoint
    @Post('refresh')
    async refreshToken(@Res({ passthrough: true }) res: Response, @Req() req: Request): Promise<IApiResponse<any>> {
        const oldCookieRefreshToken = req.cookies[this.refreshTokenName];
        if (!oldCookieRefreshToken) {
            throw new ConflictException('Refresh token is missing in cookies');
        }
        const result = await this.authService.refreshToken(oldCookieRefreshToken, res);
        return {
            statusCode: 200,
            message: 'Token refreshed successfully',
            data: {
                accessToken: result.accessToken,
                user: result.user,
            },
        };
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get the profile of the currently authenticated user' }) // Add Swagger documentation for this endpoint
    async getProfile(@User() user: UserEntity): Promise<IApiResponse<any>> {
        try {
            return {
                statusCode: 200,
                message: 'Profile retrieved successfully',
                data: {
                    user,
                },
            };
        } catch (error) {
            throw new InternalServerException(`Failed to retrieve profile, ${(error as Error).message}`);
        }
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout the currently authenticated user' }) // Add Swagger documentation for this endpoint
    async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request, @User() user: UserEntity): Promise<IApiResponse<any>> {
        const oldCookieRefreshToken = req.cookies[this.refreshTokenName];
        if (!oldCookieRefreshToken) {
            throw new NotFoundException('Refresh token is missing in cookies');
        }
        const result: boolean = await this.authService.logout(user, oldCookieRefreshToken, res);
        return {
            statusCode: 200,
            message: 'Logout successful',
            data: { result },
        };
    }

    @Post('logout-all')
    @ApiOperation({ summary: 'Logout the currently authenticated user from all devices' }) // Add Swagger documentation for this endpoint
    async logoutAll(@Res({ passthrough: true }) res: Response, @User() user: UserEntity): Promise<IApiResponse<any>> {
        const result: boolean = await this.authService.logoutAll(user, res);
        return {
            statusCode: 200,
            message: 'All sessions logged out successfully',
            data: { result },
        };
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
    async googleAuthRedirect(@UserGoogle() googleUser: GoogleUser, @DeviceId() deviceId: string, @Res({ passthrough: true }) res: Response): Promise<IApiResponse<any>> {
        const result = await this.authService.googleLogin(googleUser, res, deviceId);
        // Sau khi đăng nhập thành công, bạn thường sẽ muốn redirect người dùng về giao diện Frontend
        // Ví dụ: return res.redirect('http://localhost:3000/dashboard');
        return {
            statusCode: 200,
            message: 'Google Login successful',
            data: {
                accessToken: result.accessToken,
                user: result.user,
            },
        };
    }
}
