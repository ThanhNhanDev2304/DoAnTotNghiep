import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password', 'roleName'] as const)) {
    @ApiProperty({ description: 'The description of the user', example: 'This is a user description' })
    @IsString({ message: 'Role ID must be a string' })
    @MaxLength(500, { message: 'Role ID must be at most 500 characters' })
    description?: string;
}

export class UpdateUserRoleDto {
    @ApiProperty({ description: 'The new role name or ID of the user', example: 'ADMIN' })
    @IsString({ message: 'Role name or ID must be a string' })
    @MaxLength(100, { message: 'Role name or ID must be at most 100 characters' })
    roleNameOrId!: string;
}

export enum UserImageType {
    AVATAR = 'avatar',
    BACKGROUND = 'background',
}

export class UpdateUserAvatarOrBGDto {
    @ApiProperty({
        description: 'Choose image type',
        enum: UserImageType,
        example: UserImageType.AVATAR,
    })
    @IsEnum(UserImageType, {
        message: 'Type must be either avatar or background',
    })
    typeImg!: UserImageType;
}
