import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { FeedbackType } from '@/common/enums/feedback-type.enum';

export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackType, example: FeedbackType.SALARY })
  @IsEnum(FeedbackType)
  type!: FeedbackType;

  @ApiProperty({ example: 'Đề xuất điều chỉnh lương tăng ca' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Nội dung chi tiết...' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ example: false, description: 'Gửi ẩn danh' })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean = false;
}
