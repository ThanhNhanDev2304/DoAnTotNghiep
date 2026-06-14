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
import { FilesModule } from '@/files/files.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsModule } from '@/jobs/jobs.module';
import { EmailModule } from '@/email/email.module';
import { DepartmentModule } from '@/department/department.module';
import { PositionModule } from '@/position/position.module';
import { ShiftModule } from '@/shift/shift.module';
import { FeedbackModule } from '@/feedback/feedback.module';
import { SurveyModule } from '@/survey/survey.module';
import { ProposalModule } from '@/proposal/proposal.module';
import { ComplaintModule } from '@/complaint/complaint.module';
import { AnnouncementModule } from '@/announcement/announcement.module';
import { EvaluationModule } from '@/evaluation/evaluation.module';
import { QnaModule } from '@/qna/qna.module';
import { DashboardModule } from '@/dashboard/dashboard.module';
import { NotificationModule } from '@/notification/notification.module';
import { SearchModule } from '@/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.development', '.env.local', '.env'],
    }),
    // Infrastructure
    PrismaModule, SessionModule, FilesModule, EmailModule,
    ScheduleModule.forRoot(),
    // Core
    UsersModule, RoleModule, AuthModule,
    SeedDbModule, JobsModule,
    // Organization
    DepartmentModule, PositionModule, ShiftModule,
    // UMC Features
    FeedbackModule,
    SurveyModule,
    ProposalModule,
    ComplaintModule,
    AnnouncementModule,
    EvaluationModule,
    QnaModule,
    DashboardModule,
    NotificationModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
