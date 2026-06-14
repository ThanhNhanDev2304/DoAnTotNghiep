import { Module } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { UsersController } from '@/users/users.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { RoleModule } from '@/role/role.module';
import { FilesModule } from '@/files/files.module';
import { EmailModule } from '@/email/email.module';
import { NotificationModule } from '@/notification/notification.module';

@Module({
  imports: [PrismaModule, RoleModule, FilesModule, EmailModule, NotificationModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
