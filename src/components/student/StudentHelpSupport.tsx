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
  Bot,
  Calendar
} from 'lucide-react';
import { Input } from '../ui/input';

interface StudentHelpSupportProps {
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
    description: 'Learn the basics of using SomaTogether.ai to start your learning journey.',
    icon: BookOpen,
    articles: [
      {
        id: 'understanding-dashboard',
        title: 'Understanding Your Dashboard',
        content: `• The top stats show your wallet balance, tokens, classes, and assignments.
• Quick action buttons let you browse teachers, view classes, check assignments, and access your wallet.
• Recent activity shows your latest learning progress and notifications.
• Upcoming sessions display your scheduled classes with teachers.`
      },
      {
        id: 'setting-up-profile',
        title: 'Setting Up Your Profile',
        content: `1. Click your profile icon → Settings.
2. Update your name, email, and profile picture.
3. Add your education level, school, and learning interests.
4. Set your learning goals and preferred subjects.
5. Adjust notification preferences for classes and assignments.`
      },
      {
        id: 'navigating-platform',
        title: 'Navigating the Platform',
        content: `• Use the sidebar to move between Dashboard, Browse Teachers, My Classes, Assignments, and more.
• The top-right icons give quick access to messages, notifications, and your profile.
• The AI Assistant button provides instant help with questions.
• Search functionality helps you find teachers, classes, or assignments quickly.`
      },
      {
        id: 'first-steps',
        title: 'Your First Steps',
        content: `1. Complete your profile setup in Settings.
2. Browse available teachers and find one that matches your learning needs.
3. Book your first session by sending a session request.
4. Top up your wallet with tokens to pay for sessions.
5. Attend your scheduled classes and complete assignments.`
      }
    ]
  },
  {
    id: 'finding-teachers',
    title: 'Finding & Booking Teachers',
    description: 'Learn how to discover teachers, view profiles, and book learning sessions.',
    icon: Users,
    articles: [
      {
        id: 'browsing-teachers',
        title: 'How to Browse Teachers',
        content: `1. Go to "Browse Teachers" from the sidebar or dashboard.
2. Use filters to search by subject, rating, price, or availability.
3. Click on a teacher card to view their full profile.
4. Read reviews and check their teaching experience.
5. View their specialties, certifications, and teaching philosophy.`
      },
      {
        id: 'viewing-teacher-profile',
        title: 'Viewing Teacher Profiles',
        content: `• Click "View Profile" on any teacher card to see expanded details.
• View their subjects, curriculums, education background, and certifications.
• Check their ratings, reviews, and total sessions completed.
• See their availability status and preferred class duration.
• Review their teaching philosophy and specialties.`
      },
      {
        id: 'booking-session',
        title: 'Booking a Session',
        content: `1. Find a teacher you want to learn from.
2. Click "Send request" on their profile card.
3. Select your preferred date and time for the session.
4. Add any special requests or learning goals in the message field.
5. Confirm the request (10 tokens will be deducted).
6. Wait for the teacher to accept your request.
7. You'll receive a notification once the session is confirmed.`
      },
      {
        id: 'session-requests',
        title: 'Managing Session Requests',
        content: `• View all your session requests in the Messages section under "Requests" tab.
• Pending requests show as "Waiting for teacher response" - teachers have up to 7 days to respond.
• Accepted requests appear in your "Upcoming Sessions" on the dashboard.
• Once accepted, you'll receive a notification with session details and Zoom link.
• Declined requests will have your 10 tokens automatically refunded within 24 hours.
• You can cancel requests before they're accepted to get an immediate refund.
• Expired requests (after 7 days) are automatically cancelled and tokens refunded.
• Check request status regularly to stay updated.
• Contact support if you don't receive a refund after a declined request.`
      }
    ]
  },
  {
    id: 'managing-classes',
    title: 'Managing Classes',
    description: 'Learn how to attend classes, track progress, and manage your learning schedule.',
    icon: Calendar,
    articles: [
      {
        id: 'viewing-classes',
        title: 'Viewing Your Classes',
        content: `1. Go to "My Classes" from the sidebar or dashboard.
2. See all your active classes with teachers.
3. View class schedules, subjects, and progress.
4. Access class materials and resources.
5. Check your attendance and participation records.`
      },
      {
        id: 'attending-sessions',
        title: 'Attending Live Sessions',
        content: `• Join sessions on time using the Zoom link provided in your session confirmation.
• The Zoom link is sent via notification when your request is accepted.
• Ensure you have a stable internet connection (minimum 1 Mbps recommended).
• Test your audio and video before joining the session.
• Have your materials, notes, and assignments ready beforehand.
• Find a quiet, well-lit space for the session.
• Participate actively in discussions and activities.
• Ask questions and engage with your teacher throughout the session.
• Complete any in-session assignments or quizzes.
• Take notes during the session for later review.
• The session duration is tracked automatically - tokens are deducted after completion.
• If you experience technical issues, contact support immediately.`
      },
      {
        id: 'class-materials',
        title: 'Accessing Class Materials',
        content: `1. Go to "My Classes" from the sidebar or dashboard.
2. Select a class from your active classes list.
3. Navigate to the "Materials" or "Resources" section.
4. Download notes, presentations, PDFs, or study guides.
5. Access recorded sessions if your teacher has enabled recording.
6. Review homework and assignment instructions.
7. Check additional resources recommended by your teacher.
8. View shared documents, links, and educational content.
9. Organize materials by subject or date for easy access.
10. Some materials may require teacher approval before access.
11. Materials are typically available for the duration of your class enrollment.`
      },
      {
        id: 'tracking-progress',
        title: 'Tracking Your Progress',
        content: `• View your overall progress in each subject.
• Check completion rates for classes and assignments.
• Monitor your learning milestones and achievements.
• Review performance metrics and grades.
• See your study hours and session history.
• Track improvements over time.`
      }
    ]
  },
  {
    id: 'assignments',
    title: 'Assignments & Submissions',
    description: 'Learn how to view, complete, and submit assignments from your teachers.',
    icon: FileText,
    articles: [
      {
        id: 'viewing-assignments',
        title: 'Viewing Your Assignments',
        content: `1. Go to "Assignments" from the sidebar or dashboard.
2. See all assignments organized by due date.
3. Filter by subject, status (pending, submitted, graded), or class.
4. Click on an assignment to view full details.
5. Check instructions, requirements, and grading criteria.
6. Note the due date and submission format.`
      },
      {
        id: 'completing-assignments',
        title: 'Completing Assignments',
        content: `1. Read all instructions carefully - check the assignment details page.
2. Review class materials, notes, and any provided resources.
3. Understand the grading criteria and point distribution.
4. Complete the work according to all requirements.
5. Double-check your answers, spelling, and grammar.
6. Ensure proper formatting (font, spacing, margins).
7. Save your work in the required format:
   - PDF (recommended for most assignments)
   - Word document (.docx)
   - Text file (.txt)
   - Images (.jpg, .png) for visual assignments
8. Ensure you meet word count, page count, or other specified requirements.
9. Include your name, date, and assignment title if required.
10. Review the submission guidelines before uploading.
11. Keep a backup copy of your work.`
      },
      {
        id: 'submitting-assignments',
        title: 'Submitting Assignments',
        content: `1. Go to the Assignments section and click on the assignment.
2. Review the assignment details and requirements one more time.
3. Click "Submit Assignment" or "Upload File" button.
4. Select your completed work file from your device.
5. Wait for the file to upload completely (check upload progress).
6. Add any additional notes or comments if the teacher requested them.
7. Review your submission - ensure the correct file is attached.
8. Click "Confirm Submission" to finalize.
9. Submit before the due date to avoid late penalties or point deductions.
10. You'll receive a confirmation notification once submitted successfully.
11. You can view your submitted file after submission.
12. Note: Some assignments may not allow resubmission after the due date.
13. Contact your teacher if you need to submit late due to extenuating circumstances.`
      },
      {
        id: 'viewing-grades',
        title: 'Viewing Grades & Feedback',
        content: `• Check your grades in the Assignments section.
• Graded assignments show your score and teacher feedback.
• Review comments and suggestions for improvement.
• See which questions you got right or wrong.
• Track your average grade across all subjects.
• Use feedback to improve future assignments.`
      }
    ]
  },
  {
    id: 'wallet-tokens',
    title: 'Wallet & Tokens',
    description: 'Understand how to manage your wallet, purchase tokens, and pay for sessions.',
    icon: Wallet,
    articles: [
      {
        id: 'understanding-tokens',
        title: 'Understanding Tokens',
        content: `• Tokens are the currency used to send session requests to teachers on SomaTogether.ai.
• Pricing: 10 tokens = $1.00 USD (1 token = $0.10 USD).
• Each session request costs 10 tokens.
• Tokens are deducted when you send a session request (not when the session happens).
• If a teacher declines your request, your 10 tokens are automatically refunded within 24 hours.
• Tokens are only deducted after a completed Zoom class session.
• You need at least 10 tokens in your wallet to send a session request.
• You can purchase tokens through M-Pesa, Credit/Debit Cards, or PayPal.
• Token packages available:
  - Starter Pack: 250 tokens for $25
  - Popular Pack: 550 tokens for $50 (includes 50 bonus tokens)
  - Premium Pack: 1200 tokens for $100 (includes 200 bonus tokens)
  - Family Pack: 2500 tokens for $200 (includes 500 bonus tokens)
• Check your token balance in your Wallet section or on the dashboard.
• View your token transaction history in the Wallet section.`
      },
      {
        id: 'purchasing-tokens',
        title: 'Purchasing Tokens',
        content: `1. Go to "Wallet" from the sidebar or dashboard.
2. Click "Add Tokens" or "Top Up".
3. Select the amount of tokens you want to purchase.
4. Choose your payment method (M-Pesa, Credit/Debit Card, PayPal).
5. Complete the payment process.
6. Your tokens will be added to your account immediately.
7. View your transaction history in the Wallet section.`
      },
      {
        id: 'payment-methods',
        title: 'Payment Methods',
        content: `• M-Pesa: Mobile money payment (Kenya).
• Credit/Debit Cards: Visa, Mastercard, and other major cards.
• PayPal: International payment option.
• All transactions are secure and encrypted.
• Payment receipts are available in your transaction history.
• Contact support if you encounter payment issues.`
      },
      {
        id: 'managing-wallet',
        title: 'Managing Your Wallet',
        content: `• View your current token balance and wallet balance.
• Check your transaction history for all purchases and spending.
• See pending transactions and refunds.
• Monitor token usage for session bookings.
• Set up payment methods for faster checkout.
• Enable notifications for low token balance.`
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Learn how to message teachers, get help, and stay connected.',
    icon: MessageSquare,
    articles: [
      {
        id: 'messaging-teachers',
        title: 'Messaging Teachers',
        content: `1. Go to "Messages" from the sidebar or dashboard.
2. Select a teacher from your conversations.
3. Type your message and click send.
4. Attach files if needed (assignments, questions, etc.).
5. Teachers typically respond within 24 hours.
6. Use messages to ask questions, clarify assignments, or discuss progress.`
      },
      {
        id: 'ai-assistant',
        title: 'Using the AI Assistant',
        content: `1. Click the AI Assistant button (floating or in sidebar).
2. Ask questions about the platform, features, or your account.
3. Get instant help with navigation and troubleshooting.
4. Ask for study tips or learning strategies.
5. Get explanations of concepts or homework help.
6. The AI can guide you through platform features.`
      },
      {
        id: 'notifications',
        title: 'Managing Notifications',
        content: `• Receive notifications for new messages, assignment grades, and session confirmations.
• View notifications in the bell icon at the top right.
• Enable/disable notifications in Settings.
• Choose notification types: email, in-app, or push notifications.
• Get reminders for upcoming sessions and assignment due dates.
• Stay updated on your learning progress and achievements.`
      },
      {
        id: 'getting-help',
        title: 'Getting Help & Support',
        content: `• Use the Help & Support section for detailed guides.
• Contact support via email: somatogether25@gmail.com
• Call support: 0790046062 / 0725907099
• Use live chat during business hours (Mon-Fri, 8am-6pm).
• Watch video tutorials on our YouTube channel.
• Check the FAQ section for common questions.`
      }
    ]
  },
  {
    id: 'account-settings',
    title: 'Account Settings',
    description: 'Manage your profile, preferences, and account security.',
    icon: Settings,
    articles: [
      {
        id: 'updating-profile',
        title: 'Updating Your Profile',
        content: `1. Go to Settings from the sidebar.
2. Click on "Profile" section.
3. Update your name, email, phone number, and bio.
4. Upload or change your profile picture.
5. Add or update your education level and school.
6. Update your learning interests and goals.
7. Save your changes.`
      },
      {
        id: 'privacy-settings',
        title: 'Privacy Settings',
        content: `• Control who can see your profile information.
• Choose what data to share with teachers.
• Enable or disable profile visibility.
• Manage your online status visibility.
• Control who can contact you.
• Adjust data sharing preferences.`
      },
      {
        id: 'notification-preferences',
        title: 'Notification Preferences',
        content: `• Enable/disable email notifications.
• Control push notifications on your device.
• Set preferences for class reminders.
• Choose assignment due date reminders.
• Manage teacher message notifications.
• Enable/disable weekly progress reports.`
      },
      {
        id: 'security',
        title: 'Account Security',
        content: `• Change your password regularly.
• Enable two-factor authentication if available.
• Review your login history.
• Log out of all devices if needed.
• Report suspicious activity immediately.
• Keep your account information secure.`
      }
    ]
  }
];

export function StudentHelpSupport({ onBack }: StudentHelpSupportProps) {
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
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
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
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Need More Help?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Call Us</p>
                <p className="text-sm text-gray-600">0790046062 / 0725907099</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">somatogether25@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Live Chat</p>
                <p className="text-sm text-gray-600">Available Mon–Fri, 8:00am–6:00pm</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Video className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Video Tutorials</p>
                <a 
                  href="https://youtube.com/@SomaTogetherAcademy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  Visit our YouTube channel <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">FAQ & Guides</p>
                <a 
                  href="https://somatogether.ai/help-center" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center"
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

