import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { CheckCircle, AlertCircle, Video, Settings, ExternalLink } from 'lucide-react';

interface ZoomStatusProps {
  teacherId: string;
  compact?: boolean;
}

interface ZoomAccount {
  id: string;
  teacher_id: string;
  zoom_user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  personal_meeting_url: string;
  is_active: boolean;
  created_at: string;
}

export function ZoomStatus({ teacherId, compact = false }: ZoomStatusProps) {
  const [account, setAccount] = useState<ZoomAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchZoomStatus();
  }, [teacherId]);

  const fetchZoomStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll simulate the API call since the backend might not be running
      // In production, this would call: /api/zoom/status/${teacherId}
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - replace with actual API call when backend is ready
      const mockResponse = {
        connected: false, // Change to true when Zoom is properly configured
        account: null
      };

      if (mockResponse.connected && mockResponse.account) {
        setAccount(mockResponse.account);
      }
    } catch (error) {
      console.error('Error fetching Zoom status:', error);
      setError('Failed to fetch Zoom status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectZoom = () => {
    // This would open the Zoom integration modal or navigate to settings
    console.log('Opening Zoom connection interface...');
    // For now, show an alert
    alert('Zoom integration setup needed. Please check the setup guide for configuration instructions.');
  };

  if (loading) {
    return (
      <Card className={compact ? 'p-4' : ''}>
        <CardContent className={compact ? 'p-0' : ''}>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Checking Zoom status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {account ? (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">Zoom Connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">Zoom Not Connected</span>
          </>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Video className="h-5 w-5 mr-2" />
          Zoom Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {account ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account:</span>
                <span className="text-sm font-medium">{account.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium">{account.first_name} {account.last_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <Badge variant={account.is_active ? 'default' : 'secondary'}>
                  {account.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Zoom
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600">Not Connected</span>
            </div>
            
            <p className="text-sm text-gray-600">
              Connect your Zoom account to schedule and host online classes.
            </p>

            <Button onClick={handleConnectZoom} className="w-full">
              <Video className="h-4 w-4 mr-2" />
              Connect Zoom Account
            </Button>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Setup Required:</strong> Zoom integration needs to be configured. 
                Check the setup guide for instructions.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

