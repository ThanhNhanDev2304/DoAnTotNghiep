import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { InternalServerException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import { ComplaintStatus } from '@/common/enums/complaint-type.enum';

const INCLUDE_AUTHOR = { select: { id: true, fullName: true, userName: true, employeeCode: true, department: { select: { name: true } } } };

@Injectable()
export class ComplaintService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateComplaintDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { employeeCode: true } });
    if (!user?.employeeCode) {
      throw new ValidationException('Bạn chưa có mã nhân viên. Vui lòng cập nhật mã nhân viên trong trang cá nhân trước khi gửi khiếu nại.');
    }

    try {
      return await this.prisma.complaint.create({
        data: { ...dto, userId, status: ComplaintStatus.PENDING },
        include: { user: INCLUDE_AUTHOR },
      });
    } catch (e: any) { throw new InternalServerException(e.message); }
  }

  async findMy(userId: string) {
    return this.prisma.complaint.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async findAll(status?: string, type?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    return this.prisma.complaint.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { user: INCLUDE_AUTHOR, resolvedBy: { select: { fullName: true, userName: true } } },
    });
  }

  async updateStatus(id: string, hrId: string, dto: UpdateComplaintStatusDto) {
    try {
      const complaint = await this.prisma.complaint.findUnique({ where: { id } });
      if (!complaint) throw new NotFoundException('Khiếu nại', id);
      return await this.prisma.complaint.update({
        where: { id },
        data: {
          status: dto.status, hrNote: dto.hrNote,
          resolvedById: [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED].includes(dto.status) ? hrId : undefined,
          resolvedAt: [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED].includes(dto.status) ? new Date() : undefined,
        },
      });
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerException(e.message);
    }
  }
}
