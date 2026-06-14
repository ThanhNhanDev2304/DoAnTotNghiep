import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ConflictException, InternalServerException, NotFoundException } from '@/common/exceptions/app.exception';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShiftDto) {
    try {
      const exists = await this.prisma.shift.findUnique({ where: { name: dto.name } });
      if (exists) throw new ConflictException('Ca làm việc đã tồn tại');
      return await this.prisma.shift.create({ data: dto });
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  async findAll() {
    return this.prisma.shift.findMany({
      orderBy: { startTime: 'asc' },
      include: { _count: { select: { users: true } } },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException('Ca làm việc', id);
    return shift;
  }

  async update(id: string, dto: UpdateShiftDto) {
    try {
      await this.findOne(id);
      return await this.prisma.shift.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  async remove(id: string) {
    try {
      const shift = await this.findOne(id);
      const count = await this.prisma.user.count({ where: { shiftId: id } });
      if (count > 0) throw new ConflictException(`Không thể xóa: còn ${count} nhân viên trong ca này`);
      await this.prisma.shift.delete({ where: { id } });
      return shift;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof ConflictException) throw e;
      throw new InternalServerException(e.message);
    }
  }
}
