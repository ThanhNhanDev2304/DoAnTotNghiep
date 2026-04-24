import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
    @ApiProperty({ description: 'The description of the user', example: 'This is a user description' })
    @IsString({ message: 'Role ID must be a string' })
    @MaxLength(500, { message: 'Role ID must be at most 500 characters' })
    description?: string;
}

