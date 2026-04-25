import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserAvatarOrBGDto, UpdateUserDto, UserImageType } from '@/users/dto/update-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { UserEntity } from '@/users/entities/user.entity';
import { RoleService } from '@/role/role.service';
import { ConfigService } from '@nestjs/config';
import { generatePasswordHash } from '@/lib/bcrypt/bcrypt';
import { plainToInstance } from 'class-transformer';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { FilesService } from '@/files/files.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService
  ) {}

  async checkEmailOrUsernameExists(email: string, userName: string, excludeId?: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { userName }
        ],
        NOT: excludeId ? { id: excludeId } : undefined, // Exclude the current user when checking for updates
      }
    });
    return !!user; // Returns true if user exists, false otherwise
  }

  async searchUserByEmailOrUsername(emailOrUserName: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUserName },
          { userName: emailOrUserName }
        ]
      }
    });
    return user ? user : null;
  }

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      if (await this.checkEmailOrUsernameExists(createUserDto.email, createUserDto.userName)) {
        throw new BadRequestException('Email or username already exists');
      }
      const roleId: (string | null) = await this.roleService.findRoleIdByName(createUserDto.roleName || this.configService.get<string>('NAME_ROLE_USER') || 'USER');
      if (!roleId || roleId === null) {
        throw new BadRequestException('Role not found');
      }
      const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10', 10);
      const newUser = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          userName: createUserDto.userName,
          roleId,
          password: await generatePasswordHash(createUserDto.password, saltRounds)
        },
      });
      return newUser ? plainToInstance(UserEntity, newUser, { excludeExtraneousValues: false }) : new UserEntity();
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(`Error creating user: ${error.message}`);
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }
  }

  async findAll(): Promise<UserEntity[]> {
    try {
      const listUsers = await this.prisma.user.findMany();
      return listUsers ? listUsers.map(user => plainToInstance(UserEntity, user, { excludeExtraneousValues: false })) : [];
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new BadRequestException('Database error: ' + error.message);
      }
      throw new BadRequestException('Error fetching users', error.message);
    }
  }

  async findOne(id: string): Promise<UserEntity> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new BadRequestException(`User with ID ${id} not found`);
      }
      return plainToInstance(UserEntity, user, { excludeExtraneousValues: false });
    } catch (error: any) {
      throw new BadRequestException('Error fetching user', error.message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new BadRequestException(`User with ID ${id} not found`);
      }
      const checkEmailOrUsername = await this.checkEmailOrUsernameExists(updateUserDto.email || '', updateUserDto.userName || '', id);
      if (checkEmailOrUsername) {
        throw new BadRequestException('The email address or username already exists or is already taken by someone else.');
      }
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      return plainToInstance(UserEntity, updatedUser, { excludeExtraneousValues: false });
    } catch (error : any) {
      throw new BadRequestException('Error updating user', error.message);
    }
  }

  async remove(id: string): Promise<UserEntity> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new BadRequestException(`User with ID ${id} not found`);
      }
      await this.prisma.user.delete({
        where: { id },
      });
      return plainToInstance(UserEntity, user, { excludeExtraneousValues: false });
    } catch (error: any) {
      throw new BadRequestException('Error removing user', error.message);
    }
  }

  async updateAvatarOrBG(id: string, fileAvatar: Express.Multer.File, updateUserAvatarOrBGDto: UpdateUserAvatarOrBGDto): Promise<UserEntity> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new BadRequestException(`User with ID ${id} not found`);
      }
      if (!fileAvatar) {
        throw new BadRequestException('No file uploaded');
      }
      const uploadedFile = await this.filesService.uploadSingleFile(`users/${id}/profile`, updateUserAvatarOrBGDto.typeImg, fileAvatar, id);
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          ...(updateUserAvatarOrBGDto.typeImg === UserImageType.AVATAR ? { avatarUrl: uploadedFile.fileUrl } : { backgroundUrl: uploadedFile.fileUrl }),
        },
      });
      return plainToInstance(UserEntity, updatedUser, { excludeExtraneousValues: false });

    } catch (error: any) {
      console.error('Error updating user avatar:', error);
      throw new BadRequestException('Error updating user avatar', error.message);
    }
  }
}
