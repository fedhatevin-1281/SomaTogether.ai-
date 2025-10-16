import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { ArrowLeft, TrendingUp, Users, Clock, Star, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import TeacherAnalyticsService, { TeacherAnalyticsData } from '../../services/teacherAnalyticsService';

interface TeacherAnalyticsProps {
  onBack: () => void;
}

export function TeacherAnalytics({ onBack }: TeacherAnalyticsProps) {
  const { profile } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<TeacherAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!profile?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await TeacherAnalyticsService.getTeacherAnalytics(profile.id);
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [profile?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-slate-600">Track your teaching performance and student progress</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-slate-600">Track your teaching performance and student progress</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading analytics: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-slate-600">Track your teaching performance and student progress</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-slate-600">Track your teaching performance and student progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Students</p>
              <p className="text-2xl font-bold">{analyticsData.totalStudents}</p>
              <p className="text-xs text-blue-600">Active students</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Success Rate</p>
              <p className="text-2xl font-bold">{analyticsData.successRate.toFixed(1)}%</p>
              <p className="text-xs text-green-600">Session completion</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Average Rating</p>
              <p className="text-2xl font-bold">{analyticsData.averageRating.toFixed(1)}</p>
              <p className="text-xs text-purple-600">Based on {analyticsData.recentReviews.length} reviews</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Earnings</p>
              <p className="text-2xl font-bold">{formatCurrency(analyticsData.totalEarnings)}</p>
              <p className="text-xs text-orange-600">Lifetime</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Student Progress</h3>
          <div className="space-y-4">
            {analyticsData.studentProgress.length > 0 ? (
              analyticsData.studentProgress.slice(0, 4).map((student) => (
                <div key={student.student_id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{student.student_name}</span>
                    <span className="text-green-600">+{student.improvement}%</span>
                  </div>
                  <Progress value={student.progress} className="h-2" />
                  <div className="text-xs text-slate-500">
                    {student.total_sessions} sessions
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No student progress data available</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Monthly Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Sessions Completed</span>
              <span className="font-medium">{analyticsData.monthlyPerformance.sessionsCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">On-time Rate</span>
              <span className="font-medium">{analyticsData.monthlyPerformance.onTimeRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Student Satisfaction</span>
              <span className="font-medium">{analyticsData.monthlyPerformance.studentSatisfaction.toFixed(1)}/5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Response Time</span>
              <span className="font-medium">&lt; {analyticsData.monthlyPerformance.responseTime} hours</span>
            </div>
          </div>
        </Card>
      </div>

      {analyticsData.recentReviews.length > 0 && (
        <Card className="p-6">
          <h3 className="font-bold mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {analyticsData.recentReviews.map((review) => (
              <div key={review.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{review.student_name}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}