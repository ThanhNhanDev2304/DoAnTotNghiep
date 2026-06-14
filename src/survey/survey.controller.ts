import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SurveyService } from './survey.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { Roles } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('Survey')
@Controller({ path: 'surveys', version: '1' })
export class SurveyController {
  constructor(private readonly service: SurveyService) {}

  @Post()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Tạo khảo sát mới (HR/Admin)' })
  create(@User('id') userId: string, @Body() dto: CreateSurveyDto) {
    return this.service.create(userId, dto);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Danh sách tất cả khảo sát (HR/Admin)' })
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Khảo sát đang mở (Employee)' })
  findActive(@User('id') userId: string) {
    return this.service.findActiveForEmployee(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết khảo sát' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Sửa khảo sát DRAFT (HR/Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateSurveyDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/publish')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Publish khảo sát (HR/Admin)' })
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Patch(':id/close')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Đóng khảo sát (HR/Admin)' })
  close(@Param('id') id: string) {
    return this.service.close(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Điền khảo sát (Employee)' })
  submit(@Param('id') surveyId: string, @User('id') userId: string, @Body() dto: SubmitSurveyDto) {
    return this.service.submit(surveyId, userId, dto);
  }

  @Get(':id/results')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Kết quả khảo sát (HR/Admin)' })
  getResults(@Param('id') id: string) {
    return this.service.getResults(id);
  }
}
