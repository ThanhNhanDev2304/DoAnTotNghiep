import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ConflictException, InternalServerException, NotFoundException } from '@/common/exceptions/app.exception';
import { IDepartmentService } from './interfaces/department.interface';

@Injectable()
export class DepartmentService implements IDepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    try {
      const exists = await this.prisma.department.findFirst({
        where: { OR: [{ name: dto.name }, { code: dto.code }] },
      });
      if (exists) throw new ConflictException('Tên hoặc mã phòng ban đã tồn tại');

      return await this.prisma.department.create({ data: dto });
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  async findAll() {
    try {
      return await this.prisma.department.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { users: true } } },
      });
    } catch (e: any) {
      throw new InternalServerException(e.message);
    }
  }

  async findOne(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!dept) throw new NotFoundException('Phòng ban', id);
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    try {
      await this.findOne(id);
      return await this.prisma.department.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof ConflictException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  async remove(id: string) {
    try {
      const dept = await this.findOne(id);
      const userCount = await this.prisma.user.count({ where: { departmentId: id } });
      if (userCount > 0) throw new ConflictException(`Không thể xóa: còn ${userCount} nhân viên trong phòng ban`);
      await this.prisma.department.delete({ where: { id } });
      return dept;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof ConflictException) throw e;
      throw new InternalServerException(e.message);
    }
  }
}
