import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { roles, users, departments, positions, shifts } from '@/seed-db/seed/sample';
import { ConfigService } from '@nestjs/config';
import { generatePasswordHash } from '@/lib/bcrypt/bcrypt';
import { FilesService } from '@/files/files.service';

@Injectable()
export class SeedDbService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
  ) {}

  private readonly logger = new Logger(SeedDbService.name);

  private async seedRoles() {
    const existing = await this.prisma.role.findMany();
    if (existing.length > 0) {
      this.logger.warn(`Roles already exist (${existing.length}). Skipping.`);
      return;
    }
    const result = await this.prisma.role.createMany({ data: roles, skipDuplicates: true });
    this.logger.log(`Seeded ${result.count} roles.`);
  }

  private async seedDepartments() {
    const existing = await this.prisma.department.findMany();
    if (existing.length > 0) {
      this.logger.warn(`Departments already exist (${existing.length}). Skipping.`);
      return;
    }
    const result = await this.prisma.department.createMany({ data: departments, skipDuplicates: true });
    this.logger.log(`Seeded ${result.count} departments.`);
  }

  private async seedPositions() {
    const existing = await this.prisma.position.findMany();
    if (existing.length > 0) {
      this.logger.warn(`Positions already exist (${existing.length}). Skipping.`);
      return;
    }
    const result = await this.prisma.position.createMany({ data: positions, skipDuplicates: true });
    this.logger.log(`Seeded ${result.count} positions.`);
  }

  private async seedShifts() {
    const existing = await this.prisma.shift.findMany();
    if (existing.length > 0) {
      this.logger.warn(`Shifts already exist (${existing.length}). Skipping.`);
      return;
    }
    const result = await this.prisma.shift.createMany({ data: shifts, skipDuplicates: true });
    this.logger.log(`Seeded ${result.count} shifts.`);
  }

  private async seedUsers() {
    const existing = await this.prisma.user.findMany();
    if (existing.length > 0) {
      this.logger.warn(`Users already exist (${existing.length}). Skipping.`);
      return;
    }

    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10', 10);

    const adminRole = await this.prisma.role.findUnique({
      where: { roleName: this.configService.get<string>('NAME_ROLE_ADMIN') || 'ADMIN' },
    });
    const hrRole = await this.prisma.role.findUnique({
      where: { roleName: this.configService.get<string>('NAME_ROLE_HR') || 'HR' },
    });
    const employeeRole = await this.prisma.role.findUnique({
      where: { roleName: this.configService.get<string>('NAME_ROLE_USER') || 'EMPLOYEE' },
    });

    if (!adminRole || !hrRole || !employeeRole) {
      throw new Error('Required roles not found. Ensure roles are seeded first.');
    }

    const getRoleId = (userName: string) => {
      if (userName === 'Admin') return adminRole.id;
      if (userName === 'HR') return hrRole.id;
      return employeeRole.id;
    };

    const dept = await this.prisma.department.findFirst({ where: { code: 'PRD01' } });
    const pos = await this.prisma.position.findFirst({ where: { name: 'Công nhân' } });
    const shift = await this.prisma.shift.findFirst({ where: { name: 'Ca sáng' } });

    const list = await Promise.all(
      users.map(async (u) => ({
        email: u.email,
        userName: u.userName,
        fullName: u.fullName,
        employeeCode: (u as any).employeeCode ?? null,
        password: await generatePasswordHash(u.password, saltRounds),
        roleId: getRoleId(u.userName),
        isActive: true,
        departmentId: ['NV001', 'NV002'].includes(u.userName) ? (dept?.id ?? null) : null,
        positionId: ['NV001', 'NV002'].includes(u.userName) ? (pos?.id ?? null) : null,
        shiftId: ['NV001', 'NV002'].includes(u.userName) ? (shift?.id ?? null) : null,
        startDate: ['NV001', 'NV002'].includes(u.userName) ? new Date('2022-01-01') : null,
      })),
    );

    const result = await this.prisma.user.createMany({ data: list, skipDuplicates: true });
    this.logger.log(`Seeded ${result.count} users.`);
  }

  async seed() {
    this.logger.log('Starting database seeding...');
    await this.seedRoles();
    await this.seedDepartments();
    await this.seedPositions();
    await this.seedShifts();
    await this.seedUsers();
    this.logger.log('Database seeding completed.');
  }

  async clear() {
    await this.filesService.clearBucketStorage();
    await this.prisma.pendingRegistration.deleteMany();
    await this.prisma.session.deleteMany();
    await this.prisma.file.deleteMany();
    await this.prisma.notification.deleteMany();
    await this.prisma.recognition.deleteMany();
    await this.prisma.departmentHealthScore.deleteMany();
    await this.prisma.workplaceEvaluation.deleteMany();
    await this.prisma.qnAAnswer.deleteMany();
    await this.prisma.qnA.deleteMany();
    await this.prisma.announcement.deleteMany();
    await this.prisma.complaint.deleteMany();
    await this.prisma.proposal.deleteMany();
    await this.prisma.surveyAnswer.deleteMany();
    await this.prisma.surveyResponse.deleteMany();
    await this.prisma.surveyQuestion.deleteMany();
    await this.prisma.survey.deleteMany();
    await this.prisma.feedbackAttachment.deleteMany();
    await this.prisma.feedback.deleteMany();
    await this.prisma.user.deleteMany();
    await this.prisma.shift.deleteMany();
    await this.prisma.position.deleteMany();
    await this.prisma.department.deleteMany();
    await this.prisma.role.deleteMany();
    this.logger.log('Database cleared.');
  }

  async onModuleInit() {
    const shouldSeed = this.configService.get<string>('SEED_DB') === 'true';
    const shouldClear = this.configService.get<string>('CLEAR_DB') === 'true';

    this.logger.log(`SEED_DB: ${shouldSeed}, CLEAR_DB: ${shouldClear}`);

    if (shouldSeed) {
      if (shouldClear) {
        await this.clear();
        this.logger.log('Database cleared before seeding.');
      }
      await this.seed();
    } else {
      this.logger.log('SEED_DB not enabled. Skipping.');
    }
  }
}
