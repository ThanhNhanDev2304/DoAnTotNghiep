import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserImageType } from '@/users/enums/UserImageType.enum';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password', 'roleName'] as const)) {}

// Nhân viên tự cập nhật thông tin cá nhân — không được đổi role/dept/ca/chức vụ
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional() @IsString() @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'NV001', description: 'Mã nhân viên (chỉ set được 1 lần nếu chưa có)' })
  @IsOptional() @IsString() @MaxLength(20)
  employeeCode?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional() @IsString() @MaxLength(15)
  phone?: string;

  @ApiPropertyOptional({ example: 'Nhân viên sản xuất tổ 1' })
  @IsOptional() @IsString() @MaxLength(500)
  description?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'HR' })
  @IsString()
  @MaxLength(100)
  roleNameOrId!: string;
}

export class UpdateUserAvatarOrBGDto {
  @ApiProperty({ enum: UserImageType })
  @IsEnum(UserImageType)
  typeImg!: UserImageType;
}
