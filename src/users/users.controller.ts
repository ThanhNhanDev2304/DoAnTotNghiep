import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserAvatarOrBGDto, UpdateUserDto, UserImageType } from '@/users/dto/update-user.dto';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { UserEntity } from '@/users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ValidationException } from '@/common/exceptions/app.exception';
import { IApiResponse } from '@/common/interceptors/transform.interceptor';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() createUserDto: CreateUserDto): Promise<IApiResponse<UserEntity>> {
    const data = await this.usersService.create(createUserDto);
    return { statusCode: 200, message: 'User created successfully',  data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll(): Promise<IApiResponse<UserEntity[]>> {
    const result = await this.usersService.findAll();
    return { statusCode: 200, message: 'Users retrieved successfully', data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  async findOne(@Param('id') id: string): Promise<IApiResponse<UserEntity>> {
    const result = await this.usersService.findOne(id);
    return { statusCode: 200, message: 'User retrieved successfully', data: result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<IApiResponse<UserEntity>> {
    const result = await this.usersService.update(id, updateUserDto);
    return { statusCode: 200, message: 'User updated successfully', data: result };
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
  async updateAvatar(@Param('id') id: string, @UploadedFile() imgProfile: Express.Multer.File, @Body() updateUserAvatarOrBGDto: UpdateUserAvatarOrBGDto): Promise<IApiResponse<UserEntity>> {
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
  // @ApiResponse({ status: 200, description: 'User deleted successfully', type: UserEntity })
  async remove(@Param('id') id: string): Promise<IApiResponse<UserEntity>> {
    const result = await this.usersService.remove(id);
    return { statusCode: 200, message: 'User deleted successfully', data: result };
  }
}
