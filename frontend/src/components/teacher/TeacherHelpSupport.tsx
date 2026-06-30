import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  HelpCircle, 
  BookOpen, 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  MessageSquare,
  Phone,
  Mail,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  Wallet,
  Calendar,
  UserCheck,
  Star,
  BarChart3,
  Upload
} from 'lucide-react';
import { Input } from '../ui/input';

interface TeacherHelpSupportProps {
  onBack?: () => void;
}

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of teaching on SomaTogether.ai and set up your profile.',
    icon: BookOpen,
    articles: [
      {
        id: 'understanding-dashboard',
        title: 'Understanding Your Dashboard',
        content: `• The dashboard shows key metrics at a glance:
  - Total Earnings: Your cumulative earnings from completed sessions
  - Active Students: Number of students in your active classes
  - Upcoming Sessions: Scheduled sessions in the next 7 days
  - Average Rating: Your overall rating with total review count
  - Wallet Balance: Current token balance and earnings
  - Pending Requests: Session requests awaiting your response
  - Unread Messages: Notification count
• Use tabs to navigate between Overview, Active Classes, Upcoming Sessions, Assignments, and Recent Activity.
• Quick action buttons provide fast access to common tasks.
• Refresh button updates all dashboard data in real-time.`
      },
      {
        id: 'setting-up-profile',
        title: 'Setting Up Your Teacher Profile',
        content: `1. Go to Settings from the sidebar.
2. Complete your profile information:
   - Upload profile and cover images
   - Add your teaching philosophy
   - List your education background
   - Add certifications and qualifications
   - Specify languages you speak
   - Add social media links (optional)
3. Set your subjects and proficiency levels.
4. Add your teaching specialties and skills.
5. Configure your hourly rate and currency.
6. Set your availability and timezone.
7. Upload verification documents if required.
8. Complete your profile to increase visibility and attract more students.
9. A complete profile helps students find and trust you.`
      },
      {
        id: 'navigating-platform',
        title: 'Navigating the Platform',
        content: `• Use the sidebar to access all features:
  - Dashboard: Overview of your teaching activities
  - Class Management: Create and manage classes
  - Session Management: Schedule and conduct sessions
  - Student Requests: Accept or decline session requests
  - My Students: View all your students
  - Upload Assignment: Create assignments for students
  - Grade Submissions: Review and grade student work
  - Materials Library: Manage teaching materials
  - Wallet: View earnings and manage payments
  - Messages: Communicate with students and parents
  - Analytics: View performance metrics
  - Settings: Manage your account
• The top-right icons provide quick access to notifications, messages, and your profile.
• Use search functionality to find specific students, classes, or assignments.`
      },
      {
        id: 'first-steps',
        title: 'Your First Steps as a Teacher',
        content: `1. Complete your teacher profile in Settings.
2. Set up your subjects and teaching specialties.
3. Configure your availability and hourly rate.
4. Wait for students to send session requests.
5. Review and accept session requests from students.
6. Schedule your first session with accepted students.
7. Conduct the session using the provided Zoom link.
8. Upload assignments and materials for your students.
9. Grade student submissions and provide feedback.
10. Track your earnings and manage your wallet.
11. Build your reputation through quality teaching and positive reviews.`
      }
    ]
  },
  {
    id: 'managing-requests',
    title: 'Managing Student Requests',
    description: 'Learn how to handle session requests from students and manage your schedule.',
    icon: UserCheck,
    articles: [
      {
        id: 'viewing-requests',
        title: 'Viewing Session Requests',
        content: `1. Go to "Student Requests" from the sidebar or dashboard.
2. View all incoming session requests from students.
3. See request details including:
   - Student name and profile
   - Requested date and time
   - Session duration
   - Student message or learning goals
   - Request status (pending, accepted, declined)
4. Requests expire after 7 days if not responded to.
5. Click on a request to view full student profile before deciding.
6. Check your availability before accepting requests.
7. Review student's learning goals to ensure you can help.`
      },
      {
        id: 'accepting-requests',
        title: 'Accepting Session Requests',
        content: `1. Review the session request details carefully.
2. Check your availability for the requested time.
3. View the student's profile to understand their needs.
4. Click "Accept Request" on the request card.
5. Optionally add a response message to the student.
6. The student will be notified immediately.
7. The session will appear in your "Upcoming Sessions".
8. A Zoom link will be generated for the session.
9. You'll receive a notification with session details.
10. The student's tokens are confirmed (10 tokens per session).
11. Prepare your materials and lesson plan before the session.`
      },
      {
        id: 'declining-requests',
        title: 'Declining Session Requests',
        content: `1. If you cannot accept a request, click "Decline Request".
2. Optionally provide a reason or message to the student.
3. The student will be notified of your decision.
4. The student's 10 tokens will be automatically refunded within 24 hours.
5. The request will be marked as declined in your history.
6. You can decline requests if:
   - You're not available at the requested time
   - The subject is outside your expertise
   - You're on vacation or taking time off
   - The request conflicts with your schedule
7. Be professional and courteous when declining requests.
8. Consider suggesting alternative times if applicable.`
      },
      {
        id: 'request-expiration',
        title: 'Understanding Request Expiration',
        content: `• Session requests expire after 7 days if not responded to.
• Expired requests are automatically cancelled.
• Students receive automatic refunds for expired requests.
• You won't be penalized for expired requests.
• Check your requests regularly to avoid expiration.
• Set up notifications to be alerted of new requests.
• Respond promptly to maintain good teacher ratings.
• Quick responses help attract more students.`
      }
    ]
  },
  {
    id: 'class-management',
    title: 'Class Management',
    description: 'Learn how to create, manage, and organize your classes with students.',
    icon: BookOpen,
    articles: [
      {
        id: 'creating-classes',
        title: 'Creating a New Class',
        content: `1. Go to "Class Management" from the sidebar.
2. Click "Create New Class" button.
3. Fill in class details:
   - Class title and description
   - Subject and curriculum
   - Class duration and schedule
   - Maximum number of students
   - Hourly rate for the class
4. Set class settings:
   - Class visibility (public or private)
   - Enrollment requirements
   - Prerequisites if any
5. Add class materials and resources.
6. Set learning objectives and goals.
7. Save the class - it will be available for students.
8. Share the class link with interested students.
9. Monitor enrollment and manage students.`
      },
      {
        id: 'managing-students',
        title: 'Managing Students in Classes',
        content: `1. Go to "Class Management" and select a class.
2. View all enrolled students in the class.
3. See student profiles, progress, and attendance.
4. Add or remove students from the class.
5. Send messages to individual students or the whole class.
6. Track student progress and performance.
7. View student submissions and assignments.
8. Provide feedback and grades.
9. Monitor attendance and participation.
10. Export student data if needed.
11. Archive or close classes when completed.`
      },
      {
        id: 'class-materials',
        title: 'Adding Materials to Classes',
        content: `1. Go to "Class Management" → select a class.
2. Navigate to the "Materials" or "Resources" section.
3. Click "Add Material" or "Upload File".
4. Upload files such as:
   - PDF notes and study guides
   - Presentations (PowerPoint, PDF)
   - Videos and recordings
   - Worksheets and assignments
   - Links to external resources
5. Organize materials by topic or week.
6. Set material visibility (all students or specific students).
7. Add descriptions and instructions for each material.
8. Update or remove materials as needed.
9. Students can access materials through their class view.
10. Keep materials organized for easy student access.`
      },
      {
        id: 'class-settings',
        title: 'Managing Class Settings',
        content: `1. Go to "Class Management" and select a class.
2. Click "Settings" or "Edit Class".
3. Update class information:
   - Title, description, and subject
   - Schedule and duration
   - Maximum students
   - Hourly rate
4. Modify class visibility and enrollment settings.
5. Update learning objectives and goals.
6. Change class status (active, paused, completed).
7. Archive or delete classes when no longer needed.
8. Export class data and reports.
9. Set notification preferences for class activities.
10. Save changes - students will be notified of updates.`
      }
    ]
  },
  {
    id: 'session-management',
    title: 'Session Management',
    description: 'Learn how to schedule, conduct, and manage your teaching sessions.',
    icon: Calendar,
    articles: [
      {
        id: 'scheduling-sessions',
        title: 'Scheduling Sessions',
        content: `1. Go to "Session Management" from the sidebar.
2. Click "Schedule New Session" or "Create Session".
3. Select the student or class for the session.
4. Choose date and time for the session.
5. Set session duration (30 minutes to 3 hours).
6. Add session topic or learning objectives.
7. Include any special instructions or materials needed.
8. Generate or confirm Zoom meeting link.
9. Save the session - it will appear in your calendar.
10. Students will receive notifications with session details.
11. Sessions appear in "Upcoming Sessions" on your dashboard.
12. You can reschedule or cancel sessions if needed.`
      },
      {
        id: 'conducting-sessions',
        title: 'Conducting Live Sessions',
        content: `1. Before the session:
   - Review student's profile and learning goals
   - Prepare your lesson plan and materials
   - Test your internet connection and Zoom setup
   - Have teaching materials ready
2. Join the session:
   - Click "Join Session" from your dashboard or session management
   - Use the provided Zoom link
   - Ensure audio and video are working
   - Share your screen if needed
3. During the session:
   - Start the session timer (tracks duration automatically)
   - Engage with the student actively
   - Use interactive tools and materials
   - Answer questions and provide explanations
   - Take notes on student progress
4. After the session:
   - End the session and stop the timer
   - Tokens are automatically deducted from student and credited to you
   - Provide session summary or feedback
   - Assign follow-up work if needed
   - Update student progress records`
      },
      {
        id: 'session-tracking',
        title: 'Session Time Tracking',
        content: `• Session duration is tracked automatically when you start a session.
• The timer begins when you click "Start Session".
• You can pause and resume the session timer if needed.
• Tokens are calculated based on actual session duration.
• Standard rate: 10 tokens per hour (approximately $0.40 earnings per hour).
• Session time is recorded accurately for billing purposes.
• View session history with duration and earnings.
• Students are charged based on actual time spent.
• You earn tokens based on completed session time.
• Check your session logs for detailed time tracking.`
      },
      {
        id: 'managing-sessions',
        title: 'Managing Your Sessions',
        content: `1. View all sessions in "Session Management":
   - Upcoming sessions (scheduled)
   - Active sessions (in progress)
   - Completed sessions (past)
   - Cancelled sessions
2. Filter sessions by:
   - Date range
   - Student name
   - Status
   - Subject
3. Reschedule sessions:
   - Click on a session
   - Select "Reschedule"
   - Choose new date and time
   - Students are notified automatically
4. Cancel sessions:
   - Click "Cancel Session"
   - Provide reason if required
   - Students receive refunds automatically
   - You won't earn tokens for cancelled sessions
5. View session details:
   - Student information
   - Session notes and feedback
   - Duration and earnings
   - Materials used
6. Export session reports for your records.`
      }
    ]
  },
  {
    id: 'assignments',
    title: 'Assignments & Grading',
    description: 'Learn how to create assignments, grade submissions, and provide feedback.',
    icon: FileText,
    articles: [
      {
        id: 'creating-assignments',
        title: 'Creating Assignments',
        content: `1. Go to "Upload Assignment" from the sidebar.
2. Click "Create New Assignment".
3. Fill in assignment details:
   - Assignment title and description
   - Subject and class (if applicable)
   - Instructions and requirements
   - Point value or grading criteria
   - Due date and time
   - Difficulty level
4. Add assignment files:
   - Upload PDF, Word, or other documents
   - Attach worksheets or templates
   - Include example solutions (optional)
5. Set assignment settings:
   - Visibility (which students can see it)
   - Submission format (file type required)
   - Allow late submissions (yes/no)
   - Maximum file size
6. Add grading rubric or criteria.
7. Publish the assignment - students will be notified.
8. Monitor submission progress in "Grade Submissions".`
      },
      {
        id: 'grading-submissions',
        title: 'Grading Student Submissions',
        content: `1. Go to "Grade Submissions" from the sidebar.
2. View all submitted assignments:
   - Filter by class, student, or status
   - See submission date and due date
   - Check if submission is on time or late
3. Click on a submission to grade:
   - Review the student's work
   - Download and open submitted files
   - Check against assignment requirements
4. Provide grades and feedback:
   - Enter points or percentage score
   - Add written feedback and comments
   - Highlight strengths and areas for improvement
   - Suggest resources for further learning
5. Save the grade - student will be notified.
6. Students can view grades and feedback in their assignments.
7. Track grading progress for all assignments.
8. Export grades for record-keeping.`
      },
      {
        id: 'assignment-feedback',
        title: 'Providing Effective Feedback',
        content: `• Be specific and constructive in your feedback.
• Highlight what the student did well.
• Point out areas that need improvement.
• Provide actionable suggestions for learning.
• Reference specific parts of their work.
• Use a positive and encouraging tone.
• Include resources or materials for further study.
• Set clear expectations for future assignments.
• Balance praise with constructive criticism.
• Help students understand their progress.
• Feedback helps students learn and improve.
• Good feedback improves student satisfaction and ratings.`
      },
      {
        id: 'managing-assignments',
        title: 'Managing Assignments',
        content: `1. View all assignments in "Upload Assignment":
   - Active assignments (published)
   - Draft assignments (not yet published)
   - Completed assignments (past due date)
2. Edit assignments:
   - Update instructions or requirements
   - Modify due dates if needed
   - Add or remove files
   - Change point values
3. Monitor submissions:
   - See how many students have submitted
   - Track pending submissions
   - Identify students who haven't submitted
4. Extend deadlines if needed:
   - Select the assignment
   - Update the due date
   - Students are notified automatically
5. Archive or delete old assignments.
6. Duplicate assignments for reuse.
7. Export assignment data and grades.`
      }
    ]
  },
  {
    id: 'materials-library',
    title: 'Materials Library',
    description: 'Organize and manage your teaching materials, resources, and content.',
    icon: BookOpen,
    articles: [
      {
        id: 'uploading-materials',
        title: 'Uploading Teaching Materials',
        content: `1. Go to "Materials Library" from the sidebar.
2. Click "Upload Material" or "Add Resource".
3. Choose material type:
   - Documents (PDF, Word, PowerPoint)
   - Videos and recordings
   - Images and diagrams
   - Links to external resources
4. Upload your file or add link.
5. Add material details:
   - Title and description
   - Subject and topic
   - Tags for easy searching
   - Target audience (grade level)
6. Set material visibility:
   - Private (only you)
   - Shared with specific classes
   - Public (all your students)
7. Organize materials into folders or categories.
8. Save the material - it's now in your library.
9. Materials can be attached to classes or assignments.
10. Keep your library organized for easy access.`
      },
      {
        id: 'organizing-materials',
        title: 'Organizing Your Materials',
        content: `1. Create folders or categories:
   - By subject (Math, Science, English)
   - By topic or unit
   - By class or student level
   - By material type (notes, videos, worksheets)
2. Use tags to categorize materials:
   - Add relevant tags to each material
   - Search materials by tags
   - Filter materials by tags
3. Sort materials:
   - By date uploaded
   - By subject
   - By most used
   - Alphabetically
4. Archive old materials:
   - Move unused materials to archive
   - Keep library clean and organized
   - Restore archived materials if needed
5. Share materials:
   - Attach to specific classes
   - Share with individual students
   - Make materials public to all students
6. Update materials:
   - Edit descriptions and tags
   - Replace outdated files
   - Update links if they change`
      },
      {
        id: 'using-materials',
        title: 'Using Materials in Classes',
        content: `1. When creating or editing a class:
   - Go to class materials section
   - Click "Add from Library"
   - Select materials from your library
   - Add to the class
2. When creating assignments:
   - Attach relevant materials
   - Students can access materials while completing assignments
3. During sessions:
   - Share materials via screen share
   - Reference materials in your teaching
   - Use materials as teaching aids
4. Materials help students:
   - Review lessons after sessions
   - Prepare for assignments
   - Study independently
   - Understand concepts better
5. Keep materials updated and relevant.
6. Remove outdated materials from classes.`
      }
    ]
  },
  {
    id: 'earnings-wallet',
    title: 'Earnings & Wallet',
    description: 'Understand how you earn, manage your wallet, and withdraw funds.',
    icon: Wallet,
    articles: [
      {
        id: 'understanding-earnings',
        title: 'Understanding Your Earnings',
        content: `• You earn tokens for completed teaching sessions.
• Earnings rate: 10 tokens = $0.40 USD (approximately $0.04 per token).
• You receive 20% of the session cost (students pay 10 tokens = $1.00, you earn $0.20).
• Tokens are credited to your wallet after session completion.
• View your earnings on the dashboard:
   - Total Earnings: Cumulative earnings from all sessions
   - Wallet Balance: Current available balance
   - Pending Earnings: Earnings from sessions not yet completed
• Earnings are calculated based on actual session duration.
• You earn tokens only for completed sessions.
• Cancelled or no-show sessions don't generate earnings.
• Check your transaction history for detailed earnings breakdown.`
      },
      {
        id: 'wallet-management',
        title: 'Managing Your Wallet',
        content: `1. Go to "Wallet" from the sidebar.
2. View your wallet balance:
   - Available tokens
   - Pending earnings
   - Total earnings (all time)
3. Check transaction history:
   - Session earnings
   - Withdrawals
   - Transaction dates and amounts
4. Filter transactions by:
   - Date range
   - Transaction type
   - Amount
5. Export transaction history for tax purposes.
6. Set up withdrawal methods:
   - Bank account
   - M-Pesa (Kenya)
   - PayPal
   - Other payment methods
7. Monitor your earnings growth over time.
8. Set earnings goals and track progress.`
      },
      {
        id: 'withdrawing-funds',
        title: 'Withdrawing Your Earnings',
        content: `1. Go to "Wallet" → "Withdraw" section.
2. Ensure you have minimum withdrawal amount (check platform requirements).
3. Select your withdrawal method:
   - Bank transfer
   - M-Pesa
   - PayPal
   - Other available methods
4. Enter withdrawal amount.
5. Provide payment details:
   - Account number (for bank transfer)
   - Phone number (for M-Pesa)
   - Email (for PayPal)
6. Submit withdrawal request.
7. Wait for processing (typically 3-5 business days).
8. You'll receive notification when withdrawal is processed.
9. Check withdrawal status in transaction history.
10. Contact support if withdrawal is delayed.
11. Keep records of all withdrawals for tax purposes.`
      },
      {
        id: 'earning-more',
        title: 'Tips to Increase Your Earnings',
        content: `• Complete your profile to attract more students.
• Maintain high ratings through quality teaching.
• Respond quickly to session requests.
• Be flexible with your schedule.
• Offer multiple subjects or specialties.
• Provide excellent feedback and support.
• Build positive relationships with students.
• Encourage students to leave reviews.
• Keep your availability updated.
• Offer group classes for higher earnings.
• Create valuable assignments and materials.
• Be professional and punctual.
• Continuously improve your teaching skills.
• Market yourself through your profile and materials.`
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics & Performance',
    description: 'Track your teaching performance, student progress, and platform metrics.',
    icon: BarChart3,
    articles: [
      {
        id: 'viewing-analytics',
        title: 'Viewing Your Analytics',
        content: `1. Go to "Analytics" from the sidebar.
2. View comprehensive performance metrics:
   - Total sessions conducted
   - Total students taught
   - Average session duration
   - Total earnings and trends
   - Student retention rate
   - Assignment completion rates
   - Average student ratings
3. Analyze performance over time:
   - Daily, weekly, monthly views
   - Compare periods
   - Identify trends
4. View subject-specific analytics:
   - Performance by subject
   - Popular subjects
   - Earnings by subject
5. Check student engagement metrics:
   - Attendance rates
   - Assignment submissions
   - Student progress
6. Export analytics data for reporting.
7. Use analytics to improve your teaching.`
      },
      {
        id: 'performance-metrics',
        title: 'Understanding Performance Metrics',
        content: `• Session Metrics:
   - Total sessions: All sessions you've conducted
   - Average duration: Mean session length
   - Completion rate: Percentage of completed sessions
• Student Metrics:
   - Active students: Currently enrolled students
   - Total students: All students you've taught
   - Retention rate: Students who return for more sessions
• Earnings Metrics:
   - Total earnings: Cumulative income
   - Average per session: Mean earnings per session
   - Monthly earnings: Earnings by month
• Rating Metrics:
   - Average rating: Overall student rating
   - Total reviews: Number of student reviews
   - Rating trends: Rating changes over time
• Engagement Metrics:
   - Assignment completion: Percentage of completed assignments
   - Student participation: Active engagement in classes
   - Material usage: How often students access materials`
      },
      {
        id: 'improving-performance',
        title: 'Improving Your Performance',
        content: `1. Review your analytics regularly.
2. Identify areas for improvement:
   - Low-rated aspects
   - Declining metrics
   - Student feedback patterns
3. Set performance goals:
   - Target number of sessions
   - Earnings goals
   - Rating improvement goals
4. Take action based on data:
   - Adjust teaching methods
   - Improve materials
   - Enhance communication
5. Monitor progress toward goals.
6. Seek feedback from students.
7. Continuously learn and adapt.
8. Use analytics to make data-driven decisions.
9. Celebrate improvements and milestones.
10. Share success stories to attract more students.`
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Learn how to communicate with students, parents, and manage messages.',
    icon: MessageSquare,
    articles: [
      {
        id: 'messaging-students',
        title: 'Messaging Students',
        content: `1. Go to "Messages" from the sidebar.
2. View all your conversations:
   - With students
   - With parents (if applicable)
   - Group conversations
3. Select a conversation to view messages.
4. Send messages:
   - Type your message
   - Attach files if needed
   - Send immediately or schedule
5. Use messages for:
   - Answering questions
   - Providing feedback
   - Sharing resources
   - Scheduling discussions
   - Sending reminders
6. Organize conversations:
   - Mark as read/unread
   - Archive old conversations
   - Search for specific messages
7. Respond promptly to maintain good ratings.
8. Be professional and clear in communications.`
      },
      {
        id: 'notifications',
        title: 'Managing Notifications',
        content: `• Receive notifications for:
   - New session requests
   - Student messages
   - Assignment submissions
   - Session reminders
   - Payment updates
   - Platform announcements
• View notifications in the bell icon at top right.
• Configure notification preferences in Settings:
   - Email notifications
   - In-app notifications
   - Push notifications (if using mobile app)
   - Notification frequency
• Mark notifications as read.
• Set quiet hours to avoid notifications.
• Customize which notifications you receive.
• Stay updated without being overwhelmed.
• Respond to important notifications promptly.`
      },
      {
        id: 'student-communication',
        title: 'Best Practices for Student Communication',
        content: `• Respond to messages within 24 hours.
• Be clear and concise in your messages.
• Use professional but friendly language.
• Provide helpful and constructive responses.
• Share relevant resources and materials.
• Set clear expectations for communication.
• Be available for questions and support.
• Encourage student engagement.
• Provide regular updates on progress.
• Celebrate student achievements.
• Address concerns promptly and professionally.
• Maintain appropriate boundaries.
• Good communication improves student satisfaction.`
      }
    ]
  },
  {
    id: 'account-settings',
    title: 'Account Settings',
    description: 'Manage your profile, preferences, and account configuration.',
    icon: Settings,
    articles: [
      {
        id: 'profile-settings',
        title: 'Profile Settings',
        content: `1. Go to Settings from the sidebar.
2. Update your profile:
   - Personal information (name, email, phone)
   - Profile and cover images
   - Bio and teaching philosophy
   - Education and certifications
   - Languages and specialties
3. Manage your subjects:
   - Add or remove subjects
   - Set proficiency levels
   - Update subject descriptions
4. Configure teaching preferences:
   - Hourly rate and currency
   - Availability schedule
   - Preferred class duration
   - Maximum students per class
5. Update social links and contact information.
6. Save changes - profile updates are visible to students.
7. Keep your profile current and accurate.`
      },
      {
        id: 'preferences',
        title: 'Teaching Preferences',
        content: `1. Go to Settings → Preferences.
2. Set availability:
   - Working hours
   - Days of week available
   - Time zone
   - Vacation mode
3. Configure class settings:
   - Auto-accept bookings (yes/no)
   - Require student approval
   - Maximum students per class
   - Preferred class duration
4. Set notification preferences:
   - Email notifications
   - In-app notifications
   - Notification frequency
5. Manage privacy settings:
   - Profile visibility
   - Show contact information
   - Show social links
   - Online status visibility
6. Save preferences - they affect how students interact with you.
7. Review and update preferences regularly.`
      },
      {
        id: 'security',
        title: 'Account Security',
        content: `1. Go to Settings → Security.
2. Change your password regularly.
3. Enable two-factor authentication if available.
4. Review your login history.
5. Log out of all devices if needed.
6. Keep your account information secure.
7. Don't share your login credentials.
8. Report suspicious activity immediately.
9. Use strong, unique passwords.
10. Update security settings regularly.
11. Be cautious with third-party integrations.
12. Protect your personal and financial information.`
      },
      {
        id: 'verification',
        title: 'Teacher Verification',
        content: `1. Complete your profile with accurate information.
2. Upload verification documents:
   - Educational certificates
   - Teaching licenses
   - Professional certifications
   - Identity verification
3. Submit documents for review.
4. Wait for verification approval (typically 1-3 business days).
5. Verified teachers get:
   - Verification badge on profile
   - Increased visibility
   - Higher trust from students
   - Priority in search results
6. Keep verification documents updated.
7. Contact support if verification is delayed.
8. Maintain verified status by keeping profile current.`
      }
    ]
  }
];

export function TeacherHelpSupport({ onBack }: TeacherHelpSupportProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filteredSections = helpSections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.articles.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
    setExpandedArticle(null);
  };

  const toggleArticle = (articleId: string) => {
    setExpandedArticle(expandedArticle === articleId ? null : articleId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Help & Support</h1>
          <p className="text-slate-600">Find answers to common questions and learn how to use SomaTogether.ai</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Help Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          
          return (
            <Card key={section.id} className="overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 p-6 space-y-3">
                  {section.articles.length === 0 ? (
                    <p className="text-gray-600 text-sm">No articles found matching your search.</p>
                  ) : (
                    section.articles.map((article) => {
                      const isArticleExpanded = expandedArticle === article.id;
                      return (
                        <div key={article.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleArticle(article.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-gray-900">{article.title}</span>
                            {isArticleExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          {isArticleExpanded && (
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                              <div className="text-sm text-gray-700 whitespace-pre-line">
                                {article.content}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Contact & Additional Support */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <div className="flex items-center space-x-3 mb-4">
          <HelpCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Need More Help?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Call Us</p>
                <p className="text-sm text-gray-600">0790046062 / 0725907099</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">somatogether25@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Live Chat</p>
                <p className="text-sm text-gray-600">Available Mon–Fri, 8:00am–6:00pm</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Video className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Video Tutorials</p>
                <a 
                  href="https://youtube.com/@SomaTogetherAcademy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline flex items-center"
                >
                  Visit our YouTube channel <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">FAQ & Guides</p>
                <a 
                  href="https://somatogether.ai/help-center" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline flex items-center"
                >
                  somatogether.ai/help-center <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

