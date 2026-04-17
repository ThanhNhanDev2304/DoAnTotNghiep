import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        const connectionString = process.env.DATABASE_URL;
        
        if (!connectionString) {
            throw new Error('DATABASE_URL is not defined');
        }

        const pool = new pg.Pool({ connectionString }); // Tạo pool kết nối PostgreSQL
        const adapter = new PrismaPg(pool); // Tạo adapter Prisma với pool kết nối
        
        // Gọi super với adapter
        super({ adapter });
    }

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