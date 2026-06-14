import { apiClient } from './client'

export interface Shift {
  id: string
  name: string
  startTime: string
  endTime: string
  description?: string
  _count?: { users: number }
  createdAt: string
  updatedAt: string
}

export const shiftsApi = {
  getAll: () => apiClient.get<Shift[]>('/shifts'),
  getOne: (id: string) => apiClient.get<Shift>(`/shifts/${id}`),
  create: (data: { name: string; startTime: string; endTime: string; description?: string }) =>
    apiClient.post<Shift>('/shifts', data),
  update: (id: string, data: Partial<{ name: string; startTime: string; endTime: string; description: string }>) =>
    apiClient.patch<Shift>(`/shifts/${id}`, data),
  delete: (id: string) => apiClient.delete<Shift>(`/shifts/${id}`),
}
