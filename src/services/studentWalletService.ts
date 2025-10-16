import { supabase } from '../supabaseClient';
import { tokenService, TokenWallet, TokenTransaction } from './tokenService';

export interface StudentWalletData {
  id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  created_at: string;
  updated_at: string;
}

export interface StudentTransaction {
  id: string;
  type: 'purchase' | 'deduction' | 'refund' | 'bonus' | 'transfer';
  amount: number;
  balance_after: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference_type?: string;
  reference_id?: string;
  class_title?: string;
  teacher_name?: string;
  created_at: string;
  processed_at?: string;
  metadata?: any;
}

export interface TokenPurchaseRequest {
  amount_usd: number;
  tokens_to_receive: number;
  payment_method_id: string;
  provider: 'stripe' | 'mpesa';
}

export interface StudentWalletStats {
  total_spent: number;
  this_month_spent: number;
  last_month_spent: number;
  total_classes: number;
  average_class_cost: number;
  spending_growth_percentage: number;
}

export interface TransactionFilter {
  type?: string;
  status?: string;
}

export class StudentWalletService {
  /**
   * Get student wallet data from token system
   */
  static async getWalletData(studentId: string): Promise<StudentWalletData | null> {
    try {
      const wallet = await tokenService.getUserWallet(studentId);
      if (!wallet) return null;

      return {
        id: wallet.id,
        user_id: wallet.user_id,
        balance: wallet.balance, // Keep as tokens for students
        locked_balance: wallet.locked_balance,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at,
      };
    } catch (error) {
      console.error('Error fetching student wallet data:', error);
      return null;
    }
  }

  /**
   * Get student transactions with pagination and filtering
   */
  static async getTransactions(
    studentId: string,
    page: number = 0,
    limit: number = 20,
    filter?: TransactionFilter
  ): Promise<StudentTransaction[]> {
    try {
      const transactions = await tokenService.getUserTransactions(
        studentId,
        limit,
        page * limit,
        filter?.type
      );

      // Get additional details for class session transactions
      const enrichedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          let classTitle = '';
          let teacherName = '';

          if (transaction.reference_type === 'class_session' && transaction.reference_id) {
            const session = await tokenService.getClassSession(transaction.reference_id);
            if (session) {
              // Get teacher name
              const { data: teacherProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', session.teacher_id)
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

              teacherName = teacherProfile?.full_name || '';
            }
          }

          return {
            id: transaction.id,
            type: transaction.transaction_type as StudentTransaction['type'],
            amount: transaction.amount, // Keep as tokens for students
            balance_after: transaction.balance_after,
            description: transaction.description || '',
            status: 'completed' as const, // Token transactions are always completed when recorded
            reference_type: transaction.reference_type,
            reference_id: transaction.reference_id,
            class_title: classTitle,
            teacher_name: teacherName,
            created_at: transaction.created_at,
            processed_at: transaction.created_at,
            metadata: transaction.metadata,
          };
        })
      );

