import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { SurveyStatus } from '@/common/enums/survey-status.enum';
import { ConflictException, ForbiddenException, InternalServerException, NotFoundException } from '@/common/exceptions/app.exception';
import { NotificationService } from '@/notification/notification.service';
import { NotificationType } from '@/common/enums/notification-type.enum';

@Injectable()
export class SurveyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createdById: string, dto: CreateSurveyDto) {
    try {
      const survey = await this.prisma.survey.create({
        data: {
          title: dto.title,
          description: dto.description,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          createdById,
          status: SurveyStatus.DRAFT,
          questions: dto.questions
            ? {
                create: dto.questions.map((q, i) => ({
                  question: q.question,
                  type: q.type,
                  options: q.options ?? [],
                  required: q.required ?? true,
                  order: q.order ?? i,
                })),
              }
            : undefined,
        },
        include: { questions: { orderBy: { order: 'asc' } }, _count: { select: { responses: true } } },
      });
      return survey;
    } catch (e: any) {
      throw new InternalServerException(e.message);
    }
  }

  async update(id: string, dto: UpdateSurveyDto) {
    const survey = await this.prisma.survey.findUnique({ where: { id } });
    if (!survey) throw new NotFoundException('Khảo sát', id);
    if (survey.status !== SurveyStatus.DRAFT) throw new ConflictException('Chỉ có thể sửa khảo sát ở trạng thái DRAFT');

    try {
      if (dto.questions !== undefined) {
        await this.prisma.surveyQuestion.deleteMany({ where: { surveyId: id } });
      }

      return this.prisma.survey.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
          ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
          ...(dto.questions !== undefined && {
            questions: {
              create: dto.questions.map((q, i) => ({
                question: q.question!,
                type: q.type!,
                options: q.options ?? [],
                required: q.required ?? true,
                order: q.order ?? i,
              })),
            },
          }),
        },
        include: { questions: { orderBy: { order: 'asc' } }, _count: { select: { responses: true, questions: true } } },
      });
    } catch (e: any) {
      throw new InternalServerException(e.message);
    }
  }

  async publish(id: string) {
    const survey = await this.prisma.survey.findUnique({ where: { id } });
    if (!survey) throw new NotFoundException('Khảo sát', id);
    if (survey.status !== SurveyStatus.DRAFT) throw new ConflictException('Chỉ có thể publish khảo sát ở trạng thái DRAFT');
    const updated = await this.prisma.survey.update({ where: { id }, data: { status: SurveyStatus.ACTIVE } });
    this.notificationService.createForAllActiveEmployees(
      NotificationType.SURVEY_PUBLISHED,
      'Khảo sát mới: ' + survey.title,
      (survey.description ?? 'Hãy tham gia khảo sát mới nhất từ HR.').slice(0, 100),
      '/surveys',
    ).catch(() => {});
    return updated;
  }

  async close(id: string) {
    const survey = await this.prisma.survey.findUnique({ where: { id } });
    if (!survey) throw new NotFoundException('Khảo sát', id);
    return this.prisma.survey.update({ where: { id }, data: { status: SurveyStatus.CLOSED } });
  }

  // HR: xem tất cả khảo sát
  async findAll() {
    return this.prisma.survey.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { fullName: true, userName: true } },
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true, questions: true } },
      },
    });
  }

  // Employee: xem các khảo sát ACTIVE + check đã điền chưa
  async findActiveForEmployee(userId: string) {
    const surveys = await this.prisma.survey.findMany({
      where: { status: SurveyStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { responses: true, questions: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });

    // Check user đã response chưa
    const responseChecks = await this.prisma.surveyResponse.findMany({
      where: { userId, surveyId: { in: surveys.map((s) => s.id) } },
      select: { surveyId: true },
    });
    const respondedIds = new Set(responseChecks.map((r) => r.surveyId));

    return surveys.map((s) => ({ ...s, hasResponded: respondedIds.has(s.id) }));
  }

  async findOne(id: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        createdBy: { select: { fullName: true, userName: true } },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) throw new NotFoundException('Khảo sát', id);
    return survey;
  }

  // Employee submit câu trả lời
  async submit(surveyId: string, userId: string, dto: SubmitSurveyDto) {
    try {
      const survey = await this.prisma.survey.findUnique({
        where: { id: surveyId },
        include: { questions: true },
      });
      if (!survey) throw new NotFoundException('Khảo sát', surveyId);
      if (survey.status !== SurveyStatus.ACTIVE) throw new ForbiddenException('Khảo sát chưa mở hoặc đã đóng');

      const now = new Date();
      if (survey.startDate && now < survey.startDate) throw new ForbiddenException('Khảo sát chưa bắt đầu');
      if (survey.endDate && now > survey.endDate) throw new ForbiddenException('Khảo sát đã hết hạn');

      const alreadySubmitted = await this.prisma.surveyResponse.findUnique({
        where: { surveyId_userId: { surveyId, userId } },
      });
      if (alreadySubmitted) throw new ConflictException('Bạn đã điền khảo sát này rồi');

      const response = await this.prisma.surveyResponse.create({
        data: {
          surveyId,
          userId,
          answers: {
            create: dto.answers.map((a) => ({
              questionId: a.questionId,
              answer: a.answer,
            })),
          },
        },
        include: { answers: true },
      });
      return response;
    } catch (e: any) {
      if (e instanceof NotFoundException || e instanceof ConflictException || e instanceof ForbiddenException) throw e;
      throw new InternalServerException(e.message);
    }
  }

  // HR: xem kết quả khảo sát
  async getResults(surveyId: string) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            answers: {
              include: {
                response: {
                  include: {
                    user: { select: { employeeCode: true, userName: true, fullName: true } },
                  },
                },
              },
            },
          },
        },
        responses: {
          orderBy: { submittedAt: 'asc' },
          include: {
            user: { select: { employeeCode: true, userName: true, fullName: true } },
          },
        },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) throw new NotFoundException('Khảo sát', surveyId);

    // Tổng hợp từng câu hỏi + chi tiết người trả lời
    const results = survey.questions.map((q) => {
      const answers = q.answers.map((a) => a.answer);
      const numericAnswers = answers.map(Number).filter((n) => !isNaN(n));
      const avg = numericAnswers.length > 0 ? numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length : null;

      const distribution: Record<string, number> = {};
      answers.forEach((a) => { distribution[a] = (distribution[a] || 0) + 1; });

      const details = q.answers.map((a) => ({
        answer: a.answer,
        employeeCode: a.response.user.employeeCode,
        userName: a.response.user.userName,
        fullName: a.response.user.fullName,
        submittedAt: a.response.submittedAt,
      }));

      return {
        questionId: q.id,
        question: q.question,
        type: q.type,
        totalAnswers: answers.length,
        average: avg ? Math.round(avg * 100) / 100 : null,
        distribution,
        details,
      };
    });

    // Danh sách người đã tham gia
    const respondents = survey.responses.map((r) => ({
      employeeCode: r.user.employeeCode,
      userName: r.user.userName,
      fullName: r.user.fullName,
      submittedAt: r.submittedAt,
    }));

    return {
      survey: { id: survey.id, title: survey.title, totalResponses: survey._count.responses },
      results,
      respondents,
    };
  }
}
