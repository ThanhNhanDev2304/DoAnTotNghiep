import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { ConflictException, InternalServerException, NotFoundException } from '@/common/exceptions/app.exception';

@Injectable()
export class PositionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePositionDto) {
    try {
      const exists = await this.prisma.position.findUnique({ where: { name: dto.name } });
      if (exists) throw new ConflictException('Chức vụ đã tồn tại');
      return await this.prisma.position.create({ data: dto });
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  async findAll() {
    return this.prisma.position.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const pos = await this.prisma.position.findUnique({ where: { id } });
    if (!pos) throw new NotFoundException('Chức vụ', id);
    return pos;
  }

  async update(id: string, dto: UpdatePositionDto) {
    try {
      await this.findOne(id);
      return await this.prisma.position.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  async remove(id: string) {
    try {
      const pos = await this.findOne(id);
      const count = await this.prisma.user.count({ where: { positionId: id } });
      if (count > 0) throw new ConflictException(`Không thể xóa: còn ${count} nhân viên đang giữ chức vụ này`);
      await this.prisma.position.delete({ where: { id } });
      return pos;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof ConflictException) throw e;
      throw new InternalServerException(e.message);
    }
  }
}
