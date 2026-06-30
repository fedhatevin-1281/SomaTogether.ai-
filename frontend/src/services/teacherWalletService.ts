import { supabase } from '../supabaseClient';
import { tokenService, TokenWallet, TokenTransaction, ClassSession } from './tokenService';

export interface TeacherWalletData {
  id: string;
  user_id: string;
  balance: number;
  token_balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

export interface TeacherTransaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus' | 'refund' | 'fee' | 'deduction';
  amount: number;
  balance_after: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_type?: string;
  reference_id?: string;
  student_name?: string;
  class_title?: string;
  created_at: string;
  processed_at?: string;
  metadata?: any;
}

export interface WithdrawalRequest {
  id: string;
  amount_usd: number;
  tokens_to_convert: number;
  conversion_rate: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider: 'stripe' | 'mpesa' | 'bank_transfer';
  provider_transaction_id?: string;
  created_at: string;
  processed_at?: string;
  completed_at?: string;
  failure_reason?: string;
}

export interface MonthlyEarnings {
  month: string;
  year: number;
  earnings: number;
  sessions: number;
  students: number;
}

export interface TeacherWalletStats {
  total_earnings: number;
  this_month_earnings: number;
  last_month_earnings: number;
  pending_withdrawals: number;
  total_sessions: number;
  average_session_value: number;
  earnings_growth_percentage: number;
}

export interface TransactionFilter {
  type?: string;
  status?: string;
}

export interface LoadingState {
  wallet: boolean;
  transactions: boolean;
  withdrawalRequests: boolean;
  monthlyEarnings: boolean;
  stats: boolean;
}

export class TeacherWalletService {
  /**
   * Get teacher wallet data from token system
   */
  static async getWalletData(teacherId: string): Promise<TeacherWalletData | null> {
    try {
      const wallet = await tokenService.getUserWallet(teacherId);
      if (!wallet) return null;

      return {
        id: wallet.id,
        user_id: wallet.user_id,
        balance: wallet.balance || 0,
        token_balance: wallet.token_balance || 0,
        locked_balance: wallet.locked_balance || 0,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at,
      };
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      return null;
    }
  }

  /**
   * Get teacher transactions with pagination and filtering
   */
  static async getTransactions(
    teacherId: string,
    page: number = 0,
    limit: number = 20,
    filter?: TransactionFilter
  ): Promise<TeacherTransaction[]> {
    try {
      const transactions = await tokenService.getUserTransactions(
        teacherId,
        limit,
        page * limit,
        filter?.type
      );

      // Get additional details for class session transactions
      const enrichedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          let studentName = '';
          let classTitle = '';

          if (transaction.reference_type === 'class_session' && transaction.reference_id) {
            const session = await tokenService.getClassSession(transaction.reference_id);
            if (session) {
              // Get student name
              const { data: studentProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', session.student_id)
                .single();

              // Get class title
              if (session.class_id) {
                const { data: classData } = await supabase
                  .from('classes')
                  .select('title')
                  .eq('id', session.class_id)
                  .single();

                classTitle = classData?.title || '';
              }

              studentName = studentProfile?.full_name || '';
            }
          }

          return {
            id: transaction.id,
            type: (transaction.transaction_type || transaction.type) as TeacherTransaction['type'],
            amount: transaction.amount_usd || tokenService.tokensToUSDForTeacher(transaction.amount_tokens),
            balance_after: transaction.balance_after || 0,
            description: transaction.description || '',
            status: transaction.status as TeacherTransaction['status'],
            reference_type: transaction.related_entity_type,
            reference_id: transaction.related_entity_id,
            student_name: studentName,
            class_title: classTitle,
            created_at: transaction.created_at,
            processed_at: transaction.created_at,
            metadata: transaction.metadata,
          };
        })
      );

      return enrichedTransactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  /**
   * Get withdrawal requests
   */
  static async getWithdrawalRequests(teacherId: string): Promise<WithdrawalRequest[]> {
    try {
      const requests = await tokenService.getUserWithdrawalRequests(teacherId);
      
      return requests.map(request => ({
        id: request.id,
        amount_usd: request.amount_usd,
        tokens_to_convert: request.tokens_to_convert,
        conversion_rate: request.conversion_rate,
        status: request.status,
        provider: request.provider,
        provider_transaction_id: request.provider_transaction_id,
        created_at: request.created_at,
        processed_at: request.processed_at,
        completed_at: request.completed_at,
        failure_reason: request.failure_reason,
      }));
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      return [];
    }
  }

  /**
   * Get monthly earnings for the past 12 months
   */
  static async getMonthlyEarnings(teacherId: string): Promise<MonthlyEarnings[]> {
    try {
      const transactions = await tokenService.getUserTransactions(teacherId, 1000); // Get more for analysis
      
      // Filter earning transactions from class sessions
      const earningTransactions = transactions.filter(
        t => t.transaction_type === 'earning' && t.reference_type === 'class_session'
      );

      // Group by month and calculate earnings
      const monthlyData: { [key: string]: MonthlyEarnings } = {};
      
      earningTransactions.forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            year: date.getFullYear(),
            earnings: 0,
            sessions: 0,
            students: 0,
          };
        }
        
