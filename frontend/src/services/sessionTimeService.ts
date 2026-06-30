import { supabase } from '../supabaseClient';

export interface SessionTimeTracker {
  id: string;
  session_id: string;
  start_time: string;
  pause_time?: string;
  resume_time?: string;
  total_paused_seconds: number;
  total_active_seconds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  teacher_id: string;
  student_id: string;
  title: string;
  description?: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meeting_url?: string;
  meeting_id?: string;
  duration_minutes?: number;
  rate?: number;
  notes?: string;
  student_feedback?: string;
  teacher_feedback?: string;
  zoom_meeting_id?: string;
  recording_available: boolean;
  tokens_charged: number;
  tokens_deducted_at?: string;
  tokens_credited_at?: string;
  teacher_earning_usd?: number;
  student_cost_usd?: number;
  created_at: string;
  updated_at: string;
}

class SessionTimeService {
  /**
   * Start a class session
   */
  static async startSession(
    sessionId: string,
    teacherId: string
  ): Promise<{ success: boolean; trackerId?: string; error?: string }> {
    try {
      console.log('Starting session:', { sessionId, teacherId });

      // Check if session exists and belongs to teacher
      const { data: session, error: sessionError } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('teacher_id', teacherId)
        .single();

      if (sessionError || !session) {
        return { success: false, error: 'Session not found' };
      }

      if (session.status !== 'scheduled') {
        return { success: false, error: 'Session cannot be started' };
      }

      // Create time tracker
      const startTime = new Date().toISOString();
      const { data: tracker, error: trackerError } = await supabase
        .from('session_time_tracker')
        .insert({
          session_id: sessionId,
          start_time: startTime,
          is_active: true,
          total_paused_seconds: 0,
          total_active_seconds: 0
        })
        .select('id')
        .single();

      if (trackerError) {
        console.error('Error creating time tracker:', trackerError);
        return { success: false, error: 'Failed to create time tracker' };
      }

      // Update session status
      const { error: updateError } = await supabase
        .from('class_sessions')
        .update({
          status: 'in_progress',
          actual_start: startTime
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error updating session status:', updateError);
        return { success: false, error: 'Failed to update session status' };
      }

      // Note: Tokens will be deducted when the session is completed, not at start
      // This ensures students only pay for completed sessions

      console.log('Session started successfully:', tracker.id);

      return { success: true, trackerId: tracker.id };
    } catch (error) {
      console.error('Error starting session:', error);
      return { success: false, error: 'Failed to start session' };
    }
  }

  /**
   * Pause a class session
   */
  static async pauseSession(
    sessionId: string,
    teacherId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Pausing session:', { sessionId, teacherId });

      // Get active time tracker
      const { data: tracker, error: trackerError } = await supabase
        .from('session_time_tracker')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (trackerError || !tracker) {
        return { success: false, error: 'No active session found' };
      }

      const pauseTime = new Date().toISOString();
      const startTime = new Date(tracker.start_time);
      const activeSeconds = Math.floor((new Date(pauseTime).getTime() - startTime.getTime()) / 1000);

      // Update tracker
      const { error: updateError } = await supabase
        .from('session_time_tracker')
        .update({
          pause_time: pauseTime,
          total_active_seconds: activeSeconds,
          is_active: false
        })
        .eq('id', tracker.id);

      if (updateError) {
        console.error('Error pausing session:', updateError);
        return { success: false, error: 'Failed to pause session' };
      }

      console.log('Session paused successfully');

      return { success: true };
    } catch (error) {
      console.error('Error pausing session:', error);
      return { success: false, error: 'Failed to pause session' };
    }
  }

