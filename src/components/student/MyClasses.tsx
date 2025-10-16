import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

import { 
  ArrowLeft, 
  Play, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Star,
  Video,
  Download,
  MoreVertical,
  BookOpen
} from 'lucide-react';

interface MyClassesProps {
  onScreenChange: (screen: string) => void;
}

interface ClassData {
  id: string;
  title: string;
  subject: string;
  teacher_name: string;
  teacher_image?: string;
  progress: number;
  total_sessions: number;
  completed_sessions: number;
  next_session?: string;
  status: string;
  hourly_rate: number;
  currency: string;
  start_date: string;
  description?: string;
  materials_count?: number;
  assignments_count?: number;
}

interface SessionData {
  id: string;
  class_id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  meeting_url?: string;
}

export function MyClasses({ onScreenChange }: MyClassesProps) {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [activeClasses, setActiveClasses] = useState<ClassData[]>([]);
  const [completedClasses, setCompletedClasses] = useState<ClassData[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    if (user) {
      fetchClassesData();
    }
  }, [user]);

  const fetchClassesData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchActiveClasses(),
        fetchCompletedClasses(),
        fetchUpcomingSessions()
      ]);
    } catch (error) {
      console.error('Error fetching classes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveClasses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          title,
          description,
          hourly_rate,
          currency,
          status,
          start_date,
          completed_sessions,
          subjects (
            name
          ),
          teachers!teacher_id (
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active classes:', error);
        return;
      }

      const classesData: ClassData[] = (data || []).map(cls => ({
        id: cls.id,
        title: cls.title,
        subject: cls.subjects?.name || 'Unknown Subject',
        teacher_name: cls.teachers?.profiles?.full_name || 'Unknown Teacher',
        teacher_image: cls.teachers?.profiles?.avatar_url,
        progress: Math.min(100, Math.round((cls.completed_sessions / 12) * 100)), // Assuming 12 sessions per class
        total_sessions: 12, // Default assumption
        completed_sessions: cls.completed_sessions,
        status: cls.status,
        hourly_rate: cls.hourly_rate,
        currency: cls.currency,
        start_date: cls.start_date,
        description: cls.description
      }));

      setActiveClasses(classesData);
    } catch (error) {
      console.error('Error fetching active classes:', error);
    }
  };

  const fetchCompletedClasses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          title,
          description,
          hourly_rate,
          currency,
          status,
          start_date,
          completed_sessions,
          subjects (
            name
          ),
          teachers!teacher_id (
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed classes:', error);
        return;
      }

      const classesData: ClassData[] = (data || []).map(cls => ({
        id: cls.id,
        title: cls.title,
        subject: cls.subjects?.name || 'Unknown Subject',
        teacher_name: cls.teachers?.profiles?.full_name || 'Unknown Teacher',
        teacher_image: cls.teachers?.profiles?.avatar_url,
        progress: 100,
        total_sessions: 12,
        completed_sessions: cls.completed_sessions,
        status: cls.status,
        hourly_rate: cls.hourly_rate,
        currency: cls.currency,
        start_date: cls.start_date,
        description: cls.description
      }));

      setCompletedClasses(classesData);
    } catch (error) {
      console.error('Error fetching completed classes:', error);
    }
  };

  const fetchUpcomingSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          id,
          class_id,
          title,
          scheduled_start,
          scheduled_end,
          status,
          meeting_url
        `)
        .eq('student_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching upcoming sessions:', error);
        return;
      }

      const sessionsData: SessionData[] = (data || []).map(session => ({
        id: session.id,
        class_id: session.class_id,
        title: session.title,
        scheduled_start: session.scheduled_start,
        scheduled_end: session.scheduled_end,
        status: session.status,
        meeting_url: session.meeting_url
      }));

      setUpcomingSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Starting soon';
    if (diffInHours < 24) return `In ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `In ${diffInDays}d`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => onScreenChange('dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Classes</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  const renderClassCard = (classItem: ClassData) => (
    <Card key={classItem.id} className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <img
            src={classItem.teacher_image || '/default-avatar.png'}
            alt={classItem.teacher_name}
            className="w-12 h-12 rounded-full object-cover bg-slate-200"
          />
          <div>
            <h3 className="text-lg font-semibold">{classItem.title}</h3>
            <p className="text-slate-600">{classItem.subject}</p>
            <p className="text-sm text-slate-500">with {classItem.teacher_name}</p>
          </div>
        </div>
        <Badge className={classItem.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
          {classItem.status}
        </Badge>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Progress</span>
          <span>{classItem.completed_sessions}/{classItem.total_sessions} sessions</span>
        </div>
        <Progress value={classItem.progress} className="h-2" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">{classItem.completed_sessions}</div>
          <div className="text-xs text-slate-600">Sessions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{classItem.materials_count || 0}</div>
          <div className="text-xs text-slate-600">Materials</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">{classItem.assignments_count || 0}</div>
          <div className="text-xs text-slate-600">Assignments</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-orange-600">${classItem.hourly_rate}</div>
          <div className="text-xs text-slate-600">Per Hour</div>
        </div>
      </div>

      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="flex-1">
          <MessageSquare className="w-4 h-4 mr-2" />
          Message
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <FileText className="w-4 h-4 mr-2" />
          Materials
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Play className="w-4 h-4 mr-2" />
          Join
        </Button>
      </div>
    </Card>
  );

  const renderUpcomingSession = (session: SessionData) => (
    <Card key={session.id} className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{session.title}</h4>
          <p className="text-sm text-slate-600">{formatDate(session.scheduled_start)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-100 text-blue-800">
            {formatTimeAgo(session.scheduled_start)}
          </Badge>
          <Button size="sm" variant="outline">
            <Video className="w-4 h-4 mr-2" />
            Join
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => onScreenChange('dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">My Classes</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{activeClasses.length}</div>
          <div className="text-sm text-slate-600">Active Classes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedClasses.length}</div>
          <div className="text-sm text-slate-600">Completed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{upcomingSessions.length}</div>
          <div className="text-sm text-slate-600">Upcoming Sessions</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {activeClasses.reduce((sum, cls) => sum + cls.completed_sessions, 0)}
          </div>
          <div className="text-sm text-slate-600">Total Sessions</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active Classes</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-6">
              {activeClasses.length > 0 ? (
                activeClasses.map(renderClassCard)
              ) : (
                <Card className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium mb-2">No Active Classes</h3>
                  <p className="text-slate-600 mb-4">Start your learning journey by finding a teacher</p>
                  <Button onClick={() => onScreenChange('browse-teachers')}>
                    Browse Teachers
                  </Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {completedClasses.length > 0 ? (
                completedClasses.map(renderClassCard)
              ) : (
                <Card className="p-12 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium mb-2">No Completed Classes</h3>
                  <p className="text-slate-600">Your completed classes will appear here</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Upcoming Sessions
            </h3>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map(renderUpcomingSession)}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No upcoming sessions</p>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={() => onScreenChange('browse-teachers')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Find New Teachers
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onScreenChange('assignments')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Assignments
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onScreenChange('messages')}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}