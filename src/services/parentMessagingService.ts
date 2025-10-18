import { supabase } from '../supabaseClient';

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'class';
  title: string;
  class_id?: string;
  created_by: string;
  participants: string[];
  last_message_at: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields for display
  other_participant?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
  last_message?: {
    content: string;
    sender_name: string;
    created_at: string;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'assignment' | 'system';
  attachments: any[];
  reply_to_id?: string;
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_at?: string;
  metadata: any;
  created_at: string;
  // Additional fields for display
  sender_name: string;
  sender_avatar?: string;
  sender_role: string;
  reply_to?: {
    content: string;
    sender_name: string;
  };
}

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
  // Conversation info
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
  // Additional fields for display
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
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages!messages_conversation_id_fkey (
            id,
            content,
            created_at,
            sender_id,
            profiles!messages_sender_id_fkey (
              full_name
            )
          )
        `)
        .contains('participants', [parentId])
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      // Process conversations to add display information
      const processedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          // Get other participants (not the current parent)
          const otherParticipants = conv.participants.filter((id: string) => id !== parentId);
          
          let otherParticipant = null;
          if (otherParticipants.length > 0) {
            const { data: participantData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, role')
              .eq('id', otherParticipants[0])
              .single();
            
            if (participantData) {
              otherParticipant = participantData;
            }
          }

          // Get last message info
          const lastMessage = conv.messages && conv.messages.length > 0 
            ? conv.messages[conv.messages.length - 1]
            : null;

          return {
            ...conv,
            other_participant: otherParticipant,
            last_message: lastMessage ? {
              content: lastMessage.content,
              sender_name: lastMessage.profiles?.full_name || 'Unknown',
              created_at: lastMessage.created_at
            } : undefined,
            unread_count: 0 // TODO: Implement unread count logic
          };
        })
      );

      return processedConversations;
    } catch (error) {
      console.error('Error in getConversations:', error);
      return [];
    }
  }

  /**
   * Get messages for a specific conversation
   */
  static async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey (
            full_name,
            avatar_url,
            role
          ),
          reply_to_message:messages!messages_reply_to_id_fkey (
            content,
            profiles!messages_sender_id_fkey (
              full_name
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []).map((msg: any) => ({
        ...msg,
        sender_name: msg.profiles?.full_name || 'Unknown',
        sender_avatar: msg.profiles?.avatar_url,
        sender_role: msg.profiles?.role || 'user',
        reply_to: msg.reply_to_message ? {
          content: msg.reply_to_message.content,
          sender_name: msg.reply_to_message.profiles?.full_name || 'Unknown'
        } : undefined
      }));
    } catch (error) {
      console.error('Error in getMessages:', error);
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
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          attachments,
          reply_to_id: replyToId
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { success: false, error: error.message };
      }

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  /**
   * Create or get conversation with AI assistant
   */
  static async getOrCreateAIConversation(parentId: string): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      console.log('Creating AI conversation for parent:', parentId);
      
      // Check if AI conversation already exists
      const { data: existingConvs, error: fetchError } = await supabase
        .from('conversations')
        .select('id, participants, title')
        .eq('type', 'direct')
        .contains('participants', [parentId])
        .eq('title', 'AI Assistant');

      if (fetchError) {
        console.error('Error fetching existing AI conversations:', fetchError);
      }

      // Check if any existing conversation is with AI
      let existingConv = null;
      if (existingConvs) {
        existingConv = existingConvs.find(conv => 
          conv.participants && 
          conv.participants.includes(parentId) && 
          conv.participants.includes('ai-assistant')
        );
      }

      if (existingConv) {
        console.log('Found existing AI conversation:', existingConv.id);
        return { success: true, conversationId: existingConv.id };
      }

      // Create new AI conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          title: 'AI Assistant',
          created_by: parentId,
          participants: [parentId, 'ai-assistant'] // Special ID for AI
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating AI conversation:', error);
        return { success: false, error: error.message };
      }

      console.log('Created new AI conversation:', data.id);
      return { success: true, conversationId: data.id };
    } catch (error) {
      console.error('Error in getOrCreateAIConversation:', error);
      return { success: false, error: 'Failed to create AI conversation' };
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
      console.log('Creating conversation between parent:', parentId, 'and teacher:', teacherId);
      
      // Check if conversation already exists - use a different approach
      const { data: existingConvs, error: fetchError } = await supabase
        .from('conversations')
        .select('id, participants')
        .eq('type', 'direct')
        .contains('participants', [parentId]);

      if (fetchError) {
        console.error('Error fetching existing conversations:', fetchError);
      }

      // Check if any existing conversation contains both participants
      let existingConv = null;
      if (existingConvs) {
        existingConv = existingConvs.find(conv => 
          conv.participants && 
          conv.participants.includes(parentId) && 
          conv.participants.includes(teacherId)
        );
      }

      if (existingConv) {
        console.log('Found existing conversation:', existingConv.id);
        return { success: true, conversationId: existingConv.id };
      }

      // Get teacher name for conversation title
      const { data: teacherData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', teacherId)
        .single();

      const teacherName = teacherData?.full_name || 'Teacher';
      console.log('Teacher name:', teacherName);

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          title: `Chat with ${teacherName}`,
          created_by: parentId,
          participants: [parentId, teacherId]
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating teacher conversation:', error);
        return { success: false, error: error.message };
      }

      console.log('Created new conversation:', data.id);
      return { success: true, conversationId: data.id };
    } catch (error) {
      console.error('Error in getOrCreateTeacherConversation:', error);
      return { success: false, error: 'Failed to create teacher conversation' };
    }
  }

  /**
   * Get available teachers for messaging
   */
  static async getAvailableTeachers(parentId: string): Promise<TeacherContact[]> {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          subjects,
          rating,
          total_reviews,
          is_available,
          updated_at,
          profiles!inner (
            id,
            full_name,
            email,
            avatar_url,
            role
          )
        `)
        .eq('is_available', true)
        .eq('profiles.is_active', true);

      if (error) {
        console.error('Error fetching teachers:', error);
        return [];
      }

      // Get conversation info for each teacher
      const teachersWithConversations = await Promise.all(
        (data || []).map(async (teacher) => {
          const convResult = await this.getOrCreateTeacherConversation(parentId, teacher.id);
          const conversationId = convResult.conversationId;

          // Get last message if conversation exists
          let lastMessage = null;
          let lastMessageTime = null;
          if (conversationId) {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (lastMsg) {
              lastMessage = lastMsg.content;
              lastMessageTime = lastMsg.created_at;
            }
          }

          return {
            id: teacher.id,
            name: teacher.profiles.full_name,
            email: teacher.profiles.email,
            avatar_url: teacher.profiles.avatar_url,
            subjects: teacher.subjects || [],
            rating: teacher.rating || 0,
            total_reviews: teacher.total_reviews || 0,
            is_available: teacher.is_available,
            last_seen: teacher.updated_at,
            conversation_id: conversationId,
            unread_count: 0, // TODO: Implement unread count
            last_message: lastMessage,
            last_message_time: lastMessageTime
          };
        })
      );

      return teachersWithConversations;
    } catch (error) {
      console.error('Error in getAvailableTeachers:', error);
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
      expiresAt.setHours(expiresAt.getHours() + 24); // Expire in 24 hours

      const { data, error } = await supabase
        .from('session_requests')
        .insert({
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
        .select('id')
        .single();

      if (error) {
        console.error('Error creating session request:', error);
        return { success: false, error: error.message };
      }

      // Send notification to teacher
      await this.sendNotification(
        teacherId,
        'session_request',
        'New Session Request',
        `You have a new session request from a parent`,
        { request_id: data.id, parent_id: parentId, student_id: studentId }
      );

      return { success: true, requestId: data.id };
    } catch (error) {
      console.error('Error in sendSessionRequest:', error);
      return { success: false, error: 'Failed to send session request' };
    }
  }

  /**
   * Get session requests for a parent
   */
  static async getSessionRequests(parentId: string): Promise<SessionRequest[]> {
    try {
      // Get children of the parent
      const { data: children } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', parentId);

      if (!children || children.length === 0) {
        return [];
      }

      const childrenIds = children.map(child => child.id);

      const { data, error } = await supabase
        .from('session_requests')
        .select(`
          *,
          students!session_requests_student_id_fkey (
            profiles!inner (
              full_name
            )
          ),
          teachers!session_requests_teacher_id_fkey (
            profiles!inner (
              full_name,
              avatar_url
            )
          ),
          classes (
            title,
            subjects!inner (
              name
            )
          )
        `)
        .in('student_id', childrenIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching session requests:', error);
        return [];
      }

      return (data || []).map((request: any) => ({
        id: request.id,
        student_id: request.student_id,
        teacher_id: request.teacher_id,
        class_id: request.class_id,
        requested_start: request.requested_start,
        requested_end: request.requested_end,
        duration_hours: request.duration_hours,
        tokens_required: request.tokens_required,
        status: request.status,
        message: request.message,
        teacher_response: request.teacher_response,
        declined_reason: request.declined_reason,
        expires_at: request.expires_at,
        created_at: request.created_at,
        updated_at: request.updated_at,
        student_name: request.students?.profiles?.full_name || 'Unknown Student',
        teacher_name: request.teachers?.profiles?.full_name || 'Unknown Teacher',
        teacher_avatar: request.teachers?.profiles?.avatar_url,
        subject: request.classes?.subjects?.name || 'General'
      }));
    } catch (error) {
      console.error('Error in getSessionRequests:', error);
      return [];
    }
  }

  /**
   * Send notification to user
   */
  private static async sendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: data || {},
          priority: 'normal'
        });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // This would typically involve updating a read status table
      // For now, we'll just log the action
      console.log(`Marking messages as read for conversation ${conversationId} by user ${userId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
}

export default ParentMessagingService;
