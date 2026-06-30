import { supabase } from '../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { apiService } from './apiService';

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'class';
  title?: string;
  class_id?: string;
  created_by?: string;
  participants: string[];
  last_message_at: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  other_participant?: Profile;
  last_message?: Message;
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
  sender?: Profile;
  reply_to?: Message;
  read_by: MessageRead[];
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  avatar_url?: string;
  phone?: string;
  bio?: string;
  date_of_birth?: string;
  location?: string;
  timezone?: string;
  language?: string;
  is_verified: boolean;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
  user?: Profile;
}

export interface TypingUser {
  user_id: string;
  user?: Profile;
  conversation_id: string;
  timestamp: string;
}

class MessagingService {
  private channels: Map<string, RealtimeChannel> = new Map();

  // ==============================================
  // CONVERSATION MANAGEMENT
  // ==============================================

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Conversation[] }>(`/messaging/conversations/${userId}`);
      
      // Fetch details (last message, unread count, profile)
      const conversationsWithDetails = await Promise.all(
        (res.data || []).map(async (conversation) => {
          const [lastMessage, unreadCount] = await Promise.all([
            this.getLastMessage(conversation.id),
            this.getUnreadCount(conversation.id, userId)
          ]);

          const otherParticipantId = conversation.participants.find(p => p !== userId);
          let otherParticipant = null;
          
          if (otherParticipantId) {
            otherParticipant = await this.getUserProfile(otherParticipantId);
          }

          return {
            ...conversation,
            last_message: lastMessage,
            unread_count: unreadCount,
            other_participant: otherParticipant
          };
        })
      );

      return conversationsWithDetails;
    } catch (error) {
      console.error('Error fetching conversations via API:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    participants: string[],
    type: 'direct' | 'group' | 'class' = 'direct',
    title?: string,
    class_id?: string
  ): Promise<Conversation> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Conversation }>('/messaging/conversations', {
        method: 'POST',
        body: JSON.stringify({
          type,
          title,
          class_id,
          participants,
          created_by: participants[0]
        })
      });
      return res.data;
    } catch (error) {
      console.error('Error creating conversation via API:', error);
      throw error;
    }
  }

  /**
   * Find or create a direct conversation between two users
   */
  async findOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    try {
      return await this.createConversation([user1Id, user2Id], 'direct');
    } catch (error) {
      console.error('Error finding/creating direct conversation via API:', error);
      throw error;
    }
  }

  // ==============================================
  // MESSAGE MANAGEMENT
  // ==============================================

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string,
    page: number = 0,
    limit: number = 50
  ): Promise<Message[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Message[] }>(`/messaging/messages/${conversationId}?page=${page}&limit=${limit}`);
      return (res.data || []).reverse();
    } catch (error) {
      console.error('Error fetching messages via API:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'assignment' | 'system' = 'text',
    attachments: any[] = [],
    replyToId?: string
  ): Promise<Message> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Message }>('/messaging/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          message_type: messageType,
          attachments,
          reply_to_id: replyToId
        })
      });
      return res.data;
    } catch (error) {
      console.error('Error sending message via API:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    try {
      await apiService.makeRequest('/messaging/messages/read', {
        method: 'POST',
        body: JSON.stringify({
          messageIds,
          userId
        })
      });
    } catch (error) {
      console.error('Error marking messages as read via API:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await apiService.makeRequest(`/messaging/messages/${messageId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting message via API:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<Message> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Message }>(`/messaging/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: newContent })
      });
      return res.data;
    } catch (error) {
      console.error('Error editing message via API:', error);
      throw error;
    }
  }

  // ==============================================
  // HELPER METHODS
  // ==============================================

  /**
   * Get the last message in a conversation
   */
  private async getLastMessage(conversationId: string): Promise<Message | null> {
    try {
      const messages = await this.getMessages(conversationId, 0, 1);
      return messages.length > 0 ? messages[0] : null;
    } catch (error) {
      console.error('Error fetching last message:', error);
      return null;
    }
  }

  /**
   * Get unread message count for a conversation
   */
  private async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; count: number }>(`/messaging/messages/${conversationId}/unread-count?userId=${userId}`).catch(() => ({ success: true, count: 0 }));
      return res.count || 0;
    } catch (error) {
      return 0;
    }
  }

  // ==============================================
  // REAL-TIME SUBSCRIPTIONS (Standard client-only channel listeners)
  // ==============================================

  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void,
    onMessageUpdate?: (message: Message) => void,
    onMessageDelete?: (messageId: string) => void
  ): RealtimeChannel {
    const channelName = `messages:${conversationId}`;
    
    if (this.channels.has(channelName)) {
      this.unsubscribeFromMessages(conversationId);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(*),
              reply_to:messages(*),
              read_by:message_reads(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            onMessage(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          if (payload.new.is_deleted) {
            onMessageDelete?.(payload.new.id);
          } else {
            const { data: message } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles!messages_sender_id_fkey(*),
                reply_to:messages(*),
                read_by:message_reads(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (message) {
              onMessageUpdate?.(message);
            }
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  subscribeToConversations(
    userId: string,
    onConversationUpdate: (conversation: Conversation) => void
  ): RealtimeChannel {
    const channelName = `conversations:${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `participants=cs.{${userId}}`
        },
        async (payload) => {
          const { data: conversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (conversation) {
            const [lastMessage, unreadCount] = await Promise.all([
              this.getLastMessage(conversation.id),
              this.getUnreadCount(conversation.id, userId)
            ]);

            const otherParticipantId = conversation.participants.find(p => p !== userId);
            let otherParticipant = null;
            
            if (otherParticipantId) {
              otherParticipant = await this.getUserProfile(otherParticipantId);
            }

            onConversationUpdate({
              ...conversation,
              last_message: lastMessage,
              unread_count: unreadCount,
              other_participant: otherParticipant
            });
          }
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  subscribeToTyping(
    conversationId: string,
    onTypingStart: (user: TypingUser) => void,
    onTypingStop: (userId: string) => void
  ): RealtimeChannel {
    const channelName = `typing:${conversationId}`;
    
    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.typing) {
              onTypingStart(presence);
            }
          });
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.typing) {
            onTypingStart(presence);
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          onTypingStop(presence.user_id);
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            online_at: new Date().toISOString()
          });
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  async sendTypingIndicator(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    const channelName = `typing:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      if (isTyping) {
        await channel.track({
          user_id: userId,
          typing: true,
          timestamp: new Date().toISOString()
        });
        
        setTimeout(() => {
          channel.track({
            user_id: userId,
            typing: false,
            timestamp: new Date().toISOString()
          });
        }, 3000);
      } else {
        await channel.track({
          user_id: userId,
          typing: false,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  unsubscribeFromMessages(conversationId: string): void {
    const channelName = `messages:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeFromConversations(userId: string): void {
    const channelName = `conversations:${userId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeFromTyping(conversationId: string): void {
    const channelName = `typing:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  cleanup(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // ==============================================
  // USER MANAGEMENT
  // ==============================================

  async searchUsers(query: string, currentUserId: string, role?: string): Promise<Profile[]> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Profile[] }>(`/profiles/search?query=${query}&currentUserId=${currentUserId}&role=${role || ''}`);
      return res.data || [];
    } catch (error) {
      console.error('Error searching users via API:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const res = await apiService.makeRequest<{ success: boolean; data: Profile }>(`/profiles/${userId}`);
      return res.data;
    } catch (error) {
      console.error('Error fetching user profile via API:', error);
      return null;
    }
  }
}

export const messagingService = new MessagingService();
