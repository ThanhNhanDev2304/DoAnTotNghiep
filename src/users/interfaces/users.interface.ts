import { IApiResponse } from '@/common/interceptors/transform.interceptor';
import { UserImageType } from '@/users/enums/UserImageType.enum';

export interface IUserEntity {
  id: string;
  email: string;
  userName: string;
  googleId?: string | null;
  accountType: string;
  isActive: boolean;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  description?: string | null;
  roleId: string;
  roleName: string;
  // Employee profile
  fullName?: string | null;
  employeeCode?: string | null;
  pendingEmployeeCode?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  shiftId?: string | null;
  startDate?: Date | null;
}

export interface IUserEntityWithPassword extends IUserEntity {
  password: string | null;
}

export interface IUsersController {
  create(dto: any): Promise<IApiResponse<IUserEntity>>;
  findAll(): Promise<IApiResponse<IUserEntity[]>>;
  findOne(id: string): Promise<IApiResponse<IUserEntity>>;
  update(id: string, dto: any): Promise<IApiResponse<IUserEntity>>;
  updateRole(id: string, dto: any): Promise<IApiResponse<IUserEntity>>;
  updateAvatarOrBG(id: string, file: Express.Multer.File, dto: any): Promise<IApiResponse<IUserEntity>>;
  remove(id: string, currentUserId: string): Promise<IApiResponse<null>>;
}

export interface IUsersService {
  checkEmailOrUsernameExists(email: string, userName: string, excludeId?: string): Promise<{ exists: boolean; field?: 'email' | 'username' }>;
  searchUserByEmailOrUsernameOrId(emailOrUserNameOrId: string): Promise<IUserEntityWithPassword | null>;
  generateEmployeeCode(isIntern: boolean): Promise<string>;
  create(dto: any): Promise<IUserEntity>;
  findAll(): Promise<IUserEntity[]>;
  findOne(id: string): Promise<IUserEntity>;
  update(id: string, dto: any): Promise<IUserEntity>;
  updateRole(id: string, roleNameOrId: string): Promise<IUserEntity>;
  updateProfile(id: string, dto: any): Promise<{ user: IUserEntity; pendingEmployeeCode: string | null; message?: string }>;
  approveEmployeeCode(userId: string): Promise<IUserEntity>;
  rejectEmployeeCode(userId: string): Promise<IUserEntity>;
  getPendingUsers(): Promise<IUserEntity[]>;
  approveAccount(userId: string): Promise<IUserEntity>;
  rejectAccount(userId: string): Promise<void>;
  updateAvatarOrBG(id: string, file: Express.Multer.File, dto: any): Promise<IUserEntity>;
  remove(id: string, currentUserId: string): Promise<void>;
}
