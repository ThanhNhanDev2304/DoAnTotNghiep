import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SendToHrDto {
  @ApiProperty({ example: 'Yêu cầu xác nhận tăng ca' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  @MinLength(3, { message: 'Tiêu đề tối thiểu 3 ký tự' })
  @MaxLength(200, { message: 'Tiêu đề tối đa 200 ký tự' })
  title!: string;

  @ApiProperty({ example: 'Tôi muốn yêu cầu xác nhận tăng ca ngày 15/6...' })
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  @MinLength(10, { message: 'Nội dung tối thiểu 10 ký tự' })
  @MaxLength(1000, { message: 'Nội dung tối đa 1000 ký tự' })
  body!: string;
}
