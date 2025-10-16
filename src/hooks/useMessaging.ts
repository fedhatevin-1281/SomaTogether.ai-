import { useState, useEffect, useCallback, useRef } from 'react';
import { messagingService, type Conversation, type Message, type Profile, type TypingUser } from '../services/messagingService';
import { useAuth } from '../contexts/AuthContext';

export interface UseMessagingResult {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  typingUsers: TypingUser[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  
  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  sendMessage: (content: string, messageType?: 'text' | 'image' | 'file' | 'assignment' | 'system', attachments?: any[], replyToId?: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  searchUsers: (query: string, role?: string) => Promise<Profile[]>;
  createDirectConversation: (userId: string) => Promise<Conversation>;
  loadMoreMessages: () => Promise<void>;
  
  // Utilities
  getUnreadCount: () => number;
  clearError: () => void;
}

export function useMessaging(): UseMessagingResult {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
    
    return () => {
      messagingService.cleanup();
    };
  }, [user?.id]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to conversation updates
    const conversationChannel = messagingService.subscribeToConversations(
      user.id,
      (updatedConversation) => {
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === updatedConversation.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = updatedConversation;
            // Move to top if it's the most recent
            updated.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
            return updated;
          } else {
            // New conversation
            return [updatedConversation, ...prev];
          }
        });
      }
    );

    return () => {
      messagingService.unsubscribeFromConversations(user.id);
    };
  }, [user?.id]);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await messagingService.getConversations(user.id);
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const selectConversation = useCallback(async (conversation: Conversation) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Unsubscribe from previous conversation
      if (currentConversation) {
        messagingService.unsubscribeFromMessages(currentConversation.id);
        messagingService.unsubscribeFromTyping(currentConversation.id);
      }
      
      setCurrentConversation(conversation);
      setMessages([]);
      setTypingUsers([]);
      setCurrentPage(0);
      setHasMoreMessages(true);
      
      // Load messages for the selected conversation
      const messageData = await messagingService.getMessages(conversation.id, 0, 50);
      setMessages(messageData);
      
      // Mark messages as read
      const unreadMessageIds = messageData
        .filter(msg => msg.sender_id !== user.id && !msg.read_by.some(read => read.user_id === user.id))
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        await messagingService.markMessagesAsRead(unreadMessageIds, user.id);
      }
      
      // Subscribe to real-time updates for this conversation
      messagingService.subscribeToMessages(
        conversation.id,
        (newMessage) => {
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          // Auto-mark as read if it's not from current user
          if (newMessage.sender_id !== user.id) {
            messagingService.markMessagesAsRead([newMessage.id], user.id);
          }
        },
        (updatedMessage) => {
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
        },
        (deletedMessageId) => {
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
        }
      );
      
      // Subscribe to typing indicators
      messagingService.subscribeToTyping(
        conversation.id,
        (typingUser) => {
          setTypingUsers(prev => {
            const existing = prev.find(u => u.user_id === typingUser.user_id);
            if (existing) {
              return prev.map(u => u.user_id === typingUser.user_id ? typingUser : u);
            } else {
              return [...prev, typingUser];
            }
          });
        },
        (userId) => {
          setTypingUsers(prev => prev.filter(u => u.user_id !== userId));
        }
      );
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentConversation]);

  const sendMessage = useCallback(async (
    content: string,
    messageType: 'text' | 'image' | 'file' | 'assignment' | 'system' = 'text',
    attachments: any[] = [],
    replyToId?: string
  ) => {
    if (!currentConversation || !user?.id || !content.trim()) return;

    try {
      setIsSending(true);
      setError(null);
      
      // Stop typing indicator
      stopTyping();
      
      const newMessage = await messagingService.sendMessage(
        currentConversation.id,
        user.id,
        content,
        messageType,
        attachments,
        replyToId
      );
      
      // Optimistically add the message to UI
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation in the list
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === currentConversation.id 
            ? { ...conv, last_message: newMessage, last_message_at: newMessage.created_at }
            : conv
        );
        // Move to top
        updated.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        return updated;
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [currentConversation, user?.id]);

  const markAsRead = useCallback(async () => {
    if (!currentConversation || !user?.id) return;

    try {
      const unreadMessageIds = messages
        .filter(msg => msg.sender_id !== user.id && !msg.read_by.some(read => read.user_id === user.id))
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        await messagingService.markMessagesAsRead(unreadMessageIds, user.id);
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [currentConversation, messages, user?.id]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await messagingService.deleteMessage(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_deleted: true, deleted_at: new Date().toISOString() }
          : msg
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, []);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      const updatedMessage = await messagingService.editMessage(messageId, newContent);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message');
    }
  }, []);

  const startTyping = useCallback(() => {
    if (!currentConversation || !user?.id) return;

    const now = Date.now();
    lastTypingTimeRef.current = now;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    messagingService.sendTypingIndicator(currentConversation.id, user.id, true);

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastTypingTimeRef.current >= 2500) {
        stopTyping();
      }
    }, 3000);
  }, [currentConversation, user?.id]);

  const stopTyping = useCallback(() => {
    if (!currentConversation || !user?.id) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    messagingService.sendTypingIndicator(currentConversation.id, user.id, false);
  }, [currentConversation, user?.id]);

  const searchUsers = useCallback(async (query: string, role?: string): Promise<Profile[]> => {
    if (!user?.id || !query.trim()) return [];
    
    try {
      return await messagingService.searchUsers(query, user.id, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
      return [];
    }
  }, [user?.id]);

  const createDirectConversation = useCallback(async (userId: string): Promise<Conversation> => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const conversation = await messagingService.findOrCreateDirectConversation(user.id, userId);
      
      // Add to conversations list
      setConversations(prev => {
        const exists = prev.some(c => c.id === conversation.id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });
      
      return conversation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      throw err;
    }
  }, [user?.id]);

  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || !hasMoreMessages || isLoading) return;

    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;
      const newMessages = await messagingService.getMessages(currentConversation.id, nextPage, 50);
      
      if (newMessages.length === 0) {
        setHasMoreMessages(false);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more messages');
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, hasMoreMessages, currentPage, isLoading]);

  const getUnreadCount = useCallback((): number => {
    return conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);
  }, [conversations]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    conversations,
    currentConversation,
    messages,
    typingUsers,
    isLoading,
    isSending,
    error,
    
    // Actions
    loadConversations,
    selectConversation,
    sendMessage,
    markAsRead,
    deleteMessage,
    editMessage,
    startTyping,
    stopTyping,
    searchUsers,
    createDirectConversation,
    loadMoreMessages,
    
    // Utilities
    getUnreadCount,
    clearError
  };
}



