import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AnnouncementType } from '@/common/enums/announcement-type.enum';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'Thông báo thưởng lễ 30/4' })
  @IsNotEmpty() @IsString() @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Nội dung thông báo...' })
  @IsNotEmpty() @IsString() @MaxLength(10000)
  content!: string;

  @ApiPropertyOptional({ enum: AnnouncementType, default: AnnouncementType.GENERAL })
  @IsOptional() @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean()
  isPinned?: boolean;
}
