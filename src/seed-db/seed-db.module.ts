import { Module } from '@nestjs/common';
import { SeedDbService } from './seed-db.service';
import { SeedDbController } from './seed-db.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { FilesModule } from '@/files/files.module';

@Module({
  imports: [
    PrismaModule,
    FilesModule
  ],
  controllers: [SeedDbController],
  providers: [SeedDbService],
})
export class SeedDbModule {}
