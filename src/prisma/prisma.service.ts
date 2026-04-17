import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';import { PrismaPg } from '@prisma/adapter-pg';
// Adapter for Prisma when using Prisma Accelerate (prisma+postgres / db.prisma.io)
// Required because PrismaClient default does NOT support this connection directly
import * as pg from 'pg'; 

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    this.prisma = new PrismaClient({ adapter });
  }

  get client() {
    return this.prisma;
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log('✅ Prisma connected to PostgreSQL successfully');
    } catch (error) {
      this.logger.error('❌ Prisma connection failed:', error);
      throw error; 
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    this.logger.log('✅ Prisma disconnected from PostgreSQL');
  }
}
