import { Module } from '@nestjs/common';
import { SeedDbService } from './seed-db.service';
import { SeedDbController } from './seed-db.controller';

@Module({
  imports: [
    
  ],
  controllers: [SeedDbController],
  providers: [SeedDbService],
})
export class SeedDbModule {}
