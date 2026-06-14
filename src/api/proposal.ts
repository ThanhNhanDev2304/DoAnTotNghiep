import { apiClient } from './client'

export type ProposalStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'

export const ProposalStatusLabel: Record<ProposalStatus, string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Từ chối',
}

export interface Proposal {
  id: string
  title: string
  content: string
  status: ProposalStatus
  hrNote?: string
  user?: { fullName: string; userName: string; employeeCode: string; department?: { name: string } }
  resolvedBy?: { fullName: string; userName: string }
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export const proposalApi = {
  submit: (data: { title: string; content: string }) => apiClient.post<Proposal>('/proposals', data),
  getMy: () => apiClient.get<Proposal[]>('/proposals/my'),
  getAll: (status?: string) => apiClient.get<Proposal[]>('/proposals', { params: status ? { status } : undefined }),
  updateStatus: (id: string, data: { status: ProposalStatus; hrNote?: string }) =>
    apiClient.patch<Proposal>(`/proposals/${id}/status`, data),
}
