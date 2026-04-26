import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({ description: 'Địa chỉ email nhận tin nhắn kiểm tra', example: 'user@example.com' })
  @IsEmail({ }, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  toEmail!: string;
}