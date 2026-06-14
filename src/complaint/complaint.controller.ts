import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { Roles } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('Complaint')
@Controller({ path: 'complaints', version: '1' })
export class ComplaintController {
  constructor(private readonly service: ComplaintService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi khiếu nại (Employee)' })
  create(@User('id') userId: string, @Body() dto: CreateComplaintDto) {
    return this.service.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Khiếu nại của tôi' })
  findMy(@User('id') userId: string) {
    return this.service.findMy(userId);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Tất cả khiếu nại (HR/Admin)' })
  findAll(@Query('status') status?: string, @Query('type') type?: string) {
    return this.service.findAll(status, type);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Xử lý khiếu nại (HR/Admin)' })
  updateStatus(@Param('id') id: string, @User('id') hrId: string, @Body() dto: UpdateComplaintStatusDto) {
    return this.service.updateStatus(id, hrId, dto);
  }
}
