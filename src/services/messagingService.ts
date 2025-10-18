import { supabase } from '../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import NotificationService from './notificationService';

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
  // Extended fields for UI
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
  // Extended fields for UI
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
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .eq('is_archived', false)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Get the last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conversation) => {
          const [lastMessage, unreadCount] = await Promise.all([
            this.getLastMessage(conversation.id),
            this.getUnreadCount(conversation.id, userId)
          ]);

          // Find the other participant (not the current user)
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
      console.error('Error fetching conversations:', error);
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
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          type,
          title,
          class_id,
          participants,
          created_by: participants[0]
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Find or create a direct conversation between two users
   */
  async findOrCreateDirectConversation(user1Id: string, user2Id: string): Promise<Conversation> {
    try {
      // First, try to find an existing direct conversation
      const { data: conversations, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'direct')
        .eq('is_archived', false);

      if (searchError) throw searchError;

      // Find conversation that contains both users
      const existing = conversations?.find(conv => 
        conv.participants.includes(user1Id) && conv.participants.includes(user2Id)
      );

      if (existing) {
        return existing;
      }

      // Create new conversation if none exists
      return await this.createConversation([user1Id, user2Id], 'direct');
    } catch (error) {
      console.error('Error finding/creating direct conversation:', error);
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
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) throw error;

      // Reverse to show oldest first
      return data.reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
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
        .select(`
          *,
          sender:profiles(*),
          reply_to:messages(*),
          read_by:message_reads(*)
        `)
        .single();

      if (error) throw error;

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Create notifications for other participants
      await this.createMessageNotifications(conversationId, data);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    try {
      for (const messageId of messageIds) {
        const { error } = await supabase
          .from('message_reads')
          .upsert({
            message_id: messageId,
            user_id: userId
          }, { 
            onConflict: 'message_id,user_id',
            ignoreDuplicates: true 
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select(`
          *,
          sender:profiles(*),
          reply_to:messages(*),
          read_by:message_reads(*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error editing message:', error);
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
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
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
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_deleted', false);

      if (error) throw error;

      if (data.length === 0) return 0;

      const messageIds = data.map(msg => msg.id);

      const { data: readMessages, error: readError } = await supabase
        .from('message_reads')
        .select('message_id')
        .in('message_id', messageIds)
        .eq('user_id', userId);

      if (readError) throw readError;

      const readMessageIds = new Set(readMessages.map(r => r.message_id));
      return messageIds.filter(id => !readMessageIds.has(id)).length;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // ==============================================
  // REAL-TIME SUBSCRIPTIONS
  // ==============================================

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void,
    onMessageUpdate?: (message: Message) => void,
    onMessageDelete?: (messageId: string) => void
  ): RealtimeChannel {
    const channelName = `messages:${conversationId}`;
    
    // Unsubscribe from existing channel if it exists
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
          // Fetch the complete message with sender info
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(*),
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
            // Fetch the complete updated message
            const { data: message } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles(*),
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

  /**
   * Subscribe to conversation updates
   */
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
          // Fetch the complete conversation with details
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

            // Get other participant info
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

  /**
   * Subscribe to typing indicators
   */
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
          // Track user presence
          await channel.track({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            online_at: new Date().toISOString()
          });
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Send typing indicator
   */
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
        
        // Auto-stop typing after 3 seconds
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

  /**
   * Unsubscribe from messages
   */
  unsubscribeFromMessages(conversationId: string): void {
    const channelName = `messages:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from conversations
   */
  unsubscribeFromConversations(userId: string): void {
    const channelName = `conversations:${userId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from typing indicators
   */
  unsubscribeFromTyping(conversationId: string): void {
    const channelName = `typing:${conversationId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  // ==============================================
  // USER MANAGEMENT
  // ==============================================

  /**
   * Search for users to start conversations with
   */
  async searchUsers(query: string, currentUserId: string, role?: string): Promise<Profile[]> {
    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)
        .eq('is_active', true);

      if (role) {
        queryBuilder = queryBuilder.eq('role', role);
      }

      const { data, error } = await queryBuilder
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // ==============================================
  // NOTIFICATION HELPERS
  // ==============================================

  /**
   * Create notifications for message recipients
   */
  private async createMessageNotifications(conversationId: string, message: Message): Promise<void> {
    try {
      // Get conversation participants
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participants')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) return;

      // Create notifications for all participants except the sender
      const recipients = conversation.participants.filter((id: string) => id !== message.sender_id);
      
      for (const recipientId of recipients) {
        try {
          await NotificationService.createNotification(
            recipientId,
            'message',
            `New message from ${message.sender?.full_name || 'Unknown User'}`,
            message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
            {
              conversation_id: conversationId,
              sender_id: message.sender_id,
              message_id: message.id
            }
          );
        } catch (error) {
          console.error('Failed to create notification for user:', recipientId, error);
        }
      }
    } catch (error) {
      console.error('Error creating message notifications:', error);
    }
  }
}

export const messagingService = new MessagingService();
