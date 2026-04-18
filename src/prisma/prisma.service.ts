import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(
        private readonly configService: ConfigService
     ) {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set. Please set it to your Prisma Data API URL !!!');
        }
        super({ accelerateUrl: databaseUrl });
    }
    
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Prisma connected to PostgreSQL successfully');
        } catch (error: any) {
            this.logger.error('❌ Prisma connection failed:', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('✅ Prisma disconnected from PostgreSQL');
    }
}