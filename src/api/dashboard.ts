import { apiClient } from './client'

export const dashboardApi = {
  getOverview: () => apiClient.get<any>('/dashboard/overview'),
  getHealthScores: (month?: number, year?: number) =>
    apiClient.get<any>('/dashboard/health-scores', { params: { month, year } }),
  getFeedbackTrend: () => apiClient.get<any[]>('/dashboard/feedback-trend'),
  getFeedbackByType: () => apiClient.get<any[]>('/dashboard/feedback-by-type'),
  getEmployeeDashboard: () => apiClient.get<any>('/dashboard/employee'),
}
