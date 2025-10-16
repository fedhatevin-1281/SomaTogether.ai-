// Database service for server-side operations
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoemhycHdjZmFja3FpbmF3b2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE2MDQsImV4cCI6MjA3NTU5NzYwNH0.tOHiPVTyyMh0a3tCl3YYtgVZEMEVmHvQlJ8QEs4bb8g';

const supabase = createClient(supabaseUrl, supabaseKey);

class DatabaseService {
  /**
   * Update user's token balance
   */
  static async updateUserTokens(userId, tokens, operation = 'add') {
    try {
      let updateQuery;
      
      if (operation === 'add') {
        updateQuery = supabase
          .from('wallets')
          .update({
            tokens: supabase.sql`tokens + ${tokens}`
          })
          .eq('user_id', userId);
      } else if (operation === 'subtract') {
        updateQuery = supabase
          .from('wallets')
          .update({
            tokens: supabase.sql`tokens - ${tokens}`
          })
          .eq('user_id', userId);
      } else {
        updateQuery = supabase
          .from('wallets')
          .update({
            tokens: tokens
          })
          .eq('user_id', userId);
      }

      const { error } = await updateQuery;
      
      if (error) {
        console.error('Error updating user tokens:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create transaction record
   */
  static async createTransactionRecord(transactionData) {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: transactionData.userId,
          wallet_id: transactionData.userId,
          type: transactionData.type,
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          description: transactionData.description,
          status: transactionData.status || 'completed',
          reference_id: transactionData.referenceId,
          metadata: transactionData.metadata || {}
        });

      if (error) {
        console.error('Error creating transaction record:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating transaction record:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update transaction status
   */
  static async updateTransactionStatus(paymentIntentId, status) {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: status,
          processed_at: new Date().toISOString()
        })
        .eq('reference_id', paymentIntentId);

      if (error) {
        console.error('Error updating transaction status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update withdrawal request status
   */
  static async updateWithdrawalStatus(teacherId, transferId, status) {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: status,
          reference_id: transferId,
          processed_at: new Date().toISOString()
        })
        .eq('teacher_id', teacherId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error updating withdrawal status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user wallet balance
   */
  static async getUserWallet(userId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user wallet:', error);
        return { success: false, error: error.message };
      }

      return { success: true, wallet: data };
    } catch (error) {
      console.error('Error fetching user wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create payment method record
   */
  static async createPaymentMethod(paymentMethodData) {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: paymentMethodData.userId,
          type: paymentMethodData.type,
          provider: paymentMethodData.provider,
          provider_id: paymentMethodData.providerId,
          last_four: paymentMethodData.lastFour,
          is_default: paymentMethodData.isDefault || false,
          is_verified: true
        });

      if (error) {
        console.error('Error creating payment method:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process session payment
   */
  static async processSessionPayment(sessionData) {
    try {
      const { studentId, teacherId, tokens, sessionCostUSD, teacherEarningsUSD } = sessionData;

      // Deduct tokens from student
      const studentUpdate = await this.updateUserTokens(studentId, tokens, 'subtract');
      if (!studentUpdate.success) {
        return studentUpdate;
      }

      // Add tokens to teacher
      const teacherTokens = Math.floor(teacherEarningsUSD / 0.04); // Convert USD to tokens at teacher rate
      const teacherUpdate = await this.updateUserTokens(teacherId, teacherTokens, 'add');
      if (!teacherUpdate.success) {
        return teacherUpdate;
      }

      // Create transaction records
      const studentTransaction = await this.createTransactionRecord({
        userId: studentId,
        type: 'payment',
        amount: -sessionCostUSD,
        currency: 'USD',
        description: `Session payment - ${tokens} tokens`,
        referenceId: sessionData.sessionId,
        metadata: {
          tokens_spent: tokens,
          teacher_id: teacherId,
          session_id: sessionData.sessionId
        }
      });

      const teacherTransaction = await this.createTransactionRecord({
        userId: teacherId,
        type: 'payment',
        amount: teacherEarningsUSD,
        currency: 'USD',
        description: `Session earnings - ${teacherTokens} tokens`,
        referenceId: sessionData.sessionId,
        metadata: {
          tokens_earned: teacherTokens,
          student_id: studentId,
          session_id: sessionData.sessionId
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error processing session payment:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DatabaseService;

