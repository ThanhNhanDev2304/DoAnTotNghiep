import { apiClient } from './client'

export interface QnAAnswer {
  id: string
  content: string
  author?: { fullName: string; userName: string }
  createdAt: string
}

export interface QnA {
  id: string
  question: string
  status: 'PENDING' | 'ANSWERED'
  category: string
  user?: { fullName: string; userName: string; employeeCode: string }
  answers: QnAAnswer[]
  createdAt: string
  updatedAt: string
}

export const qnaApi = {
  ask: (data: { question: string; category?: string }) => apiClient.post<QnA>('/qna', data),
  getMy: () => apiClient.get<QnA[]>('/qna/my'),
  getAll: (status?: string, category?: string) =>
    apiClient.get<QnA[]>('/qna', { params: { status, category } }),
  answer: (id: string, content: string) => apiClient.post<QnAAnswer>(`/qna/${id}/answer`, { content }),
}
