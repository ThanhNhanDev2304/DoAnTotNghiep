import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationType } from '@/common/enums/notification-type.enum';

@Injectable()
export class NotificationService {
  private readonly employeeRoleName: string;
  private readonly hrRoleName: string;
  private readonly adminRoleName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.employeeRoleName = this.config.get('NAME_ROLE_USER') || 'EMPLOYEE';
    this.hrRoleName = this.config.get('NAME_ROLE_HR') || 'HR';
    this.adminRoleName = this.config.get('NAME_ROLE_ADMIN') || 'ADMIN';
  }

  async create(userId: string, type: NotificationType, title: string, body: string, link?: string) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    });
  }

  async createForAllActiveEmployees(type: NotificationType, title: string, body: string, link?: string) {
    const employees = await this.prisma.user.findMany({
      where: { isActive: true, role: { roleName: this.employeeRoleName } },
      select: { id: true },
    });
    if (!employees.length) return;
    await this.prisma.notification.createMany({
      data: employees.map(e => ({ userId: e.id, type, title, body, link: link ?? null })),
    });
  }

  async getByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  }

  async createForHrAndAdmin(senderName: string, title: string, body: string) {
    const managers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { roleName: { in: [this.hrRoleName, this.adminRoleName] } },
      },
      select: { id: true },
    });
    if (!managers.length) return;
    await this.prisma.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        type: NotificationType.EMPLOYEE_REQUEST,
        title,
        body: `[${senderName}]: ${body}`,
        link: null,
      })),
    });
  }
}
