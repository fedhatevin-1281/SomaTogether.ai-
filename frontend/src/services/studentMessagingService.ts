import { messagingService, Conversation, Message } from './messagingService';
import { apiService } from './apiService';

export interface TeacherContact {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  subjects: string[];
  rating: number;
  total_reviews: number;
  is_available: boolean;
  last_seen?: string;
  conversation_id?: string;
  unread_count?: number;
  last_message?: string;
  last_message_time?: string;
}

class StudentMessagingService {
  /**
   * Get all conversations for a student
   */
  static async getConversations(studentId: string): Promise<Conversation[]> {
    try {
      const convs = await messagingService.getConversations(studentId);
      // Format to fit the StudentConversation layout
      return convs.map(conv => ({
        ...conv,
        other_participant: conv.other_participant ? {
          id: conv.other_participant.id,
          name: conv.other_participant.full_name,
          avatar_url: conv.other_participant.avatar_url,
          role: conv.other_participant.role
        } : undefined,
        last_message: conv.last_message ? {
          content: conv.last_message.content,
          sender_name: conv.last_message.sender?.full_name || 'Unknown',
          created_at: conv.last_message.created_at
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching student conversations via API:', error);
      return [];
    }
  }

  /**
   * Get messages for a specific conversation
   */
  static async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const messages = await messagingService.getMessages(conversationId);
      return messages.map((msg: any) => ({
        ...msg,
        sender_name: msg.sender?.full_name || 'Unknown',
        sender_avatar: msg.sender?.avatar_url,
        sender_role: msg.sender?.role || 'user',
        reply_to: msg.reply_to_id ? {
          id: msg.reply_to_id,
          content: msg.reply_to?.content || 'Reply message',
          sender_name: msg.reply_to?.sender?.full_name || 'Previous message'
        } : null
      }));
    } catch (error) {
      console.error('Error fetching student messages via API:', error);
      return [];
    }
  }

  /**
   * Send a message to a conversation
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'assignment' | 'system' = 'text',
    attachments: any[] = [],
    replyToId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const msg = await messagingService.sendMessage(
        conversationId,
        senderId,
        content,
        messageType,
        attachments,
        replyToId
      );
      return { success: true, messageId: msg.id };
    } catch (error: any) {
      console.error('Error sending student message via API:', error);
      return { success: false, error: error.message || 'Failed to send message' };
    }
  }

  /**
   * Create or get conversation with a teacher
   */
  static async getOrCreateTeacherConversation(
    studentId: string,
    teacherId: string
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      const conv = await messagingService.findOrCreateDirectConversation(studentId, teacherId);
      return { success: true, conversationId: conv.id };
    } catch (error: any) {
      console.error('Error creating teacher conversation via API:', error);
      return { success: false, error: error.message || 'Failed to create conversation' };
    }
  }

  /**
   * Create or get conversation with AI assistant
   */
  static async getOrCreateAIConversation(studentId: string): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      // Find existing or create direct chat with special recipient 'ai-assistant'
      const conv = await messagingService.createConversation([studentId, 'ai-assistant'], 'direct', 'AI Assistant');
      return { success: true, conversationId: conv.id };
    } catch (error: any) {
      console.error('Error creating AI conversation via API:', error);
      return { success: false, error: error.message || 'Failed to create AI conversation' };
    }
  }

  /**
   * Get available teachers for messaging
   */
  static async getAvailableTeachers(studentId: string): Promise<TeacherContact[]> {
    try {
      // Get student's classes to find teachers
      const classes = await apiService.makeRequest<{ success: boolean; data: any[] }>(`/classes/student/${studentId}`);
      const teacherIds = [...new Set((classes.data || []).map(c => c.teacher_id).filter(Boolean))];

      if (teacherIds.length === 0) return [];

      // Query teacher profiles using generic db query
      const teachersRes = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/teachers/query', {
        method: 'POST',
        body: JSON.stringify({
          select: '*, profiles:profiles!teachers_id_fkey(*)'
        })
      });

      const activeTeachers = (teachersRes.data || []).filter(t => teacherIds.includes(t.id) && t.is_available);

      return await Promise.all(activeTeachers.map(async (t) => {
        const convRes = await this.getOrCreateTeacherConversation(studentId, t.id);
        return {
          id: t.id,
          name: t.profiles?.full_name || 'Unknown Teacher',
          email: t.profiles?.email || '',
          avatar_url: t.profiles?.avatar_url,
          subjects: t.subjects || [],
          rating: t.rating || 0,
          total_reviews: t.total_reviews || 0,
          is_available: t.is_available,
          last_seen: t.updated_at,
          conversation_id: convRes.conversationId,
          unread_count: 0
        };
      }));
    } catch (error) {
      console.error('Error getting available teachers via API:', error);
      return [];
    }
  }

  /**
   * Get session requests for a student
   */
  static async getStudentRequests(studentId: string): Promise<any[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: any[] }>(`/session-requests/student/${studentId}`);
      return res.data || [];
    } catch (error) {
      console.error('Error fetching student requests via API:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Fetch messages for conversation first
      const messages = await messagingService.getMessages(conversationId);
      const unreadMessageIds = messages
        .filter(m => m.sender_id !== userId && !m.read_by?.some(r => r.user_id === userId))
        .map(m => m.id);

      if (unreadMessageIds.length > 0) {
        await messagingService.markMessagesAsRead(unreadMessageIds, userId);
      }
    } catch (error) {
      console.error('Error marking messages as read via API:', error);
    }
  }
}

export default StudentMessagingService;
export type { Conversation, Message };
