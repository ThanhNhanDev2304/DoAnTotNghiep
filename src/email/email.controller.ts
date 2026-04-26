import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from '@/lib/decorator/metadata';
import { ApiOperation } from '@nestjs/swagger';
import { SendEmailDto } from './dto/create-email.dto';

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
}