        monthlyData[monthKey].earnings += tokenService.tokensToUSDForTeacher(transaction.amount);
        monthlyData[monthKey].sessions += 1;
      });

      return Object.values(monthlyData).slice(-12); // Last 12 months
    } catch (error) {
      console.error('Error fetching monthly earnings:', error);
      return [];
    }
  }

  /**
   * Get comprehensive wallet statistics
   */
  static async getWalletStats(teacherId: string): Promise<TeacherWalletStats> {
    try {
      const transactions = await tokenService.getUserTransactions(teacherId, 1000);
      
      // Filter earning transactions
      const earningTransactions = transactions.filter(
        t => t.transaction_type === 'earning'
      );

      // Get current month earnings
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const currentMonthEarnings = earningTransactions
        .filter(t => new Date(t.created_at) >= startOfMonth)
        .reduce((sum, t) => sum + tokenService.tokensToUSDForTeacher(t.amount), 0);

      // Get last month earnings
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
      
      const lastMonthEarnings = earningTransactions
        .filter(t => {
          const date = new Date(t.created_at);
          return date >= lastMonth && date <= endOfLastMonth;
        })
        .reduce((sum, t) => sum + tokenService.tokensToUSDForTeacher(t.amount), 0);

      // Get total earnings
      const totalEarnings = earningTransactions
        .reduce((sum, t) => sum + tokenService.tokensToUSDForTeacher(t.amount), 0);

      // Get total sessions
      const totalSessions = earningTransactions.length;

      // Get pending withdrawals
      const withdrawalRequests = await tokenService.getUserWithdrawalRequests(teacherId);
      const pendingWithdrawals = withdrawalRequests
        .filter(w => ['pending', 'processing'].includes(w.status))
        .reduce((sum, w) => sum + w.amount_usd, 0);

      const earningsGrowth = lastMonthEarnings > 0 
        ? ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
        : 0;

      const averageSessionValue = totalSessions > 0 ? totalEarnings / totalSessions : 0;

      return {
        total_earnings: totalEarnings,
        this_month_earnings: currentMonthEarnings,
        last_month_earnings: lastMonthEarnings,
        pending_withdrawals: pendingWithdrawals,
        total_sessions: totalSessions,
        average_session_value: averageSessionValue,
        earnings_growth_percentage: earningsGrowth,
      };
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      return {
        total_earnings: 0,
        this_month_earnings: 0,
        last_month_earnings: 0,
        pending_withdrawals: 0,
        total_sessions: 0,
        average_session_value: 0,
        earnings_growth_percentage: 0,
      };
    }
  }

  /**
   * Create a withdrawal request
   */
  static async createWithdrawalRequest(
    teacherId: string,
    amountUsd: number,
    paymentMethodId: string,
    provider: 'stripe' | 'mpesa' | 'bank_transfer' = 'stripe'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get teacher's wallet to check balance
      const wallet = await tokenService.getUserWallet(teacherId);
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      const walletBalanceUSD = tokenService.tokensToUSDForTeacher(wallet.balance);
      if (walletBalanceUSD < amountUsd) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Create withdrawal request
      const request = await tokenService.createWithdrawalRequest(
        teacherId,
        wallet.id,
        paymentMethodId,
        amountUsd,
        provider
      );

      if (!request) {
        return { success: false, error: 'Failed to create withdrawal request' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      return { success: false, error: 'Failed to create withdrawal request' };
    }
  }

  /**
   * Get teacher's class sessions
   */
  static async getTeacherSessions(
    teacherId: string,
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<ClassSession[]> {
    try {
      return await tokenService.getTeacherSessions(teacherId, limit, offset, status);
    } catch (error) {
      console.error('Error fetching teacher sessions:', error);
      return [];
    }
  }

  /**
   * Start a class session (deducts tokens from student)
   */
  static async startClassSession(
    sessionId: string,
    teacherId: string,
    studentId: string,
    classId?: string
  ): Promise<boolean> {
    try {
      return await tokenService.startClassSession(sessionId, teacherId, studentId, classId);
    } catch (error) {
      console.error('Error starting class session:', error);
      return false;
    }
  }

  /**
   * Complete a class session (credits teacher)
   */
  static async completeClassSession(sessionId: string): Promise<boolean> {
    try {
      return await tokenService.completeClassSession(sessionId);
    } catch (error) {
      console.error('Error completing class session:', error);
      return false;
    }
  }

  /**
   * Get token pricing for teachers
   */
  static async getTokenPricing(): Promise<{ tokensPerDollar: number; dollarsPerToken: number } | null> {
    try {
      const pricing = await tokenService.getTokenPricing('teacher');
      if (!pricing) return null;

      return {
        tokensPerDollar: pricing.tokens_per_dollar,
        dollarsPerToken: pricing.dollars_per_token,
      };
    } catch (error) {
      console.error('Error fetching token pricing:', error);
      return null;
    }
  }

  /**
   * Calculate tokens needed for a class duration
   */
  static calculateTokensForDuration(minutes: number): number {
    return tokenService.calculateTokensForDuration(minutes);
  }

  /**
   * Convert tokens to USD for teacher
   */
  static tokensToUSD(tokens: number): number {
    return tokenService.tokensToUSDForTeacher(tokens);
  }

  /**
   * Convert USD to tokens for teacher
   */
  static usdToTokens(usd: number): number {
    return tokenService.usdToTokensForUser('teacher', usd);
  }
}