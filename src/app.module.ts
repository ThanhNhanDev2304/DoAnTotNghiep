import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { SessionModule } from './session/session.module';
import { RoleModule } from './role/role.module';
import { SeedDbModule } from './seed-db/seed-db.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true,
      envFilePath: '.env'
     }), // Load environment variables from .env file and make them globally available
    UsersModule, PrismaModule, SessionModule, RoleModule, SeedDbModule ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
