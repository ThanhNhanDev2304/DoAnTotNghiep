import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ProposalStatus } from '@/common/enums/proposal-status.enum';

export class UpdateProposalStatusDto {
  @ApiProperty({ enum: ProposalStatus })
  @IsEnum(ProposalStatus)
  status!: ProposalStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  hrNote?: string;
}