      return enrichedTransactions;
    } catch (error) {
      console.error('Error fetching student transactions:', error);
      return [];
    }
  }

  /**
   * Get student wallet statistics
   */
  static async getWalletStats(studentId: string): Promise<StudentWalletStats> {
    try {
      const transactions = await tokenService.getUserTransactions(studentId, 1000); // Get more for analysis
      
      // Filter deduction transactions from class sessions
      const deductionTransactions = transactions.filter(
        t => t.transaction_type === 'deduction' && t.reference_type === 'class_session'
      );

      // Get current month spending
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const currentMonthSpent = deductionTransactions
        .filter(t => new Date(t.created_at) >= startOfMonth)
        .reduce((sum, t) => sum + tokenService.tokensToUSDForStudent(t.amount), 0);

      // Get last month spending
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
      
      const lastMonthSpent = deductionTransactions
        .filter(t => {
          const date = new Date(t.created_at);
          return date >= lastMonth && date <= endOfLastMonth;
        })
        .reduce((sum, t) => sum + tokenService.tokensToUSDForStudent(t.amount), 0);

      // Get total spending
      const totalSpent = deductionTransactions
        .reduce((sum, t) => sum + tokenService.tokensToUSDForStudent(t.amount), 0);

      // Get total classes
      const totalClasses = deductionTransactions.length;

      const spendingGrowth = lastMonthSpent > 0 
        ? ((currentMonthSpent - lastMonthSpent) / lastMonthSpent) * 100 
        : 0;

      const averageClassCost = totalClasses > 0 ? totalSpent / totalClasses : 0;

      return {
        total_spent: totalSpent,
        this_month_spent: currentMonthSpent,
        last_month_spent: lastMonthSpent,
        total_classes: totalClasses,
        average_class_cost: averageClassCost,
        spending_growth_percentage: spendingGrowth,
      };
    } catch (error) {
      console.error('Error fetching student wallet stats:', error);
      return {
        total_spent: 0,
        this_month_spent: 0,
        last_month_spent: 0,
        total_classes: 0,
        average_class_cost: 0,
        spending_growth_percentage: 0,
      };
    }
  }

  /**
   * Calculate tokens needed for a class duration
   */
  static calculateTokensForClass(minutes: number = 60): number {
    return tokenService.calculateTokensForDuration(minutes);
  }

  /**
   * Check if student has enough tokens for a class
   */
  static async canAffordClass(studentId: string, durationMinutes: number = 60): Promise<{
    canAfford: boolean;
    requiredTokens: number;
    currentBalance: number;
    shortfall?: number;
  }> {
    try {
      const wallet = await this.getWalletData(studentId);
      if (!wallet) {
        return {
          canAfford: false,
          requiredTokens: 0,
          currentBalance: 0,
          shortfall: 0
        };
      }

      const requiredTokens = this.calculateTokensForClass(durationMinutes);
      const canAfford = wallet.balance >= requiredTokens;
      const shortfall = canAfford ? 0 : requiredTokens - wallet.balance;

      return {
        canAfford,
        requiredTokens,
        currentBalance: wallet.balance,
        shortfall
      };
    } catch (error) {
      console.error('Error checking class affordability:', error);
      return {
        canAfford: false,
        requiredTokens: 0,
        currentBalance: 0,
        shortfall: 0
      };
    }
  }

  /**
   * Get token pricing for students
   */
  static async getTokenPricing(): Promise<{ tokensPerDollar: number; dollarsPerToken: number } | null> {
    try {
      const pricing = await tokenService.getTokenPricing('student');
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
   * Convert tokens to USD for student display
   */
  static tokensToUSD(tokens: number): number {
    return tokenService.tokensToUSDForStudent(tokens);
  }

  /**
   * Convert USD to tokens for student purchase
   */
  static usdToTokens(usd: number): number {
    return tokenService.usdToTokensForUser('student', usd);
  }

  /**
   * Create token purchase request (placeholder for payment integration)
   */
  static async createTokenPurchaseRequest(
    studentId: string,
    amountUSD: number,
    paymentMethodId: string,
    provider: 'stripe' | 'mpesa' = 'stripe'
  ): Promise<{ success: boolean; error?: string; purchaseRequest?: TokenPurchaseRequest }> {
    try {
      const tokensToReceive = this.usdToTokens(amountUSD);
      
      const purchaseRequest: TokenPurchaseRequest = {
        amount_usd: amountUSD,
        tokens_to_receive: tokensToReceive,
        payment_method_id: paymentMethodId,
        provider: provider
      };

      // TODO: Integrate with Stripe/M-Pesa payment processing
      // For now, return the request structure
      return {
        success: true,
        purchaseRequest
      };
    } catch (error) {
      console.error('Error creating token purchase request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create purchase request'
      };
    }
  }

  /**
   * Get student's class sessions
   */
  static async getStudentSessions(
    studentId: string,
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('class_sessions')
        .select(`
          *,
          teachers:teacher_id (
            profiles (
              full_name
            )
          ),
          classes (
            title
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        // Note: This would need to be filtered in the query above
        return data?.filter(session => session.status === status) || [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching student sessions:', error);
      return [];
    }
  }
}
