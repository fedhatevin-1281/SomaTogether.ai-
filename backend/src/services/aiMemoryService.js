const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoemhycHdjZmFja3FpbmF3b2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE2MDQsImV4cCI6MjA3NTU5NzYwNH0.tOHiPVTyyMh0a3tCl3YYtgVZEMEVmHvQlJ8QEs4bb8g';
const supabase = createClient(supabaseUrl, supabaseKey);

class AIMemoryService {
  static instance = null;

  static getInstance() {
    if (!AIMemoryService.instance) {
      AIMemoryService.instance = new AIMemoryService();
    }
    return AIMemoryService.instance;
  }

  /**
   * Store a Q&A pair in AI memory
   */
  async storeQA(studentId, question, answer, subject, context) {
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
      return true;
    } catch (error) {
      console.error('Error storing AI Q&A:', error);
      return false;
    }
  }

  /**
   * Get recent conversation context for AI
   */
  async getConversationContext(studentId, limit = 5) {
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
  async getFormattedContext(studentId, limit = 5) {
    const context = await this.getConversationContext(studentId, limit);
    
    if (context.length === 0) {
      return "This is the start of our conversation.";
    }

    let formattedContext = "Recent conversation context:\n";
    [...context].reverse().forEach((entry, index) => {
      formattedContext += `\n${index + 1}. Student asked: "${entry.question}"\n`;
      formattedContext += `   AI responded: "${entry.answer}"\n`;
      if (entry.subject) {
        formattedContext += `   Subject: ${entry.subject}\n`;
      }
    });

    return formattedContext;
  }

  /**
   * Clean up expired conversations
   */
  async cleanupExpiredConversations() {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_ai_conversations');
      if (error) {
        console.error('Error cleaning up expired conversations:', error);
        return 0;
      }
      return data || 0;
    } catch (error) {
      console.error('Error cleaning up expired conversations:', error);
      return 0;
    }
  }
}

module.exports = AIMemoryService;
