import { apiClient } from './client'

export type FeedbackType = 'SALARY' | 'OVERTIME' | 'ENVIRONMENT' | 'EQUIPMENT' | 'MANAGEMENT' | 'COLLEAGUE' | 'BENEFIT' | 'TRAINING' | 'OTHER'
export type FeedbackStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED'
export type SentimentType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'

export const FeedbackTypeLabel: Record<FeedbackType, string> = {
  SALARY: 'Lương thưởng',
  OVERTIME: 'Tăng ca',
  ENVIRONMENT: 'Môi trường làm việc',
  EQUIPMENT: 'Thiết bị làm việc',
  MANAGEMENT: 'Quản lý',
  COLLEAGUE: 'Đồng nghiệp',
  BENEFIT: 'Phúc lợi',
  TRAINING: 'Đào tạo',
  OTHER: 'Khác',
}

export const FeedbackStatusLabel: Record<FeedbackStatus, string> = {
  PENDING: 'Chờ xử lý',
  REVIEWING: 'Đang xem xét',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Từ chối',
}

export interface FeedbackAttachment {
  id: string
  fileName: string
  originalName: string
  url: string
  mimeType: string
  size?: number
}

export interface Feedback {
  id: string
  type: FeedbackType
  title: string
  content: string
  isAnonymous: boolean
  status: FeedbackStatus
  hrNote?: string
  sentiment?: SentimentType
  sentimentScore?: number
  userId: string | '[Ẩn danh]'
  user?: { id: string; fullName: string; userName: string; employeeCode: string } | null
  department?: { name: string } | null
  shift?: { name: string } | null
  attachments: FeedbackAttachment[]
  resolvedBy?: { fullName: string; userName: string } | null
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface FeedbackPaginated {
  items: Feedback[]
  total: number
  page: number
  limit: number
}

export interface CreateFeedbackFormData {
  type: FeedbackType
  title: string
  content: string
  isAnonymous: boolean
  attachments?: File[]
}

export const feedbackApi = {
  // Employee
  submit: (data: CreateFeedbackFormData) => {
    const formData = new FormData()
    formData.append('type', data.type)
    formData.append('title', data.title)
    formData.append('content', data.content)
    formData.append('isAnonymous', String(data.isAnonymous))
    data.attachments?.forEach((f) => formData.append('attachments', f))
    return apiClient.post<Feedback>('/feedbacks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getMy: (params?: { status?: string; type?: string; page?: number; limit?: number }) =>
    apiClient.get<FeedbackPaginated>('/feedbacks/my', { params }),
  getMyOne: (id: string) => apiClient.get<Feedback>(`/feedbacks/my/${id}`),

  // HR/Admin
  getAll: (params?: { status?: string; type?: string; departmentId?: string; shiftId?: string; page?: number; limit?: number; search?: string }) =>
    apiClient.get<FeedbackPaginated>('/feedbacks', { params }),
  getOne: (id: string) => apiClient.get<Feedback>(`/feedbacks/${id}`),
  updateStatus: (id: string, data: { status: FeedbackStatus; hrNote?: string }) =>
    apiClient.patch<Feedback>(`/feedbacks/${id}/status`, data),
  getStats: () => apiClient.get<any>('/feedbacks/stats'),
}
