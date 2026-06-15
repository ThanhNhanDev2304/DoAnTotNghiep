import { apiClient } from './client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const chatbotApi = {
  chat: (message: string, history: ChatMessage[]) =>
    apiClient.post<{ reply: string }>('/chatbot/chat', { message, history }),
}
