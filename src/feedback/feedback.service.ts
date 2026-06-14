import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { FilesService } from '@/files/files.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { ForbiddenException, InternalServerException, NotFoundException, ValidationException } from '@/common/exceptions/app.exception';
import { FeedbackStatus } from '@/common/enums/feedback-status.enum';

@Injectable()
export class FeedbackService {
  private readonly anonSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
  ) {
    this.anonSecret = this.configService.get<string>('ANONYMOUS_SECRET') || 'umc-anon-secret-2025';
  }

  private buildAnonymousToken(userId: string, feedbackId: string): string {
    return crypto
      .createHmac('sha256', this.anonSecret)
      .update(`${userId}:${feedbackId}`)
      .digest('hex');
  }

  async create(userId: string, dto: CreateFeedbackDto, files: Express.Multer.File[]) {
    // Kiểm tra mã nhân viên trước khi cho gửi
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { employeeCode: true, departmentId: true, shiftId: true },
    });
    if (!user?.employeeCode) {
      throw new ValidationException('Bạn chưa có mã nhân viên. Vui lòng cập nhật mã nhân viên trong trang cá nhân trước khi gửi phản hồi.');
    }

    try {

      const feedback = await this.prisma.feedback.create({
        data: {
          type: dto.type,
          title: dto.title,
          content: dto.content,
          isAnonymous: dto.isAnonymous ?? false,
          userId,
          departmentId: user?.departmentId ?? null,
          shiftId: user?.shiftId ?? null,
          status: FeedbackStatus.PENDING,
        },
      });

      // Nếu ẩn danh: tạo token thay cho userId
      if (dto.isAnonymous) {
        const anonymousToken = this.buildAnonymousToken(userId, feedback.id);
        await this.prisma.feedback.update({
          where: { id: feedback.id },
          data: { anonymousToken },
        });
      }

      // Upload file đính kèm nếu có
      if (files && files.length > 0) {
        const uploads = await Promise.all(
          files.map((f) =>
            this.filesService.uploadSingleFile(`feedbacks/${feedback.id}`, f.originalname, f, userId),
          ),
        );
        await this.prisma.feedbackAttachment.createMany({
          data: uploads.map((u, i) => ({
            feedbackId: feedback.id,
            fileName: u.fileName,
            originalName: files[i].originalname,
            url: u.fileUrl as string,
            mimeType: files[i].mimetype,
            size: files[i].size,
          })),
        });
      }

      return this.findOneForEmployee(feedback.id, userId);
    } catch (e: any) {
      throw new InternalServerException(e.message);
    }
  }

  // Employee: chỉ xem feedback của chính mình
  async findMyFeedbacks(userId: string, query: QueryFeedbackDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, parseInt(query.limit || '10', 10));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { attachments: true, department: { select: { name: true } } },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    // Nếu ẩn danh: ẩn userId khỏi response
    const sanitized = items.map((f) => this.sanitizeFeedbackForEmployee(f));

    return { items: sanitized, total, page, limit };
  }

  // HR/Admin: xem tất cả feedback
  async findAll(query: QueryFeedbackDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(50, parseInt(query.limit || '10', 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.shiftId) where.shiftId = query.shiftId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          attachments: true,
          department: { select: { name: true } },
          shift: { select: { name: true } },
          // Nếu ẩn danh: không include user
          user: { select: { id: true, fullName: true, userName: true, employeeCode: true } },
          resolvedBy: { select: { id: true, fullName: true, userName: true } },
        },
      }),
      this.prisma.feedback.count({ where }),
    ]);

    // Ẩn thông tin user nếu isAnonymous
    const sanitized = items.map((f) => this.sanitizeFeedbackForHR(f));

    return { items: sanitized, total, page, limit };
  }

  async findOneForEmployee(id: string, userId: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: { attachments: true, department: { select: { name: true } } },
    });
    if (!feedback) throw new NotFoundException('Phản hồi', id);
    if (feedback.userId !== userId) throw new ForbiddenException('Không có quyền xem phản hồi này');
    return this.sanitizeFeedbackForEmployee(feedback);
  }

  async findOneForHR(id: string) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: {
        attachments: true,
        department: { select: { name: true } },
        shift: { select: { name: true } },
        user: { select: { id: true, fullName: true, userName: true, employeeCode: true } },
        resolvedBy: { select: { id: true, fullName: true, userName: true } },
      },
    });
    if (!feedback) throw new NotFoundException('Phản hồi', id);
    return this.sanitizeFeedbackForHR(feedback);
  }

  async updateStatus(id: string, hrId: string, dto: UpdateFeedbackStatusDto) {
    try {
      const feedback = await this.prisma.feedback.findUnique({ where: { id } });
      if (!feedback) throw new NotFoundException('Phản hồi', id);

      return await this.prisma.feedback.update({
        where: { id },
        data: {
          status: dto.status,
          hrNote: dto.hrNote,
          resolvedById: [FeedbackStatus.RESOLVED, FeedbackStatus.REJECTED].includes(dto.status) ? hrId : undefined,
          resolvedAt: [FeedbackStatus.RESOLVED, FeedbackStatus.REJECTED].includes(dto.status) ? new Date() : undefined,
        },
      });
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  // Ẩn userId nếu isAnonymous (cho employee)
  private sanitizeFeedbackForEmployee(f: any) {
    return f;
  }

  // Ẩn thông tin định danh nếu isAnonymous (cho HR)
  private sanitizeFeedbackForHR(f: any) {
    if (f.isAnonymous) {
      return { ...f, user: null, userId: '[Ẩn danh]' };
    }
    return f;
  }

  async getStats() {
    const [total, pending, reviewing, resolved, rejected, byType, bySentiment] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.PENDING } }),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.REVIEWING } }),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.RESOLVED } }),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.REJECTED } }),
      this.prisma.feedback.groupBy({ by: ['type'], _count: { id: true } }),
      this.prisma.feedback.groupBy({ by: ['sentiment'], _count: { id: true }, where: { sentiment: { not: null } } }),
    ]);

    return {
      total,
      byStatus: { pending, reviewing, resolved, rejected },
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
      bySentiment: bySentiment.map((s) => ({ sentiment: s.sentiment, count: s._count.id })),
    };
  }
}
