import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateRoleDto } from '@/role/dto/create-role.dto';
import { UpdateRoleDto } from '@/role/dto/update-role.dto';
import { RoleEntity } from '@/role/entities/role.entity';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { InternalServerException, NotFoundException, ConflictException, ValidationException } from '@/common/exceptions/app.exception';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) { }

  async findRoleIdByName(roleName: string): Promise<string | null> { // default this func are public 
    try {
      const role = await this.prisma.role.findUnique({
        where: { roleName },
      });
      return role ? role.id : null;
    }
    catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Role not found');
      }
      throw new NotFoundException('Failed to find role: ' + error.message);
    }
  }

  async create(createRoleDto: CreateRoleDto): Promise<RoleEntity> {
    try {
      const newRole = await this.prisma.role.create({
        data: createRoleDto,
      });
      // Transform to Entity instance (for @Expose() and @Type() to work)
      return newRole ? plainToInstance(RoleEntity, newRole, { excludeExtraneousValues: false }) : new RoleEntity();
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new NotFoundException('Role name already exists');
      }
      throw new InternalServerException('Failed to create role: ' + error.message);
    }
  }

  async findAll(): Promise<RoleEntity[]> {
    try {
      const roles = await this.prisma.role.findMany({
        include: { users: true },
      });
      // Transform to Entity instances (for @Expose() and @Exclude() to work)
      return roles.map(role => plainToInstance(RoleEntity, role, { excludeExtraneousValues: false }));
    } catch (error: any) {
      throw new InternalServerException('Failed to retrieve roles: ' + error.message);
    }
  }

  async findOne(id: string): Promise<RoleEntity> {
    try {
      const role = await this.prisma.role.findUnique({
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
      throw new InternalServerException('Failed to retrieve role: ' + error.message);
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleEntity> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      if (updateRoleDto.roleName && updateRoleDto.roleName !== role.roleName) {
        const existingRole = await this.prisma.role.findUnique({
          where: { roleName: updateRoleDto.roleName },
        });
        if (existingRole) {
          throw new NotFoundException('Role name already exists');
        }
      }

      const updatedRole = await this.prisma.role.update({
        where: { id },
        data: updateRoleDto,
      });
      return plainToInstance(RoleEntity, updatedRole, { excludeExtraneousValues: false });
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof NotFoundException || error instanceof ValidationException) {
        throw error;
      }
      throw new InternalServerException('Failed to update role: ' + error.message);
    }
  }

  async remove(id: string): Promise<RoleEntity> {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: { users: true },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      if (role.users && role.users.length > 0) {
        throw new ConflictException(
          `Cannot delete role. It has ${role.users.length} user(s) assigned`,
        );
      }

      await this.prisma.role.delete({
        where: { id },
      });

      return plainToInstance(RoleEntity, role, { excludeExtraneousValues: false });
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof NotFoundException || error instanceof ValidationException) {
        throw error;
      }
      throw new InternalServerException('Failed to delete role: ' + error.message);
    }
  }
}
