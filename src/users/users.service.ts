import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateProfileDto, UpdateUserAvatarOrBGDto, UpdateUserDto } from '@/users/dto/update-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RoleService } from '@/role/role.service';
import { ConfigService } from '@nestjs/config';
import { ensurePasswordHash } from '@/lib/bcrypt/bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { FilesService } from '@/files/files.service';
import { EmailService } from '@/email/email.service';
import { ConflictException, ForbiddenException, InternalServerException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import { UserImageType } from '@/users/enums/UserImageType.enum';
import { IUsersService } from '@/users/interfaces/users.interface';
import { toUserEntity } from '@/users/helpers/toUserEntity.helper';
import { NotificationService } from '@/notification/notification.service';
import { NotificationType } from '@/common/enums/notification-type.enum';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) { }

  async checkEmailOrUsernameExists(email: string, userName: string, excludeId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { userName }
        ],
        NOT: excludeId ? { id: excludeId } : undefined, // Exclude the current user when checking for updates
      }
    });
    if (!user) {
      return { exists: false, field: undefined };
    }
    if (user.email === email) {
      return { exists: true, field: 'email' as const };
    }
    if (user.userName === userName) {
      return { exists: true, field: 'username' as const };
    }
    return { exists: false, field: undefined };
  }

  // can tra ve pass de validate trong auth service
  async searchUserByEmailOrUsernameOrId(emailOrUserNameOrId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUserNameOrId },
          { userName: emailOrUserNameOrId },
          { id: emailOrUserNameOrId }
        ]
      },
        include: { role: { select: { roleName: true } } }
    });
    if (!user) return null;
    const { role, ...userData } = user || {}; // destructure to separate role from user data
    return { ...userData, roleName: user?.role?.roleName };
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const checkEmailOrUsername = await this.checkEmailOrUsernameExists(createUserDto.email, createUserDto.userName);
      if (checkEmailOrUsername.exists) {
        if (checkEmailOrUsername.field === 'email') {
          throw new ConflictException('Email already exists');
        }
        if (checkEmailOrUsername.field === 'username') {
          throw new ConflictException('Username already exists');
        }
      }
      const roleId: (string | null) = await this.roleService.findRoleIdByName(createUserDto.roleName || this.configService.get<string>('NAME_ROLE_USER') || 'EMPLOYEE');
      if (!roleId || roleId === null) {
        throw new NotFoundException('Role not found');
      }
      const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10', 10);
      const employeeCode = createUserDto.employeeCode || await this.generateEmployeeCode(false);
      const newUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          userName: createUserDto.userName,
          roleId,
          password: await ensurePasswordHash(createUserDto.password, saltRounds),
          fullName: createUserDto.fullName ?? null,
          employeeCode,
          phone: createUserDto.phone ?? null,
          departmentId: createUserDto.departmentId ?? null,
          positionId: createUserDto.positionId ?? null,
          shiftId: createUserDto.shiftId ?? null,
          startDate: createUserDto.startDate ? new Date(createUserDto.startDate) : null,
          isActive: true,
        },
        include: { role: { select: { roleName: true } } }
      });
      return toUserEntity(newUser);
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Error creating user: ${error.message}`);
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerException(`Failed to create user: ${error.message}`);
    }
  }

  async generateEmployeeCode(isIntern: boolean): Promise<string> {
    const allUsers = await this.prisma.user.findMany({
      select: { employeeCode: true },
      where: { employeeCode: { not: null } },
    });
    if (isIntern) {
      const maxNum = allUsers
        .filter(u => /^U\d{5}$/.test(u.employeeCode!))
        .map(u => parseInt(u.employeeCode!.slice(1)))
        .reduce((max, n) => Math.max(max, n), 0);
      return `U${String(maxNum + 1).padStart(5, '0')}`;
    }
    const maxNum = allUsers
      .filter(u => /^\d{5}$/.test(u.employeeCode!))
      .map(u => parseInt(u.employeeCode!))
      .reduce((max, n) => Math.max(max, n), 0);
    return String(maxNum + 1).padStart(5, '0');
  }

  async findAll() {
    try {
      const listUsers = await this.prisma.user.findMany({include: { role: {select: { roleName: true }} } });
      return listUsers ? listUsers.map(user => toUserEntity(user)) : [];
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Database error: ' + error.message);
      }
      throw new InternalServerException(error.message);
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { role: { select: { roleName: true } } }
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return toUserEntity(user);
    } catch (error: any) {
      throw new InternalServerException(error.message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      const checkResult = await this.checkEmailOrUsernameExists(updateUserDto.email || user.email, updateUserDto.userName || user.userName, id);

      // Fix: Check exists property, not the object itself
      if (checkResult.exists) {
        if (checkResult.field === 'email') {
          throw new ConflictException('Email already exists');
        }
        throw new ConflictException('Username already exists');
      }
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        include: { role: { select: { roleName: true } } }
      });
      return toUserEntity(updatedUser);
    } catch (error: any) {
      throw new InternalServerException(error.message);
    }
  }

  async updateRole(id: string, roleNameOrId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      const roleId: (string | null) = await this.roleService.findRoleIdByName(roleNameOrId);
      if (!roleId || roleId === null) {
        throw new NotFoundException('Role not found');
      }
      
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { roleId },
        include: { role: { select: { roleName: true } } }
      });
      return toUserEntity(updatedUser);
    } catch (error: any) {
      throw new InternalServerException(error.message);
    }
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException('Không thể xóa tài khoản của chính mình');
    }
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { role: { select: { roleName: true } } }
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw new ForbiddenException('Không được phép xóa tài khoản người dùng');
      await this.prisma.user.delete({ where: { id } });
      return toUserEntity(user);
    } catch (error: any) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) throw error;
      throw new InternalServerException(error.message);
    }
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { employeeCode: true, pendingEmployeeCode: true },
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Xác định cách xử lý employeeCode
    let employeeCodeData: Record<string, any> = {};
    let responseMessage: string | undefined;

    if (dto.employeeCode !== undefined) {
      if (!user.employeeCode) {
        // Lần đầu thiết lập → lưu thẳng
        employeeCodeData = { employeeCode: dto.employeeCode };
      } else if (user.employeeCode !== dto.employeeCode) {
        // Thay đổi → vào pending, chờ admin duyệt
        employeeCodeData = { pendingEmployeeCode: dto.employeeCode };
        responseMessage = 'Yêu cầu thay đổi mã nhân viên đã được gửi, vui lòng chờ admin duyệt.';
      }
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          description: dto.description,
          ...employeeCodeData,
        },
        include: { role: { select: { roleName: true } } },
      });
      return {
        user: toUserEntity(updated),
        pendingEmployeeCode: updated.pendingEmployeeCode,
        message: responseMessage,
      };
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Mã nhân viên này đã được sử dụng bởi tài khoản khác.');
      }
      throw new InternalServerException(error.message);
    }
  }

  async approveEmployeeCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pendingEmployeeCode: true },
    });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (!user.pendingEmployeeCode) throw new ValidationException('Không có yêu cầu đổi mã nhân viên đang chờ duyệt.');

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { employeeCode: user.pendingEmployeeCode, pendingEmployeeCode: null },
        include: { role: { select: { roleName: true } } },
      });
      return toUserEntity(updated);
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Mã nhân viên này đã được sử dụng bởi tài khoản khác.');
      }
      throw new InternalServerException(error.message);
    }
  }

  async rejectEmployeeCode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { pendingEmployeeCode: true } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (!user.pendingEmployeeCode) throw new ValidationException('Không có yêu cầu đang chờ duyệt.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmployeeCode: null },
      include: { role: { select: { roleName: true } } },
    });
    return toUserEntity(updated);
  }

  async getPendingUsers() {
    const users = await this.prisma.user.findMany({
      where: { isActive: false },
      include: {
        role: { select: { roleName: true } },
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(u => ({
      ...toUserEntity(u),
      departmentName: (u as any).department?.name ?? null,
      positionName: (u as any).position?.name ?? null,
    }));
  }

  async approveAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    if (user.isActive) throw new ValidationException('Tài khoản này đã được duyệt rồi.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      include: { role: { select: { roleName: true } } },
    });

    try { await this.emailService.sendAccountApproved(user.email, user.fullName ?? user.userName); } catch (_) {}
    try {
      await this.notificationService.create(
        userId,
        NotificationType.ACCOUNT_APPROVED,
        'Tài khoản đã được duyệt',
        'Chào mừng bạn! Tài khoản của bạn đã được admin phê duyệt. Hãy đăng nhập để bắt đầu.',
        '/dashboard',
      );
    } catch (_) {}

    return toUserEntity(updated);
  }

  async rejectAccount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    try {
      await this.emailService.sendAccountRejected(user.email, user.fullName ?? user.userName);
    } catch (_) {}

    await this.prisma.user.delete({ where: { id: userId } });
  }

  async updateAvatarOrBG(id: string, fileAvatar: Express.Multer.File, updateUserAvatarOrBGDto: UpdateUserAvatarOrBGDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      if (!fileAvatar) {
        throw new ValidationException('No file uploaded');
      }
      const uploadedFile = await this.filesService.uploadSingleFile(`users/${id}/profile`, updateUserAvatarOrBGDto.typeImg, fileAvatar, id);
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...(updateUserAvatarOrBGDto.typeImg === UserImageType.AVATAR ? { avatarUrl: uploadedFile.fileUrl } : { backgroundUrl: uploadedFile.fileUrl }),
        },
        include: { role: { select: { roleName: true } } }
      });
      return toUserEntity(updatedUser);

    } catch (error: any) {
      console.error('Error updating user avatar:', error);
      throw new InternalServerException(error.message);
    }
  }
}
