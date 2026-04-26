import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class JobsService {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,

    ) {}
    private readonly logger = new Logger(JobsService.name);

    @Cron(CronExpression.EVERY_MINUTE,{
        name: 'handleExpiredSessions', // Tên của cron job để dễ dàng quản lý và theo dõi
        timeZone: 'Asia/Ho_Chi_Minh', // Đặt múi giờ cho cron job
        waitForCompletion: true, // Đảm bảo cron job không chạy đồng thời nếu lần trước chưa hoàn thành
    })
    async handleExpiredSessions() {
        try {
            const now = new Date();
            const result = await this.prisma.session.deleteMany({
                where: {
                    expiresAt: { lt: now },
                },
            });
            this.logger.log(`Deleted ${result.count} expired sessions successfully.`);
        } catch (error: any) {
            this.logger.error(`Error handling expired sessions: ${error.message}`);
        }
    }
}
