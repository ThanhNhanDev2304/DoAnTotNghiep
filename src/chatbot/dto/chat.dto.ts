import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ChatHistoryItemDto {
  @IsString() role!: 'user' | 'assistant';
  @IsString() content!: string;
}

export class ChatDto {
  @ApiProperty({ description: 'Tin nhắn của người dùng' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({ description: 'Lịch sử hội thoại', required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
