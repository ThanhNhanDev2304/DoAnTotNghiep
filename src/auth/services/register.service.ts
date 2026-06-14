import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from '@/users/users.service';
import { EmailService } from '@/email/email.service';
import { RegisterDto, VerifyRegisterOtpDto } from '@/auth/dto/create-auth.dto';
import { generatePasswordHash } from '@/lib/bcrypt/bcrypt';
import { ConflictException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import { AccountType } from '@/common/enums/account-type.enum';
import { OtpService } from '@/auth/services/otp.service';
import { IRegisterService, ISanitizedUser } from '@/auth/interfaces/auth.interface';
import { sanitizeUser } from '@/auth/helpers/sanitize.helper';

@Injectable()
export class RegisterService implements IRegisterService {
    private readonly defaultRoleName: string;
    private readonly saltRounds: number;
    private readonly otpExpire: string;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly emailService: EmailService,
        private readonly otpService: OtpService,
    ) {
        this.saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS') || '10');
        this.defaultRoleName = this.configService.get('NAME_ROLE_USER')!;
        this.otpExpire = this.configService.get('OTP_EXPIRE')!;
        if (!this.defaultRoleName) {
            throw new Error('Default role name is not defined in environment variables');
        }
        if (!this.otpExpire || this.otpExpire.trim() === '') {
            throw new Error('OTP_EXPIRE is not defined in environment variables');
        }
    }

    async register(dto: RegisterDto): Promise<{ message: string }> {
        const { userName, email, password, fullName, phone, departmentId, positionId, isIntern } = dto;

        this.validateEmail(email);
        await this.checkExistingUser(email, userName);

        const defaultRole = await this.prismaService.role.findUnique({
            where: { roleName: this.defaultRoleName },
        });
        if (!defaultRole) throw new NotFoundException('Default role not found');

        const passwordHash = await generatePasswordHash(password, this.saltRounds);
        const employeeCode = await this.usersService.generateEmployeeCode(!!isIntern);

        await this.prismaService.user.create({
            data: {
                email,
                userName,
                password: passwordHash,
                roleId: defaultRole.id,
                accountType: AccountType.LOCAL,
                isActive: false,
                fullName,
                phone,
                departmentId: departmentId || null,
                positionId: positionId || null,
                employeeCode,
            },
        });

        try {
            await this.emailService.sendAccountPending(email, fullName);
        } catch (_) {
            // email failure không block đăng ký
        }

        return { message: 'Tài khoản đã được tạo. Admin sẽ duyệt và thông báo qua email.' };
    }

    // Giữ lại verifyOtp để tương thích với các pending registration cũ
    async verifyOtp(dto: VerifyRegisterOtpDto): Promise<ISanitizedUser> {
        const { email, otp } = dto;
        const pending = await this.otpService.verify(email, otp, 'pending registration');

        const existingUser = await this.prismaService.user.findFirst({
            where: { OR: [{ email: pending.email }, { userName: pending.userName }] }
        });
        if (existingUser) {
            throw new ConflictException('User already exists with this email or username');
        }

        const defaultRole = await this.prismaService.role.findUnique({
            where: { roleName: this.defaultRoleName }
        });
        if (!defaultRole) throw new NotFoundException('Default role not found');

        const createdUser = await this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: pending.email,
                    userName: pending.userName,
                    password: pending.passwordHash,
                    roleId: defaultRole.id,
                    accountType: AccountType.LOCAL,
                    isActive: false,
                },
            });
            await tx.pendingRegistration.delete({ where: { email: pending.email } });
            return user;
        });
        return sanitizeUser({
            ...createdUser,
            roleName: this.defaultRoleName,
        } as ISanitizedUser);
    }

    async resendOtp(email: string): Promise<{ message: string }> {
        const now = new Date();
        const pending = await this.prismaService.pendingRegistration.findUnique({ where: { email } });
        if (!pending) {
            throw new ConflictException('No pending registration found. Please register first.');
        }
        if (pending.otpExpiresAt <= now) {
            await this.prismaService.pendingRegistration.delete({ where: { email } });
            throw new ConflictException('OTP has expired. Please register again.');
        }
        await this.otpService.checkCooldown(email);
        const { otp, otpHash, otpExpiresAt, resendAfter } = await this.otpService.generate();
        const updated = await this.prismaService.pendingRegistration.update({
            where: { email },
            data: { otpHash, otpExpiresAt, resendAfter, attemptCount: 0 },
        });
        await this.emailService.sendRegisterOtp(email, updated.userName, otp, this.otpExpire);
        return { message: `OTP resent. Expires in ${this.otpExpire}.` };
    }


    private validateEmail(email: string): void {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            throw new ValidationException('Invalid email address');
        }
    }

    private async checkExistingUser(email: string, userName: string): Promise<void> {
        const existed = await this.usersService.checkEmailOrUsernameExists(email, userName);
        if (existed.exists) {
            throw new ConflictException(`${existed.field} already exists`);
        }
    }
}
