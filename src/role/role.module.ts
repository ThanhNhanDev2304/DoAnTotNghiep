import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule, // DI for PrismaService to interact with the database
  ],
  controllers: [RoleController],
  providers: [RoleService],
})
export class RoleModule {}
