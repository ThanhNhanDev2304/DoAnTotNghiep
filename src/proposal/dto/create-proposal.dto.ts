import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProposalDto {
  @ApiProperty({ example: 'Đề xuất cải thiện khu vực nghỉ giải lao' })
  @IsNotEmpty() @IsString() @MinLength(5, { message: 'Tiêu đề tối thiểu 5 ký tự' }) @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Nội dung đề xuất chi tiết...' })
  @IsNotEmpty() @IsString() @MinLength(10, { message: 'Nội dung tối thiểu 10 ký tự' }) @MaxLength(5000)
  content!: string;
}
