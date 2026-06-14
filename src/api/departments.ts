import { apiClient } from './client'

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  managerId?: string
  _count?: { users: number }
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentDto {
  name: string
  code: string
  description?: string
  managerId?: string
}

export const departmentsApi = {
  getAll: () => apiClient.get<Department[]>('/departments'),
  getOne: (id: string) => apiClient.get<Department>(`/departments/${id}`),
  create: (data: CreateDepartmentDto) => apiClient.post<Department>('/departments', data),
  update: (id: string, data: Partial<CreateDepartmentDto>) => apiClient.patch<Department>(`/departments/${id}`, data),
  delete: (id: string) => apiClient.delete<Department>(`/departments/${id}`),
}
