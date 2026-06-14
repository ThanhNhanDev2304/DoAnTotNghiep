import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {  } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'; //Use the `pg` command when connecting to a PostgreSQL database, including Supabase, when using it outside of Accelerate.
import { PrismaPg } from '@prisma/adapter-pg'; // Use the PrismaPg adapter for connecting to PostgreSQL databases, including Supabase, when using it with Accelerate. This adapter is designed to work with the Prisma Data API and provides optimized performance and compatibility for PostgreSQL databases.

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(
        private readonly configService: ConfigService
     ) {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set. Please set it to your Prisma Data API URL !!!');
        }
        const pool = new Pool({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false, // For development purposes only. In production, you should use proper SSL certificates.
            },
        })

        super({ adapter: new PrismaPg(pool) }); // use the DB Orther Data API URL from the environment variable for connection
        // super({ accelerateUrl: databaseUrl }); // use the Prisma Data API URL from the environment variable for connection


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