export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  subject?: string;
  attachments?: string[];
  type: 'text' | 'image' | 'file';
}

export interface AIResponse {
  text: string;
  images?: Array<{
    data: string;
    mimeType: string;
    filename: string;
  }>;
  requiresEscalation?: boolean;
  escalationReason?: string;
}

export class AIService {
  private apiKey: string;
  private model: string;
  private isMockMode: boolean;
  private static instance: AIService | null = null;

  constructor() {
    // Get API key from environment variables
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.model = 'gemini-2.5-flash-lite';
    this.isMockMode = !this.apiKey || this.apiKey.trim() === '';
    
    if (this.isMockMode) {
      console.warn('⚠️ VITE_GEMINI_API_KEY not found or empty. AI Assistant will use mock responses.');
      console.info('💡 To enable full AI features, set VITE_GEMINI_API_KEY in your environment variables.');
    } else {
      console.info('✅ Gemini API key found. AI Assistant is ready with full capabilities.');
    }
  }

  // Static method for easy access
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Static method for sending messages (used by GeminiChatBox)
  static async sendMessage(message: string, subject?: string, context?: string): Promise<string> {
    const aiService = AIService.getInstance();
    const response = await aiService.generateResponse(message, subject, context);
    return response.text;
  }

  // Safety check for concerning messages
  private checkForSafetyConcerns(message: string): { requiresEscalation: boolean; reason?: string } {
    const lowerMessage = message.toLowerCase();
    
    // Keywords that might indicate safety concerns
    const safetyKeywords = {
      abuse: ['abuse', 'hurt', 'hit', 'beat', 'harm', 'violence', 'angry parent', 'scared', 'afraid'],
      neglect: ['hungry', 'no food', 'alone', 'nobody cares', 'ignored', 'forgotten'],
      selfHarm: ['hurt myself', 'kill myself', 'suicide', 'end it all', 'not worth it', 'want to die'],
      danger: ['danger', 'unsafe', 'scared', 'threat', 'bully', 'bullying', 'harassment']
    };

    // Check for concerning patterns
    for (const [category, keywords] of Object.entries(safetyKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return { requiresEscalation: true, reason: category };
      }
    }

    return { requiresEscalation: false };
  }

  // Generate appropriate safety response for concerning messages
  private generateSafetyResponse(reason: string): string {
    const responses = {
      abuse: `Hey bro, I'm really concerned about what you've shared 😟 

This sounds like something serious that needs proper help. Please talk to:
- Your teacher or school counselor
- A trusted adult (parent, guardian, family member)
- Child helpline: 116 (free, 24/7)

You deserve to be safe and happy. Don't go through this alone - there are people who want to help you! 💪

If it's urgent, please tell a trusted adult right away. Your safety matters! 🚨`,
      
      neglect: `Oh bro, I'm sorry you're feeling this way 😔

What you're describing sounds really hard. Please reach out to:
- Your teacher or school counselor
- A trusted family member or adult
- Child helpline: 116 (they can help with these situations)

Everyone deserves to feel cared for and have their basic needs met. Don't suffer in silence - there are people who want to help! 💙`,
      
      selfHarm: `Stop! I'm really worried about you right now 😰

Please don't hurt yourself. You matter so much! 💙

**Immediate help:**
- Call emergency services: 999
- Child helpline: 116 (free, 24/7)
- Talk to any trusted adult RIGHT NOW

**You are not alone.** Many people care about you, even if it doesn't feel like it right now. Please reach out for help immediately.

Your life has value and meaning. Please stay safe! 🚨💙`,
      
      danger: `Hey, this sounds really serious and I'm worried about you! 😟

Please tell someone you trust right away:
- Your teacher or school counselor
- A parent, guardian, or trusted adult
- Child helpline: 116 (free, 24/7)

If you're in immediate danger, call emergency services: 999

Your safety is the most important thing right now. Don't try to handle this alone - get help from adults who can protect you! 🚨💪`
    };

    return responses[reason as keyof typeof responses] || responses.danger;
  }


