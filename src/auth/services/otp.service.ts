import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { comparePassword, generatePasswordHash } from '@/lib/bcrypt/bcrypt';
import { generateNumericOtp } from '@/common/otp/generate-otp';
import { ConflictException } from '@/common/exceptions/app.exception';
import ms from 'ms';
import { IOtpService } from '@/auth/interfaces/auth.interface';

@Injectable()
export class OtpService implements IOtpService {
    private readonly saltRounds: number;
    private readonly otpExpire: string;
    private readonly otpLength: number;
    private readonly otpMaxAttempts: number;
    private readonly otpResendCooldown: string;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {
        this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS') || '10');
        this.otpExpire = this.configService.get('OTP_EXPIRE')!;
        this.otpLength = Number(this.configService.get('OTP_LENGTH'));
        this.otpMaxAttempts = Number(this.configService.get('OTP_MAX_ATTEMPTS'));
        this.otpResendCooldown = this.configService.get('OTP_RESEND_COOLDOWN')!;
        // Validate critical configurations
        if (!this.otpExpire || this.otpExpire.trim() === '') {
            throw new Error('OTP_EXPIRE is not defined in environment variables');
        }
        if (!this.otpLength || !Number.isInteger(this.otpLength) || this.otpLength < 4) {
            throw new Error('OTP_LENGTH is not defined or must be an integer >= 4');
        }
        if (!this.otpMaxAttempts || !Number.isInteger(this.otpMaxAttempts) || this.otpMaxAttempts <= 0) {
            throw new Error('OTP_MAX_ATTEMPTS is not defined or must be a positive integer in environment variables');
        }
        if (!this.otpResendCooldown || this.otpResendCooldown.trim() === '') {
            throw new Error('OTP_RESEND_COOLDOWN is not defined in environment variables');
        }
    }

    async generate(): Promise<{ otp: string; otpHash: string; otpExpiresAt: Date; resendAfter: Date }> {
        const otp = generateNumericOtp(this.otpLength);
        const otpHash = await generatePasswordHash(otp, this.saltRounds);
        return {
            otp,
            otpHash,
            otpExpiresAt: new Date(Date.now() + ms(this.otpExpire as ms.StringValue)),
            resendAfter: new Date(Date.now() + ms(this.otpResendCooldown as ms.StringValue))
        };
    }

    async checkCooldown(email: string): Promise<void> {
        const now = new Date();
        const pending = await this.prismaService.pendingRegistration.findUnique({ where: { email } });

        if (pending?.resendAfter && pending.resendAfter > now) {
            const remainingSeconds = Math.ceil((pending.resendAfter.getTime() - now.getTime()) / 1000);
            throw new ConflictException(`Please wait ${remainingSeconds} seconds before requesting a new OTP.`);
        }
    }

    async getValidPending(email: string, purpose: string) {
        const pending = await this.prismaService.pendingRegistration.findUnique({ where: { email } });

        if (!pending) {
            throw new ConflictException(`No ${purpose} found for this email`);
        }
        if (pending.otpExpiresAt <= new Date()) {
            await this.prismaService.pendingRegistration.delete({ where: { email } });
            throw new ConflictException('OTP has expired');
        }
        if (pending.attemptCount >= this.otpMaxAttempts) {
            await this.prismaService.pendingRegistration.delete({ where: { email } });
            throw new ConflictException(`Too many incorrect attempts. Please request a new OTP after ${this.otpExpire}`);
        }

        return pending;
    }

    async verify(email: string, otp: string, purpose: string) {
        if (otp.length !== this.otpLength) {
            throw new ConflictException(`OTP must be exactly ${this.otpLength} digits`);
        }

        const pending = await this.getValidPending(email, purpose);
        const isValid = await comparePassword(otp, pending.otpHash);

        if (!isValid) {
            const updated = await this.prismaService.pendingRegistration.update({
                where: { email },
                data: { attemptCount: { increment: 1 } }
            });

            const remainingAttempts = this.otpMaxAttempts - updated.attemptCount;
            if (remainingAttempts <= 0) {
                throw new ConflictException('OTP has been locked due to too many incorrect attempts.');
            }
            throw new ConflictException(`Invalid OTP. You have ${remainingAttempts} attempt(s) remaining.`);
        }

        return pending;
    }
}