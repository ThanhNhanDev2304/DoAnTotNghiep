import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'Ca sáng' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ example: '06:00', description: 'Giờ bắt đầu (HH:mm)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime phải định dạng HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '18:00', description: 'Giờ kết thúc (HH:mm)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime phải định dạng HH:mm' })
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