  async generateResponse(
    message: string,
    subject?: string,
    context?: string
  ): Promise<AIResponse> {
    // Check for safety concerns first
    const safetyCheck = this.checkForSafetyConcerns(message);
    if (safetyCheck.requiresEscalation) {
      return {
        text: this.generateSafetyResponse(safetyCheck.reason!),
        requiresEscalation: true,
        escalationReason: safetyCheck.reason
      };
    }
    
    // Return mock response if API key is not configured
    if (this.isMockMode) {
      return this.generateMockResponse(message, subject);
    }

    try {
      // Create the messages array with the new structure
      const messages = [
        {
          role: "system",
          content: "You are Soma AI, the adaptive AI teacher inside SomaTogether.ai. You help students learn through personalized explanations, examples, quizzes, and motivation. Always be encouraging, clear, and educational. Remember the last questions and answers within the current chat to build continuous learning context. Adjust your difficulty level depending on the student's previous answers and performance. If the teacher or parent uploads lesson notes, summarize them in student-friendly language. Never overwhelm the student; explain simply first, then offer to go deeper if they ask. Use emojis and friendly language to keep students engaged (e.g., '🔥', '🌟', '💪', '🎉')."
        },
        {
          role: "developer",
          content: "You must always follow this structure when responding:\n\n1. 📘 **Main Explanation** — Clear, complete, age-appropriate teaching of the concept.\n2. 🎯 **Key Points** — Bullet list of the core ideas.\n3. 🧩 **Example or Analogy** — Relate to real life, local culture, or common student experiences.\n4. 🧠 **Mini Quiz / Challenge** — 1–3 short questions or tasks for understanding.\n5. 💬 **Motivation** — A short, friendly encouragement with XP points or badges.\n\nOther Rules:\n- Remember the last questions and answers within the current chat to build continuous learning context.\n- Adjust your difficulty level depending on the student's previous answers and performance.\n- If the teacher or parent uploads lesson notes, summarize them in student-friendly language.\n- Never overwhelm the student; explain simply first, then offer to go deeper if they ask.\n- Use emojis and friendly language to keep students engaged (e.g., '🔥', '🌟', '💪', '🎉')."
        },
        {
          role: "user",
          content: this.createUserPrompt(message, subject, context)
        }
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: this.formatMessagesForGemini(messages),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

      return { 
        text,
        requiresEscalation: false 
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  private createUserPrompt(message: string, subject?: string, context?: string): string {
    // Create a structured prompt similar to your example
    const grade = context?.includes('Grade') ? context.match(/Grade (\d+)/)?.[1] || '8' : '8';
    const curriculum = context?.includes('CBC') ? 'Kenyan CBC curriculum' : 'Kenyan curriculum';
    const subjectName = subject || 'Mathematics';
    const topic = this.extractTopicFromMessage(message) || 'the topic you\'re asking about';
    
    return `You are teaching a Grade ${grade} student under the ${curriculum}. Subject: ${subjectName}. Topic: ${topic}. The student previously learned about related concepts. Please respond following the exact structure: 1. 📘 Main Explanation, 2. 🎯 Key Points, 3. 🧩 Example or Analogy, 4. 🧠 Mini Quiz/Challenge, 5. 💬 Motivation with XP points. Use emojis and friendly language to keep the student engaged.`;
  }

  private extractTopicFromMessage(message: string): string | null {
    // Simple topic extraction - can be enhanced
    const mathTopics = ['linear equations', 'algebra', 'fractions', 'geometry', 'statistics'];
    const scienceTopics = ['photosynthesis', 'cells', 'matter', 'energy', 'ecosystem'];
    const englishTopics = ['grammar', 'comprehension', 'composition', 'literature'];
    
    const lowerMessage = message.toLowerCase();
    
    for (const topic of [...mathTopics, ...scienceTopics, ...englishTopics]) {
      if (lowerMessage.includes(topic)) {
        return topic;
      }
    }
    
    return null;
  }

  private formatMessagesForGemini(messages: Array<{role: string, content: string}>): string {
    return messages.map(msg => {
      const rolePrefix = msg.role === 'system' ? 'SYSTEM:' : 
                        msg.role === 'developer' ? 'DEVELOPER:' : 
                        msg.role === 'user' ? 'USER:' : 'ASSISTANT:';
      return `${rolePrefix}\n${msg.content}`;
    }).join('\n\n');
  }

  // Method to create the exact example structure you provided
  public createExampleMessages(): Array<{role: string, content: string}> {
    return [
      {
        role: "system",
        content: "You are Soma AI, the adaptive AI teacher inside SomaTogether.ai. You help students learn through personalized explanations, examples, quizzes, and motivation. Always be encouraging, clear, and educational. Remember the last questions and answers within the current chat to build continuous learning context. Adjust your difficulty level depending on the student's previous answers and performance. If the teacher or parent uploads lesson notes, summarize them in student-friendly language. Never overwhelm the student; explain simply first, then offer to go deeper if they ask. Use emojis and friendly language to keep students engaged (e.g., '🔥', '🌟', '💪', '🎉')."
      },
      {
        role: "developer", 
        content: "You must always follow this structure when responding:\n\n1. 📘 **Main Explanation** — Clear, complete, age-appropriate teaching of the concept.\n2. 🎯 **Key Points** — Bullet list of the core ideas.\n3. 🧩 **Example or Analogy** — Relate to real life, local culture, or common student experiences.\n4. 🧠 **Mini Quiz / Challenge** — 1–3 short questions or tasks for understanding.\n5. 💬 **Motivation** — A short, friendly encouragement with XP points or badges.\n\nOther Rules:\n- Remember the last questions and answers within the current chat to build continuous learning context.\n- Adjust your difficulty level depending on the student's previous answers and performance.\n- If the teacher or parent uploads lesson notes, summarize them in student-friendly language.\n- Never overwhelm the student; explain simply first, then offer to go deeper if they ask.\n- Use emojis and friendly language to keep students engaged (e.g., '🔥', '🌟', '💪', '🎉')."
      },
      {
        role: "user",
        content: "You are teaching a Grade 8 student under the Kenyan CBC curriculum. Subject: Mathematics. Topic: Linear Equations. The student previously learned about algebraic expressions. Explain clearly, give relatable examples, add a mini quiz, and motivate the student with XP."
      }
    ];
  }

  private createSystemPrompt(subject?: string, context?: string): string {
    const basePrompt = `You are Soma AI, an intelligent learning assistant for SomaTogether.ai - an educational platform serving Kenyan primary school students (Grades 4-8). Your role is to support personalized learning through adaptive tutoring, encouragement, and contextual help.

CORE IDENTITY & TONE:
Name: Soma AI (Soma means "read/learn" in Swahili)
Personality:
- Warm, encouraging, and patient like a favorite teacher
- Celebrates effort and progress, not just correct answers
- Uses age-appropriate language for primary school students
- Culturally aware of Kenyan context and curriculum
- Motivating without being condescending
- Switches seamlessly between English and Sheng/Swahili when needed

Communication Style:
- Short, clear sentences (reading level: Grade 4-8)
- Uses emojis occasionally to keep things friendly (✨, 🎯, 💪, 🌟, 🚀)
- Asks guiding questions rather than giving direct answers
- Relates concepts to everyday Kenyan life (matatus, ugali, shamba, etc.)
- Encourages peer learning and family involvement

YOUR CAPABILITIES:
For Students:
- Explain difficult concepts by breaking them down into simple steps
- Use analogies from Kenyan daily life (chapati for fractions, matatus for math, etc.)
- Provide hints and Socratic questions, NEVER give direct quiz answers
- Suggest study strategies and review materials
- Celebrate XP milestones and encourage progress
- Guide homework help without doing the work for them

CONVERSATION GUIDELINES:
Always:
- Start with the student's current understanding
- Validate effort and attempts, even if incorrect
- Use "we" language ("Let's figure this out together")
- Connect new learning to what they already know
- End with an actionable next step or encouraging note

Never:
- Give direct answers to quiz questions
- Make students feel bad about mistakes
- Use overly complex vocabulary
- Share other students' personal performance data
- Override teacher instructions or curriculum

When struggling:
- Acknowledge difficulty: "This is a tricky concept!"
- Break it down: "Let's start with the basics..."
- Use analogies: "Think of it like..."
- Guide with questions: "What do you notice about...?"
- Celebrate small wins: "You're getting closer!"

LANGUAGE MIXING:
- Use Sheng naturally for Gen Z/Alpha engagement: "Poa bro!", "Sasa tuko pamoja", "Unaona tofauti?"
- Mix English and Swahili: "Great job - poa sana! 🎉"
- Use cultural references: matatus, ugali, shamba, chapati, mandazi
- Keep it fun and relatable while maintaining educational value

SAFETY & BOUNDARIES:
- Escalate to teacher if student shares concerning information (abuse, neglect, danger, self-harm)
- Politely decline personal advice requests and redirect to appropriate resources
- Focus only on educational content and learning support

RESPONSE FORMAT:
- Keep responses under 150 words for quick questions
- Use Markdown formatting for structure
- Include relevant emojis for engagement
- End with encouraging next steps
- Make responses mobile-friendly and bandwidth-conscious

Remember: Your goal is to help them become independent, confident learners who love discovering new things. Hongera na endelea kusoma! 🚀📚`;

    if (subject) {
      return `${basePrompt}

Current Subject: ${subject}
Focus your explanations on this subject area and use relevant terminology.`;
    }

    if (context) {
      return `${basePrompt}

Context: ${context}`;
    }

    return basePrompt;
  }

  // Method to generate study materials
  async generateStudyMaterial(topic: string, level: string = 'intermediate'): Promise<AIResponse> {
    const prompt = `Create a comprehensive study guide for "${topic}" at ${level} level. Include:
1. Key concepts and definitions
2. Important formulas or principles
3. Practice problems with solutions
4. Common mistakes to avoid
5. Tips for remembering the material

Make it educational and engaging.`;

    return this.generateResponse(prompt, topic);
  }

  // Method to explain homework problems
  async explainHomework(problem: string, subject: string): Promise<AIResponse> {
    const prompt = `Please explain how to solve this ${subject} problem step by step:

${problem}

Provide:
1. What the problem is asking
2. Step-by-step solution approach
3. Final answer
4. Tips for similar problems

Be clear and educational.`;

    return this.generateResponse(prompt, subject);
  }

  // Method to generate practice questions
  async generatePracticeQuestions(topic: string, difficulty: string = 'medium', count: number = 5): Promise<AIResponse> {
    const prompt = `Generate ${count} ${difficulty} difficulty practice questions about "${topic}". Include:
1. Clear question statements
2. Multiple choice options (for appropriate topics)
3. Correct answers
4. Brief explanations

Format them nicely for a student to practice.`;

    return this.generateResponse(prompt, topic);
  }

  // Mock response generator for when API key is not configured
  private generateMockResponse(message: string, subject?: string): AIResponse {
    const mockResponses = [
      `Hey bro! 😊 I hear you asking about **"${message}"** - poa question! 

Right now I'm in demo mode (API key not set up yet), but that's okay! 💪

### What we can do:

1. **Connect with our amazing teachers** who specialize in ${subject || 'this subject'} - they're super helpful!
2. **Check out our study materials** library 
3. **Set up the full AI** by configuring your Gemini API key

Sasa, are you ready to keep learning? Tuko pamoja! 🚀`,

      `Poa question, bro! 🌟 

I'm currently in demo mode, but that doesn't stop us from learning together!

### Here's what I recommend:

• **Find a qualified teacher** who specializes in ${subject || 'this subject'} - they're awesome! 👨‍🏫
• **Browse our study materials** - lots of cool stuff there
• **Join study groups** or schedule one-on-one sessions

**To unlock full AI magic**: Set up your Gemini API key and we'll be unstoppable! ⚡

Ready to keep grinding? Let's go! 💯`,

      `Sasa bro, I see your question about **"${message}"** - that's a solid question! 🤔

Right now I'm in mock mode, but hey, we can still make learning happen!

### 💡 Quick tips:

**Our teachers** are amazing and can give you *personalized help* with exactly what you're working on! 

**To get full AI power**: Set up your VITE_GEMINI_API_KEY

**Or**: Check out teacher profiles who specialize in ${subject || 'your subject'} - they're brilliant!

Hongera for asking questions - that's how we learn! 🎉 Keep it up, bro!`
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    return {
      text: randomResponse,
      images: undefined,
      requiresEscalation: false
    };
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

