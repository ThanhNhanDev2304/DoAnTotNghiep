import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from '@/lib/decorator/metadata';
import { ApiOperation } from '@nestjs/swagger';
import { SendEmailDto, TestSendRegisterOtpDto } from './dto/create-email.dto';

@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) {

    }

    @Public()
    @ApiOperation({ summary: 'Send a test email to verify email configuration' })
    @Post('test-email')
    async testEmail(@Body() body: SendEmailDto) {
        const result = await this.emailService.sendTestEmail(body.toEmail);
        return { message: 'Test email sent successfully', result };
    }

    @Public()
    @ApiOperation({ summary: 'Send a registration OTP email to a user' })
    @Post('send-register-otp')
    async sendRegisterOtp(@Body() body: TestSendRegisterOtpDto) {
        await this.emailService.sendRegisterOtp(body.email, body.userName, body.otp, body.expireText);
        return { message: 'Registration OTP email sent successfully' };
    }
}
