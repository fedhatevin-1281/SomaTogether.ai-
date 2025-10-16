# Real-Time Messaging System Implementation Guide

## 🚀 Overview

This document provides a comprehensive guide to the real-time messaging system implemented for the SomaTogether.ai platform. The system enables seamless communication between teachers, students, and parents with advanced features like file attachments, read receipts, typing indicators, and real-time notifications.

## 📋 Features Implemented

### Core Messaging Features
- ✅ **Real-time messaging** using Supabase subscriptions
- ✅ **Direct conversations** between users
- ✅ **Message threading** and replies
- ✅ **Message editing and deletion**
- ✅ **Read receipts** with read status indicators
- ✅ **Typing indicators** with real-time updates
- ✅ **File attachments** with drag-and-drop upload
- ✅ **Message search** and conversation filtering
- ✅ **User search** to start new conversations

### Notification System
- ✅ **Real-time notifications** for new messages
- ✅ **Browser notifications** with permission handling
- ✅ **Notification center** with unread count badges
- ✅ **Auto-mark as read** functionality
- ✅ **Notification types** (messages, assignments, session requests)

### Advanced Features
- ✅ **Message pagination** for performance
- ✅ **Optimistic UI updates** for better UX
- ✅ **Error handling** with retry mechanisms
- ✅ **Loading states** and skeleton screens
- ✅ **Responsive design** for all screen sizes

## 🏗️ Architecture

### Services Layer
```
src/services/
├── messagingService.ts     # Core messaging functionality
├── notificationService.ts  # Notification management
└── supabaseClient.ts      # Database connection
```

### Hooks Layer
```
src/hooks/
├── useMessaging.ts        # Messaging state management
└── useNotifications.ts    # Notification state management
```

### Components Layer
```
src/components/shared/
├── MessagesScreen.tsx     # Main messaging interface
├── FileUpload.tsx         # File attachment component
├── NotificationCenter.tsx # Notification dropdown
└── NotificationBell.tsx   # Notification bell icon
```

## 🗄️ Database Schema

### Core Tables
- `conversations` - Chat conversations between users
- `messages` - Individual messages with attachments
- `message_reads` - Read receipt tracking
- `notifications` - System notifications
- `profiles` - User profile information

### Key Relationships
- Conversations have multiple participants (users)
- Messages belong to conversations
- Message reads track which users have read messages
- Notifications are sent to specific users

## 🚀 Setup Instructions

### 1. Database Setup
Run the following SQL script in your Supabase SQL Editor:

```sql
-- Run setup-message-storage.sql
-- This creates the necessary tables, indexes, and storage policies
```

### 2. Storage Bucket Setup
The system automatically creates a `message-attachments` bucket for file uploads with:
- 10MB file size limit
- Support for images, PDFs, documents, and text files
- Public access for viewing attachments

### 3. Environment Variables
Ensure your `.env.local` file contains:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Component Integration
Add the messaging components to your app:

```tsx
import { MessagesScreen } from './components/shared/MessagesScreen';
import { NotificationBell } from './components/shared/NotificationBell';

// In your header component
<NotificationBell />

// In your main app
<MessagesScreen 
  userRole="student" // or "teacher", "parent", "admin"
  onBack={() => navigate('/dashboard')}
/>
```

## 💻 Usage Examples

### Basic Messaging
```tsx
import { useMessaging } from './hooks/useMessaging';

function ChatComponent() {
  const {
    conversations,
    currentConversation,
    messages,
    sendMessage,
    selectConversation
  } = useMessaging();

  // Send a text message
  const handleSendMessage = async () => {
    await sendMessage("Hello, how are you?");
  };

  // Send a message with attachments
  const handleSendFile = async () => {
    const attachments = [
      { name: 'document.pdf', url: 'https://...', type: 'application/pdf' }
    ];
    await sendMessage("Here's the document", 'file', attachments);
  };
}
```

