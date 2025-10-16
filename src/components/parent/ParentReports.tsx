import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ArrowLeft, Download, Calendar, TrendingUp, BookOpen } from 'lucide-react';

interface ParentReportsProps {
  onBack?: () => void;
}

export function ParentReports({ onBack }: ParentReportsProps) {
  const reports = [
    {
      id: 1,
      title: 'Monthly Progress Report - October 2025',
      type: 'progress',
      date: '2025-10-01',
      subjects: ['Mathematics', 'Physics', 'Literature'],
      status: 'available'
    },
    {
      id: 2,
      title: 'Mathematics Assessment Report',
      type: 'assessment',
      date: '2025-09-28',
      subjects: ['Mathematics'],
      status: 'available'
    },
    {
      id: 3,
      title: 'Quarterly Performance Summary - Q3 2025',
      type: 'summary',
      date: '2025-09-30',
      subjects: ['All Subjects'],
      status: 'available'
    }
  ];

  const performanceData = [
    { subject: 'Mathematics', current: 'B+', previous: 'B', improvement: '+1 grade' },
    { subject: 'Physics', current: 'B', previous: 'C+', improvement: '+1 grade' },
    { subject: 'Literature', current: 'A-', previous: 'B+', improvement: '+1 grade' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-slate-600">Comprehensive insights into Alex's academic journey</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Overall Improvement</p>
              <p className="text-2xl font-bold text-green-600">+18%</p>
              <p className="text-xs text-blue-600">This quarter</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Sessions Attended</p>
              <p className="text-2xl font-bold">24/24</p>
              <p className="text-xs text-green-600">100% attendance</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Study Hours</p>
              <p className="text-2xl font-bold">36h</p>
              <p className="text-xs text-purple-600">This month</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Reports Generated</p>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-orange-600">This month</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Reports */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Available Reports</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{report.title}</h4>
                    <p className="text-sm text-slate-600">{report.date}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {report.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {report.subjects.map((subject, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Overview */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">Grade Progression</h3>
          <div className="space-y-4">
            {performanceData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.subject}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-600">{item.previous}</span>
                    <span className="text-sm">→</span>
                    <span className="font-medium text-green-600">{item.current}</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {item.improvement}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: '85%' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-6">Learning Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-4">Study Patterns</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Most Productive Time</span>
                <span className="font-medium">3-5 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Average Session Length</span>
                <span className="font-medium">1.5 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Preferred Learning Style</span>
                <span className="font-medium">Visual</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Strengths</h4>
            <div className="space-y-2">
              <Badge className="bg-green-100 text-green-800">Problem Solving</Badge>
              <Badge className="bg-blue-100 text-blue-800">Mathematical Reasoning</Badge>
              <Badge className="bg-purple-100 text-purple-800">Critical Thinking</Badge>
              <Badge className="bg-orange-100 text-orange-800">Essay Writing</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-4">Areas for Improvement</h4>
            <div className="space-y-2">
              <Badge variant="outline">Physics Lab Work</Badge>
              <Badge variant="outline">Time Management</Badge>
              <Badge variant="outline">Study Consistency</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}