import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { ConflictException, InternalServerException } from '@/common/exceptions/app.exception';

@Injectable()
export class EvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateEvaluationDto) {
    try {
      const existing = await this.prisma.workplaceEvaluation.findUnique({
        where: { userId_month_year: { userId, month: dto.month, year: dto.year } },
      });
      if (existing) throw new ConflictException(`Bạn đã đánh giá tháng ${dto.month}/${dto.year} rồi`);

      const avg = (dto.salaryScore + dto.managementScore + dto.colleagueScore + dto.environmentScore + dto.benefitScore + dto.trainingScore) / 6;

      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, shiftId: true } });

      return await this.prisma.workplaceEvaluation.create({
        data: {
          ...dto,
          averageScore: Math.round(avg * 100) / 100,
          userId,
          departmentId: user?.departmentId ?? null,
          shiftId: user?.shiftId ?? null,
        },
      });
    } catch (e: any) {
      if (e instanceof ConflictException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  async findMy(userId: string) {
    return this.prisma.workplaceEvaluation.findMany({
      where: { userId }, orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  // HR: xem đánh giá theo tháng/năm, có thể filter theo phòng ban
  async findAll(month?: number, year?: number, departmentId?: string) {
    const where: any = {};
    if (month) where.month = month;
    if (year) where.year = year;
    if (departmentId) where.departmentId = departmentId;

    return this.prisma.workplaceEvaluation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, userName: true, employeeCode: true } },
        department: { select: { name: true } },
        shift: { select: { name: true } },
      },
    });
  }

  // Tổng hợp điểm trung bình theo phòng ban + tháng
  async getAggregatedByDepartment(month: number, year: number) {
    const evaluations = await this.prisma.workplaceEvaluation.findMany({
      where: { month, year },
      include: { department: { select: { name: true, code: true } } },
    });

    const grouped: Record<string, any> = {};
    evaluations.forEach((e) => {
      const key = e.departmentId ?? 'unknown';
      if (!grouped[key]) {
        grouped[key] = {
          departmentId: e.departmentId,
          departmentName: e.department?.name ?? 'Chưa phân công',
          scores: [],
        };
      }
      grouped[key].scores.push(e.averageScore);
    });

    return Object.values(grouped).map((g) => ({
      departmentId: g.departmentId,
      departmentName: g.departmentName,
      avgScore: g.scores.reduce((a: number, b: number) => a + b, 0) / g.scores.length,
      count: g.scores.length,
    }));
  }
}
