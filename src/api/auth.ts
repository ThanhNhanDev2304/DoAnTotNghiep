import apiClient, { BASE_URL } from './client'
import { ensureDeviceIdCookie } from '@/lib/deviceCookie'

export interface RegisterPayload {
  userName: string
  email: string
  password: string
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

export const authApi = {
  register: (data: RegisterPayload) => apiClient.post('/auth/register', data),
  verifyRegisterOtp: (data: VerifyOtpPayload) => apiClient.post('/auth/verify-register-otp', data),
  resendRegisterOtp: (data: ResendOtpPayload) => apiClient.post('/auth/resend-register-otp', data),
  login: (data: LoginPayload) => {
    ensureDeviceIdCookie()
    return apiClient.post('/auth/login', data)
  },
  refresh: () => apiClient.post('/auth/refresh'),
  getProfile: () => apiClient.get('/auth/profile'),
  sendChangePasswordOtp: (data: VerifyEmailPayload) =>
    apiClient.post('/auth/change-password/send-otp', data),
  verifyChangePasswordOtp: (data: ChangePasswordPayload) =>
    apiClient.post('/auth/change-password/verify-otp', data),
  logout: () => apiClient.post('/auth/logout'),
  logoutAll: () => apiClient.post('/auth/logout-all'),
  googleAuth: () => {
    ensureDeviceIdCookie()
    window.location.href = BASE_URL + '/auth/google'
  },
}
