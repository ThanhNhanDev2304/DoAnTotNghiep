import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserAvatarOrBGDto, UpdateUserDto } from '@/users/dto/update-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RoleService } from '@/role/role.service';
import { ConfigService } from '@nestjs/config';
import { ensurePasswordHash } from '@/lib/bcrypt/bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { FilesService } from '@/files/files.service';
import { ConflictException, InternalServerException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import { UserImageType } from '@/users/enums/UserImageType.enum';
import { IUsersService } from '@/users/interfaces/users.interface';
import { toUserEntity } from '@/users/helpers/toUserEntity.helper';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService
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
      const roleId: (string | null) = await this.roleService.findRoleIdByName(createUserDto.roleName || this.configService.get<string>('NAME_ROLE_USER') || 'USER');
      if (!roleId || roleId === null) {
        throw new NotFoundException('Role not found');
      }
      const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10', 10);
      const newUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          userName: createUserDto.userName,
          roleId,
          password: await ensurePasswordHash(createUserDto.password, saltRounds)
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

  async remove(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { role: { select: { roleName: true } } }
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      await this.prisma.user.delete({
        where: { id }
      });
      return toUserEntity(user);
    } catch (error: any) {
      throw new InternalServerException(error.message);
    }
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
