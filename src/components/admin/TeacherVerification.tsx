import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Check, X, FileText, Award } from 'lucide-react';

interface TeacherVerificationProps {
  onBack: () => void;
}

export function TeacherVerification({ onBack }: TeacherVerificationProps) {
  const pendingTeachers = [
    {
      id: 1,
      name: 'Dr. David Wilson',
      email: 'david.wilson@email.com',
      subject: 'Chemistry',
      experience: '10+ years',
      qualifications: ['Ph.D. Chemistry', 'Teaching Certificate'],
      documents: 3,
      applicationDate: '2025-10-01',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Ms. Jennifer Clark',
      email: 'jennifer.clark@email.com',
      subject: 'Spanish',
      experience: '5+ years',
      qualifications: ['M.A. Spanish Literature', 'TESOL Certificate'],
      documents: 4,
      applicationDate: '2025-09-28',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Teacher Verification</h1>
          <p className="text-slate-600">Review and verify new teacher applications</p>
        </div>
      </div>

      <div className="space-y-6">
        {pendingTeachers.map((teacher) => (
          <Card key={teacher.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <img
                  src={teacher.avatar}
                  alt={teacher.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-lg">{teacher.name}</h3>
                  <p className="text-slate-600">{teacher.subject} Teacher</p>
                  <p className="text-sm text-slate-500">{teacher.email}</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-800">Pending Review</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3">Qualifications</h4>
                <div className="space-y-2">
                  {teacher.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{qual}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Application Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Experience</span>
                    <span className="font-medium">{teacher.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Documents</span>
                    <span className="font-medium">{teacher.documents} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Applied</span>
                    <span className="font-medium">{teacher.applicationDate}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Review Documents
                  </Button>
                  <div className="flex space-x-2">
                    <Button className="flex-1 bg-green-500 hover:bg-green-600">
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}