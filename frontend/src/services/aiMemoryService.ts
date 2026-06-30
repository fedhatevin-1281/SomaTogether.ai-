// AI Memory Service - Handles storing and retrieving AI conversation context
import { supabase } from '../supabaseClient';

export interface AIMemoryEntry {
  question: string;
  answer: string;
  subject?: string;
  created_at: string;
}

export class AIMemoryService {
  private static instance: AIMemoryService;
  
  public static getInstance(): AIMemoryService {
    if (!AIMemoryService.instance) {
      AIMemoryService.instance = new AIMemoryService();
    }
    return AIMemoryService.instance;
  }

  /**
   * Store a Q&A pair in AI memory
   */
  async storeQA(
    studentId: string, 
    question: string, 
    answer: string, 
    subject?: string, 
    context?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('store_ai_qa', {
        student_id: studentId,
        question: question,
        answer: answer,
        subject: subject || null,
        context: context || null
      });

      if (error) {
        console.error('Error storing AI Q&A:', error);
        return false;
      }

      console.log('✅ AI Q&A stored successfully');
      return true;
    } catch (error) {
      console.error('Error storing AI Q&A:', error);
      return false;
    }
  }

  /**
   * Get recent conversation context for AI
   */
  async getConversationContext(
    studentId: string, 
    limit: number = 5
  ): Promise<AIMemoryEntry[]> {
    try {
      const { data, error } = await supabase.rpc('get_ai_conversation_context', {
        student_id: studentId,
        limit_count: limit
      });

      if (error) {
        console.error('Error fetching AI context:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching AI context:', error);
      return [];
    }
  }

  /**
   * Get conversation context formatted for AI prompt
   */
  async getFormattedContext(studentId: string, limit: number = 5): Promise<string> {
    const context = await this.getConversationContext(studentId, limit);
    
    if (context.length === 0) {
      return "This is the start of our conversation.";
    }

    let formattedContext = "Recent conversation context:\n";
    context.reverse().forEach((entry, index) => {
      formattedContext += `\n${index + 1}. Student asked: "${entry.question}"\n`;
      formattedContext += `   AI responded: "${entry.answer}"\n`;
      if (entry.subject) {
        formattedContext += `   Subject: ${entry.subject}\n`;
      }
    });

    return formattedContext;
  }

  /**
   * Clean up expired conversations (called periodically)
   */
  async cleanupExpiredConversations(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_ai_conversations');

      if (error) {
        console.error('Error cleaning up expired conversations:', error);
        return 0;
      }

      console.log(`🧹 Cleaned up ${data} expired AI conversations`);
      return data || 0;
    } catch (error) {
      console.error('Error cleaning up expired conversations:', error);
      return 0;
    }
  }

  /**
   * Get conversation statistics for a student
   */
  async getConversationStats(studentId: string): Promise<{
    totalQuestions: number;
    recentActivity: string;
    activeSession: boolean;
  }> {
    try {
      const context = await this.getConversationContext(studentId, 1);
      
      return {
        totalQuestions: context.length,
        recentActivity: context.length > 0 ? context[0].created_at : 'No recent activity',
        activeSession: context.length > 0
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return {
        totalQuestions: 0,
        recentActivity: 'Error fetching data',
        activeSession: false
      };
    }
  }
}
