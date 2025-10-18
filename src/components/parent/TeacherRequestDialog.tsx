import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar, Clock, DollarSign, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ParentMessagingService from '../../services/parentMessagingService';
import ParentService from '../../services/parentService';

interface TeacherRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId?: string;
  teacherName?: string;
  onSuccess?: () => void;
}

export function TeacherRequestDialog({ 
  isOpen, 
  onClose, 
  teacherId, 
  teacherName,
  onSuccess 
}: TeacherRequestDialogProps) {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedTime, setRequestedTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadChildren();
    }
  }, [isOpen, user]);

  const loadChildren = async () => {
    if (!user) return;
    
    try {
      const childrenData = await ParentService.getChildren(user.id);
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0].id);
      }
    } catch (err) {
      console.error('Error loading children:', err);
      setError('Failed to load children data');
    }
  };

  const calculateTokens = (durationHours: number) => {
    // Simple calculation: 10 tokens per hour
    return Math.ceil(durationHours * 10);
  };

  const handleSubmit = async () => {
    if (!user || !teacherId || !selectedChild || !requestedDate || !requestedTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const durationHours = parseFloat(duration);
      const requestedStart = new Date(`${requestedDate}T${requestedTime}`);
      const requestedEnd = new Date(requestedStart.getTime() + durationHours * 60 * 60 * 1000);
      const tokensRequired = calculateTokens(durationHours);

      const result = await ParentMessagingService.sendSessionRequest(
        user.id,
        selectedChild,
        teacherId,
        requestedStart.toISOString(),
        requestedEnd.toISOString(),
        durationHours,
        tokensRequired,
        message.trim() || undefined
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          onSuccess?.();
          resetForm();
        }, 2000);
      } else {
        setError(result.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Error sending request:', err);
      setError('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedChild('');
    setRequestedDate('');
    setRequestedTime('');
    setDuration('1');
    setMessage('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Request Sent!</h3>
            <p className="text-sm text-gray-500">
              Your session request has been sent to {teacherName}. 
              You'll be notified when they respond.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Request Session with {teacherName}</span>
          </DialogTitle>
          <DialogDescription>
            Send a session request to schedule a learning session for your child.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Child Selection */}
          <div className="space-y-2">
            <Label htmlFor="child">Select Child *</Label>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.full_name} ({child.grade_level || 'Student'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="time"
                  type="time"
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours) *</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">30 minutes</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="1.5">1.5 hours</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="2.5">2.5 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Token Cost */}
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              This session will cost <strong>{calculateTokens(parseFloat(duration))} tokens</strong>.
              Make sure you have sufficient balance in your account.
            </AlertDescription>
          </Alert>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any specific requirements or questions for the teacher..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedChild || !requestedDate || !requestedTime}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
