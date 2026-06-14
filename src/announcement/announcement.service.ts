import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { InternalServerException, NotFoundException } from '@/common/exceptions/app.exception';
import { NotificationService } from '@/notification/notification.service';
import { NotificationType } from '@/common/enums/notification-type.enum';

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(authorId: string, dto: CreateAnnouncementDto) {
    try {
      const ann = await this.prisma.announcement.create({
        data: { ...dto, authorId, type: dto.type ?? 'GENERAL', isPinned: dto.isPinned ?? false },
        include: { author: { select: { fullName: true, userName: true } } },
      });
      // Thông báo cho tất cả nhân viên
      this.notificationService.createForAllActiveEmployees(
        NotificationType.ANNOUNCEMENT,
        ann.title,
        ann.content.slice(0, 100) + (ann.content.length > 100 ? '...' : ''),
        `/announcements/${ann.id}`,
      ).catch(() => {});
      return ann;
    } catch (e: any) { throw new InternalServerException(e.message); }
  }

  async findAll(type?: string) {
    return this.prisma.announcement.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { fullName: true, userName: true } } },
    });
  }

  async findOne(id: string) {
    const ann = await this.prisma.announcement.findUnique({
      where: { id },
      include: { author: { select: { fullName: true, userName: true } } },
    });
    if (!ann) throw new NotFoundException('Thông báo', id);
    return ann;
  }

  async update(id: string, dto: Partial<CreateAnnouncementDto>) {
    try {
      await this.findOne(id);
      return await this.prisma.announcement.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);
      return await this.prisma.announcement.delete({ where: { id } });
    } catch (e: any) {
      if (e instanceof NotFoundException) throw e;
      throw new InternalServerException(e.message);
    }
  }
}
