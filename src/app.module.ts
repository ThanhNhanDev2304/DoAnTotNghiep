import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UsersModule } from '@/users/users.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { SessionModule } from '@/session/session.module';
import { RoleModule } from '@/role/role.module';
import { SeedDbModule } from '@/seed-db/seed-db.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/auth/auth.module';
import { FilesModule } from './files/files.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env.local', '.env'], // Load environment variables from .env files in order of priority
     }), // Load environment variables from .env file and make them globally available
    UsersModule, PrismaModule, SessionModule, RoleModule, 
    SeedDbModule /*Module to seed the database with initial data on application startup*/,
    ScheduleModule.forRoot(), /* Enable scheduling capabilities for tasks like cleaning up expired sessions */
    AuthModule, FilesModule, JobsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
