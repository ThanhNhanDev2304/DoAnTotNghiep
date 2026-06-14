import { apiClient } from './client'

export interface Position {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export const positionsApi = {
  getAll: () => apiClient.get<Position[]>('/positions'),
  getOne: (id: string) => apiClient.get<Position>(`/positions/${id}`),
  create: (data: { name: string; description?: string }) => apiClient.post<Position>('/positions', data),
  update: (id: string, data: Partial<{ name: string; description: string }>) => apiClient.patch<Position>(`/positions/${id}`, data),
  delete: (id: string) => apiClient.delete<Position>(`/positions/${id}`),
}
