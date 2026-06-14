import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'QA', description: 'Tên phòng ban' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'QA01', description: 'Mã phòng ban' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  code!: string;

  @ApiPropertyOptional({ example: 'Phòng Kiểm soát chất lượng' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'UUID của trưởng phòng' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}
