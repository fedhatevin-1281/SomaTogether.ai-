import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  Star, 
  MapPin, 
  Calendar,
  MessageSquare,
  DollarSign,
  User
} from 'lucide-react';

interface StudentRequestsProps {
  onBack?: () => void;
}

interface StudentRequest {
  id: number;
  studentName: string;
  studentImage: string;
  subject: string;
  message: string;
  hourlyRate: number;
  preferredSchedule: string[];
  experience: string;
  goals: string;
  requestDate: string;
  urgency: 'low' | 'medium' | 'high';
  sessionType: 'one-time' | 'ongoing';
  studentRating?: number;
  previousTutors?: number;
}

export function StudentRequests({ onBack }: StudentRequestsProps) {
  const [selectedTab, setSelectedTab] = useState('pending');

  const pendingRequests: StudentRequest[] = [
    {
      id: 1,
      studentName: 'Alex Thompson',
      studentImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      subject: 'Advanced Calculus',
      message: 'I\'m struggling with derivatives and need help preparing for my upcoming exam. Looking for someone patient who can explain concepts clearly.',
      hourlyRate: 45,
      preferredSchedule: ['Monday 6PM', 'Wednesday 6PM', 'Friday 6PM'],
      experience: 'College Sophomore',
      goals: 'Improve grade from C+ to B+ or higher',
      requestDate: '2 hours ago',
      urgency: 'high',
      sessionType: 'ongoing',
      studentRating: 4.8,
      previousTutors: 2
    },
    {
      id: 2,
      studentName: 'Emma Rodriguez',
      studentImage: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
      subject: 'Statistics',
      message: 'Need help with probability distributions and hypothesis testing for my statistics course.',
      hourlyRate: 50,
      preferredSchedule: ['Tuesday 4PM', 'Thursday 4PM'],
      experience: 'High School Senior',
      goals: 'Understand concepts for AP Statistics exam',
      requestDate: '5 hours ago',
      urgency: 'medium',
      sessionType: 'ongoing',
      studentRating: 4.9,
      previousTutors: 1
    },
    {
      id: 3,
      studentName: 'Michael Chen',
      studentImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      subject: 'Linear Algebra',
      message: 'One-time session needed to review matrix operations before my midterm exam next week.',
      hourlyRate: 45,
      preferredSchedule: ['This weekend'],
      experience: 'College Junior',
      goals: 'Review for midterm exam',
      requestDate: '1 day ago',
      urgency: 'high',
      sessionType: 'one-time',
      studentRating: 4.7,
      previousTutors: 3
    },
    {
      id: 4,
      studentName: 'Sarah Kim',
      studentImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      subject: 'Algebra II',
      message: 'Looking for ongoing help with quadratic equations and polynomial functions.',
      hourlyRate: 40,
      preferredSchedule: ['Monday 7PM', 'Wednesday 7PM'],
      experience: 'High School Sophomore',
      goals: 'Maintain A average in class',
      requestDate: '1 day ago',
      urgency: 'low',
      sessionType: 'ongoing',
      studentRating: 4.6,
      previousTutors: 0
    },
    {
      id: 5,
      studentName: 'David Park',
      studentImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
      subject: 'Calculus BC',
      message: 'Need intensive help preparing for AP Calculus BC exam. Looking for someone experienced with AP curriculum.',
      hourlyRate: 55,
      preferredSchedule: ['Saturday mornings', 'Sunday afternoons'],
      experience: 'High School Senior',
      goals: 'Score 4 or 5 on AP exam',
      requestDate: '2 days ago',
      urgency: 'medium',
      sessionType: 'ongoing',
      studentRating: 4.9,
      previousTutors: 1
    }
  ];

  const acceptedRequests: StudentRequest[] = [
    {
      id: 6,
      studentName: 'Lisa Johnson',
      studentImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b1e0?w=150&h=150&fit=crop&crop=face',
      subject: 'Trigonometry',
      message: 'Help with trigonometric identities and applications.',
      hourlyRate: 45,
      preferredSchedule: ['Tuesday 5PM', 'Thursday 5PM'],
      experience: 'High School Junior',
      goals: 'Improve understanding of trig concepts',
      requestDate: 'Accepted 3 days ago',
      urgency: 'low',
      sessionType: 'ongoing',
      studentRating: 4.8,
      previousTutors: 1
    }
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleAcceptRequest = (requestId: number) => {
    console.log('Accepting request:', requestId);
    // Handle accept logic
  };

  const handleDeclineRequest = (requestId: number) => {
    console.log('Declining request:', requestId);
    // Handle decline logic
  };

  const renderRequestCard = (request: StudentRequest, showActions: boolean = true) => (
    <Card key={request.id} className="p-6">
      <div className="flex items-start space-x-4 mb-4">
        <img
          src={request.studentImage}
          alt={request.studentName}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg">{request.studentName}</h3>
              <p className="text-slate-600">{request.subject}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={getUrgencyColor(request.urgency)}>
                  {request.urgency} priority
                </Badge>
                <Badge variant="outline">
                  {request.sessionType}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{request.requestDate}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{request.experience}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4" />
              <span>{request.studentRating} rating</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>${request.hourlyRate}/hour</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Student Message</h4>
          <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{request.message}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Learning Goals</h4>
            <p className="text-slate-700">{request.goals}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Preferred Schedule</h4>
            <div className="flex flex-wrap gap-1">
              {request.preferredSchedule.map((slot, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {slot}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-sm text-slate-600">
            <span>Previous tutors: {request.previousTutors || 0}</span>
          </div>
          {showActions && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeclineRequest(request.id)}
              >
                <X className="h-4 w-4 mr-2" />
                Decline
              </Button>
              <Button 
                className="bg-green-500 hover:bg-green-600"
                size="sm"
                onClick={() => handleAcceptRequest(request.id)}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Requests</h1>
          <p className="text-slate-600">Review and respond to student requests</p>
        </div>
        <Badge className="bg-red-100 text-red-800">5 New</Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-slate-600">Accepted</p>
              <p className="text-2xl font-bold">{acceptedRequests.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-slate-600">Avg Rate</p>
              <p className="text-2xl font-bold">$47</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-slate-600">Match Score</p>
              <p className="text-2xl font-bold">92%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({acceptedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {pendingRequests.map((request) => renderRequestCard(request, true))}
          </div>
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          <div className="space-y-4">
            {acceptedRequests.map((request) => renderRequestCard(request, false))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}