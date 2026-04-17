import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { error } from 'console';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async CheckRoleNameExists(name: string): Promise<boolean> {
    const existingRole = await this.prisma.client.role.findUnique({
      where: { name },
    });
    return !!existingRole; // Return true if role exists, false otherwise
  }

  async create(createRoleDto: CreateRoleDto) {
    if (await this.CheckRoleNameExists(createRoleDto.name)) {
      throw new BadRequestException('Role name already exists');
    }
    const newRole = await this.prisma.client.role.create({
      data: createRoleDto
    });
    if (!newRole) {
      throw new error('Failed to create role');
    }
    return newRole;
  }

  async findAll() {
    const roles = await this.prisma.client.role.findMany();
    if (!roles) {
      throw new error('Failed to retrieve roles');
    }
    return roles;
  }

  async findOne(id: string) {
    const role = await this.prisma.client.role.findUnique({
      where: { id },
    });
    if (!role) {
      throw new error('Role not found');
    }
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const updatedRole = await this.prisma.client.role.update({
      where: { id },
      data: updateRoleDto,
    });
    if (!updatedRole) {
      throw new error('Failed to update role');
    }
    return updatedRole;
  }

  async remove(id: string) {
    const deletedRole = await this.prisma.client.role.delete({
      where: { id },
    });
    if (!deletedRole) {
      throw new error('Failed to delete role');
    }
    return deletedRole;
  }
}