### Notifications
```tsx
import { useNotifications } from './hooks/useNotifications';

function NotificationComponent() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  return (
    <div>
      <span>Unread: {unreadCount}</span>
      {notifications.map(notification => (
        <div key={notification.id}>
          {notification.title}
          <button onClick={() => markAsRead(notification.id)}>
            Mark as Read
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 🔧 API Reference

### MessagingService

#### Core Methods
- `getConversations(userId)` - Get all conversations for a user
- `sendMessage(conversationId, senderId, content, type, attachments)` - Send a message
- `getMessages(conversationId, page, limit)` - Get messages with pagination
- `markMessagesAsRead(messageIds, userId)` - Mark messages as read
- `deleteMessage(messageId)` - Delete a message
- `editMessage(messageId, newContent)` - Edit a message

#### Real-time Subscriptions
- `subscribeToMessages(conversationId, callbacks)` - Listen for new messages
- `subscribeToConversations(userId, callback)` - Listen for conversation updates
- `subscribeToTyping(conversationId, callbacks)` - Listen for typing indicators

### NotificationService

#### Core Methods
- `getNotifications(userId, limit)` - Get user notifications
- `createNotification(userId, type, title, message, data)` - Create a notification
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead(userId)` - Mark all notifications as read

#### Helper Methods
- `createMessageNotification()` - Create message notification
- `createSessionRequestNotification()` - Create session request notification
- `createAssignmentNotification()` - Create assignment notification

## 🎨 UI Components

### MessagesScreen
The main messaging interface with:
- Conversation list with search
- Chat interface with message history
- File upload with drag-and-drop
- Typing indicators and read receipts
- User search for new conversations

### FileUpload
Drag-and-drop file upload component with:
- File type validation
- Size limits
- Preview for images
- Multiple file support
- Progress indicators

### NotificationCenter
Dropdown notification center with:
- Unread count badges
- Notification history
- Mark as read functionality
- Browser notification integration

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only access their own conversations
- Message reads are tracked per user
- File uploads are restricted to authenticated users
- Notifications are user-specific

### File Upload Security
- File type validation
- Size limits (10MB per file)
- Secure storage with signed URLs
- Automatic cleanup of expired files

## 📱 Real-time Features

### WebSocket Subscriptions
- Real-time message delivery
- Typing indicators
- Online status updates
- Conversation updates

### Optimistic Updates
- Messages appear immediately
- UI updates before server confirmation
- Rollback on errors
- Smooth user experience

## 🧪 Testing

### Manual Testing Checklist
- [ ] Send and receive messages
- [ ] File upload and download
- [ ] Read receipts functionality
- [ ] Typing indicators
- [ ] Notification delivery
- [ ] Message editing/deletion
- [ ] User search and new conversations
- [ ] Real-time updates across multiple tabs
- [ ] Mobile responsiveness

### Error Scenarios
- [ ] Network disconnection
- [ ] Invalid file uploads
- [ ] Message sending failures
- [ ] Notification permission denied
- [ ] Database connection issues

## 🚀 Performance Optimizations

### Database Optimizations
- Indexed foreign keys
- Paginated message loading
- Efficient conversation queries
- Optimized read receipt tracking

### Client Optimizations
- Message pagination (50 messages per page)
- Debounced typing indicators
- Optimistic UI updates
- Efficient re-rendering with React hooks

### Storage Optimizations
- CDN-backed file storage
- Image compression for uploads
- Lazy loading of attachments
- Automatic file cleanup

## 🔮 Future Enhancements

### Planned Features
- [ ] Message reactions and emojis
- [ ] Voice messages
- [ ] Video calls integration
- [ ] Message encryption
- [ ] Group conversations
- [ ] Message scheduling
- [ ] Advanced search filters
- [ ] Message templates
- [ ] Translation support

### Technical Improvements
- [ ] Message caching
- [ ] Offline support
- [ ] Push notifications
- [ ] Message backup
- [ ] Analytics dashboard
- [ ] Performance monitoring

## 🐛 Troubleshooting

### Common Issues

#### Messages not appearing
1. Check Supabase connection
2. Verify RLS policies
3. Check console for errors
4. Ensure user is authenticated

#### File uploads failing
1. Check storage bucket configuration
2. Verify file size limits
3. Check file type restrictions
4. Ensure storage policies are correct

#### Notifications not working
1. Check browser notification permissions
2. Verify notification service setup
3. Check real-time subscriptions
4. Ensure user has notification preferences enabled

#### Real-time updates not working
1. Check Supabase real-time is enabled
2. Verify subscription channels
3. Check network connectivity
4. Ensure proper cleanup of subscriptions

### Debug Tools
- Browser DevTools for network monitoring
- Supabase Dashboard for database inspection
- Console logging for error tracking
- React DevTools for component debugging

## 📞 Support

For technical support or questions about the messaging system:
1. Check the troubleshooting section above
2. Review the Supabase documentation
3. Check the component documentation
4. Create an issue in the project repository

---

**Note**: This messaging system is designed to scale with your application and provides a solid foundation for real-time communication features. All components are fully typed with TypeScript and follow React best practices.



