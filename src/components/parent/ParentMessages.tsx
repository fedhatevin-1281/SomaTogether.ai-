import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Search, 
  Plus,
  Bot,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ParentMessagingService, { 
  Conversation, 
  Message, 
  TeacherContact, 
  SessionRequest 
} from '../../services/parentMessagingService';
import { useAI } from '../../hooks/useAI';

interface ParentMessagesProps {
  onBack?: () => void;
}

export function ParentMessages({ onBack }: ParentMessagesProps) {
  const { user } = useAuth();
  const { sendMessage: sendAIMessage, isLoading: aiLoading } = useAI();
  
  const [activeTab, setActiveTab] = useState<'conversations' | 'teachers' | 'requests'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [teachers, setTeachers] = useState<TeacherContact[]>([]);
  const [sessionRequests, setSessionRequests] = useState<SessionRequest[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'conversations':
          const convs = await ParentMessagingService.getConversations(user.id);
          setConversations(convs);
          break;
        case 'teachers':
          const teacherList = await ParentMessagingService.getAvailableTeachers(user.id);
          setTeachers(teacherList);
          break;
        case 'requests':
          const requests = await ParentMessagingService.getSessionRequests(user.id);
          setSessionRequests(requests);
          break;
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    try {
      const msgs = await ParentMessagingService.getMessages(conversation.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Check if it's an AI conversation
      if (selectedConversation.title === 'AI Assistant') {
        // Use AI service for AI conversations
        await sendAIMessage(messageContent);
      } else {
        // Send regular message
        const result = await ParentMessagingService.sendMessage(
          selectedConversation.id,
          user.id,
          messageContent
        );

        if (!result.success) {
          setError(result.error || 'Failed to send message');
          return;
        }
      }

      // Reload messages
      const msgs = await ParentMessagingService.getMessages(selectedConversation.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleStartChatWithTeacher = async (teacher: TeacherContact) => {
    if (!user) return;

    try {
      const result = await ParentMessagingService.getOrCreateTeacherConversation(
        user.id,
        teacher.id
      );

      if (result.success && result.conversationId) {
        // Find the conversation in our list or create a new one
        const conversation: Conversation = {
          id: result.conversationId,
          type: 'direct',
          title: `Chat with ${teacher.name}`,
          created_by: user.id,
          participants: [user.id, teacher.id],
          last_message_at: new Date().toISOString(),
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          other_participant: {
            id: teacher.id,
            name: teacher.name,
            avatar_url: teacher.avatar_url,
            role: 'teacher'
          }
        };

        setSelectedConversation(conversation);
        setMessages([]);
        setActiveTab('conversations');
      }
    } catch (err) {
      console.error('Error starting chat with teacher:', err);
      setError('Failed to start chat');
    }
  };

  const handleStartAIChat = async () => {
    if (!user) return;

    try {
      const result = await ParentMessagingService.getOrCreateAIConversation(user.id);

      if (result.success && result.conversationId) {
        const conversation: Conversation = {
          id: result.conversationId,
          type: 'direct',
          title: 'AI Assistant',
          created_by: user.id,
          participants: [user.id, 'ai-assistant'],
          last_message_at: new Date().toISOString(),
          is_archived: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          other_participant: {
            id: 'ai-assistant',
            name: 'AI Assistant',
            role: 'ai'
          }
        };

        setSelectedConversation(conversation);
        setMessages([]);
        setActiveTab('conversations');
      }
    } catch (err) {
      console.error('Error starting AI chat:', err);
      setError('Failed to start AI chat');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading messages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-slate-600">Chat with AI assistant and teachers</p>
          </div>
        </div>
        <Button onClick={handleStartAIChat} className="bg-purple-600 hover:bg-purple-700">
          <Bot className="h-4 w-4 mr-2" />
          Chat with AI
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'conversations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('conversations')}
          className="flex-1"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Conversations
        </Button>
        <Button
          variant={activeTab === 'teachers' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('teachers')}
          className="flex-1"
        >
          <User className="h-4 w-4 mr-2" />
          Teachers
        </Button>
        <Button
          variant={activeTab === 'requests' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('requests')}
          className="flex-1"
        >
          <Clock className="h-4 w-4 mr-2" />
          Requests
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Conversations/Teachers/Requests List */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>

            {activeTab === 'conversations' && (
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No conversations yet</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.id === conv.id
                          ? 'bg-purple-100 border border-purple-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.other_participant?.avatar_url} />
                          <AvatarFallback>
                            {conv.other_participant?.role === 'ai' ? (
                              <Bot className="h-5 w-5" />
                            ) : (
                              <User className="h-5 w-5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {conv.other_participant?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {conv.last_message?.content || 'No messages yet'}
                          </p>
                        </div>
                        {conv.unread_count && conv.unread_count > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'teachers' && (
              <div className="space-y-2">
                {teachers.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No teachers available</p>
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleStartChatWithTeacher(teacher)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={teacher.avatar_url} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{teacher.name}</p>
                          <p className="text-xs text-gray-500">
                            {teacher.subjects.slice(0, 2).join(', ')}
                            {teacher.subjects.length > 2 && '...'}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-yellow-600">★</span>
                              <span className="text-xs text-gray-600">{teacher.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">
                              {teacher.is_available ? 'Available' : 'Busy'}
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-2">
                {sessionRequests.length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-4">No session requests</p>
                ) : (
                  sessionRequests.map((request) => (
                    <div key={request.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{request.teacher_name}</p>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(request.status)}
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {request.student_name} • {request.subject}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.requested_start).toLocaleDateString()} • 
                        {request.duration_hours}h • {request.tokens_required} tokens
                      </p>
                      {request.message && (
                        <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                          {request.message}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedConversation.other_participant?.avatar_url} />
                  <AvatarFallback>
                    {selectedConversation.other_participant?.role === 'ai' ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedConversation.other_participant?.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.other_participant?.role === 'ai' ? 'AI Assistant' : 'Teacher'}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={aiLoading}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || aiLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Select a conversation</p>
                <p className="text-sm">Choose a conversation from the list to start chatting</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}








