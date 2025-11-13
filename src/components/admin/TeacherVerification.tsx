import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Check, X, FileText, Award } from 'lucide-react';
import { AdminService, TeacherVerification as TeacherVerificationType } from '../../services/adminService';

interface TeacherVerificationProps {
  onBack: () => void;
}

export function TeacherVerification({ onBack }: TeacherVerificationProps) {
  const [pendingTeachers, setPendingTeachers] = useState<TeacherVerificationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const teachers = await AdminService.getTeacherVerifications();
        setPendingTeachers(teachers);
      } catch (error) {
        console.error('Error fetching teacher verifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Verification</h1>
          <p className="text-slate-600">Review and verify new teacher applications</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-foreground">Loading teacher verifications...</div>
      ) : pendingTeachers.length === 0 ? (
        <div className="text-center py-8 text-foreground">No pending teacher verifications</div>
      ) : (
        <div className="space-y-6">
          {pendingTeachers.map((teacher) => (
          <Card key={teacher.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                {teacher.avatar ? (
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-slate-600 text-xl font-medium">
                      {teacher.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg text-foreground">{teacher.name}</h3>
                  <p className="text-slate-600">{teacher.subject} Teacher</p>
                  <p className="text-sm text-slate-500">{teacher.email}</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-800">Pending Review</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-foreground">Qualifications</h4>
                <div className="space-y-2">
                  {teacher.qualifications.map((qual, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-foreground">{qual}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 text-foreground">Application Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Experience</span>
                    <span className="font-medium text-foreground">{teacher.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Documents</span>
                    <span className="font-medium text-foreground">{teacher.documents} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Applied</span>
                    <span className="font-medium text-foreground">{teacher.applicationDate}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 text-foreground">Actions</h4>
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
      )}
    </div>
  );
}