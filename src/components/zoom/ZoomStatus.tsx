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
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    fetchZoomStatus();
  }, [teacherId]);

  const fetchZoomStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/zoom/status/${teacherId}`);
      const data = await response.json();

      setConfigured(data.configured !== false);

      if (data.connected && data.account) {
        setAccount(data.account);
      } else {
        setAccount(null);
      }
    } catch (error) {
      console.error('Error fetching Zoom status:', error);
      setError('Unable to connect to Zoom. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectZoom = async () => {
    try {
      setConnecting(true);
      setError(null);

      const response = await fetch('/api/zoom/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teacherId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setConfigured(data.configured !== false);
        setError(data.error || 'Unable to connect to Zoom. Please try again later.');
        return;
      }

      setConfigured(true);
      setAccount(data.account);
    } catch (error) {
      console.error('Error connecting Zoom account:', error);
      setError('Unable to connect to Zoom. Please try again later.');
    } finally {
      setConnecting(false);
    }
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
            <span className="text-sm text-green-600">Zoom Status: Connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">Zoom Status: Not Connected</span>
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
              <span className="text-sm font-medium text-green-600">Zoom Status: Connected</span>
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
              <span className="text-sm font-medium text-yellow-600">Zoom Status: Not Connected</span>
            </div>
            
            <p className="text-sm text-gray-600">
              {configured
                ? 'Connect Zoom to schedule and host online classes.'
                : 'Zoom is not configured by the administrator.'}
            </p>

            <Button onClick={handleConnectZoom} className="w-full" disabled={connecting || !configured}>
              <Video className="h-4 w-4 mr-2" />
              {connecting ? 'Connecting...' : 'Connect Zoom Account'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

