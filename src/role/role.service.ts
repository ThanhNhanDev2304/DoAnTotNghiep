import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateRoleDto } from '@/role/dto/create-role.dto';
import { UpdateRoleDto } from '@/role/dto/update-role.dto';
import { RoleEntity } from '@/role/entities/role.entity';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createRoleDto: CreateRoleDto) {
    try {
      const newRole = await this.prisma.client.role.create({
        data: createRoleDto,
      });
      // Transform to Entity instance (for @Expose() and @Type() to work)
      return plainToInstance(RoleEntity, newRole, { excludeExtraneousValues: false });
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Role name already exists');
      }
      throw new BadRequestException('Failed to create role: ' + error.message);
    }
  }

  async findAll() {
    try {
      const roles = await this.prisma.client.role.findMany({
        include: { users: true },
      });
      // Transform to Entity instances (for @Expose() and @Exclude() to work)
      return roles.map(role => plainToInstance(RoleEntity, role, { excludeExtraneousValues: false }));
    } catch (error: any) {
      throw new BadRequestException('Failed to retrieve roles: ' + error.message);
    }
  }

  async findOne(id: string) {
    try {
      const role = await this.prisma.client.role.findUnique({
        where: { id },
        include: { users: true },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      return plainToInstance(RoleEntity, role, { excludeExtraneousValues: false });
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve role: ' + error.message);
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const role = await this.prisma.client.role.findUnique({
        where: { id },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      if (updateRoleDto.name && updateRoleDto.name !== role.name) {
        const existingRole = await this.prisma.client.role.findUnique({
          where: { name: updateRoleDto.name },
        });
        if (existingRole) {
          throw new BadRequestException('Role name already exists');
        }
      }

      const updatedRole = await this.prisma.client.role.update({
        where: { id },
        data: updateRoleDto,
      });
      return plainToInstance(RoleEntity, updatedRole, { excludeExtraneousValues: false });
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update role: ' + error.message);
    }
  }

  async remove(id: string): Promise<RoleEntity> {
    try {
      const role = await this.prisma.client.role.findUnique({
        where: { id },
        include: { users: true },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      if (role.users && role.users.length > 0) {
        throw new BadRequestException(
          `Cannot delete role. It has ${role.users.length} user(s) assigned`,
        );
      }

      await this.prisma.client.role.delete({
        where: { id },
      });

      return plainToInstance(RoleEntity, role, { excludeExtraneousValues: false });
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete role: ' + error.message);
    }
  }
}
