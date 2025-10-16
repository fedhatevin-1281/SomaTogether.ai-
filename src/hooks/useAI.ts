import { useState, useCallback } from 'react';
import { AIService, AIMessage, AIResponse } from '../services/aiService';

export type { AIMessage, AIResponse };

export interface UseAIResult {
  messages: AIMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string, subject?: string, context?: string) => Promise<void>;
  generateStudyMaterial: (topic: string, level?: string) => Promise<void>;
  explainHomework: (problem: string, subject: string) => Promise<void>;
  generatePracticeQuestions: (topic: string, difficulty?: string, count?: number) => Promise<void>;
  clearMessages: () => void;
  saveImage: (imageData: string, mimeType: string, filename: string) => void;
}

export function useAI(): UseAIResult {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: "Hi! I'm your AI tutoring assistant. I can help you with homework, explain concepts, generate study materials, and create practice questions. What would you like to learn about today?",
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = useCallback((message: Omit<AIMessage, 'id'>) => {
    const newMessage: AIMessage = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const sendMessage = useCallback(async (message: string, subject?: string, context?: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    addMessage({
      role: 'user',
      content: message,
      timestamp: new Date(),
      subject,
      type: 'text',
    });

    try {
      const aiService = new AIService();
      const response: AIResponse = await aiService.generateResponse(message, subject, context);

      // Add AI response
      addMessage({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        subject,
        type: 'text',
      });

      // Handle escalation if needed
      if (response.requiresEscalation) {
        console.warn('⚠️ Safety escalation triggered:', response.escalationReason);
        // In a real implementation, this would notify teachers/admin
        // For now, we just log it and show the safety response
      }

      // Handle images if any
      if (response.images && response.images.length > 0) {
        response.images.forEach((image, index) => {
          addMessage({
            role: 'assistant',
            content: `Here's a visual aid for your question:`,
            timestamp: new Date(),
            subject,
            type: 'image',
            attachments: [image.data],
          });
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      addMessage({
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again or consider asking a human teacher for help.`,
        timestamp: new Date(),
        type: 'text',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const generateStudyMaterial = useCallback(async (topic: string, level: string = 'intermediate') => {
    setIsLoading(true);
    setError(null);

    addMessage({
      role: 'user',
      content: `Generate study material for: ${topic} (${level} level)`,
      timestamp: new Date(),
      subject: topic,
      type: 'text',
    });

    try {
      const aiService = new AIService();
      const response = await aiService.generateStudyMaterial(topic, level);

      addMessage({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        subject: topic,
        type: 'text',
      });

      if (response.images && response.images.length > 0) {
        response.images.forEach((image) => {
          addMessage({
            role: 'assistant',
            content: `Study material visual:`,
            timestamp: new Date(),
            subject: topic,
            type: 'image',
            attachments: [image.data],
          });
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate study material';
      setError(errorMessage);
      addMessage({
        role: 'assistant',
        content: `I couldn't generate the study material: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
        type: 'text',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const explainHomework = useCallback(async (problem: string, subject: string) => {
    setIsLoading(true);
    setError(null);

    addMessage({
      role: 'user',
      content: `Explain this homework problem: ${problem}`,
      timestamp: new Date(),
      subject,
      type: 'text',
    });

    try {
      const aiService = new AIService();
      const response = await aiService.explainHomework(problem, subject);

      addMessage({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        subject,
        type: 'text',
      });

      if (response.images && response.images.length > 0) {
        response.images.forEach((image) => {
          addMessage({
            role: 'assistant',
            content: `Visual explanation:`,
            timestamp: new Date(),
            subject,
            type: 'image',
            attachments: [image.data],
          });
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to explain homework';
      setError(errorMessage);
      addMessage({
        role: 'assistant',
        content: `I couldn't explain the homework: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
        type: 'text',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const generatePracticeQuestions = useCallback(async (
    topic: string,
    difficulty: string = 'medium',
    count: number = 5
  ) => {
    setIsLoading(true);
    setError(null);

    addMessage({
      role: 'user',
      content: `Generate ${count} ${difficulty} practice questions about: ${topic}`,
      timestamp: new Date(),
      subject: topic,
      type: 'text',
    });

    try {
      const aiService = new AIService();
      const response = await aiService.generatePracticeQuestions(topic, difficulty, count);

      addMessage({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        subject: topic,
        type: 'text',
      });

      if (response.images && response.images.length > 0) {
        response.images.forEach((image) => {
          addMessage({
            role: 'assistant',
            content: `Practice question visual:`,
            timestamp: new Date(),
            subject: topic,
            type: 'image',
            attachments: [image.data],
          });
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate practice questions';
      setError(errorMessage);
      addMessage({
        role: 'assistant',
        content: `I couldn't generate practice questions: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
        type: 'text',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: "Hi! I'm your AI tutoring assistant. I can help you with homework, explain concepts, generate study materials, and create practice questions. What would you like to learn about today?",
        timestamp: new Date(),
        type: 'text',
      },
    ]);
    setError(null);
  }, []);

  const saveImage = useCallback((imageData: string, mimeType: string, filename: string) => {
    try {
      // Convert base64 to blob and download
      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save image:', err);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    generateStudyMaterial,
    explainHomework,
    generatePracticeQuestions,
    clearMessages,
    saveImage,
  };
}
