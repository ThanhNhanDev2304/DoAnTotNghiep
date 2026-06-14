import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateQnaDto, CreateQnaAnswerDto } from './dto/create-qna.dto';
import { InternalServerException, NotFoundException } from '@/common/exceptions/app.exception';

@Injectable()
export class QnaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateQnaDto) {
    try {
      return await this.prisma.qnA.create({
        data: { question: dto.question, category: dto.category ?? 'GENERAL', userId },
        include: { user: { select: { fullName: true, userName: true } } },
      });
    } catch (e: any) { throw new InternalServerException(e.message); }
  }

  async findAll(status?: string, category?: string) {
    return this.prisma.qnA.findMany({
      where: { ...(status && { status }), ...(category && { category }) },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, userName: true, employeeCode: true } },
        answers: { include: { author: { select: { fullName: true, userName: true } } } },
      },
    });
  }

  async findMy(userId: string) {
    return this.prisma.qnA.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { answers: { include: { author: { select: { fullName: true, userName: true } } } } },
    });
  }

  async answer(qnaId: string, authorId: string, dto: CreateQnaAnswerDto) {
    try {
      const qna = await this.prisma.qnA.findUnique({ where: { id: qnaId } });
      if (!qna) throw new NotFoundException('Câu hỏi', qnaId);

      const answer = await this.prisma.qnAAnswer.create({
        data: { qnaId, content: dto.content, authorId },
        include: { author: { select: { fullName: true, userName: true } } },
      });

      // Mark as ANSWERED
      await this.prisma.qnA.update({ where: { id: qnaId }, data: { status: 'ANSWERED' } });

      return answer;
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerException(e.message);
    }
  }
}
