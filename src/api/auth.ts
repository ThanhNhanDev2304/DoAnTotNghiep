import apiClient, { BASE_URL } from './client'
import { ensureDeviceIdCookie } from '@/lib/deviceCookie'
import type { UserProfile } from '@/store/authStore'

interface ApiResponse<T> {
  statusCode: number
  message: string
  data: T
}

export interface RegisterPayload {
  userName: string
  email: string
  password: string
  fullName: string
  phone?: string
  departmentId?: string
  positionId?: string
  isIntern?: boolean
}

export interface VerifyOtpPayload {
  email: string
  otp: string
}

export interface ResendOtpPayload {
  email: string
}

export interface LoginPayload {
  userNameOrEmail: string
  password: string
}

export interface VerifyEmailPayload {
  email: string
}

export interface ChangePasswordPayload {
  email: string
  otp: string
  newPassword: string
}

export interface OtpResult {
  otpExpire: string
}

export interface LoginResult {
  accessToken: string
  user: UserProfile
}

export const authApi = {
  register: async (data: RegisterPayload): Promise<void> => {
    await apiClient.post('/auth/register', data)
  },

  verifyRegisterOtp: async (data: VerifyOtpPayload): Promise<UserProfile> => {
    const res = await apiClient.post<ApiResponse<UserProfile>>('/auth/verify-register-otp', data)
    return res.data.data
  },

  resendRegisterOtp: async (data: ResendOtpPayload): Promise<OtpResult> => {
    const res = await apiClient.post<ApiResponse<OtpResult>>('/auth/resend-register-otp', data)
    return res.data.data
  },

  login: async (data: LoginPayload): Promise<LoginResult> => {
    ensureDeviceIdCookie()
    const res = await apiClient.post<ApiResponse<LoginResult>>('/auth/login', data)
    return res.data.data
  },

  refresh: async (): Promise<LoginResult> => {
    const res = await apiClient.post<ApiResponse<LoginResult>>('/auth/refresh')
    return res.data.data
  },

  getProfile: async (): Promise<{ user: UserProfile }> => {
    const res = await apiClient.get<ApiResponse<{ user: UserProfile }>>('/auth/profile')
    return res.data.data
  },

  sendChangePasswordOtp: async (data: VerifyEmailPayload): Promise<OtpResult> => {
    const res = await apiClient.post<ApiResponse<OtpResult>>('/auth/change-password/send-otp', data)
    return res.data.data
  },

  verifyChangePasswordOtp: async (data: ChangePasswordPayload): Promise<UserProfile> => {
    const res = await apiClient.post<ApiResponse<UserProfile>>('/auth/change-password/verify-otp', data)
    return res.data.data
  },

  logout: async (): Promise<{ result: boolean }> => {
    const res = await apiClient.post<ApiResponse<{ result: boolean }>>('/auth/logout')
    return res.data.data
  },

  logoutAll: async (): Promise<{ result: boolean }> => {
    const res = await apiClient.post<ApiResponse<{ result: boolean }>>('/auth/logout-all')
    return res.data.data
  },

  updateProfile: async (data: {
    fullName?: string
    phone?: string
    description?: string
    employeeCode?: string
  }): Promise<UserProfile> => {
    const res = await apiClient.patch<ApiResponse<UserProfile>>('/auth/profile', data)
    return res.data.data
  },

  updateAvatar: async (formData: FormData): Promise<UserProfile> => {
    const res = await apiClient.patch<ApiResponse<UserProfile>>('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data.data
  },

  googleAuth: () => {
    ensureDeviceIdCookie()
    window.location.href = BASE_URL + '/auth/google'
  },
}
