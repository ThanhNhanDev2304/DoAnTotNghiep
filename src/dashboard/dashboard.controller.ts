import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('Dashboard')
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  // HR/Admin: tổng quan hệ thống
  @Get('overview')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Tổng quan hệ thống (HR/Admin)' })
  getOverview() {
    return this.service.getOverview();
  }

  // HR/Admin: health score từng phòng ban
  @Get('health-scores')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Department Health Score (HR/Admin)' })
  getHealthScores(
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const now = new Date();
    return this.service.getDepartmentHealthScores(
      month ? +month : now.getMonth() + 1,
      year ? +year : now.getFullYear(),
    );
  }

  // HR/Admin: xu hướng feedback 6 tháng
  @Get('feedback-trend')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Xu hướng phản hồi 6 tháng (HR/Admin)' })
  getFeedbackTrend() {
    return this.service.getFeedbackTrend();
  }

  // HR/Admin: phân bổ theo loại
  @Get('feedback-by-type')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Phân bổ phản hồi theo loại (HR/Admin)' })
  getFeedbackByType() {
    return this.service.getFeedbackByType();
  }

  // Employee: dashboard cá nhân
  @Get('employee')
  @ApiOperation({ summary: 'Dashboard nhân viên' })
  getEmployeeDashboard(@User('id') userId: string) {
    return this.service.getEmployeeDashboard(userId);
  }
}
