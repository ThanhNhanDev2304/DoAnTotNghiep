import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QnaService } from './qna.service';
import { CreateQnaDto, CreateQnaAnswerDto } from './dto/create-qna.dto';
import { Roles } from '@/common/decorators/metadata';
import { User } from '@/common/decorators/user.decorator';

@ApiTags('QnA')
@Controller({ path: 'qna', version: '1' })
export class QnaController {
  constructor(private readonly service: QnaService) {}

  @Post()
  @ApiOperation({ summary: 'Đặt câu hỏi (Employee)' })
  create(@User('id') userId: string, @Body() dto: CreateQnaDto) {
    return this.service.create(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Câu hỏi của tôi' })
  findMy(@User('id') userId: string) {
    return this.service.findMy(userId);
  }

  @Get()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Tất cả câu hỏi (HR/Admin)' })
  findAll(@Query('status') status?: string, @Query('category') category?: string) {
    return this.service.findAll(status, category);
  }

  @Post(':id/answer')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Trả lời câu hỏi (HR/Admin)' })
  answer(@Param('id') qnaId: string, @User('id') authorId: string, @Body() dto: CreateQnaAnswerDto) {
    return this.service.answer(qnaId, authorId, dto);
  }
}
