import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string, userId: string, roleName: string) {
    const term = q.trim();
    if (!term || term.length < 2) return { announcements: [], surveys: [], qna: [], proposals: [], complaints: [] };

    const isEmployee = roleName === 'EMPLOYEE';
    const isHrOrAdmin = !isEmployee;

    const [announcements, surveys, qna, proposals, complaints] = await Promise.all([
      // Thông báo — tất cả đều xem được
      this.prisma.announcement.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { content: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, type: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Khảo sát — employee chỉ thấy ACTIVE
      this.prisma.survey.findMany({
        where: {
          ...(isEmployee ? { status: 'ACTIVE' } : {}),
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Q&A — tất cả
      this.prisma.qnA.findMany({
        where: { question: { contains: term, mode: 'insensitive' } },
        select: { id: true, question: true, category: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Đề xuất — employee chỉ thấy của mình, HR/admin thấy tất cả
      this.prisma.proposal.findMany({
        where: {
          ...(isEmployee ? { authorId: userId } : {}),
          content: { contains: term, mode: 'insensitive' },
        },
        select: { id: true, content: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Khiếu nại — employee chỉ thấy của mình
      this.prisma.complaint.findMany({
        where: {
          ...(isEmployee ? { authorId: userId } : {}),
          OR: [
            { content: { contains: term, mode: 'insensitive' } },
            { title: { contains: term, mode: 'insensitive' } },
          ],
        },
        select: { id: true, title: true, type: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return { announcements, surveys, qna, proposals, complaints };
  }
}
