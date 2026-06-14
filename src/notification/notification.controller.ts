import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { User } from '@/common/decorators/user.decorator';
import type { ISanitizedUser } from '@/auth/interfaces/auth.interface';
import { SendToHrDto } from './dto/send-to-hr.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo của user hiện tại' })
  async list(@User('id') userId: string) {
    const data = await this.notificationService.getByUserId(userId);
    return { statusCode: 200, message: 'OK', data };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Số thông báo chưa đọc' })
  async unreadCount(@User('id') userId: string) {
    const count = await this.notificationService.countUnread(userId);
    return { statusCode: 200, message: 'OK', data: { count } };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả đã đọc' })
  async markAllRead(@User('id') userId: string) {
    await this.notificationService.markAllRead(userId);
    return { statusCode: 200, message: 'Đã đọc tất cả', data: null };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo đã đọc' })
  async markRead(@Param('id') id: string, @User('id') userId: string) {
    await this.notificationService.markRead(id, userId);
    return { statusCode: 200, message: 'Đã đánh dấu đã đọc', data: null };
  }

  @Post('send-to-hr')
  @ApiOperation({ summary: 'Nhân viên gửi thông báo đến HR/Admin' })
  async sendToHr(
    @User() user: ISanitizedUser,
    @Body() dto: SendToHrDto,
  ) {
    const senderName = (user as any).fullName || user.userName;
    await this.notificationService.createForHrAndAdmin(senderName, dto.title, dto.body);
    return { statusCode: 200, message: 'Đã gửi thông báo đến HR', data: null };
  }
}
