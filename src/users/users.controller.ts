import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserAvatarOrBGDto, UpdateUserDto, UpdateUserRoleDto } from '@/users/dto/update-user.dto';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ValidationException } from '@/common/exceptions/app.exception';
import { AdminOnly } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';
import { UserImageType } from '@/users/enums/UserImageType.enum';
import { IUsersController } from '@/users/interfaces/users.interface';

@AdminOnly() // Mark the entire controller as admin-only, meaning all routes in this controller require admin privileges to access.
@Controller('users')
export class UsersController implements IUsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return { statusCode: 200, message: 'User created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    const result = await this.usersService.findAll();
    return { statusCode: 200, message: 'Users retrieved successfully', data: result };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Danh sách tài khoản chờ duyệt (Admin)' })
  async getPendingUsers() {
    const result = await this.usersService.getPendingUsers();
    return { statusCode: 200, message: 'Pending users retrieved', data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  async findOne(@Param('id') id: string) {
    const result = await this.usersService.findOne(id);
    return { statusCode: 200, message: 'User retrieved successfully', data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const result = await this.usersService.update(id, updateUserDto);
    return { statusCode: 200, message: 'User updated successfully', data: result };
  }

  @Patch('role/:id')
  @ApiOperation({ summary: 'Update a user\'s role' })
  async updateRole(@Param('id') id: string, @Body() role: UpdateUserRoleDto) {
    const result = await this.usersService.updateRole(id, role.roleNameOrId);
    return { statusCode: 200, message: 'User role updated successfully', data: result };
  }

  @Patch('avatarorbg/:id')
  @ApiOperation({ summary: 'Update a user\'s avatar or background' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imgProfile: {
          type: 'string',
          format: 'binary',
        },
        typeImg: {
          type: 'string',
          enum: ['avatar', 'background'],
        },
      },
      required: ['imgProfile', 'typeImg'],
    },
  })
  @UseInterceptors(FileInterceptor('imgProfile')) // Tên trường file trong form-data phải trùng với tên này
  async updateAvatarOrBG(@Param('id') id: string, @UploadedFile() imgProfile: Express.Multer.File, @Body() updateUserAvatarOrBGDto: UpdateUserAvatarOrBGDto) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (!imgProfile) {
      throw new ValidationException('Image file is required. Please upload an image file for avatar or background.');
    }
    if (!allowedMimeTypes.includes(imgProfile.mimetype)) {
      throw new ValidationException('Invalid file type. Only JPEG, JPG, PNG, WEBP, and GIF images are allowed.');
    }
    if (imgProfile.size > maxSizeInBytes) {
      throw new ValidationException('File size exceeds the maximum limit of 10MB.');
    }
    if (updateUserAvatarOrBGDto.typeImg !== UserImageType.AVATAR && updateUserAvatarOrBGDto.typeImg !== UserImageType.BACKGROUND) {
      throw new ValidationException('Invalid image type. Only avatar and background images are allowed.');
    }
    const result = await this.usersService.updateAvatarOrBG(id, imgProfile, updateUserAvatarOrBGDto);
    return { statusCode: 200, message: 'User avatar updated successfully', data: result };
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  async remove(@Param('id') id: string, @User('id') currentUserId: string) {
    const result = await this.usersService.remove(id, currentUserId);
    return { statusCode: 200, message: 'User deleted successfully', data: result };
  }

  @Patch(':id/approve-employee-code')
  @ApiOperation({ summary: 'Admin duyệt yêu cầu cập nhật mã nhân viên' })
  async approveEmployeeCode(@Param('id') id: string) {
    const result = await this.usersService.approveEmployeeCode(id);
    return { statusCode: 200, message: 'Đã duyệt mã nhân viên thành công', data: result };
  }

  @Patch(':id/reject-employee-code')
  @ApiOperation({ summary: 'Admin từ chối yêu cầu cập nhật mã nhân viên' })
  async rejectEmployeeCode(@Param('id') id: string) {
    const result = await this.usersService.rejectEmployeeCode(id);
    return { statusCode: 200, message: 'Đã từ chối yêu cầu mã nhân viên', data: result };
  }

  @Patch(':id/approve-account')
  @ApiOperation({ summary: 'Duyệt tài khoản nhân viên (Admin)' })
  async approveAccount(@Param('id') id: string) {
    const result = await this.usersService.approveAccount(id);
    return { statusCode: 200, message: 'Tài khoản đã được duyệt', data: result };
  }

  @Patch(':id/reject-account')
  @ApiOperation({ summary: 'Từ chối tài khoản nhân viên (Admin)' })
  async rejectAccount(@Param('id') id: string) {
    await this.usersService.rejectAccount(id);
    return { statusCode: 200, message: 'Tài khoản đã bị từ chối và xóa', data: null };
  }
}
