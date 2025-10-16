import { supabase } from '../supabaseClient';

export interface TokenWallet {
  id: string;
  user_id: string;
  balance: number;
  token_balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  wallet_id?: string;
  type: string;
  transaction_type?: string;
  amount_tokens: number;
  amount_usd: number;
  token_rate: number;
  balance_after?: number;
  related_entity_type?: string;
  related_entity_id?: string;
  description?: string;
  status: string;
  metadata?: any;
  created_at: string;
}

export interface TokenPricing {
  user_type: 'student' | 'teacher';
  tokens_per_dollar: number;
  dollars_per_token: number;
}

export interface ClassSession {
  id: string;
  teacher_id: string;
  student_id: string;
  class_id?: string;
  status: 'scheduled' | 'started' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  duration_minutes: number;
  tokens_charged: number;
  tokens_deducted_at?: string;
  tokens_credited_at?: string;
  teacher_earning_usd?: number;
  student_cost_usd?: number;
  subject?: string;
  session_notes?: string;
  student_feedback?: string;
  teacher_feedback?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

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

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  wallet_id: string;
  payment_method_id: string;
  amount_usd: number;
  tokens_to_convert: number;
  conversion_rate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider: 'stripe' | 'mpesa' | 'bank_transfer';
  provider_transaction_id?: string;
  provider_response?: any;
  processed_at?: string;
  completed_at?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

class TokenService {
  // Token pricing constants
  static readonly STUDENT_TOKENS_PER_DOLLAR = 10; // 10 tokens = $1.00
  static readonly TEACHER_TOKENS_PER_DOLLAR = 25; // 25 tokens = $1.00 (10 tokens = $0.40)
  static readonly CLASS_TOKENS_REQUIRED = 10; // 1 hour class = 10 tokens
  static readonly TEACHER_EARNING_PER_TOKEN = 0.04; // $0.04 per token
  static readonly STUDENT_COST_PER_TOKEN = 0.10; // $0.10 per token

  /**
   * Get token pricing for user type
   */
  async getTokenPricing(userType: 'student' | 'teacher'): Promise<TokenPricing | null> {
    try {
      const { data, error } = await supabase
        .from('token_pricing')
        .select('*')
        .eq('user_type', userType)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching token pricing:', error);
      return null;
    }
  }

  /**
   * Get or create user token wallet
   */
  async getUserWallet(userId: string): Promise<TokenWallet | null> {
    try {
      // Try to get existing wallet
      let { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Wallet doesn't exist, create one
        const { data: newWallet, error: createError } = await supabase
          .rpc('create_user_token_wallet', { user_uuid: userId });

        if (createError) throw createError;

        // Fetch the newly created wallet
        const { data: walletData, error: fetchError } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError) throw fetchError;
        return walletData;
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user wallet:', error);
      return null;
    }
  }

