import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

enum QnaCategory { GENERAL = 'GENERAL', POLICY = 'POLICY', SALARY = 'SALARY', INSURANCE = 'INSURANCE', LEAVE = 'LEAVE' }

export class CreateQnaDto {
  @ApiProperty({ example: 'Chính sách nghỉ phép năm có bao nhiêu ngày?' })
  @IsNotEmpty() @IsString() @MinLength(10, { message: 'Câu hỏi tối thiểu 10 ký tự' }) @MaxLength(500)
  question!: string;

  @ApiPropertyOptional({ example: 'POLICY', description: 'POLICY|SALARY|INSURANCE|LEAVE|GENERAL' })
  @IsOptional() @IsEnum(QnaCategory, { message: 'Danh mục không hợp lệ' })
  category?: string;
}

export class CreateQnaAnswerDto {
  @ApiProperty({ example: 'Theo quy định công ty, nghỉ phép năm là 12 ngày...' })
  @IsNotEmpty() @IsString() @MinLength(10, { message: 'Câu trả lời tối thiểu 10 ký tự' }) @MaxLength(5000)
  content!: string;
}
