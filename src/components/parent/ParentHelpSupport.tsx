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
  BarChart3, 
  Settings, 
  MessageSquare,
  Phone,
  Mail,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search
} from 'lucide-react';
import { Input } from '../ui/input';

interface ParentHelpSupportProps {
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
    description: 'Learn the basics of using SomaTogether.ai to get the most out of your experience.',
    icon: BookOpen,
    articles: [
      {
        id: 'add-child',
        title: 'How to Add a Child',
        content: `1. Go to "Your Children" → click Add Child.
2. Enter the child\'s full name and email, then click Add Child.
3. Your child will receive an email invitation to join the learning platform.
4. Once accepted, their profile will appear in your dashboard.`
      },
      {
        id: 'setup-account',
        title: 'Setting Up Your Account',
        content: `1. Click your profile icon → Settings.
2. Update your name, email, and password.
3. Adjust notification preferences for messages and progress reports.
4. Ensure your payment details are up to date for session billing.`
      },
      {
        id: 'understanding-dashboard',
        title: 'Understanding the Dashboard',
        content: `• The top stats cards show teachers, progress, hours, and payments.
• The sidebar gives quick access to key sections (Progress, Teachers, Reports, etc.).
• The "Add Child" section helps you register children under your account.
• The Help icon (❓) provides instant access to tutorials and support.`
      },
      {
        id: 'navigating-platform',
        title: 'Navigating the Platform',
        content: `• Use the sidebar to move between features.
• Use the search bar to find teachers, classes, or reports.
• The top-right icons give quick access to help, messages, and notifications.`
      }
    ]
  },
  {
    id: 'managing-children',
    title: 'Managing Children',
    description: 'Learn how to add, edit, and monitor your children\'s progress.',
    icon: Users,
    articles: [
      {
        id: 'adding-multiple',
        title: 'Adding Multiple Children',
        content: `1. Repeat the "Add Child" process for each new learner.
2. Each child will get their own personalized dashboard.`
      },
      {
        id: 'managing-permissions',
        title: 'Managing Permissions',
        content: `1. Access child settings from their profile card in the Child Progress section.
2. Control who can view your child's progress reports and academic data.
3. Manage communication permissions - decide which teachers can contact your child.
4. Set visibility preferences for your child's profile information.
5. Control data sharing with teachers and administrators.
6. Review and update permissions regularly as your child grows.`
      },
      {
        id: 'viewing-progress',
        title: 'Viewing Progress Reports',
        content: `1. Navigate to Child Progress from the sidebar or dashboard.
2. Select a child from the list to view their detailed progress.
3. Review performance charts showing progress over time.
4. Check learning milestones and achievements.
5. View subject-specific metrics and grades.
6. See attendance records and session completion rates.
7. Review assignment completion and submission rates.
8. Monitor study hours and time spent learning.
9. Access detailed reports by clicking "View Details" on any child card.
10. Export reports for offline viewing or sharing with other family members.`
      },
      {
        id: 'parental-controls',
        title: 'Setting Parental Controls',
        content: `1. Go to Settings from the sidebar.
2. Navigate to the Privacy or Parental Controls section.
3. Set profile visibility preferences for your children.
4. Control what information is shared with teachers.
5. Manage communication settings for your children.
6. Review and approve teacher communications if needed.
7. Set preferences for progress report sharing.
8. Control data sharing with platform administrators.
Note: Some advanced parental control features may be available in future updates.`
      }
    ]
  },
  {
    id: 'payments-billing',
    title: 'Payments & Billing',
    description: 'Manage payment options, view invoices, and understand your subscription.',
    icon: CreditCard,
    articles: [
      {
        id: 'payment-methods',
        title: 'Payment Methods',
        content: `• Supported: M-Pesa, Credit/Debit Cards, and PayPal.
• Add or update methods in Settings → Billing.`
      },
      {
        id: 'billing-history',
        title: 'Viewing Billing History',
        content: `1. Go to Payment History from the sidebar or dashboard.
2. View all past transactions including:
   - Token purchases and top-ups
   - Session payments and charges
   - Refunds and credits
   - Transaction dates and amounts
3. Filter transactions by date range, type, or amount.
4. Download receipts for your records.
5. View transaction details including:
   - Payment method used
   - Transaction ID
   - Status (completed, pending, failed)
   - Related sessions or services
6. Export billing history as CSV or PDF.
7. Contact support if you notice any discrepancies.
8. Set up payment method preferences for faster checkout.`
      },
      {
        id: 'understanding-charges',
        title: 'Understanding Charges',
        content: `• Your children use tokens to book sessions with teachers.
• Each session request costs 10 tokens (approximately $1.00 USD).
• Tokens are deducted when a session request is sent.
• If a teacher declines a request, tokens are automatically refunded.
• Tokens are only deducted after a completed Zoom class session.
• Teachers receive 20% of the session cost (approximately $0.20 per $1.00 session).
• You can purchase tokens in packages: Starter (250 tokens), Popular (550 tokens), Premium (1200 tokens), or Family (2500 tokens).
• View all charges in your Payment History section.
• Monthly spending is tracked and displayed on your dashboard.`
      },
      {
        id: 'refund-policy',
        title: 'Refund Policy',
        content: `• Refunds can be requested for unused tokens within 7 days.
• Contact support with your transaction ID for review.`
      }
    ]
  },
  {
    id: 'progress-tracking',
    title: 'Progress Tracking',
    description: 'Keep an eye on your child\'s academic journey.',
    icon: BarChart3,
    articles: [
      {
        id: 'reading-reports',
        title: 'Reading Progress Reports',
        content: `1. Access reports through Child Progress → select a child → Reports tab.
2. View comprehensive analytics on your child's learning journey.
3. Check learning speed metrics showing progress over time.
4. Review comprehension scores from assignments and assessments.
5. Monitor consistency in attendance and assignment completion.
6. See subject-specific performance breakdowns.
7. View grade trends and improvements.
8. Check session attendance rates and participation.
9. Review teacher feedback and recommendations.
10. Export reports as PDF for record-keeping.
11. Compare performance across different time periods.
12. Identify areas where your child excels or needs more support.`
      },
      {
        id: 'understanding-metrics',
        title: 'Understanding Metrics',
        content: `• "Active Teachers" - Number of teachers currently working with your children.
• "Overall Progress" - Average performance percentage across all subjects and activities.
• "Hours This Week" - Total study time logged by your children in the current week.
• "This Month" - Total amount spent on sessions and learning activities this month.
• "Total Sessions" - Number of completed learning sessions.
• "Study Hours" - Cumulative hours spent in learning sessions.
• "Assignments Completed" - Number of assignments finished vs. total assigned.
• "Average Grades" - Mean grade across all subjects and assignments.
• "Amount Spent" - Total money spent on tokens and sessions.
• Progress percentages are calculated based on completed activities, assignments, and session attendance.
• Metrics update in real-time as your children complete activities.`
      },
      {
        id: 'setting-goals',
        title: 'Setting Goals',
        content: `1. Navigate to Child Progress → select a child.
2. Look for the "Goals" or "Learning Goals" section.
3. Define specific learning goals for each subject or skill area.
4. Set target completion dates for each goal.
5. Monitor progress toward goals in the progress dashboard.
6. Review goal completion rates and achievements.
7. Adjust goals as your child progresses or needs change.
8. Celebrate milestones when goals are achieved.
9. Work with teachers to align goals with their teaching plans.
Note: Goal-setting features may vary based on your child's education level and teacher preferences.`
      },
      {
        id: 'tracking-milestones',
        title: 'Tracking Milestones',
        content: `• Milestones are automatically tracked as your children complete activities.
• Common milestones include:
  - First session completed
  - First assignment submitted
  - First assignment graded
  - 10 sessions completed
  - 50 sessions completed
  - Perfect attendance week
  - Subject mastery achievements
• View milestones in the Child Progress section.
• Milestone summaries appear in your dashboard weekly.
• Celebrate achievements with your children to encourage continued learning.
• Milestones help track long-term progress and engagement.
• Some milestones may unlock special features or recognition badges.`
      }
    ]
  },
  {
    id: 'account-settings',
    title: 'Account Settings',
    description: 'Control your personal preferences and privacy.',
    icon: Settings,
    articles: [
      {
        id: 'update-profile',
        title: 'Update Profile Information',
        content: `1. Go to Settings from the sidebar.
2. Click on the "Profile" section.
3. Update your full name, email address, and phone number.
4. Upload or change your profile picture.
5. Add or update your location and timezone.
6. Update your bio or personal information.
7. Save your changes - they will be updated immediately.
8. Your profile information is used for account verification and communication.
9. Keep your contact information up to date to receive important notifications.`
      },
      {
        id: 'notification-settings',
        title: 'Notification Settings',
        content: `1. Go to Settings → Notifications section.
2. Enable or disable email notifications for:
   - New messages from teachers
   - Progress reports and updates
   - Session confirmations and reminders
   - Assignment grades and feedback
   - Weekly progress summaries
3. Control in-app notification preferences.
4. Set preferences for push notifications (if using mobile app).
5. Choose notification frequency (immediate, daily digest, weekly summary).
6. Manage SMS notifications if enabled.
7. Set quiet hours to avoid notifications during specific times.
8. Customize which types of notifications you want to receive.
9. Test notification settings to ensure they're working correctly.`
      },
      {
        id: 'privacy-controls',
        title: 'Privacy Controls',
        content: `1. Go to Settings → Privacy section.
2. Control profile visibility - choose who can see your profile information.
3. Manage data sharing with teachers - decide what information teachers can access.
4. Control data sharing with administrators for platform improvement.
5. Set preferences for progress report sharing.
6. Manage online status visibility.
7. Control who can contact you through the platform.
8. Review and manage connected accounts or linked services.
9. Set preferences for anonymous usage data sharing.
10. Export your data if needed for your records.
11. Review privacy policy and terms of service regularly.`
      },
      {
        id: 'security-options',
        title: 'Security Options',
        content: `1. Change password or enable 2-step verification.
2. Log out of all devices to secure your account.`
      }
    ]
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Stay connected with teachers and support staff.',
    icon: MessageSquare,
    articles: [
      {
        id: 'messaging-teachers',
        title: 'Messaging Teachers',
        content: `1. Open Messages → click a teacher\'s name → start a chat.
2. Attach files or share feedback on lessons.`
      },
      {
        id: 'scheduling-meetings',
        title: 'Scheduling Meetings',
        content: `1. Go to Messages from the sidebar or dashboard.
2. Select a teacher from your conversations.
3. Click "Schedule Meeting" or use the calendar icon.
4. Choose a date and time that works for both you and the teacher.
5. Add a meeting title and description.
6. Specify the meeting duration.
7. Add any agenda items or topics to discuss.
8. Send the meeting request to the teacher.
9. Wait for the teacher to confirm the meeting time.
10. You'll receive a notification when the meeting is confirmed.
11. The meeting link (Zoom or other platform) will be shared once confirmed.
12. Add the meeting to your calendar using the provided link.
Note: Meeting scheduling may vary depending on teacher availability and preferences.`
      },
      {
        id: 'feedback-system',
        title: 'Feedback System',
        content: `• After each session, you can rate teachers and leave feedback.
• Feedback helps improve personalized learning experiences.`
      },
      {
        id: 'parent-community',
        title: 'Parent Community',
        content: `• Connect with other parents using the platform.
• Share learning strategies and tips for supporting your children.
• Get advice from experienced parents.
• Discuss common challenges and solutions.
• Stay updated on platform features and improvements.
• Participate in parent workshops and webinars (when available).
• Access community resources and educational materials.
• Build a network of supportive parents.
Note: Community features may be available through messaging, future forum integration, or scheduled community events. Check your notifications for community updates.`
      }
    ]
  }
];

export function ParentHelpSupport({ onBack }: ParentHelpSupportProps) {
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
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-6 w-6 text-purple-600" />
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
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center space-x-3 mb-4">
          <HelpCircle className="h-6 w-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Need More Help?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Call Us</p>
                <p className="text-sm text-gray-600">0790046062 / 0725907099</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">somatogether25@gmail.com</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Live Chat</p>
                <p className="text-sm text-gray-600">Available Mon–Fri, 8:00am–6:00pm</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Video className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Video Tutorials</p>
                <a 
                  href="https://youtube.com/@SomaTogetherAcademy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline flex items-center"
                >
                  Visit our YouTube channel <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">FAQ & Guides</p>
                <a 
                  href="https://somatogether.ai/help-center" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 hover:underline flex items-center"
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

