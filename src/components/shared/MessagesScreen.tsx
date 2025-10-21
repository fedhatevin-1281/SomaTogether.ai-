import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { 
  ArrowLeft, 
  Send, 
  Search, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Users,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { useMessaging } from '../../hooks/useMessaging';
import { useAuth } from '../../contexts/AuthContext';
import type { Conversation, Message, Profile } from '../../services/messagingService';
import { FileUpload, type UploadedFile } from './FileUpload';

interface MessagesScreenProps {
  userRole: 'student' | 'teacher' | 'parent' | 'admin';
  onBack: () => void;
  classInfo?: { teacher: string; subject: string };
}

export function MessagesScreen({ userRole, onBack, classInfo }: MessagesScreenProps) {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    typingUsers,
    isLoading,
    isSending,
    error,
    selectConversation,
    sendMessage,
    markAsRead,
    deleteMessage,
    editMessage,
    startTyping,
    stopTyping,
    searchUsers,
    createDirectConversation,
    getUnreadCount,
    clearError
  } = useMessaging();

  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle user search
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (userSearchQuery.trim().length > 2) {
        try {
          const results = await searchUsers(userSearchQuery, userRole === 'student' ? 'teacher' : 'student');
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching users:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, searchUsers, userRole]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      conversation.title?.toLowerCase().includes(searchLower) ||
      conversation.other_participant?.full_name.toLowerCase().includes(searchLower) ||
      conversation.other_participant?.email.toLowerCase().includes(searchLower)
    );
  });

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && attachedFiles.length === 0) || !currentConversation || isSending) return;

    try {
      const messageContent = messageInput.trim() || '📎 File attachment';
      const messageType = attachedFiles.length > 0 ? 'file' : 'text';
      
      await sendMessage(messageContent, messageType, attachedFiles);
      setMessageInput('');
      setAttachedFiles([]);
      setShowFileUpload(false);
      stopTyping();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key !== 'Enter') {
      startTyping();
    }
  };

  const handleUserSelect = async (selectedUser: Profile) => {
    try {
      const conversation = await createDirectConversation(selectedUser.id);
      await selectConversation(conversation);
      setShowUserSearch(false);
      setUserSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      await editMessage(editingMessage.id, editContent);
      setEditingMessage(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)} min ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getReadStatus = (message: Message) => {
    if (!message.read_by || message.read_by.length === 0) {
      return <Check className="h-3 w-3 text-slate-400" />;
    }
    return <CheckCheck className="h-3 w-3 text-blue-500" />;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-slate-600">Communicate with your learning community</p>
          </div>
        </div>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="font-medium text-slate-900 mb-2">Error Loading Messages</h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={clearError} variant="outline">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-slate-600">
              {getUnreadCount() > 0 && (
                <span className="text-blue-600 font-medium">
                  {getUnreadCount()} unread message{getUnreadCount() !== 1 ? 's' : ''}
                </span>
              )}
              {getUnreadCount() === 0 && 'Communicate with your learning community'}
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowUserSearch(!showUserSearch)}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto h-full">
            {isLoading && conversations.length === 0 ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-600">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center">
                <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${
                    currentConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center">
                          {conversation.other_participant?.avatar_url ? (
                            <img
                              src={conversation.other_participant.avatar_url}
                              alt={conversation.other_participant.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-6 w-6 text-slate-500" />
                          )}
                        </div>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">
                          {conversation.title || conversation.other_participant?.full_name || 'Unknown'}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {conversation.last_message_at && formatTimestamp(conversation.last_message_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 capitalize">
                        {conversation.other_participant?.role || 'User'}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {conversation.last_message?.content || 'No messages yet'}
                      </p>
                    </div>
                    
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <Badge className="bg-blue-500 text-white h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center">
                      {currentConversation.other_participant?.avatar_url ? (
                        <img
                          src={currentConversation.other_participant.avatar_url}
                          alt={currentConversation.other_participant.full_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {currentConversation.title || currentConversation.other_participant?.full_name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-slate-600 capitalize">
                      {currentConversation.other_participant?.role || 'User'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {isLoading && messages.length === 0 ? (
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-900 mb-2">No messages yet</h3>
                    <p className="text-slate-600">Start the conversation by sending a message</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    
                    if (editingMessage?.id === message.id) {
                      return (
                        <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[70%] p-3 rounded-lg bg-slate-100">
                            <Input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="mb-2"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditMessage();
                                } else if (e.key === 'Escape') {
                                  setEditingMessage(null);
                                  setEditContent('');
                                }
                              }}
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={handleEditMessage}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingMessage(null);
                                setEditContent('');
                              }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%] group">
                          <div
                            className={`p-3 rounded-lg ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            <p>{message.content}</p>
                            
                            {/* File Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((attachment: any, index: number) => (
                                  <div key={index} className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
                                    <Paperclip className="h-4 w-4" />
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm underline hover:no-underline truncate"
                                    >
                                      {attachment.name}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className={`flex items-center justify-between mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-slate-500'
                            }`}>
                              <span className="text-xs">
                                {formatTimestamp(message.created_at)}
                                {message.is_edited && ' (edited)'}
                              </span>
                              {isOwnMessage && (
                                <div className="flex items-center space-x-1">
                                  {getReadStatus(message)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isOwnMessage && (
                            <div className="flex justify-end space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingMessage(message);
                                  setEditContent(message.content);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMessage(message.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing indicators */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-lg bg-slate-100">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-slate-600">
                          {typingUsers.map(u => u.user?.full_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* File Upload Area */}
              {showFileUpload && (
                <div className="p-4 border-t bg-slate-50">
                  <FileUpload
                    onFileSelect={setAttachedFiles}
                    maxFiles={5}
                    maxSize={10}
                    acceptedTypes={['image/*', '.pdf', '.doc', '.docx', '.txt', '.zip']}
                    disabled={isSending}
                  />
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    className={showFileUpload ? 'bg-blue-100 text-blue-600' : ''}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={handleKeyPress}
                      disabled={isSending}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!messageInput.trim() && attachedFiles.length === 0) || isSending}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Attached Files Preview */}
                {attachedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="flex items-center space-x-2 bg-blue-50 px-2 py-1 rounded-full text-sm">
                        <Paperclip className="h-3 w-3" />
                        <span className="text-blue-700 truncate max-w-32">{file.name}</span>
                        <button
                          onClick={() => setAttachedFiles(prev => prev.filter(f => f.id !== file.id))}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : showUserSearch ? (
            <div className="flex-1 flex flex-col">
              {/* User Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={`Search for ${userRole === 'student' ? 'teachers' : 'students'}...`}
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {searchResults.length === 0 ? (
                  <div className="text-center">
                    <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      {userSearchQuery.length > 2 ? 'No users found' : 'Start typing to search for users'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.full_name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <Users className="h-5 w-5 text-slate-500" />
                              )}
                            </div>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{user.full_name}</h3>
                            <p className="text-sm text-slate-600 capitalize">{user.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-2">Select a conversation</h3>
                <p className="text-slate-600 mb-4">Choose a contact to start messaging or start a new conversation</p>
                <Button onClick={() => setShowUserSearch(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}