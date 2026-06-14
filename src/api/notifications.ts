import apiClient from './client'

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

interface ApiResponse<T> {
  statusCode: number
  message: string
  data: T
}

export const notificationsApi = {
  getAll: async (): Promise<Notification[]> => {
    const res = await apiClient.get<ApiResponse<Notification[]>>('/notifications')
    return res.data.data
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count')
    return res.data.data.count
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all')
  },

  sendToHr: async (data: { title: string; body: string }): Promise<void> => {
    await apiClient.post('/notifications/send-to-hr', data)
  },
}