  /**
   * Resume a class session
   */
  static async resumeSession(
    sessionId: string,
    teacherId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Resuming session:', { sessionId, teacherId });

      // Get paused time tracker
      const { data: tracker, error: trackerError } = await supabase
        .from('session_time_tracker')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (trackerError || !tracker) {
        return { success: false, error: 'No paused session found' };
      }

      const resumeTime = new Date().toISOString();
      const pauseTime = new Date(tracker.pause_time!);
      const pausedSeconds = Math.floor((new Date(resumeTime).getTime() - pauseTime.getTime()) / 1000);
      const totalPausedSeconds = tracker.total_paused_seconds + pausedSeconds;

      // Update tracker
      const { error: updateError } = await supabase
        .from('session_time_tracker')
        .update({
          resume_time: resumeTime,
          total_paused_seconds: totalPausedSeconds,
          start_time: resumeTime, // Reset start time for next active period
          is_active: true
        })
        .eq('id', tracker.id);

      if (updateError) {
        console.error('Error resuming session:', updateError);
        return { success: false, error: 'Failed to resume session' };
      }

      console.log('Session resumed successfully');

      return { success: true };
    } catch (error) {
      console.error('Error resuming session:', error);
      return { success: false, error: 'Failed to resume session' };
    }
  }

  /**
   * End a class session
   */
  static async endSession(
    sessionId: string,
    teacherId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Ending session:', { sessionId, teacherId });

      // Get active time tracker
      const { data: tracker, error: trackerError } = await supabase
        .from('session_time_tracker')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (trackerError || !tracker) {
        return { success: false, error: 'No active session found' };
      }

      const endTime = new Date().toISOString();
      const startTime = new Date(tracker.start_time);
      const finalActiveSeconds = Math.floor((new Date(endTime).getTime() - startTime.getTime()) / 1000);
      const totalActiveSeconds = tracker.total_active_seconds + finalActiveSeconds;

      // Calculate duration in minutes
      const durationMinutes = Math.ceil(totalActiveSeconds / 60);

      // Update tracker
      const { error: trackerUpdateError } = await supabase
        .from('session_time_tracker')
        .update({
          total_active_seconds: totalActiveSeconds,
          is_active: false
        })
        .eq('id', tracker.id);

      if (trackerUpdateError) {
        console.error('Error updating time tracker:', trackerUpdateError);
        return { success: false, error: 'Failed to update time tracker' };
      }

      // Get session details before updating (to get student_id, tokens_charged, and zoom_meeting_id)
      const { data: session, error: sessionFetchError } = await supabase
        .from('class_sessions')
        .select('student_id, tokens_charged, tokens_deducted_at, zoom_meeting_id')
        .eq('id', sessionId)
        .single();

      if (sessionFetchError || !session) {
        console.error('Error fetching session:', sessionFetchError);
        return { success: false, error: 'Failed to fetch session details' };
      }

      // Update session
      const { error: sessionUpdateError } = await supabase
        .from('class_sessions')
        .update({
          status: 'completed',
          actual_end: endTime,
          duration_minutes: durationMinutes,
          notes: notes
        })
        .eq('id', sessionId);

      if (sessionUpdateError) {
        console.error('Error updating session:', sessionUpdateError);
        return { success: false, error: 'Failed to update session' };
      }

      // Deduct tokens from student ONLY if this is a Zoom class (has zoom_meeting_id) and not already deducted
      if (session.zoom_meeting_id && !session.tokens_deducted_at && session.tokens_charged) {
        const deductResult = await this.deductStudentTokens(
          sessionId,
          session.student_id,
          session.tokens_charged
        );
        if (!deductResult.success) {
          console.error('Error deducting student tokens:', deductResult.error);
          // Don't fail the session end, but log the error
        }
      }

      // Credit tokens to teacher if session lasted at least 1 hour
      if (durationMinutes >= 60) {
        const creditResult = await this.creditTeacherTokens(sessionId, teacherId, tracker.total_active_seconds);
        if (!creditResult.success) {
          console.error('Error crediting teacher tokens:', creditResult.error);
          // Don't fail the session end, just log the error
        }
      }

      console.log('Session ended successfully');

      return { success: true };
    } catch (error) {
      console.error('Error ending session:', error);
      return { success: false, error: 'Failed to end session' };
    }
  }

  /**
   * Get current session time tracker
   */
  static async getCurrentTracker(sessionId: string): Promise<SessionTimeTracker | null> {
    try {
      const { data, error } = await supabase
        .from('session_time_tracker')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return data as SessionTimeTracker;
    } catch (error) {
      console.error('Error getting current tracker:', error);
      return null;
    }
  }

  /**
   * Get session time history
   */
  static async getSessionTimeHistory(sessionId: string): Promise<SessionTimeTracker[]> {
    try {
      const { data, error } = await supabase
        .from('session_time_tracker')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting session time history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSessionTimeHistory:', error);
      return [];
    }
  }

  /**
   * Get current session duration
   */
  static async getCurrentSessionDuration(sessionId: string): Promise<{
    totalSeconds: number;
    activeSeconds: number;
    pausedSeconds: number;
    isActive: boolean;
  }> {
    try {
      const tracker = await this.getCurrentTracker(sessionId);
      
      if (!tracker) {
        return {
          totalSeconds: 0,
          activeSeconds: 0,
          pausedSeconds: 0,
          isActive: false
        };
      }

      const now = new Date();
      const startTime = new Date(tracker.start_time);
      
      if (tracker.is_active) {
        const currentActiveSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const totalActiveSeconds = tracker.total_active_seconds + currentActiveSeconds;
        
        return {
          totalSeconds: totalActiveSeconds + tracker.total_paused_seconds,
          activeSeconds: totalActiveSeconds,
          pausedSeconds: tracker.total_paused_seconds,
          isActive: true
        };
      } else {
        return {
          totalSeconds: tracker.total_active_seconds + tracker.total_paused_seconds,
          activeSeconds: tracker.total_active_seconds,
          pausedSeconds: tracker.total_paused_seconds,
          isActive: false
        };
      }
    } catch (error) {
      console.error('Error getting current session duration:', error);
      return {
        totalSeconds: 0,
        activeSeconds: 0,
        pausedSeconds: 0,
        isActive: false
      };
    }
  }

  /**
   * Deduct tokens from student at session start
   */
  private static async deductStudentTokens(
    sessionId: string,
    studentId: string,
    tokenAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Deducting tokens from student:', { studentId, tokenAmount });

      // Call RPC function to deduct tokens
      const { data, error } = await supabase
        .rpc('deduct_tokens', {
          user_uuid: studentId,
          amount: tokenAmount,
          description: 'Class session payment',
          related_entity_type: 'class_session',
          related_entity_id: sessionId
        });

      if (error) {
        console.error('Error deducting student tokens:', error);
        return { success: false, error: error.message };
      }

      // Update session with deduction timestamp
      await supabase
        .from('class_sessions')
        .update({
          tokens_deducted_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      console.log('Student tokens deducted successfully');

      return { success: true };
    } catch (error) {
      console.error('Error in deductStudentTokens:', error);
      return { success: false, error: 'Failed to deduct student tokens' };
    }
  }

  /**
   * Credit tokens to teacher at session end (if >= 1 hour)
   */
  private static async creditTeacherTokens(
    sessionId: string,
    teacherId: string,
    activeSeconds: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Crediting tokens to teacher:', { teacherId, activeSeconds });

      // Calculate tokens based on active time (10 tokens per hour)
      const activeHours = activeSeconds / 3600;
      const tokenAmount = Math.floor(activeHours * 10);

      if (tokenAmount < 10) {
        console.log('Session duration less than 1 hour, no tokens credited');
        return { success: true };
      }

      // Call RPC function to credit tokens
      const { data, error } = await supabase
        .rpc('credit_tokens', {
          user_uuid: teacherId,
          amount: tokenAmount,
          description: 'Class session earnings',
          related_entity_type: 'class_session',
          related_entity_id: sessionId
        });

      if (error) {
        console.error('Error crediting teacher tokens:', error);
        return { success: false, error: error.message };
      }

      // Update session with credit timestamp
      await supabase
        .from('class_sessions')
        .update({
          tokens_credited_at: new Date().toISOString(),
          teacher_earning_usd: tokenAmount * 0.04 // 10 tokens = $0.40 for teachers
        })
        .eq('id', sessionId);

      console.log('Teacher tokens credited successfully');

      return { success: true };
    } catch (error) {
      console.error('Error in creditTeacherTokens:', error);
      return { success: false, error: 'Failed to credit teacher tokens' };
    }
  }

  /**
   * Get teacher's session statistics
   */
  static async getTeacherSessionStats(
    teacherId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalSessions: number;
    totalHours: number;
    totalEarnings: number;
    averageSessionLength: number;
  }> {
    try {
      let query = supabase
        .from('class_sessions')
        .select('duration_minutes, teacher_earning_usd')
        .eq('teacher_id', teacherId)
        .eq('status', 'completed');

      if (startDate) {
        query = query.gte('actual_start', startDate);
      }

      if (endDate) {
        query = query.lte('actual_start', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting teacher session stats:', error);
        return {
          totalSessions: 0,
          totalHours: 0,
          totalEarnings: 0,
          averageSessionLength: 0
        };
      }

      const sessions = data || [];
      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
      const totalHours = totalMinutes / 60;
      const totalEarnings = sessions.reduce((sum, session) => sum + (session.teacher_earning_usd || 0), 0);
      const averageSessionLength = totalSessions > 0 ? totalMinutes / totalSessions : 0;

      return {
        totalSessions,
        totalHours,
        totalEarnings,
        averageSessionLength
      };
    } catch (error) {
      console.error('Error in getTeacherSessionStats:', error);
      return {
        totalSessions: 0,
        totalHours: 0,
        totalEarnings: 0,
        averageSessionLength: 0
      };
    }
  }

  /**
   * Cancel a session
   */
  static async cancelSession(
    sessionId: string,
    teacherId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Cancelling session:', { sessionId, teacherId, reason });

      // Update session status
      const { error: updateError } = await supabase
        .from('class_sessions')
        .update({
          status: 'cancelled',
          notes: reason
        })
        .eq('id', sessionId)
        .eq('teacher_id', teacherId);

      if (updateError) {
        console.error('Error cancelling session:', updateError);
        return { success: false, error: 'Failed to cancel session' };
      }

      // Refund tokens to student if they were already deducted
      const { data: session } = await supabase
        .from('class_sessions')
        .select('student_id, tokens_charged, tokens_deducted_at')
        .eq('id', sessionId)
        .single();

      if (session?.tokens_deducted_at) {
        const refundResult = await this.refundStudentTokens(
          sessionId,
          session.student_id,
          session.tokens_charged,
          'Session cancelled'
        );

        if (!refundResult.success) {
          console.error('Error refunding student tokens:', refundResult.error);
          // Don't fail the cancellation, just log the error
        }
      }

      console.log('Session cancelled successfully');

      return { success: true };
    } catch (error) {
      console.error('Error cancelling session:', error);
      return { success: false, error: 'Failed to cancel session' };
    }
  }

  /**
   * Refund tokens to student
   */
  private static async refundStudentTokens(
    sessionId: string,
    studentId: string,
    tokenAmount: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Refunding tokens to student:', { studentId, tokenAmount, reason });

      // Call RPC function to refund tokens
      const { data, error } = await supabase
        .rpc('credit_tokens', {
          user_uuid: studentId,
          amount: tokenAmount,
          description: `Refund: ${reason}`,
          related_entity_type: 'class_session',
          related_entity_id: sessionId
        });

      if (error) {
        console.error('Error refunding student tokens:', error);
        return { success: false, error: error.message };
      }

      console.log('Student tokens refunded successfully');

      return { success: true };
    } catch (error) {
      console.error('Error in refundStudentTokens:', error);
      return { success: false, error: 'Failed to refund student tokens' };
    }
  }
}

export default SessionTimeService;
