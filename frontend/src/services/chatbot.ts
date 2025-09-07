import { apiService } from './api'

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp: string
}

export interface ChatResponse {
  message: string
  timestamp: string
}

class ChatbotService {
  async sendMessage(message: string): Promise<ChatResponse> {
    return await apiService.sendChatMessage(message)
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    return await apiService.getChatHistory()
  }

  async clearChat(): Promise<void> {
    await apiService.clearChatHistory()
  }
}

export const chatbotService = new ChatbotService()
