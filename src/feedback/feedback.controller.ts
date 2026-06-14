import {
  Controller, Get, Post, Body, Patch, Param, Query,
  UploadedFiles, UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { Roles } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('Feedback')
@Controller({ path: 'feedbacks', version: '1' })
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  // Nhân viên gửi phản hồi
  @Post()
  @ApiOperation({ summary: 'Gửi phản hồi (Employee/HR)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 5))
  create(
    @User('id') userId: string,
    @Body() dto: CreateFeedbackDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.service.create(userId, dto, files || []);
  }

  // Nhân viên xem feedback của mình
  @Get('my')
  @ApiOperation({ summary: 'Xem phản hồi của tôi (Employee)' })
  findMy(@User('id') userId: string, @Query() query: QueryFeedbackDto) {
    return this.service.findMyFeedbacks(userId, query);
  }

  // HR/Admin xem tất cả
  @Get()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Xem tất cả phản hồi (HR/Admin)' })
  findAll(@Query() query: QueryFeedbackDto) {
    return this.service.findAll(query);
  }

  // Thống kê nhanh
  @Get('stats')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Thống kê phản hồi (HR/Admin)' })
  getStats() {
    return this.service.getStats();
  }

  // Employee xem chi tiết feedback của mình
  @Get('my/:id')
  @ApiOperation({ summary: 'Chi tiết phản hồi của tôi' })
  findMyOne(@Param('id') id: string, @User('id') userId: string) {
    return this.service.findOneForEmployee(id, userId);
  }

  // HR/Admin xem chi tiết
  @Get(':id')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Chi tiết phản hồi (HR/Admin)' })
  findOne(@Param('id') id: string) {
    return this.service.findOneForHR(id);
  }

  // HR/Admin cập nhật trạng thái
  @Patch(':id/status')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Cập nhật trạng thái phản hồi (HR/Admin)' })
  updateStatus(
    @Param('id') id: string,
    @User('id') hrId: string,
    @Body() dto: UpdateFeedbackStatusDto,
  ) {
    return this.service.updateStatus(id, hrId, dto);
  }
}
