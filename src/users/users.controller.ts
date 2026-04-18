import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { ApiOperation } from '@nestjs/swagger';
import { UserEntity } from '@/users/entities/user.entity';

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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  // @ApiResponse({ status: 200, description: 'User deleted successfully', type: UserEntity })
  async remove(@Param('id') id: string): Promise<{ message: string; result: UserEntity }> {
    const result = await this.usersService.remove(id);
    return { message: 'User deleted successfully', result };
  }
}
