import { apiClient } from './client'

export interface WorkplaceEvaluation {
  id: string
  month: number
  year: number
  salaryScore: number
  managementScore: number
  colleagueScore: number
  environmentScore: number
  benefitScore: number
  trainingScore: number
  averageScore: number
  comment?: string
  user?: { fullName: string; userName: string; employeeCode: string }
  department?: { name: string }
  shift?: { name: string }
  createdAt: string
}

export interface CreateEvaluationDto {
  month: number
  year: number
  salaryScore: number
  managementScore: number
  colleagueScore: number
  environmentScore: number
  benefitScore: number
  trainingScore: number
  comment?: string
}

export const evaluationApi = {
  submit: (data: CreateEvaluationDto) => apiClient.post<WorkplaceEvaluation>('/evaluations', data),
  getMy: () => apiClient.get<WorkplaceEvaluation[]>('/evaluations/my'),
  getAll: (params?: { month?: number; year?: number; departmentId?: string }) =>
    apiClient.get<WorkplaceEvaluation[]>('/evaluations', { params }),
  getAggregated: (month: number, year: number) =>
    apiClient.get<any[]>('/evaluations/aggregated', { params: { month, year } }),
}
