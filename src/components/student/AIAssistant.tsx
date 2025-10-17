import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  Bot, 
  Send, 
  Lightbulb, 
  BookOpen, 
  Calculator, 
  FileText,
  Mic,
  Image,
  Paperclip,
  Download,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import type { AIMessage } from '../../services/aiService';

interface AIAssistantProps {
  onBack: () => void;
}

export function AIAssistant({ onBack }: AIAssistantProps) {
  const { user } = useAuth();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    generateStudyMaterial,
    explainHomework,
    generatePracticeQuestions,
    clearMessages,
    saveImage,
  } = useAI();
  
  const [inputMessage, setInputMessage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const quickActions = [
    {
      icon: Calculator,
      title: 'Math Help 💯',
      description: 'Step-by-step guidance, no direct answers',
      action: () => {
        const problem = prompt('Bro, what math problem are you working on? I\'ll help you think through it! 💪');
        if (problem) {
          explainHomework(problem, 'Mathematics');
        }
      }
    },
    {
      icon: BookOpen,
      title: 'Study Guide 📚',
      description: 'Create study materials for any topic',
      action: () => {
        const topic = prompt('What topic do you want to study? I\'ll make you a cool study guide! ✨');
        if (topic) {
          generateStudyMaterial(topic);
        }
      }
    },
    {
      icon: FileText,
      title: 'Practice Problems 🎯',
      description: 'Get practice questions to test yourself',
      action: () => {
        const topic = prompt('What topic do you want to practice? Let\'s create some questions together! 🚀');
        if (topic) {
          generatePracticeQuestions(topic);
        }
      }
    },
    {
      icon: Lightbulb,
      title: 'Ask Soma AI 🤖',
      description: 'Ask me anything about your studies',
      action: () => {
        const question = prompt('Hey! What\'s on your mind? I\'m here to help you learn! 🌟');
        if (question) {
          sendMessage(question, selectedSubject, undefined, user?.id);
        }
      }
    }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    await sendMessage(inputMessage, selectedSubject, undefined, user?.id);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src="/AI Mascot.svg"
                alt="AI Mascot"
                className="w-16 h-16 object-contain mascot-live"
                onError={(e) => {
                  console.error('Failed to load AI Mascot SVG:', e);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Show fallback Bot icon
                  const fallback = target.parentElement?.querySelector('.fallback-bot-icon') as HTMLElement;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <Bot className="h-6 w-6 text-slate-600 fallback-bot-icon" style={{ display: 'none' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Soma AI
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </h1>
              <p className="text-slate-600">Your learning buddy - tuko pamoja! 🚀</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={clearMessages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[600px]">
            {/* Chat Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((message: AIMessage) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src="/AI Mascot.svg"
                          alt="AI Mascot"
                          className="w-5 h-5 object-contain mascot-live"
                          onError={(e) => {
                            console.error('Failed to load AI Mascot SVG:', e);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show fallback Bot icon
                            const fallback = target.parentElement?.querySelector('.fallback-bot-icon-small') as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                        <Bot className="h-4 w-4 text-slate-600 fallback-bot-icon-small" style={{ display: 'none' }} />
                        <span className="font-medium text-sm">Soma AI</span>
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Image attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className="relative">
                            <img
                              src={`data:image/png;base64,${attachment}`}
                              alt="AI Generated Image"
                              className="max-w-full h-auto rounded-lg border"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="absolute top-2 right-2"
                              onClick={() => saveImage(attachment, 'image/png', `ai_image_${Date.now()}_${index}.png`)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-900 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span className="font-medium text-sm">Soma AI</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-slate-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" title="Attach file">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" title="Attach image">
                  <Image className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Hey bro! What would you like to learn today? 🤔"
                    onKeyPress={handleKeyPress}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    title="Voice input (coming soon)"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">
                  💡 Tip: Be specific about your questions - tuko pamoja! 💪
                </p>
                {selectedSubject && (
                  <Badge variant="secondary" className="text-xs">
                    Subject: {selectedSubject}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={action.title}
                  onClick={action.action}
                  className="w-full p-3 text-left border rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={isLoading}
                >
                  <div className="flex items-start space-x-3">
                    <action.icon className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">{action.title}</h4>
                      <p className="text-xs text-slate-600">{action.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Subject Shortcuts */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Subject Help 📚</h3>
            <div className="space-y-2">
              {[
                { name: 'Mathematics', color: 'bg-blue-100 text-blue-800', emoji: '🔢' },
                { name: 'English', color: 'bg-green-100 text-green-800', emoji: '📝' },
                { name: 'Kiswahili', color: 'bg-yellow-100 text-yellow-800', emoji: '🗣️' },
                { name: 'Science', color: 'bg-purple-100 text-purple-800', emoji: '🔬' },
                { name: 'Social Studies', color: 'bg-orange-100 text-orange-800', emoji: '🌍' },
                { name: 'CRE/IRE', color: 'bg-red-100 text-red-800', emoji: '🙏' }
              ].map((subject, index) => (
                <Badge
                  key={subject.name}
                  className={`${subject.color} cursor-pointer hover:opacity-80 w-full justify-center py-2 ${
                    selectedSubject === subject.name ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedSubject(selectedSubject === subject.name ? '' : subject.name)}
                >
                  {subject.emoji} {subject.name}
                </Badge>
              ))}
            </div>
          </Card>

          {/* AI Capabilities */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Soma AI Powers ✨
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Guides you through problems (no direct answers!)</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Explains concepts with Kenyan examples</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Creates fun study guides</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Makes practice questions for you</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Homework help with hints & tips</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <span>Speaks Sheng & Swahili too! 🗣️</span>
              </div>
            </div>
          </Card>

          {/* Usage Stats */}
          <Card className="p-6">
            <h3 className="font-bold mb-4">Your Learning Journey 🌟</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Questions Asked</span>
                <span className="font-medium">47</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Problems Cracked</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Study Time</span>
                <span className="font-medium">12.5h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Favorite Subject</span>
                <span className="font-medium">Mathematics</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">XP Earned</span>
                <span className="font-medium">1,250</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Current Level</span>
                <span className="font-medium">Level 5</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}