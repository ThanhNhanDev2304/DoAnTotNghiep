import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from '@/session/dto/create-session.dto';
import { UpdateSessionDto } from '@/session/dto/update-session.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { SessionEntity } from '@/session/entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) { }

  async upsertSession(createSessionDto: CreateSessionDto) {
    const { userId, deviceId, refreshToken } = createSessionDto;
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRE');
    if (!expiresIn) {
      throw new Error('JWT_REFRESH_EXPIRE is not defined');
    }
    const expiresAt = new Date(Date.now() + ms(expiresIn as ms.StringValue));
    return this.prismaService.$transaction(async (tx) => { // Transaction ensures atomicity of the session management logic
      // 1. Check device tồn tại chưa
      const existingSession = await tx.session.findUnique({
        where: { deviceId },
      });
      // CASE 1: UPDATE
      if (existingSession) {
        return tx.session.update({
          where: { deviceId },
          data: {
            refreshToken,
            expiresAt,
          },
        });
      }
      // CASE 2: DEVICE MỚI → enforce limit
      const limit = Number(this.configService.get<string>('NUMBER_OF_DEVICES'));
      const sessions = await tx.session.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: 'asc' },
      });
      // Nếu đã đạt giới hạn, xóa session cũ nhất (theo expiresAt) để nhường chỗ cho session mới
      if (sessions.length >= limit) { 
        await tx.session.delete({
          where: { id: sessions[0].id },
        });
      }
      // CREATE session mới
      return tx.session.create({
        data: {
          userId,
          deviceId,
          refreshToken,
          expiresAt,
        },
      });
    });
  }


  async findSessionByRefreshTokenAndDeviceId(refreshToken: string, deviceId: string): Promise<SessionEntity | null> {
    const session = await this.prismaService.session.findFirst({
      where: {
        refreshToken,
        deviceId,
        expiresAt: { gt: new Date() }, // Ensure session is still valid
      },
    });
    return session ? session : null;
  }

  async deleteSessionByDeviceId(userId: string, deviceId: string): Promise<boolean> {
    const session = await this.prismaService.session.delete({
      where: { 
        deviceId,
        userId
       },
    });
    if (!session) {
      return false; // No session found with the given deviceId
    }
    return true;
  }

  async deleteSessionsByUserId(userId: string): Promise<boolean> {
    const result = await this.prismaService.session.deleteMany({
      where: { userId }
    });
    if(!result.count){
      throw new Error(`No sessions found for user ID ${userId}`);
    }
    return true;
  }

}
