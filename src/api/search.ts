import apiClient from './client'

export interface SearchResults {
  announcements: { id: string; title: string; type: string; createdAt: string }[]
  surveys: { id: string; title: string; status: string; createdAt: string }[]
  qna: { id: string; question: string; category: string; status: string; createdAt: string }[]
  proposals: { id: string; content: string; status: string; createdAt: string }[]
  complaints: { id: string; title: string; type: string; status: string; createdAt: string }[]
}

interface ApiResponse<T> { statusCode: number; message: string; data: T }

export const searchApi = {
  search: async (q: string): Promise<SearchResults> => {
    const res = await apiClient.get<ApiResponse<SearchResults>>('/search', { params: { q } })
    return res.data.data
  },
}