  /**
   * Get user token transactions
   */
  async getUserTransactions(
    userId: string, 
    limit: number = 50, 
    offset: number = 0,
    transactionType?: string
  ): Promise<TokenTransaction[]> {
    try {
      let query = supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (transactionType) {
        query = query.eq('transaction_type', transactionType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return [];
    }
  }

  /**
   * Start a class session and deduct tokens from student
   */
  async startClassSession(
    sessionId: string,
    teacherId: string,
    studentId: string,
    classId?: string
  ): Promise<boolean> {
    try {
      // Create session record first
      const { error: sessionError } = await supabase
        .from('class_sessions')
        .insert({
          id: sessionId,
          teacher_id: teacherId,
          student_id: studentId,
          class_id: classId,
          status: 'scheduled',
          scheduled_start_time: new Date().toISOString(),
          scheduled_end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          duration_minutes: 60,
          tokens_charged: TokenService.CLASS_TOKENS_REQUIRED
        });

      if (sessionError) throw sessionError;

      // Start the session and deduct tokens
      const { error: startError } = await supabase
        .rpc('start_class_session', {
          session_uuid: sessionId,
          teacher_uuid: teacherId,
          student_uuid: studentId,
          class_uuid: classId
        });

      if (startError) throw startError;

      // Start time tracking
      await this.startTimeTracking(sessionId);

      return true;
    } catch (error) {
      console.error('Error starting class session:', error);
      return false;
    }
  }

  /**
   * Complete a class session and credit teacher
   */
  async completeClassSession(sessionId: string): Promise<boolean> {
    try {
      // Complete the session and credit teacher
      const { error: completeError } = await supabase
        .rpc('complete_class_session', { session_uuid: sessionId });

      if (completeError) throw completeError;

      // Stop time tracking
      await this.stopTimeTracking(sessionId);

      return true;
    } catch (error) {
      console.error('Error completing class session:', error);
      return false;
    }
  }

  /**
   * Start time tracking for a session
   */
  async startTimeTracking(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('session_time_tracker')
        .insert({
          session_id: sessionId,
          start_time: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting time tracking:', error);
      return false;
    }
  }

  /**
   * Pause time tracking
   */
  async pauseTimeTracking(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('session_time_tracker')
        .update({
          pause_time: new Date().toISOString(),
          is_active: false
        })
        .eq('session_id', sessionId)
        .eq('is_active', true);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error pausing time tracking:', error);
      return false;
    }
  }

  /**
   * Resume time tracking
   */
  async resumeTimeTracking(sessionId: string): Promise<boolean> {
    try {
      // Get the current tracker record
      const { data: tracker, error: fetchError } = await supabase
        .from('session_time_tracker')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', false)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date();
      const pauseTime = new Date(tracker.pause_time);
      const pausedDuration = Math.floor((now.getTime() - pauseTime.getTime()) / 1000);

      const { error } = await supabase
        .from('session_time_tracker')
        .update({
          resume_time: now.toISOString(),
          total_paused_seconds: tracker.total_paused_seconds + pausedDuration,
          is_active: true
        })
        .eq('session_id', sessionId)
        .eq('is_active', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resuming time tracking:', error);
      return false;
    }
  }

  /**
   * Stop time tracking and calculate total active time
   */
  async stopTimeTracking(sessionId: string): Promise<boolean> {
    try {
      // Get the current tracker record
      const { data: tracker, error: fetchError } = await supabase
        .from('session_time_tracker')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date();
      const startTime = new Date(tracker.start_time);
      const totalDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      const totalActiveSeconds = totalDuration - tracker.total_paused_seconds;

      const { error } = await supabase
        .from('session_time_tracker')
        .update({
          total_active_seconds: totalActiveSeconds,
          is_active: false
        })
        .eq('session_id', sessionId)
        .eq('is_active', true);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      return false;
    }
  }

  /**
   * Get active session time tracker
   */
  async getActiveTimeTracker(sessionId: string): Promise<SessionTimeTracker | null> {
    try {
      const { data, error } = await supabase
        .from('session_time_tracker')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (error && error.code === 'PGRST116') return null;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching time tracker:', error);
      return null;
    }
  }

  /**
   * Get class session details
   */
  async getClassSession(sessionId: string): Promise<ClassSession | null> {
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching class session:', error);
      return null;
    }
  }

  /**
   * Get teacher's class sessions
   */
  async getTeacherSessions(
    teacherId: string,
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<ClassSession[]> {
    try {
      let query = supabase
        .from('class_sessions')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher sessions:', error);
      return [];
    }
  }

  /**
   * Calculate tokens needed for a duration in minutes
   */
  calculateTokensForDuration(minutes: number): number {
    // 1 hour = 60 minutes = 10 tokens
    // 1 minute = 10/60 = 0.167 tokens (rounded up)
    return Math.ceil((minutes / 60) * TokenService.CLASS_TOKENS_REQUIRED);
  }

  /**
   * Convert tokens to USD for teacher
   */
  tokensToUSDForTeacher(tokens: number): number {
    return tokens * TokenService.TEACHER_EARNING_PER_TOKEN;
  }

  /**
   * Convert tokens to USD for student
   */
  tokensToUSDForStudent(tokens: number): number {
    return tokens * TokenService.STUDENT_COST_PER_TOKEN;
  }

  /**
   * Convert USD to tokens for purchase
   */
  usdToTokensForUser(userType: 'student' | 'teacher', usd: number): number {
    if (userType === 'student') {
      return Math.floor(usd * TokenService.STUDENT_TOKENS_PER_DOLLAR);
    } else {
      return Math.floor(usd * TokenService.TEACHER_TOKENS_PER_DOLLAR);
    }
  }

  /**
   * Get withdrawal requests for user
   */
  async getUserWithdrawalRequests(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WithdrawalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }
  }

  /**
   * Create withdrawal request
   */
  async createWithdrawalRequest(
    userId: string,
    walletId: string,
    paymentMethodId: string,
    amountUSD: number,
    provider: 'stripe' | 'mpesa' | 'bank_transfer'
  ): Promise<WithdrawalRequest | null> {
    try {
      // Calculate tokens needed and conversion rate
      const tokensToConvert = amountUSD * TokenService.TEACHER_TOKENS_PER_DOLLAR;
      const conversionRate = TokenService.TEACHER_EARNING_PER_TOKEN;

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: userId,
          wallet_id: walletId,
          payment_method_id: paymentMethodId,
          amount_usd: amountUSD,
          tokens_to_convert: tokensToConvert,
          conversion_rate: conversionRate,
          provider: provider,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      return null;
    }
  }
}

export const tokenService = new TokenService();