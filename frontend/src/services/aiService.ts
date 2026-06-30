import { apiService } from './apiService';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  subject?: string;
  attachments?: string[];
  type: 'text' | 'image' | 'file';
}

export interface AIResponse {
  text: string;
  images?: Array<{
    data: string;
    mimeType: string;
    filename: string;
  }>;
  requiresEscalation?: boolean;
  escalationReason?: string;
}

export class AIService {
  private static instance: AIService | null = null;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  static async sendMessage(message: string, subject?: string, context?: string): Promise<string> {
    const aiService = AIService.getInstance();
    const response = await aiService.generateResponse(message, subject, context);
    return response.text;
  }

  async generateResponse(
    message: string,
    subject?: string,
    context?: string,
    userId?: string
  ): Promise<AIResponse> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; reply: string; requiresEscalation?: boolean; escalationReason?: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message,
          subject,
          context,
          userId
        })
      });

      return {
        text: res.reply || 'No response generated.',
        requiresEscalation: res.requiresEscalation || false,
        escalationReason: res.escalationReason
      };
    } catch (error) {
      console.error('Error calling AI endpoint on backend:', error);
      return {
        text: `Hey bro! 😊 I'm having trouble connecting right now. Let me know if we should try again!`,
        requiresEscalation: false
      };
    }
  }

  async generateStudyMaterial(topic: string, level: string = 'intermediate'): Promise<AIResponse> {
    return this.generateResponse(`Create a comprehensive study guide for "${topic}" at ${level} level.`, topic);
  }

  async explainHomework(problem: string, subject: string): Promise<AIResponse> {
    return this.generateResponse(`Please explain how to solve this ${subject} problem step by step:\n\n${problem}`, subject);
  }

  async generatePracticeQuestions(topic: string, difficulty: string = 'medium', count: number = 5): Promise<AIResponse> {
    return this.generateResponse(`Generate ${count} ${difficulty} difficulty practice questions about "${topic}".`, topic);
  }
}

let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
