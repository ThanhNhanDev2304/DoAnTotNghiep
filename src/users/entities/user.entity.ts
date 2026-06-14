import { Exclude, Type } from 'class-transformer';
import { IUserEntity } from '@/users/interfaces/users.interface';

export class UserEntity implements IUserEntity {
  id!: string;
  email!: string;
  userName!: string;

  @Exclude()
  password?: string | null;

  googleId?: string | null;
  accountType!: string;

  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  description?: string | null;

  roleId!: string;
  roleName!: string;
  isActive!: boolean;

  // Employee profile
  fullName?: string | null;
  employeeCode?: string | null;
  pendingEmployeeCode?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  shiftId?: string | null;
  startDate?: Date | null;

  @Type(() => Date)
  createdAt!: Date;
  @Type(() => Date)
  updatedAt!: Date;

  @Exclude()
  sessions?: any[];
}
