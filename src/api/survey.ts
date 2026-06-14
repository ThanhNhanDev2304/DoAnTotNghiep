import { apiClient } from './client'

export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED'
export type QuestionType = 'RATING' | 'TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'YES_NO'

export interface SurveyQuestion {
  id: string
  question: string
  type: QuestionType
  options: string[]
  required: boolean
  order: number
}

export interface Survey {
  id: string
  title: string
  description?: string
  status: SurveyStatus
  startDate?: string
  endDate?: string
  createdBy?: { fullName: string; userName: string }
  questions?: SurveyQuestion[]
  _count?: { responses: number; questions: number }
  hasResponded?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSurveyDto {
  title: string
  description?: string
  startDate?: string
  endDate?: string
  questions?: {
    question: string
    type: QuestionType
    options?: string[]
    required?: boolean
    order?: number
  }[]
}

export interface UpdateSurveyDto {
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  questions?: {
    question: string
    type: QuestionType
    options?: string[]
    required?: boolean
    order?: number
  }[]
}

export const surveyApi = {
  // HR
  create: (data: CreateSurveyDto) => apiClient.post<Survey>('/surveys', data),
  update: (id: string, data: UpdateSurveyDto) => apiClient.patch<Survey>(`/surveys/${id}`, data),
  getAll: () => apiClient.get<Survey[]>('/surveys'),
  publish: (id: string) => apiClient.patch<Survey>(`/surveys/${id}/publish`),
  close: (id: string) => apiClient.patch<Survey>(`/surveys/${id}/close`),
  getResults: (id: string) => apiClient.get<any>(`/surveys/${id}/results`),

  // Employee
  getActive: () => apiClient.get<Survey[]>('/surveys/active'),
  getOne: (id: string) => apiClient.get<Survey>(`/surveys/${id}`),
  submit: (id: string, answers: { questionId: string; answer: string }[]) =>
    apiClient.post(`/surveys/${id}/submit`, { answers }),
}
