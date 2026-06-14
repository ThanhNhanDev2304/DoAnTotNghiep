import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { Roles } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('Evaluation')
@Controller({ path: 'evaluations', version: '1' })
export class EvaluationController {
  constructor(private readonly service: EvaluationService) {}

  @Post()
  @ApiOperation({ summary: 'Đánh giá môi trường làm việc tháng này (Employee)' })
  create(@User('id') userId: string, @Body() dto: CreateEvaluationDto) {
    return this.service.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Lịch sử đánh giá của tôi' })
  findMy(@User('id') userId: string) {
    return this.service.findMy(userId);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Tất cả đánh giá (HR/Admin)' })
  findAll(
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.service.findAll(month ? +month : undefined, year ? +year : undefined, departmentId);
  }

  @Get('aggregated')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Tổng hợp điểm theo phòng ban + tháng' })
  getAggregated(@Query('month') month: string, @Query('year') year: string) {
    return this.service.getAggregatedByDepartment(+month, +year);
  }
}
