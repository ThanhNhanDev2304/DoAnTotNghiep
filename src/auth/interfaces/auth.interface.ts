// ============================================================
// AUTH INTERFACES
// Định nghĩa tất cả interface cho module Auth
// ============================================================

import type { Request, Response } from 'express';
import { IApiResponse } from '@/common/interceptors/transform.interceptor';
import { IUserEntity } from '@/users/interfaces/users.interface';

/* ------------------------------------------------------------
 1. DTO Interfaces
------------------------------------------------------------ */

export interface IRegisterDto {
  userName: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  departmentId?: string;
  positionId?: string;
  isIntern?: boolean;
}

export interface IVerifyRegisterOtpDto {
  email: string;
  otp: string;
}

export interface IResendRegisterOtpDto {
  email: string;
}

export interface ILoginDto {
  userNameOrEmail: string;
  password: string;
}

export interface IVerifyEmailDto {
  email: string;
}

export interface IChangePasswordVerifyDto {
  email: string;
  otp: string;
  newPassword: string;
}

/* ------------------------------------------------------------
 2. Strategy / Passport Interfaces
------------------------------------------------------------ */

export interface IJwtPayload {
  id: string;
  email: string;
  userName: string;
  roleName: string;
  accountType: string;
  avatarUrl?: string | null;
}

export interface IRefreshTokenPayload {
  userId: string;
  _sub: {
    roleName: string;
    email: string;
  };
  deviceId: string;
  iat?: number;
  exp?: number;
}

export interface ILocalValidateResult {
  id: string;
  email: string;
  userName: string;
  password?: string | null;
  accountType: string;
  roleName: string;
}

/* ------------------------------------------------------------
 3. Service Interfaces
------------------------------------------------------------ */

export interface IOtpGenerationResult {
  otp: string;
  otpHash: string;
  otpExpiresAt: Date;
  resendAfter: Date;
}

export interface IOtpVerifyResult {
  email: string;
  userName: string;
  passwordHash: string;
  otpHash: string;
  otpExpiresAt: Date;
  attemptCount: number;
}

export interface IRegisterResult {
  message: string;
}

export interface IOtpResult {
  otpExpire: string;
}

export interface ILoginResult {
  accessToken: string;
  user: ISanitizedUser;
}

export interface ISanitizedUser {
  id: string;
  email: string;
  userName: string;
  accountType: string;
  roleName: string;
  avatarUrl?: string | null;
  backgroundUrl?: string | null;
  description?: string | null;
  googleId?: string | null;
  roleId: string;
}

/* ------------------------------------------------------------
 4. AuthService Interface (contract)
------------------------------------------------------------ */

export interface IAuthService {
  registerWithOTP(dto: IRegisterDto): Promise<IRegisterResult>;
  verifyRegisterOtp(dto: IVerifyRegisterOtpDto): Promise<ISanitizedUser>;
  resendRegisterOtp(dto: IResendRegisterOtpDto): Promise<IRegisterResult>;
  sendChangePasswordOtp(dto: IVerifyEmailDto): Promise<IOtpResult>;
  verifyChangePasswordOtp(dto: IChangePasswordVerifyDto): Promise<ISanitizedUser>;
  validateUser(userNameOrEmail: string, password: string): Promise<ILocalValidateResult | null>;
  login(user: ISanitizedUser, res: Response, deviceId: string): Promise<ILoginResult>;
  refreshToken(oldCookieRefreshToken: string, res: Response): Promise<ILoginResult>;
  googleLogin(googleUser: IGoogleUser, res: Response, deviceId: string): Promise<ILoginResult | { pending: true }>;
  logout(user: ISanitizedUser, oldCookieRefreshToken: string, res: Response): Promise<boolean>;
  logoutAll(user: ISanitizedUser, res: Response): Promise<boolean>;
}

/* ------------------------------------------------------------
 5. Sub-Service Interfaces
------------------------------------------------------------ */

export interface ITokenService {
  login(user: ISanitizedUser, res: Response, deviceId: string): Promise<ILoginResult>;
  logout(userId: string, refreshToken: string, res: Response): Promise<boolean>;
  logoutAll(userId: string, res: Response): Promise<boolean>;
}

export interface IOtpService {
  generate(): Promise<IOtpGenerationResult>;
  checkCooldown(email: string): Promise<void>;
  getValidPending(email: string, purpose: string): Promise<IOtpVerifyResult>;
  verify(email: string, otp: string, purpose: string): Promise<IOtpVerifyResult>;
}

export interface IRegisterService {
  register(dto: IRegisterDto): Promise<IRegisterResult>;
  verifyOtp(dto: IVerifyRegisterOtpDto): Promise<ISanitizedUser>;
  resendOtp(email: string): Promise<IRegisterResult>;
}

export interface IPasswordService {
  sendOtp(dto: IVerifyEmailDto): Promise<IOtpResult>;
  verifyAndChange(dto: IChangePasswordVerifyDto): Promise<ISanitizedUser>;
}

export interface IGoogleService {
  login(googleUser: IGoogleUser, res: Response, deviceId: string): Promise<ILoginResult | { pending: true }>;
}

/* ------------------------------------------------------------
 6. Google Auth Interfaces
------------------------------------------------------------ */

export interface IGoogleUser {
  email: string;
  googleId: string;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

/* ------------------------------------------------------------
 7. Controller Interface (route definitions)
------------------------------------------------------------ */

export interface IAuthController {
  register(dto: IRegisterDto): Promise<IApiResponse<null>>;
  verifyRegisterOtp(dto: IVerifyRegisterOtpDto): Promise<IApiResponse<ISanitizedUser>>;
  resendRegisterOtp(dto: IResendRegisterOtpDto): Promise<IApiResponse<IRegisterResult>>;
  login(res: Response, user: ISanitizedUser, dto: ILoginDto, deviceId: string): Promise<IApiResponse<ILoginResult>>;
  refreshToken(res: Response, req: Request): Promise<IApiResponse<ILoginResult>>;
  getProfile(userId: string): Promise<IApiResponse<{ user: IUserEntity }>>;
  changePasswordWithOtp(dto: IVerifyEmailDto): Promise<IApiResponse<{ otpExpire: string }>>;
  verifyChangePasswordOtp(dto: IChangePasswordVerifyDto): Promise<IApiResponse<ISanitizedUser>>;
  logout(res: Response, req: Request, user: ISanitizedUser): Promise<IApiResponse<{ result: boolean }>>;
  logoutAll(res: Response, user: ISanitizedUser): Promise<IApiResponse<{ result: boolean }>>;
  googleAuth(): void;
  googleAuthRedirect(googleUser: IGoogleUser, deviceId: string, res: Response): Promise<void | IApiResponse<ILoginResult>>;
}
