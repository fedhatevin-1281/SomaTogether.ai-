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

class StudentMessagingService {
  /**
   * Get all conversations for a student
   */
  static async getConversations(studentId: string): Promise<Conversation[]> {
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
        .contains('participants', [studentId])
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      // Process conversations to add display information
      const processedConversations = await Promise.all(
        (data || []).map(async (conv) => {
          // Get other participants (not the current student)
          const otherParticipants = conv.participants.filter((id: string) => id !== studentId);
          
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
        reply_to: msg.reply_to_id ? {
          id: msg.reply_to_id,
          content: 'Reply message', // We'll fetch this separately if needed
          sender_name: 'Previous message'
        } : null
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
   * Create or get conversation with a teacher
   */
  static async getOrCreateTeacherConversation(
    studentId: string,
    teacherId: string
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      console.log('Creating conversation between student:', studentId, 'and teacher:', teacherId);
      
      // Check if conversation already exists - use a different approach
      const { data: existingConvs, error: fetchError } = await supabase
        .from('conversations')
        .select('id, participants')
        .eq('type', 'direct')
        .contains('participants', [studentId]);

      if (fetchError) {
        console.error('Error fetching existing conversations:', fetchError);
      }

      // Check if any existing conversation contains both participants
      let existingConv = null;
      if (existingConvs) {
        existingConv = existingConvs.find(conv => 
          conv.participants && 
          conv.participants.includes(studentId) && 
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
          created_by: studentId,
          participants: [studentId, teacherId]
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
   * Create or get conversation with AI assistant
   */
  static async getOrCreateAIConversation(studentId: string): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      console.log('Creating AI conversation for student:', studentId);
      
      // Check if AI conversation already exists
      const { data: existingConvs, error: fetchError } = await supabase
        .from('conversations')
        .select('id, participants, title')
        .eq('type', 'direct')
        .contains('participants', [studentId])
        .eq('title', 'AI Assistant');

      if (fetchError) {
        console.error('Error fetching existing AI conversations:', fetchError);
      }

      // Check if any existing conversation is with AI
      let existingConv = null;
      if (existingConvs) {
        existingConv = existingConvs.find(conv => 
          conv.participants && 
          conv.participants.includes(studentId) && 
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
          created_by: studentId,
          participants: [studentId, 'ai-assistant'] // Special ID for AI
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
   * Get available teachers for messaging
   */
  static async getAvailableTeachers(studentId: string): Promise<TeacherContact[]> {
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
          const convResult = await this.getOrCreateTeacherConversation(studentId, teacher.id);
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
   * Get session requests for a student
   */
  static async getStudentRequests(studentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('session_requests')
        .select(`
          *,
          profiles!teacher_id(
            id,
            full_name,
            email,
            avatar_url,
            teachers(
              hourly_rate,
              currency,
              subjects,
              specialties,
              experience_years,
              rating,
              total_reviews,
              verification_status
            )
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching student requests:', error);
        return [];
      }

      return (data || []).map((request: any) => ({
        ...request,
        teacher: {
          ...request.profiles,
          hourly_rate: request.profiles?.teachers?.[0]?.hourly_rate || 0,
          currency: request.profiles?.teachers?.[0]?.currency || 'USD',
          subjects: request.profiles?.teachers?.[0]?.subjects || [],
          specialties: request.profiles?.teachers?.[0]?.specialties || [],
          experience_years: request.profiles?.teachers?.[0]?.experience_years || 0,
          rating: request.profiles?.teachers?.[0]?.rating || 0,
          total_reviews: request.profiles?.teachers?.[0]?.total_reviews || 0,
          verification_status: request.profiles?.teachers?.[0]?.verification_status || 'pending',
        },
      }));
    } catch (error) {
      console.error('Error in getStudentRequests:', error);
      return [];
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

export default StudentMessagingService;
