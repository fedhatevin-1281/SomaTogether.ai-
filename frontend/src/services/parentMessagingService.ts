import { messagingService, Conversation, Message } from './messagingService';
import { apiService } from './apiService';
import parentService from './parentService';

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

export interface SessionRequest {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id?: string;
  requested_start: string;
  requested_end: string;
  duration_hours: number;
  tokens_required: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  message?: string;
  teacher_response?: string;
  declined_reason?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  student_name: string;
  teacher_name: string;
  teacher_avatar?: string;
  subject?: string;
}

class ParentMessagingService {
  /**
   * Get all conversations for a parent
   */
  static async getConversations(parentId: string): Promise<Conversation[]> {
    try {
      const convs = await messagingService.getConversations(parentId);
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
      console.error('Error fetching parent conversations via API:', error);
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
      console.error('Error fetching parent messages via API:', error);
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
      console.error('Error sending parent message via API:', error);
      return { success: false, error: error.message || 'Failed to send message' };
    }
  }

  /**
   * Create or get conversation with AI assistant
   */
  static async getOrCreateAIConversation(parentId: string): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      const conv = await messagingService.createConversation([parentId, 'ai-assistant'], 'direct', 'AI Assistant');
      return { success: true, conversationId: conv.id };
    } catch (error: any) {
      console.error('Error creating parent AI conversation:', error);
      return { success: false, error: error.message || 'Failed to create AI conversation' };
    }
  }

  /**
   * Create or get conversation with a teacher
   */
  static async getOrCreateTeacherConversation(
    parentId: string,
    teacherId: string
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      const conv = await messagingService.findOrCreateDirectConversation(parentId, teacherId);
      return { success: true, conversationId: conv.id };
    } catch (error: any) {
      console.error('Error creating parent-teacher conversation:', error);
      return { success: false, error: error.message || 'Failed to create conversation' };
    }
  }

  /**
   * Get available teachers for messaging
   */
  static async getAvailableTeachers(parentId: string): Promise<TeacherContact[]> {
    try {
      // Query teacher profiles using generic db query
      const teachersRes = await apiService.makeRequest<{ success: boolean; data: any[] }>('/db/teachers/query', {
        method: 'POST',
        body: JSON.stringify({
          select: '*, profiles:profiles!teachers_id_fkey(*)',
          eq: { is_available: true }
        })
      });

      return await Promise.all((teachersRes.data || []).map(async (t) => {
        const convRes = await this.getOrCreateTeacherConversation(parentId, t.id);
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
   * Send session request to a teacher
   */
  static async sendSessionRequest(
    parentId: string,
    studentId: string,
    teacherId: string,
    requestedStart: string,
    requestedEnd: string,
    durationHours: number,
    tokensRequired: number,
    message?: string
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const res = await apiService.makeRequest<{ success: boolean; data: any }>('/session-requests', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          teacher_id: teacherId,
          requested_start: requestedStart,
          requested_end: requestedEnd,
          duration_hours: durationHours,
          tokens_required: tokensRequired,
          message: message,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
      });

      // Send notification to teacher
      try {
        await apiService.makeRequest('/notifications', {
          method: 'POST',
          body: JSON.stringify({
            user_id: teacherId,
            type: 'session_request',
            title: 'New Session Request',
            message: `You have a new session request from a parent`,
            data: { request_id: res.data.id, parent_id: parentId, student_id: studentId },
            priority: 'normal'
          })
        });
      } catch (notifErr) {
        console.warn('Optional notification trigger failed:', notifErr);
      }

      return { success: true, requestId: res.data.id };
    } catch (error: any) {
      console.error('Error in sendSessionRequest via API:', error);
      return { success: false, error: error.message || 'Failed to send session request' };
    }
  }

  /**
   * Get session requests for a parent
   */
  static async getSessionRequests(parentId: string): Promise<SessionRequest[]> {
    try {
      const children = await parentService.getChildren(parentId);
      if (children.length === 0) return [];

      const allRequests = await Promise.all(children.map(async (child) => {
        try {
          const res = await apiService.makeRequest<{ success: boolean; data: any[] }>(`/session-requests/student/${child.id}`);
          return (res.data || []).map(r => ({
            ...r,
            student_name: child.full_name,
            teacher_name: r.teachers?.profiles?.full_name || 'Unknown Teacher',
            teacher_avatar: r.teachers?.profiles?.avatar_url,
            subject: r.classes?.subjects?.name || 'General'
          }));
        } catch (err) {
          console.error(`Error loading session requests for child ${child.id}:`, err);
          return [];
        }
      }));

      return allRequests.flat();
    } catch (error) {
      console.error('Error in getSessionRequests via API:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
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

export default ParentMessagingService;
