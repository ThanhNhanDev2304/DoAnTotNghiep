import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty({ example: 6, description: 'Tháng (1-12)' })
  @IsInt() @Min(1) @Max(12)
  month!: number;

  @ApiProperty({ example: 2025 })
  @IsInt() @Min(2020)
  year!: number;

  @ApiProperty({ example: 4, description: 'Điểm lương thưởng (1-5)' })
  @IsNumber() @Min(1) @Max(5)
  salaryScore!: number;

  @ApiProperty({ example: 4, description: 'Điểm quản lý (1-5)' })
  @IsNumber() @Min(1) @Max(5)
  managementScore!: number;

  @ApiProperty({ example: 5, description: 'Điểm đồng nghiệp (1-5)' })
  @IsNumber() @Min(1) @Max(5)
  colleagueScore!: number;

  @ApiProperty({ example: 3, description: 'Điểm môi trường (1-5)' })
  @IsNumber() @Min(1) @Max(5)
  environmentScore!: number;

  @ApiProperty({ example: 4, description: 'Điểm phúc lợi (1-5)' })
  @IsNumber() @Min(1) @Max(5)
  benefitScore!: number;

  @ApiProperty({ example: 3, description: 'Điểm đào tạo (1-5)' })
  @IsNumber() @Min(1) @Max(5)
  trainingScore!: number;

  @ApiPropertyOptional({ example: 'Cần cải thiện khu vực nghỉ ngơi' })
  @IsOptional() @IsString() @MaxLength(1000)
  comment?: string;
}
