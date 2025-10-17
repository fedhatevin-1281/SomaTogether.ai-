# AI Memory Implementation Guide

## 🎯 Overview
This guide explains how to implement AI memory functionality that stores questions and answers for 1 hour, allowing the AI to remember previous conversations and provide contextual responses.

## 📊 Database Schema Analysis

Based on the `database-schema-main.sql`, we have several options for storing AI memory:

### Option 1: Use Existing Tables (RECOMMENDED)
- **`conversations`** - Store AI chat sessions
- **`messages`** - Store individual Q&A pairs
- **Advantages**: Leverages existing infrastructure, built-in RLS, easy to query
- **Disadvantages**: Slightly more complex queries

### Option 2: Create Dedicated Table
- **`ai_memory`** - Dedicated table for AI Q&A storage
- **Advantages**: Simple, purpose-built
- **Disadvantages**: Additional table to maintain

## 🚀 Implementation Steps

### Step 1: Database Setup
Run the SQL script `ai-memory-setup.sql` in your Supabase SQL editor:

```sql
-- This creates:
-- 1. get_or_create_ai_conversation() function
-- 2. store_ai_qa() function  
-- 3. get_ai_conversation_context() function
-- 4. cleanup_expired_ai_conversations() function
```

### Step 2: Install Services
The following services have been created:

1. **`src/services/aiMemoryService.ts`** - Core memory management
2. **`src/services/aiMemoryCleanup.ts`** - Automatic cleanup service
3. **Updated `src/services/aiService.ts`** - Integrated with memory

### Step 3: Initialize Cleanup Service
Add to your main App component or initialization:

```typescript
import { AIMemoryCleanupService } from './services/aiMemoryCleanup';

// Start automatic cleanup
const cleanupService = AIMemoryCleanupService.getInstance();
cleanupService.startAutoCleanup();
```

## 🔧 How It Works

### 1. Question Asked
```typescript
// User asks: "What is photosynthesis?"
const response = await aiService.generateResponse(
  "What is photosynthesis?", 
  "Biology", 
  undefined, 
  userId
);
```

### 2. Memory Storage
```typescript
// AI Service automatically stores:
await memoryService.storeQA(
  userId,
  "What is photosynthesis?",
  "Photosynthesis is the process...",
  "Biology",
  context
);
```

### 3. Context Retrieval
```typescript
// Next question: "How does it work?"
// AI gets previous context:
const context = await memoryService.getFormattedContext(userId, 5);
// Returns: "Recent conversation context:\n1. Student asked: 'What is photosynthesis?'\n   AI responded: 'Photosynthesis is...'"
```

### 4. Enhanced Response
The AI now responds with full context awareness, referencing previous questions and building on previous knowledge.

## 📋 Features

### ✅ What's Included
- **1-hour memory expiration** - Conversations automatically expire
- **Context-aware responses** - AI references previous Q&A
- **Automatic cleanup** - Expired conversations are removed
- **Student personalization** - Uses student profile data
- **Subject tracking** - Remembers what subjects were discussed
- **Performance optimized** - Efficient database queries

### 🔄 Memory Lifecycle
1. **Creation**: Q&A stored when AI responds
2. **Retrieval**: Previous context loaded for new questions
3. **Expiration**: Data expires after 1 hour
4. **Cleanup**: Expired data removed every 15 minutes

## 🎛️ Configuration

### Memory Duration
Change the 1-hour limit in `ai-memory-setup.sql`:
```sql
-- Change this line:
expires_at := now() + interval '1 hour';

-- To this for 2 hours:
expires_at := now() + interval '2 hours';
```

### Context Length
Adjust how many previous Q&A pairs to include:
```typescript
// In aiService.ts, change the limit:
conversationContext = await memoryService.getFormattedContext(userId, 10); // 10 instead of 5
```

### Cleanup Frequency
Modify cleanup interval in `aiMemoryCleanup.ts`:
```typescript
// Change from 15 minutes to 30 minutes:
this.cleanupInterval = setInterval(() => {
  this.runCleanup();
}, 30 * 60 * 1000); // 30 minutes
```

## 📊 Database Structure

### Conversations Table Usage
```sql
-- AI conversations are stored as:
{
  "type": "direct",
  "title": "AI Assistant Chat", 
  "created_by": "student-uuid",
  "participants": ["student-uuid"],
  "metadata": {
    "ai_session": true,
    "expires_at": "2024-01-15T15:30:00Z"
  }
}
```

### Messages Table Usage
```sql
-- Questions stored as:
{
  "conversation_id": "conversation-uuid",
  "sender_id": "student-uuid", 
  "content": "What is photosynthesis?",
  "message_type": "text",
  "metadata": {
    "role": "user",
    "subject": "Biology",
    "timestamp": "2024-01-15T14:30:00Z"
  }
}

-- Answers stored as:
{
  "conversation_id": "conversation-uuid",
  "sender_id": "00000000-0000-0000-0000-000000000000", -- AI user ID
  "content": "Photosynthesis is the process...",
  "message_type": "text", 
  "metadata": {
    "role": "ai",
    "subject": "Biology",
    "question_id": "question-uuid"
  }
}
```

## 🚨 Important Notes

### Security
- All functions use RLS (Row Level Security)
- Students can only access their own conversations
- AI user ID is a special system ID

### Performance
- Indexes are created for efficient queries
- Cleanup runs automatically to prevent data bloat
- Context is limited to recent conversations only

### Error Handling
- Memory storage failures don't break AI responses
- Graceful fallbacks if context retrieval fails
- Comprehensive error logging

## 🧪 Testing

### Test Memory Storage
```typescript
const memoryService = AIMemoryService.getInstance();
await memoryService.storeQA(
  "test-user-id",
  "What is 2+2?", 
  "2+2 equals 4!",
  "Mathematics"
);
```

### Test Context Retrieval
```typescript
const context = await memoryService.getFormattedContext("test-user-id", 5);
console.log(context);
```

### Test Cleanup
```typescript
const cleanupService = AIMemoryCleanupService.getInstance();
const cleaned = await cleanupService.runCleanup();
console.log(`Cleaned ${cleaned} expired conversations`);
```

## 🎉 Result

With this implementation, your AI assistant will:
- ✅ Remember previous questions and answers for 1 hour
- ✅ Provide contextual, personalized responses
- ✅ Build on previous learning conversations
- ✅ Automatically clean up expired data
- ✅ Scale efficiently with many students

The AI will now say things like:
> "Great question! Earlier you asked about photosynthesis, and now you're asking about cellular respiration. These are related processes - photosynthesis creates energy, while cellular respiration uses it..."

This creates a much more engaging and educational experience for students! 🚀
