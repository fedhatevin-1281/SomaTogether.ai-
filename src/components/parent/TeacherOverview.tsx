import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Star, MessageSquare, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { TeacherProfile } from '../../services/teacherBrowseService';
import TeacherBrowseService from '../../services/teacherBrowseService';

interface TeacherOverviewProps {
  onBack?: () => void;
}

export function TeacherOverview({ onBack }: TeacherOverviewProps) {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Import the service dynamically to avoid circular dependencies
      // Using static import instead of dynamic import
      const result = await TeacherBrowseService.getTeachers({}, 1, 10);
      setTeachers(result.teachers);
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      setError('Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teachers Overview</h1>
            <p className="text-slate-600">Meet the educators guiding your children's learning</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-2 text-slate-600">Loading teachers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teachers Overview</h1>
            <p className="text-slate-600">Meet the educators guiding your children's learning</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTeachers} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teachers Overview</h1>
          <p className="text-slate-600">Meet the educators guiding your children's learning</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          {teachers.length} Active Teachers
        </Badge>
      </div>

      {teachers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 mb-4">No teachers available at the moment.</p>
          <Button onClick={fetchTeachers} variant="outline">
            Refresh
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Teacher Info */}
                <div className="lg:col-span-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={teacher.avatar_url || '/default-avatar.png'}
                      alt={teacher.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{teacher.full_name}</h3>
                      <p className="text-slate-600">
                        {teacher.subjects.length > 0 ? teacher.subjects.join(', ') : 'General Tutoring'}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{teacher.rating.toFixed(1)}</span>
                        <span className="text-slate-500 text-sm">({teacher.total_reviews})</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Experience</span>
                      <span className="font-medium">{teacher.experience_years}+ years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Hourly Rate</span>
                      <span className="font-medium">${teacher.hourly_rate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sessions</span>
                      <span className="font-medium">{teacher.total_sessions}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-1">
                      {teacher.specialties.length > 0 ? (
                        teacher.specialties.slice(0, 3).map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          General Teaching
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress & Performance */}
                <div className="lg:col-span-1">
                  <h4 className="font-medium mb-4">Teacher Stats</h4>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{teacher.total_students}</p>
                      <p className="text-sm text-green-700">Total Students</p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{teacher.rating.toFixed(1)}</p>
                      <p className="text-sm text-blue-700">Average Rating</p>
                    </div>

                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{teacher.total_sessions}</p>
                      <p className="text-sm text-purple-700">Total Sessions</p>
                    </div>
                  </div>
                </div>

                {/* Feedback & Actions */}
                <div className="lg:col-span-1">
                  <h4 className="font-medium mb-4">Teacher Info</h4>
                  <div className="bg-slate-50 p-4 rounded-lg mb-4">
                    <p className="text-slate-700 text-sm">
                      {teacher.bio || teacher.teaching_philosophy || 'Professional educator ready to help students learn.'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Status</span>
                      <span className="font-medium">
                        {teacher.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Verification</span>
                      <span className="font-medium capitalize">{teacher.verification_status}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>

                    <Button className="w-full bg-purple-500 hover:bg-purple-600">
                      View Full Profile
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}