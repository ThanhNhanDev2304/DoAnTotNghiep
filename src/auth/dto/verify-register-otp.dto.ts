import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyRegisterOtpDto {
  @ApiProperty({
    example: 'example@gmail.com',
    description: 'Email used during registration',
  })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code sent to email',
  })
  @IsNotEmpty({ message: 'OTP must not be empty' })
  @IsString({ message: 'OTP must be a string' })
  @Matches(/^\d+$/, { message: 'OTP must contain only digits' })
  otp!: string;
}
