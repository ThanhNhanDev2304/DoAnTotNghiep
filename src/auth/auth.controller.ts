import { Body, Controller, Get, Patch, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/common/decorators/metadata';
import { LoginDto, RegisterDto, VerifyRegisterOtpDto, ResendRegisterOtpDto, VerifyEmailDto, ChangePasswordVerifyDto } from '@/auth/dto/create-auth.dto';
import type { Request, Response } from 'express';
import { UserGoogle, User, DeviceId } from '@/common/decorators/user.decorator';
import type { GoogleUser } from '@/auth/passport/google/google-user.interface';
import { LocalAuthGuard } from '@/lib/passport/local-auth.guard';
import { GoogleAuthGuard } from '@/lib/passport/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { ConflictException, InternalServerException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import type { IAuthController, ISanitizedUser } from '@/auth/interfaces/auth.interface';
import { UsersService } from '@/users/users.service';
import { UpdateProfileDto } from '@/users/dto/update-user.dto';
import { UserImageType } from '@/users/enums/UserImageType.enum';

@Controller('auth')
export class AuthController implements IAuthController {
    private readonly refreshTokenName: string;
    private readonly urlClient: string;
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        this.refreshTokenName = this.configService.get<string>('NAME_COOKIE_REFRESH_TOKEN_BROWSER')!;
        this.urlClient = this.configService.get<string>('URL_CLIENT')!;
        if (!this.refreshTokenName || this.refreshTokenName.trim() === '') {
            throw new Error('Refresh token cookie name is not defined in environment variables');
        }
        if (!this.urlClient || this.urlClient.trim() === '') {
            throw new Error('URL_CLIENT is not defined in environment variables');
        }
    }

    @Public()
    @ApiOperation({ summary: 'Đăng ký tài khoản (chờ admin duyệt)' })
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        const result = await this.authService.registerWithOTP(registerDto);
        return { statusCode: 201, message: result.message, data: null };
    }

    @Public()
    @Post('verify-register-otp')
    @ApiOperation({ summary: 'Verify OTP and complete account registration' })
    async verifyRegisterOtp(@Body() verifyRegisterOtpDto: VerifyRegisterOtpDto) {
        const user = await this.authService.verifyRegisterOtp(verifyRegisterOtpDto);
        return { statusCode: 200, message: 'Account verified and created successfully', data: user };
    }

    @Public()
    @Post('resend-register-otp')
    @ApiOperation({ summary: 'Resend OTP to registered email during registration process' })
    async resendRegisterOtp(@Body() resendRegisterOtpDto: ResendRegisterOtpDto) {
        const data = await this.authService.resendRegisterOtp(resendRegisterOtpDto);
        return { statusCode: 200, message: 'OTP has been resent successfully to your email', data };
    }

    @Public()
    @UseGuards(LocalAuthGuard) // Apply the local authentication guard to this route
    @ApiOperation({ summary: 'Login a user for a session and cookie management' }) // Add Swagger documentation for this endpoint
    @Post('login')
    async login(@Res({ passthrough: true }) res: Response, @User() user: ISanitizedUser, @Body() _loginDto: LoginDto, @DeviceId() deviceId: string) {
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
    async refreshToken(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
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
    @ApiOperation({ summary: 'Get the profile of the currently authenticated user' })
    async getProfile(@User('id') userId: string) {
        try {
            const user = await this.usersService.findOne(userId);
            return {
                statusCode: 200,
                message: 'Profile retrieved successfully',
                data: { user },
            };
        } catch (error) {
            throw new InternalServerException(`Failed to retrieve profile, ${(error as Error).message}`);
        }
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Cập nhật thông tin cá nhân (mã NV cần admin duyệt)' })
    async updateProfile(@User('id') userId: string, @Body() dto: UpdateProfileDto) {
        const result = await this.usersService.updateProfile(userId, dto);
        return {
            statusCode: 200,
            message: result.message ?? 'Cập nhật thông tin thành công',
            data: result.user,
        };
    }

    @Public()
    @Post('change-password/send-otp')
    @ApiOperation({ summary: 'Change password for the currently authenticated user' }) // Add Swagger documentation for this endpoint
    async changePasswordWithOtp(@Body() verifyEmailDto: VerifyEmailDto) {
        const result = await this.authService.sendChangePasswordOtp(verifyEmailDto);
        return {
            statusCode: 200,
            message: 'If your email exists in our system, you will receive an OTP to reset your password. Please check your email.',
            data: result,
        };
    }
    
    @Public()
    @Post('change-password/verify-otp')
    @ApiOperation({ summary: 'Verify OTP and change password for the currently authenticated user' }) // Add Swagger documentation for this endpoint
    async verifyChangePasswordOtp(@Body() changePasswordVerifyDto: ChangePasswordVerifyDto) {
        const user = await this.authService.verifyChangePasswordOtp(changePasswordVerifyDto);
        return {
            statusCode: 200,
            message: 'Password changed successfully',
            data: user,
        };
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout the currently authenticated user' }) // Add Swagger documentation for this endpoint
    async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request, @User() user: ISanitizedUser) {
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
    async logoutAll(@Res({ passthrough: true }) res: Response, @User() user: ISanitizedUser) {
        const result: boolean = await this.authService.logoutAll(user, res);
        return {
            statusCode: 200,
            message: 'All sessions logged out successfully',
            data: { result },
        };
    }

    @Patch('avatar')
    @ApiOperation({ summary: 'Cập nhật avatar hoặc ảnh bìa của bản thân' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('imgProfile'))
    async updateMyAvatar(
        @User('id') userId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body('typeImg') typeImg: string,
    ) {
        if (!file) throw new ValidationException('Vui lòng chọn file ảnh');
        const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedMime.includes(file.mimetype)) throw new ValidationException('Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF');
        if (file.size > 5 * 1024 * 1024) throw new ValidationException('Ảnh tối đa 5MB');
        const imgType = typeImg === 'background' ? UserImageType.BACKGROUND : UserImageType.AVATAR;
        try {
            const result = await this.usersService.updateAvatarOrBG(userId, file, { typeImg: imgType });
            return { statusCode: 200, message: 'Cập nhật ảnh thành công', data: result };
        } catch (error) {
            throw new InternalServerException((error as Error).message);
        }
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
    async googleAuthRedirect(@UserGoogle() googleUser: GoogleUser, @DeviceId() deviceId: string, @Res() res: Response) {
        const result = await this.authService.googleLogin(googleUser, res, deviceId);
        if ('pending' in result && result.pending) {
            res.redirect(`${this.urlClient}/register/pending`);
            return;
        }
        const loginResult = result as { accessToken: string; user: any };
        const data = { accessToken: loginResult.accessToken, user: loginResult.user };
        const encodedData = Buffer.from(JSON.stringify(data)).toString('base64');
        res.redirect(`${this.urlClient}/google/callback?data=${encodeURIComponent(encodedData)}`);
        // return {
        //     statusCode: 200,
        //     message: 'Google Login successful',
        //     data: {
        //         accessToken: result.accessToken,
        //         user: result.user,
        //     },
        // };
    }
}
