import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly transporter: nodemailer.Transporter;
    private readonly appName: string;
    private readonly supportEmail: string;
    private readonly fromEmail: string;
    constructor(
        private readonly configService: ConfigService
    ) {
        const host = this.configService.get<string>('EMAIL_HOST');
        const port = Number(this.configService.get<string>('EMAIL_PORT') || '587');
        const authUser = this.configService.get<string>('EMAIL_AUTH_USER');
        const authPass = this.configService.get<string>('EMAIL_AUTH_PASS');
        this.fromEmail = this.configService.get<string>('EMAIL_FROM')!;
        this.supportEmail = this.configService.get<string>('SUPPORT_EMAIL')!;
        this.appName = this.configService.get<string>('APP_NAME') || 'Project UMC';

        if (!host || !port || !authUser || !authPass || !this.fromEmail || !this.supportEmail) {
            throw new Error(`
                ${!host ? 'EMAIL_HOST is not defined in the environment variables. ' : ''}
                ${!port ? 'EMAIL_PORT is not defined in the environment variables. ' : ''}
                ${!authUser ? 'EMAIL_AUTH_USER is not defined in the environment variables. ' : ''}
                ${!authPass ? 'EMAIL_AUTH_PASS is not defined in the environment variables.' : ''}
                ${!this.fromEmail ? 'EMAIL_FROM is not defined in the environment variables. ' : ''}
                ${!this.supportEmail ? 'SUPPORT_EMAIL is not defined in the environment variables. ' : ''}`
            );
        }
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: authUser,
                pass: authPass,
            },
        })
    }

    async sendRegisterOtp(email: string, userName: string, otp: string, expireText: string,): Promise<void> {
        const templatePath = path.join(process.cwd(), 'src', 'email', 'templates', 'register-otp.ejs');
        const html = await ejs.renderFile(templatePath, {
            appName: this.appName,
            supportEmail: this.supportEmail,
            userName,
            otp,
            expireText,
        });

        const info = await this.transporter.sendMail({
            from: this.fromEmail,
            to: email,
            subject: `${this.appName} - OTP Verification`,
            html,
        });

        this.logger.log(`OTP email sent successfully: ${info.messageId}`);
    }

    async sendAccountPending(email: string, fullName: string): Promise<void> {
        const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f5f7;padding:40px 16px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;padding:40px;">
          <h2 style="color:#1d1d1f;">Tài khoản đang chờ duyệt</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Tài khoản của bạn tại <strong>${this.appName}</strong> đã được tạo thành công và đang chờ admin xét duyệt.</p>
          <p>Chúng tôi sẽ gửi email thông báo khi tài khoản được duyệt. Vui lòng chờ trong ít phút đến vài giờ.</p>
          <p style="color:#86868b;font-size:13px;">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
        </div></body></html>`;
        await this.transporter.sendMail({ from: this.fromEmail, to: email, subject: `${this.appName} - Tài khoản đang chờ duyệt`, html });
    }

    async sendAccountApproved(email: string, fullName: string): Promise<void> {
        const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f5f7;padding:40px 16px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;padding:40px;">
          <h2 style="color:#34c759;">Tài khoản đã được duyệt ✓</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Tài khoản của bạn tại <strong>${this.appName}</strong> đã được admin duyệt thành công.</p>
          <p>Bạn có thể đăng nhập vào hệ thống ngay bây giờ.</p>
          <p style="color:#86868b;font-size:13px;">Liên hệ hỗ trợ: <a href="mailto:${this.supportEmail}">${this.supportEmail}</a></p>
        </div></body></html>`;
        await this.transporter.sendMail({ from: this.fromEmail, to: email, subject: `${this.appName} - Tài khoản đã được duyệt`, html });
    }

    async sendAccountRejected(email: string, fullName: string, reason?: string): Promise<void> {
        const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f5f7;padding:40px 16px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;padding:40px;">
          <h2 style="color:#ff3b30;">Tài khoản không được duyệt</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Rất tiếc, tài khoản của bạn tại <strong>${this.appName}</strong> không được admin chấp thuận.</p>
          ${reason ? `<p><strong>Lý do:</strong> ${reason}</p>` : ''}
          <p>Vui lòng liên hệ <a href="mailto:${this.supportEmail}">${this.supportEmail}</a> để biết thêm thông tin.</p>
        </div></body></html>`;
        await this.transporter.sendMail({ from: this.fromEmail, to: email, subject: `${this.appName} - Tài khoản không được duyệt`, html });
    }

    async sendTestEmail(toEmail: string): Promise<void> {
        const templatePath = path.join(process.cwd(), 'src', 'email', 'templates', 'test-email.ejs');
        const html = await ejs.renderFile(templatePath, {
            appName: 'privacy@tiktok.com',
            supportEmail: 'support@tiktok.com',
            toEmail,
        });
        const info = await this.transporter.sendMail({
            from: 'privacy@tiktok.com',
            to: toEmail,
            subject: `Tiktok Privacy Officer`,
            html,
        });

        this.logger.log(`Test email sent successfully: ${info.messageId}`);
    }


}
