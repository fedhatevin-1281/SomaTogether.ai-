import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import StudentMessagingService from '../../services/studentMessagingService';
import ParentMessagingService from '../../services/parentMessagingService';
import { messagingService } from '../../services/messagingService';

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'class';
  title?: string;
  participants: string[];
  last_message_at?: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id?: string;
    sender_name?: string;
  };
  unread_count?: number;
  other_participant?: {
    id: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface MessagesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMessages: (conversationId?: string) => void;
}

const MessagesDropdown: React.FC<MessagesDropdownProps> = ({ isOpen, onClose, onNavigateToMessages }) => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Load conversations based on user role
  const loadConversations = async () => {
    if (!user?.id || !profile?.role) return;

    try {
      setLoading(true);
      let convs: Conversation[] = [];

      switch (profile.role) {
        case 'student':
          convs = await StudentMessagingService.getConversations(user.id);
          break;
        case 'parent':
          convs = await ParentMessagingService.getConversations(user.id);
          break;
        case 'teacher':
        case 'admin':
          // Use general messaging service for teachers and admins
          try {
            convs = await messagingService.getConversations(user.id);
          } catch (error) {
            console.error('Error loading teacher/admin conversations:', error);
            convs = [];
          }
          break;
        default:
          convs = [];
      }

      // Filter to only show conversations with unread messages
      const unreadConvs = convs.filter(conv => (conv.unread_count || 0) > 0);

      // Sort by last message time (most recent first)
      unreadConvs.sort((a, b) => {
        const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return timeB - timeA;
      });

      setConversations(unreadConvs);
      
      // Calculate total unread count
      const unread = unreadConvs.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setTotalUnread(unread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load conversations when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, user?.id, profile?.role]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getDisplayName = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    if (conversation.other_participant) {
      return conversation.other_participant.full_name || conversation.other_participant.name || 'Unknown User';
    }
    return 'Unknown';
  };

  const getAvatarUrl = (conversation: Conversation) => {
    return conversation.other_participant?.avatar_url;
  };

  const getInitials = (conversation: Conversation) => {
    const name = getDisplayName(conversation);
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">New Messages</h3>
          {totalUnread > 0 && (
            <Badge variant="destructive" className="ml-2">
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="max-h-96">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-sm font-medium text-slate-900 mb-1">No new messages</p>
            <p className="text-xs text-slate-500">You're all caught up! New messages will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.slice(0, 10).map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  onNavigateToMessages(conversation.id);
                  onClose();
                }}
                className="w-full p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getAvatarUrl(conversation)} />
                    <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                      {getInitials(conversation)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {getDisplayName(conversation)}
                      </p>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conversation.last_message && (
                      <>
                        <p className="text-xs text-slate-600 truncate mb-1">
                          {conversation.last_message.content}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatTime(conversation.last_message.created_at)}
                        </p>
                      </>
                    )}
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sm"
          onClick={() => {
            onNavigateToMessages();
            onClose();
          }}
        >
          {conversations.length > 0 ? 'View All Messages' : 'Go to Messages'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default MessagesDropdown;

