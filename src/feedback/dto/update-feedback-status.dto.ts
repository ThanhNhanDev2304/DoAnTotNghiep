import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FeedbackStatus } from '@/common/enums/feedback-status.enum';

export class UpdateFeedbackStatusDto {
  @ApiProperty({ enum: FeedbackStatus })
  @IsEnum(FeedbackStatus)
  status!: FeedbackStatus;

  @ApiPropertyOptional({ example: 'Đã ghi nhận và chuyển cho bộ phận liên quan' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  hrNote?: string;
}
