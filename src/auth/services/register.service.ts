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

    async register(dto: RegisterDto): Promise<{ otpExpire: string }> {
        const now = new Date();
        const { userName, email, password } = dto;

        // Validate email
        this.validateEmail(email);

        // Check existing user
        await this.checkExistingUser(email, userName);

        // Clean expired pending registrations
        await this.cleanExpiredPending(email, userName, now);

        // Check cooldown
        const activePendingByEmail = await this.prismaService.pendingRegistration.findUnique({ where: { email } });
        const activePendingByUsername = await this.prismaService.pendingRegistration.findUnique({ where: { userName } });

        if (activePendingByEmail) {
            if (activePendingByEmail.resendAfter && activePendingByEmail.resendAfter > now) {
                const remainingSeconds = Math.ceil((activePendingByEmail.resendAfter.getTime() - now.getTime()) / 1000);
                throw new ConflictException(`A pending registration exists for this email. You can request a new OTP after ${remainingSeconds} second(s).`);
            }
        }

        if (activePendingByUsername && activePendingByUsername.email !== email) {
            // Kiểm tra cooldown của pending đang chiếm username
            if (activePendingByUsername.resendAfter && activePendingByUsername.resendAfter > now) {
                const remainingSeconds = Math.ceil((activePendingByUsername.resendAfter.getTime() - now.getTime()) / 1000);
                throw new ConflictException(`Username "${userName}" is temporarily taken. Please try again after ${remainingSeconds} seconds.`);
            }
            // Nếu đã hết cooldown, mới được xóa
            await this.prismaService.pendingRegistration.delete({ where: { email: activePendingByUsername.email } });
        }

        // Create pending registration
        const passwordHash = await generatePasswordHash(password, this.saltRounds);
        const { otp, otpHash, otpExpiresAt, resendAfter } = await this.otpService.generate();

        const pending = await this.prismaService.pendingRegistration.upsert({
            where: { email },
            update: { userName, passwordHash, otpHash, otpExpiresAt, attemptCount: 0, resendAfter },
            create: { email, userName, passwordHash, otpHash, otpExpiresAt, attemptCount: 0, resendAfter },
        });

        // Send OTP email
        await this.sendOtpEmail(email, userName, otp, pending);

        return { otpExpire: this.otpExpire };
    }

    async verifyOtp(dto: VerifyRegisterOtpDto): Promise<ISanitizedUser> {
        const { email, otp } = dto;
        const pending = await this.otpService.verify(email, otp, 'pending registration');

        // Check if user already exists
        const existingUser = await this.prismaService.user.findFirst({
            where: { OR: [{ email: pending.email }, { userName: pending.userName }] }
        });

        if (existingUser) {
            throw new ConflictException('User already exists with this email or username');
        }

        // Get default role
        const defaultRole = await this.prismaService.role.findUnique({
            where: { roleName: this.defaultRoleName }
        });
        if (!defaultRole) throw new NotFoundException('Default role not found');

        // Create user
        const createdUser = await this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: pending.email,
                    userName: pending.userName,
                    password: pending.passwordHash,
                    roleId: defaultRole.id,
                    accountType: AccountType.LOCAL,
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

    async resendOtp(email: string): Promise<{ otpExpire: string }> {
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

        return { otpExpire: this.otpExpire };
    }

    // ==================== PRIVATE METHODS ====================
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

    private async cleanExpiredPending(email: string, userName: string, now: Date): Promise<void> {
        const pendingByEmail = await this.prismaService.pendingRegistration.findUnique({ where: { email } });
        const pendingByUsername = await this.prismaService.pendingRegistration.findUnique({ where: { userName } });

        if (pendingByEmail && pendingByEmail.otpExpiresAt <= now) {
            await this.prismaService.pendingRegistration.delete({ where: { email: pendingByEmail.email } });
        }
        if (pendingByUsername && pendingByUsername.otpExpiresAt <= now && pendingByUsername.email !== email) {
            await this.prismaService.pendingRegistration.delete({ where: { email: pendingByUsername.email } });
        }

        // Check username conflict
        // const activeByUsername = await this.prismaService.pendingRegistration.findUnique({ where: { userName } });
        // if (activeByUsername && activeByUsername.email !== email) {
        //     await this.prismaService.pendingRegistration.delete({ where: { email: activeByUsername.email } });
        // }
    }

    private async sendOtpEmail(email: string, userName: string, otp: string,
        pendingRegistration: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userName: string;
            email: string;
            passwordHash: string;
            otpHash: string;
            otpExpiresAt: Date;
            attemptCount: number;
            resendAfter: Date | null;
        }): Promise<void> {
        try {
            await this.emailService.sendRegisterOtp(email, userName, otp, this.otpExpire);
        } catch (error) {
            await this.prismaService.pendingRegistration.deleteMany({ where: { email: pendingRegistration.email } });
            throw new ConflictException('Failed to send OTP email. Please try again.');
        }
    }
}