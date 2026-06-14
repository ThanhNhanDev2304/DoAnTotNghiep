import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FeedbackStatus } from '@/common/enums/feedback-status.enum';
import { SentimentType } from '@/common/enums/sentiment.enum';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      totalEmployees, totalFeedbacks, totalSurveys, totalProposals, totalComplaints,
      pendingFeedbacks, pendingProposals, pendingComplaints,
      recentFeedbacks, recentAnnouncements,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.feedback.count(),
      this.prisma.survey.count(),
      this.prisma.proposal.count(),
      this.prisma.complaint.count(),
      this.prisma.feedback.count({ where: { status: FeedbackStatus.PENDING } }),
      this.prisma.proposal.count({ where: { status: 'PENDING' } }),
      this.prisma.complaint.count({ where: { status: 'PENDING' } }),
      this.prisma.feedback.findMany({
        take: 5, orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, type: true, status: true, isAnonymous: true, createdAt: true, department: { select: { name: true } } },
      }),
      this.prisma.announcement.findMany({
        take: 5, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, title: true, type: true, isPinned: true, createdAt: true },
      }),
    ]);

    return {
      stats: { totalEmployees, totalFeedbacks, totalSurveys, totalProposals, totalComplaints },
      pending: { feedbacks: pendingFeedbacks, proposals: pendingProposals, complaints: pendingComplaints },
      recentFeedbacks,
      recentAnnouncements,
    };
  }

  // Department Health Score: 0-100
  async getDepartmentHealthScores(month: number, year: number) {
    const departments = await this.prisma.department.findMany({
      select: { id: true, name: true, code: true },
    });

    const scores = await Promise.all(
      departments.map(async (dept) => {
        // 1. Feedback sentiment score (30%)
        const feedbacks = await this.prisma.feedback.findMany({
          where: {
            departmentId: dept.id,
            createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
            sentiment: { not: null },
          },
          select: { sentiment: true },
        });
        let feedbackScore = 50; // neutral default
        if (feedbacks.length > 0) {
          const pos = feedbacks.filter((f) => f.sentiment === SentimentType.POSITIVE).length;
          const neg = feedbacks.filter((f) => f.sentiment === SentimentType.NEGATIVE).length;
          feedbackScore = feedbacks.length > 0 ? ((pos - neg) / feedbacks.length + 1) * 50 : 50;
        }

        // 2. Workplace evaluation score (40%) — convert 1-5 to 0-100
        const evals = await this.prisma.workplaceEvaluation.findMany({
          where: { departmentId: dept.id, month, year },
          select: { averageScore: true },
        });
        const evalScore = evals.length > 0
          ? (evals.reduce((s, e) => s + e.averageScore, 0) / evals.length) * 20
          : 50;

        // 3. Complaint rate (30%) — fewer = better
        const totalUsers = await this.prisma.user.count({ where: { departmentId: dept.id } });
        const complaints = await this.prisma.complaint.count({
          where: { user: { departmentId: dept.id }, createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } },
        });
        const complaintRate = totalUsers > 0 ? complaints / totalUsers : 0;
        const complaintScore = Math.max(0, 100 - complaintRate * 200);

        const healthScore = Math.round(feedbackScore * 0.3 + evalScore * 0.4 + complaintScore * 0.3);

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          departmentCode: dept.code,
          healthScore: Math.min(100, Math.max(0, healthScore)),
          breakdown: { feedbackScore: Math.round(feedbackScore), evalScore: Math.round(evalScore), complaintScore: Math.round(complaintScore) },
          totalEmployees: totalUsers,
          feedbackCount: feedbacks.length,
          evalCount: evals.length,
          complaintCount: complaints,
        };
      }),
    );

    return { month, year, departments: scores.sort((a, b) => b.healthScore - a.healthScore) };
  }

  // Xu hướng feedback theo tháng (6 tháng gần nhất)
  async getFeedbackTrend() {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

    const trend = await Promise.all(
      months.map(async ({ month, year }) => {
        const [total, positive, negative, neutral] = await Promise.all([
          this.prisma.feedback.count({ where: { createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } } }),
          this.prisma.feedback.count({ where: { sentiment: SentimentType.POSITIVE, createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } } }),
          this.prisma.feedback.count({ where: { sentiment: SentimentType.NEGATIVE, createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } } }),
          this.prisma.feedback.count({ where: { sentiment: SentimentType.NEUTRAL, createdAt: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) } } }),
        ]);
        return { label: `${month}/${year}`, month, year, total, positive, negative, neutral };
      }),
    );

    return trend;
  }

  // Phân bổ feedback theo loại
  async getFeedbackByType() {
    return this.prisma.feedback.groupBy({
      by: ['type'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
  }

  // Employee dashboard: thông tin cá nhân + thống kê
  async getEmployeeDashboard(userId: string) {
    const [myFeedbacks, mySurveys, myProposals, myComplaints, announcements] = await Promise.all([
      this.prisma.feedback.count({ where: { userId } }),
      this.prisma.surveyResponse.count({ where: { userId } }),
      this.prisma.proposal.count({ where: { userId } }),
      this.prisma.complaint.count({ where: { userId } }),
      this.prisma.announcement.findMany({
        take: 5, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, title: true, type: true, isPinned: true, createdAt: true },
      }),
    ]);

    const activeSurveys = await this.prisma.survey.findMany({
      where: { status: 'ACTIVE' },
      include: { _count: { select: { questions: true } } },
    });

    const respondedIds = await this.prisma.surveyResponse.findMany({
      where: { userId, surveyId: { in: activeSurveys.map((s) => s.id) } },
      select: { surveyId: true },
    });
    const respondedSet = new Set(respondedIds.map((r) => r.surveyId));

    return {
      stats: { myFeedbacks, mySurveys, myProposals, myComplaints },
      announcements,
      pendingSurveys: activeSurveys.filter((s) => !respondedSet.has(s.id)),
    };
  }
}
