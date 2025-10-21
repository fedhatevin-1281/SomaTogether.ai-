import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import SessionTimeService from '../../services/sessionTimeService';
import { tokenService } from '../../services/tokenService';

interface ClassTimeTrackerProps {
  sessionId: string;
  teacherId: string;
  studentId: string;
  classId?: string;
  onSessionComplete?: () => void;
  onError?: (error: string) => void;
}

interface TimeTrackerState {
  isActive: boolean;
  isPaused: boolean;
  startTime: Date | null;
  pausedTime: number;
  totalTime: number;
  sessionStatus: 'scheduled' | 'started' | 'in_progress' | 'completed' | 'cancelled';
}

export function ClassTimeTracker({ 
  sessionId, 
  teacherId, 
  studentId, 
  classId,
  onSessionComplete,
  onError 
}: ClassTimeTrackerProps) {
  const [state, setState] = useState<TimeTrackerState>({
    isActive: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    totalTime: 0,
    sessionStatus: 'scheduled'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the class session
  const startSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await tokenService.startClassSession(sessionId, teacherId, studentId, classId);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isActive: true,
          startTime: new Date(),
          sessionStatus: 'started'
        }));
        
        // Start the timer
        startTimer();
      } else {
        throw new Error('Failed to start class session');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Pause the session
  const pauseSession = async () => {
    setLoading(true);
    
    try {
      const success = await tokenService.pauseTimeTracking(sessionId);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isPaused: true,
          pausedTime: prev.totalTime
        }));
        
        stopTimer();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause session');
    } finally {
      setLoading(false);
    }
  };

  // Resume the session
  const resumeSession = async () => {
    setLoading(true);
    
    try {
      const success = await tokenService.resumeTimeTracking(sessionId);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isPaused: false,
          startTime: new Date()
        }));
        
        startTimer();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume session');
    } finally {
      setLoading(false);
    }
  };

  // Complete the session
  const completeSession = async () => {
    setLoading(true);
    
    try {
      const success = await tokenService.completeClassSession(sessionId);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isActive: false,
          sessionStatus: 'completed'
        }));
        
        stopTimer();
        onSessionComplete?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session');
    } finally {
      setLoading(false);
    }
  };

  // Timer functions
  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setState(prev => {
        if (prev.startTime && !prev.isPaused) {
          const elapsed = Math.floor((Date.now() - prev.startTime.getTime()) / 1000);
          return {
            ...prev,
            totalTime: prev.pausedTime + elapsed
          };
        }
        return prev;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Check if session has reached 1 hour (3600 seconds)
  const isOneHourReached = state.totalTime >= 3600;
  
  // Get session status badge
  const getStatusBadge = () => {
    switch (state.sessionStatus) {
      case 'scheduled':
        return <Badge className="bg-gray-100 text-gray-800">Scheduled</Badge>;
      case 'started':
      case 'in_progress':
        return <Badge className="bg-green-100 text-green-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Class Session Tracker</h3>
        {getStatusBadge()}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <div className="text-center mb-6">
        <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
          {formatTime(state.totalTime)}
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
          <Clock className="h-4 w-4" />
          <span>
            {isOneHourReached ? 'Class completed!' : `Goal: ${formatTime(3600)}`}
          </span>
        </div>
      </div>

      <div className="flex justify-center space-x-3">
        {!state.isActive ? (
          <Button 
            onClick={startSession}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Class
              </>
            )}
          </Button>
        ) : (
          <>
            {!state.isPaused ? (
              <Button 
                onClick={pauseSession}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Pausing...
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={resumeSession}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resuming...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </Button>
            )}
            
            <Button 
              onClick={completeSession}
              disabled={loading || !isOneHourReached}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Class
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {state.isActive && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <p className="font-medium">Session Active</p>
            <p className="text-xs">
              Tokens have been deducted from student. Teacher will receive tokens when class completes.
            </p>
          </div>
        </div>
      )}

      {isOneHourReached && state.isActive && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Class duration completed! Click "Complete Class" to credit teacher tokens.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
