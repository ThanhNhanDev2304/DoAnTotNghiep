import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoleService } from '@/role/role.service';
import { CreateRoleDto } from '@/role/dto/create-role.dto';
import { UpdateRoleDto } from '@/role/dto/update-role.dto';
import { RoleEntity } from '@/role/entities/role.entity';

@ApiTags('roles')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully', type: RoleEntity })
  async create(@Body() createRoleDto: CreateRoleDto): Promise<{ message: string; result: RoleEntity }> {
    const result = await this.roleService.create(createRoleDto);
    return { message: 'Role created successfully', result };
  }

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully', type: [RoleEntity] })
  async findAll(): Promise<{ message: string; result: RoleEntity[] }> {
    const result =  await this.roleService.findAll();
    return { message: 'Roles retrieved successfully', result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully', type: RoleEntity })
  async findOne(@Param('id') id: string): Promise<{ message: string; result: RoleEntity }> {
     const result = await this.roleService.findOne(id);
     return { message: 'Role retrieved successfully', result };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: RoleEntity })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto): Promise<{ message: string; result: RoleEntity }> {
    const result = await this.roleService.update(id, updateRoleDto);
    return { message: 'Role updated successfully', result };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully', type: RoleEntity })
  async remove(@Param('id') id: string): Promise<{ message: string; result: RoleEntity }> {
    const result = await this.roleService.remove(id);
    return { message: 'Role deleted successfully', result };
  }
}
 