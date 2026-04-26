import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserAvatarOrBGDto, UpdateUserDto, UserImageType } from '@/users/dto/update-user.dto';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { UserEntity } from '@/users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  // @ApiResponse({ status: 201, description: 'User created successfully', type: UserEntity })
  async create(@Body() createUserDto: CreateUserDto): Promise<{ message: string; result: UserEntity }> {
    const result = await this.usersService.create(createUserDto);
    return { message: 'User created successfully', result };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  // @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: [UserEntity] })
  async findAll(): Promise<{ message: string; result: UserEntity[] }> {
    const result = await this.usersService.findAll();
    return { message: 'Users retrieved successfully', result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  // @ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserEntity })
  async findOne(@Param('id') id: string): Promise<{ message: string; result: UserEntity }> {
    const result = await this.usersService.findOne(id);
    return { message: 'User retrieved successfully', result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  // @ApiResponse({ status: 200, description: 'User updated successfully', type: UserEntity })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<{ message: string; result: UserEntity }> {
    const result = await this.usersService.update(id, updateUserDto);
    return { message: 'User updated successfully', result };
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
  async updateAvatar(@Param('id') id: string, @UploadedFile() imgProfile: Express.Multer.File, @Body() updateUserAvatarOrBGDto: UpdateUserAvatarOrBGDto): Promise<{ message: string; result: UserEntity }> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (!imgProfile) {
      throw new BadRequestException('Image file is required. Please upload an image file for avatar or background.');
    }
    if (!allowedMimeTypes.includes(imgProfile.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, JPG, PNG, WEBP, and GIF images are allowed.');
    }
    if (imgProfile.size > maxSizeInBytes) {
      throw new BadRequestException('File size exceeds the maximum limit of 10MB.');
    }
    if (updateUserAvatarOrBGDto.typeImg !== UserImageType.AVATAR && updateUserAvatarOrBGDto.typeImg !== UserImageType.BACKGROUND) {
      throw new BadRequestException('Invalid image type. Only avatar and background images are allowed.');
    }
    const result = await this.usersService.updateAvatarOrBG(id, imgProfile, updateUserAvatarOrBGDto);
    return { message: 'User avatar updated successfully', result };
  }


  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  // @ApiResponse({ status: 200, description: 'User deleted successfully', type: UserEntity })
  async remove(@Param('id') id: string): Promise<{ message: string; result: UserEntity }> {
    const result = await this.usersService.remove(id);
    return { message: 'User deleted successfully', result };
  }
}
