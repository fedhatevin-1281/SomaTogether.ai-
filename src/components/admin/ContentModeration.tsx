import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Eye, Flag, Shield } from 'lucide-react';
import { AdminService } from '../../services/adminService';

interface ContentModerationProps {
  onBack: () => void;
}

export function ContentModeration({ onBack }: ContentModerationProps) {
  const [flaggedContent, setFlaggedContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Note: Content moderation table doesn't exist yet
        // This is a placeholder for when the table is created
        const contentFlags = await AdminService.getContentFlags();
        setFlaggedContent(contentFlags);
      } catch (error) {
        console.error('Error fetching content flags:', error);
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
          <h1 className="text-2xl font-bold text-foreground">Content Moderation</h1>
          <p className="text-slate-600">Review and moderate platform content</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-foreground">Loading content moderation data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Flag className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Flagged Content</p>
                  <p className="text-2xl font-bold text-foreground">{flaggedContent.filter(c => c.status === 'pending').length}</p>
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
                  <p className="text-2xl font-bold text-foreground">{flaggedContent.filter(c => c.status === 'reviewed').length}</p>
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
                  <p className="text-2xl font-bold text-foreground">{flaggedContent.filter(c => c.reporter === 'System Auto-Detection').length}</p>
                  <p className="text-xs text-blue-600">AI flagged</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 text-foreground">Flagged Content</h3>
            <div className="space-y-4">
              {flaggedContent.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-2">No flagged content found</p>
                  <p className="text-sm text-slate-400">Content moderation system will be available once the database table is created</p>
                </div>
              ) : (
                flaggedContent.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div>
                      <h4 className="font-medium text-foreground">{item.title}</h4>
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
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}