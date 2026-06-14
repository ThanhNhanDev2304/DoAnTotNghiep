import { apiClient } from './client'

export type AnnouncementType = 'GENERAL' | 'RECRUITMENT' | 'BONUS' | 'REGULATION' | 'HOLIDAY' | 'URGENT'

export const AnnouncementTypeLabel: Record<AnnouncementType, string> = {
  GENERAL: 'Thông báo chung',
  RECRUITMENT: 'Tuyển dụng',
  BONUS: 'Thưởng',
  REGULATION: 'Nội quy',
  HOLIDAY: 'Nghỉ lễ',
  URGENT: 'Khẩn cấp',
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: AnnouncementType
  isPinned: boolean
  author?: { fullName: string; userName: string }
  createdAt: string
  updatedAt: string
}

export const announcementApi = {
  getAll: (type?: string) => apiClient.get<Announcement[]>('/announcements', { params: type ? { type } : undefined }),
  getOne: (id: string) => apiClient.get<Announcement>(`/announcements/${id}`),
  create: (data: { title: string; content: string; type?: AnnouncementType; isPinned?: boolean }) =>
    apiClient.post<Announcement>('/announcements', data),
  update: (id: string, data: Partial<{ title: string; content: string; type: AnnouncementType; isPinned: boolean }>) =>
    apiClient.patch<Announcement>(`/announcements/${id}`, data),
  delete: (id: string) => apiClient.delete<Announcement>(`/announcements/${id}`),
}
