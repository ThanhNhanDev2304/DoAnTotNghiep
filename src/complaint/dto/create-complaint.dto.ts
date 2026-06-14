import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ComplaintType } from '@/common/enums/complaint-type.enum';

export class CreateComplaintDto {
  @ApiProperty({ example: 'Khiếu nại về lương tháng 5' })
  @IsNotEmpty() @IsString() @MinLength(5, { message: 'Tiêu đề tối thiểu 5 ký tự' }) @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Nội dung khiếu nại...' })
  @IsNotEmpty() @IsString() @MinLength(10, { message: 'Nội dung tối thiểu 10 ký tự' }) @MaxLength(5000)
  content!: string;

  @ApiProperty({ enum: ComplaintType })
  @IsEnum(ComplaintType, { message: 'Loại khiếu nại không hợp lệ' })
  type!: ComplaintType;
}
