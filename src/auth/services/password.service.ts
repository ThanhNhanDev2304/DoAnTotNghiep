import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '@/email/email.service';
import { OtpService } from '@/auth/services/otp.service';
import { VerifyEmailDto, ChangePasswordVerifyDto } from '@/auth/dto/create-auth.dto';
import { generatePasswordHash } from '@/lib/bcrypt/bcrypt';
import { plainToInstance } from 'class-transformer';
import { UserEntity } from '@/users/entities/user.entity';
import { ConflictException, ValidationException } from '@/common/exceptions/app.exception';
import { AccountType } from '@/common/enums/account-type.enum';

@Injectable()
export class PasswordService {
    private readonly saltRounds: number;
    private readonly otpExpire: string;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
        private readonly otpService: OtpService,
    ) {
        this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS') || '10');
        this.otpExpire = this.configService.get('OTP_EXPIRE')!;
        if (!this.otpExpire || this.otpExpire.trim() === '') {
            throw new Error('OTP_EXPIRE is not defined in environment variables');
        }
    }

    async sendOtp(dto: VerifyEmailDto): Promise<{ otpExpire: string }> {
        const { email } = dto;

        await this.otpService.checkCooldown(email);

        const user = await this.prismaService.user.findUnique({ where: { email } });
        if (!user) {
            return { otpExpire: this.otpExpire };
        }

        if (user.accountType !== AccountType.LOCAL) {
            throw new ConflictException('Password reset is only available for local accounts. Please use Google login for your account.');
        }

        const { otp, otpHash, otpExpiresAt, resendAfter } = await this.otpService.generate();

        await this.prismaService.pendingRegistration.upsert({
            where: { email },
            update: { userName: user.userName, otpHash, otpExpiresAt, attemptCount: 0, resendAfter, passwordHash: '' },
            create: { email, userName: user.userName, passwordHash: '', otpHash, otpExpiresAt, attemptCount: 0, resendAfter },
        });

        try {
            await this.emailService.sendRegisterOtp(email, user.userName, otp, this.otpExpire);
        } catch (error) {
            await this.prismaService.pendingRegistration.deleteMany({ where: { email } });
            throw new ConflictException('Failed to send OTP email. Please try again.');
        }

        return { otpExpire: this.otpExpire };
    }

    async verifyAndChange(dto: ChangePasswordVerifyDto): Promise<UserEntity> {
        const { email, otp, newPassword } = dto;

        await this.otpService.verify(email, otp, 'OTP requested for password change');

        if (!newPassword || newPassword.length < 6) {
            throw new ValidationException(`New password must be at least ${6} characters long`);
        }

        const newPasswordHash = await generatePasswordHash(newPassword, this.saltRounds);

        const updatedUser = await this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { email },
                data: { password: newPasswordHash },
                include: { role: true }
            });
            await tx.pendingRegistration.delete({ where: { email } });
            return user;
        });
        const { role, ...UserDelRole } = updatedUser;
        return plainToInstance(UserEntity, {
            ...UserDelRole,
            roleName: updatedUser.role?.roleName ?? null
        });
    }
}