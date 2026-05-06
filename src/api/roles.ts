import apiClient from './client'

export interface CreateRolePayload {
  roleName: string
  description: string
}

export interface UpdateRolePayload {
  roleName?: string
  description?: string
}

export const rolesApi = {
  getAll: () => apiClient.get('/role'),
  getById: (id: string) => apiClient.get(`/role/${id}`),
  create: (data: CreateRolePayload) => apiClient.post('/role', data),
  update: (id: string, data: UpdateRolePayload) => apiClient.patch(`/role/${id}`, data),
  remove: (id: string) => apiClient.delete(`/role/${id}`),
}
