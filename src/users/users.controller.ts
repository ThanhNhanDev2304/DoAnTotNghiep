import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
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

  @Patch('avatar/:id')
  @ApiOperation({ summary: 'Update a user\'s avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ // swagger file upload support
    schema: {
      type: 'object',
      properties: {
        fileAvatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('fileAvatar'))
  async updateAvatar(@Param('id') id: string, @UploadedFile() fileAvatar: Express.Multer.File): Promise<{ message: string; result: UserEntity }> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedMimeTypes.includes(fileAvatar.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, JPG, PNG, WEBP, and GIF images are allowed.');
    }
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (fileAvatar.size > maxSizeInBytes) {
      throw new BadRequestException('File size exceeds the maximum limit of 10MB.');
    }
    const result = await this.usersService.updateAvatar(id, fileAvatar);
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
