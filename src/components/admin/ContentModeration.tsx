import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Eye, Flag, Shield } from 'lucide-react';

interface ContentModerationProps {
  onBack: () => void;
}

export function ContentModeration({ onBack }: ContentModerationProps) {
  const flaggedContent = [
    {
      id: 1,
      type: 'assignment',
      title: 'Mathematics Problem Set',
      reporter: 'Parent User',
      reason: 'Inappropriate content',
      status: 'pending',
      date: '2025-10-03'
    },
    {
      id: 2,
      type: 'message',
      title: 'Teacher-Student Chat',
      reporter: 'System Auto-Detection',
      reason: 'Spam detected',
      status: 'reviewed',
      date: '2025-10-02'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-slate-600">Review and moderate platform content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Flag className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Flagged Content</p>
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs text-red-600">Pending review</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Reviewed</p>
              <p className="text-2xl font-bold">45</p>
              <p className="text-xs text-green-600">This month</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Auto-Detected</p>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-blue-600">AI flagged</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Flagged Content</h3>
        <div className="space-y-4">
          {flaggedContent.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-slate-600">
                  Reported by {item.reporter} • {item.reason}
                </p>
                <p className="text-xs text-slate-500">{item.date}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={item.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                  {item.status}
                </Badge>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}