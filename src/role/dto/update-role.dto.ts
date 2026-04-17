import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from '@/role/dto/create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
