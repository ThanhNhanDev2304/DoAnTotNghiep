import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { ForbiddenException, InternalServerException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import { ProposalStatus } from '@/common/enums/proposal-status.enum';

const INCLUDE_AUTHOR = { select: { id: true, fullName: true, userName: true, employeeCode: true, department: { select: { name: true } } } };

@Injectable()
export class ProposalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProposalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { employeeCode: true } });
    if (!user?.employeeCode) {
      throw new ValidationException('Bạn chưa có mã nhân viên. Vui lòng cập nhật mã nhân viên trong trang cá nhân trước khi gửi đề xuất.');
    }

    try {
      return await this.prisma.proposal.create({
        data: { ...dto, userId, status: ProposalStatus.PENDING },
        include: { user: INCLUDE_AUTHOR },
      });
    } catch (e: any) { throw new InternalServerException(e.message); }
  }

  async findMy(userId: string) {
    return this.prisma.proposal.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(status?: string) {
    return this.prisma.proposal.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: INCLUDE_AUTHOR, resolvedBy: { select: { fullName: true, userName: true } } },
    });
  }

  async updateStatus(id: string, hrId: string, dto: UpdateProposalStatusDto) {
    try {
      const proposal = await this.prisma.proposal.findUnique({ where: { id } });
      if (!proposal) throw new NotFoundException('Kiến nghị', id);
      return await this.prisma.proposal.update({
        where: { id },
        data: {
          status: dto.status, hrNote: dto.hrNote,
          resolvedById: [ProposalStatus.COMPLETED, ProposalStatus.REJECTED].includes(dto.status) ? hrId : undefined,
          resolvedAt: [ProposalStatus.COMPLETED, ProposalStatus.REJECTED].includes(dto.status) ? new Date() : undefined,
        },
      });
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerException(e.message);
    }
  }
}
