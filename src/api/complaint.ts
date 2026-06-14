import { apiClient } from './client'

export type ComplaintType = 'SALARY' | 'TIMEKEEPING' | 'INSURANCE' | 'DISCIPLINE' | 'OTHER'
export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED'

export const ComplaintTypeLabel: Record<ComplaintType, string> = {
  SALARY: 'Lương',
  TIMEKEEPING: 'Chấm công',
  INSURANCE: 'Bảo hiểm',
  DISCIPLINE: 'Kỷ luật',
  OTHER: 'Khác',
}

export const ComplaintStatusLabel: Record<ComplaintStatus, string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Từ chối',
}

export interface Complaint {
  id: string
  title: string
  content: string
  type: ComplaintType
  status: ComplaintStatus
  hrNote?: string
  user?: { fullName: string; userName: string; employeeCode: string; department?: { name: string } }
  resolvedBy?: { fullName: string; userName: string }
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

export const complaintApi = {
  submit: (data: { title: string; content: string; type: ComplaintType }) =>
    apiClient.post<Complaint>('/complaints', data),
  getMy: () => apiClient.get<Complaint[]>('/complaints/my'),
  getAll: (status?: string, type?: string) =>
    apiClient.get<Complaint[]>('/complaints', { params: { status, type } }),
  updateStatus: (id: string, data: { status: ComplaintStatus; hrNote?: string }) =>
    apiClient.patch<Complaint>(`/complaints/${id}/status`, data),
}
