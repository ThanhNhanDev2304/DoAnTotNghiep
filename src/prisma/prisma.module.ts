import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Global() // Make PrismaModule global so that PrismaService can be injected anywhere without needing to import PrismaModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
