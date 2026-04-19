import { Module } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { UsersController } from '@/users/users.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { RoleModule } from '@/role/role.module';

@Module({
  imports: [PrismaModule, RoleModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
