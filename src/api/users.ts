import apiClient from './client'

export interface CreateUserPayload {
  email: string
  password: string
  userName: string
  roleName: string
}

export interface UpdateUserPayload {
  email?: string
  userName?: string
  description: string
}

export interface UpdateUserRolePayload {
  roleNameOrId: string
}

export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: CreateUserPayload) => apiClient.post('/users', data),
  update: (id: string, data: UpdateUserPayload) => apiClient.patch(`/users/${id}`, data),
  remove: (id: string) => apiClient.delete(`/users/${id}`),
  updateRole: (id: string, data: UpdateUserRolePayload) =>
    apiClient.patch(`/users/role/${id}`, data),
  updateAvatarOrBg: (id: string, formData: FormData) =>
    apiClient.patch(`/users/avatarorbg/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPending: () => apiClient.get('/users/pending'),
  approveAccount: (id: string) => apiClient.patch(`/users/${id}/approve-account`),
  rejectAccount: (id: string) => apiClient.patch(`/users/${id}/reject-account`),
}
