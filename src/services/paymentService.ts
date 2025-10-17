import { supabase } from '../supabaseClient';
import { PaystackService } from './paystackService';

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card' | 'paypal' | 'bank_account' | 'crypto';
  provider: 'stripe' | 'paypal' | 'wise' | 'binance' | 'mpesa' | 'bank_transfer' | 'paystack';
  provider_id: string;
  last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  bank_name?: string;
  account_holder_name?: string;
  is_default: boolean;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'failed' | 'expired';
  phone_number?: string;
  mpesa_account_name?: string;
  stripe_payment_method_id?: string;
  stripe_account_id?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  payment_method_id?: string;
  user_id: string;
  description: string;
  metadata: any;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  teacher_id: string;
  amount_usd: number;
  amount_tokens: number;
  payment_method_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processing_fee: number;
  net_amount: number;
  reference_id?: string;
  failure_reason?: string;
  provider: 'stripe' | 'mpesa' | 'bank_transfer' | 'paystack';
  provider_transaction_id?: string;
  provider_response?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

class PaymentService {
  /**
   * Initialize Stripe payment intent for token purchase
   */
  static async createPaymentIntent(
    userId: string,
    amount: number,
    currency: string = 'USD',
    description: string,
    metadata: any = {}
  ): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
    try {
      console.log('Creating payment intent:', { userId, amount, currency, description });

      // Call your backend API to create Stripe payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          description,
          metadata: {
            user_id: userId,
            ...metadata
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment intent creation failed:', errorData);
        return { success: false, error: errorData.message || 'Failed to create payment intent' };
      }

      const { clientSecret } = await response.json();
      return { success: true, clientSecret };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: 'Failed to create payment intent' };
    }
  }

  /**
   * Confirm payment and process token purchase
   */
  static async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      console.log('Confirming payment:', paymentIntentId);

      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          payment_method_id: paymentMethodId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment confirmation failed:', errorData);
        return { success: false, error: errorData.message || 'Payment confirmation failed' };
      }

      const { transaction_id } = await response.json();
      return { success: true, transactionId: transaction_id };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: 'Failed to confirm payment' };
    }
  }

  /**
   * Get user's payment methods
   */
  static async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_verified', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPaymentMethods:', error);
      return [];
    }
  }

  /**
   * Add Stripe payment method
   */
  static async addStripePaymentMethod(
    userId: string,
    paymentMethodId: string,
    isDefault: boolean = false
  ): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> {
    try {
      console.log('Adding Stripe payment method:', { userId, paymentMethodId });

      // Get payment method details from Stripe
      const response = await fetch('/api/get-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          payment_method_id: paymentMethodId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to get payment method details:', errorData);
        return { success: false, error: 'Failed to get payment method details' };
      }

      const paymentMethodData = await response.json();

      // Save to database
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          type: paymentMethodData.type === 'card' ? 'card' : 'bank_account',
          provider: 'stripe',
          provider_id: paymentMethodId,
          last_four: paymentMethodData.card?.last4,
          expiry_month: paymentMethodData.card?.exp_month,
          expiry_year: paymentMethodData.card?.exp_year,
          bank_name: paymentMethodData.card?.brand,
          is_default: isDefault,
          is_verified: true,
          verification_status: 'verified',
          stripe_payment_method_id: paymentMethodId,
          metadata: paymentMethodData
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving payment method:', error);
        return { success: false, error: 'Failed to save payment method' };
      }

      // Set as default if requested
      if (isDefault) {
        await this.setDefaultPaymentMethod(userId, data.id);
      }

      return { success: true, paymentMethodId: data.id };
    } catch (error) {
      console.error('Error adding Stripe payment method:', error);
      return { success: false, error: 'Failed to add payment method' };
    }
  }

  /**
   * Add M-Pesa payment method
   */
  static async addMpesaPaymentMethod(
    userId: string,
    phoneNumber: string,
    accountName: string,
    isDefault: boolean = false
  ): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> {
    try {
      console.log('Adding M-Pesa payment method:', { userId, phoneNumber, accountName });

      // Validate phone number format (Kenya)
      if (!this.isValidKenyanPhoneNumber(phoneNumber)) {
        return { success: false, error: 'Invalid phone number format. Please use format: +254XXXXXXXXX' };
      }

      // Save to database
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          type: 'bank_account',
          provider: 'mpesa',
          provider_id: phoneNumber,
          phone_number: phoneNumber,
          mpesa_account_name: accountName,
          account_holder_name: accountName,
          is_default: isDefault,
          is_verified: false,
          verification_status: 'pending',
          metadata: {}
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving M-Pesa payment method:', error);
        return { success: false, error: 'Failed to save M-Pesa payment method' };
      }

      // Set as default if requested
      if (isDefault) {
        await this.setDefaultPaymentMethod(userId, data.id);
      }

      // Send verification SMS (implement based on your SMS provider)
      await this.sendMpesaVerificationSMS(phoneNumber);

      return { success: true, paymentMethodId: data.id };
    } catch (error) {
      console.error('Error adding M-Pesa payment method:', error);
      return { success: false, error: 'Failed to add M-Pesa payment method' };
    }
  }

  /**
   * Set default payment method
   */
  static async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<boolean> {
    try {
      // Remove default from all other payment methods
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error setting default payment method:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setDefaultPaymentMethod:', error);
      return false;
    }
  }

  /**
   * Delete payment method
   */
  static async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId);

      if (error) {
        console.error('Error deleting payment method:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePaymentMethod:', error);
      return false;
    }
  }

  /**
   * Create withdrawal request for teacher
   */
  static async createWithdrawalRequest(
    teacherId: string,
    amountTokens: number,
    paymentMethodId: string,
    provider: 'stripe' | 'mpesa' | 'bank_transfer' = 'stripe'
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      console.log('Creating withdrawal request:', { teacherId, amountTokens, paymentMethodId, provider });

      // Get payment method details
      const { data: paymentMethod, error: pmError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', paymentMethodId)
        .eq('user_id', teacherId)
        .single();

      if (pmError || !paymentMethod) {
        return { success: false, error: 'Payment method not found' };
      }

      // Calculate amounts (assuming 10 tokens = $0.40 for teachers)
      const tokenRate = 0.04; // $0.40 / 10 tokens
      const amountUsd = amountTokens * tokenRate;
      const processingFee = this.calculateProcessingFee(amountUsd, provider);
      const netAmount = amountUsd - processingFee;

      // Create withdrawal request
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          teacher_id: teacherId,
          amount_usd: amountUsd,
          amount_tokens: amountTokens,
          payment_method_id: paymentMethodId,
          processing_fee: processingFee,
          net_amount: netAmount,
          provider,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating withdrawal request:', error);
        return { success: false, error: 'Failed to create withdrawal request' };
      }

      // Process withdrawal based on provider
      let processResult;
      switch (provider) {
        case 'stripe':
          processResult = await this.processStripeWithdrawal(data.id, paymentMethod, netAmount);
          break;
        case 'mpesa':
          processResult = await this.processMpesaWithdrawal(data.id, paymentMethod, netAmount);
          break;
        case 'bank_transfer':
          processResult = await this.processBankTransferWithdrawal(data.id, paymentMethod, netAmount);
          break;
        default:
          return { success: false, error: 'Unsupported payment provider' };
      }

      if (!processResult.success) {
        // Update withdrawal request status to failed
        await supabase
          .from('withdrawal_requests')
          .update({
            status: 'failed',
            failure_reason: processResult.error
          })
          .eq('id', data.id);

        return { success: false, error: processResult.error };
      }

      return { success: true, requestId: data.id };
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      return { success: false, error: 'Failed to create withdrawal request' };
    }
  }

  /**
   * Get withdrawal requests for teacher
   */
  static async getWithdrawalRequests(
    teacherId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ requests: WithdrawalRequest[], total: number }> {
    try {
      const { data, error, count } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact' })
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching withdrawal requests:', error);
        return { requests: [], total: 0 };
      }

      return {
        requests: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getWithdrawalRequests:', error);
      return { requests: [], total: 0 };
    }
  }

  /**
   * Process Stripe withdrawal
   */
  private static async processStripeWithdrawal(
    requestId: string,
    paymentMethod: PaymentMethod,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Implement Stripe transfer logic here
      // This would typically involve creating a transfer to the teacher's connected account
      
      console.log('Processing Stripe withdrawal:', { requestId, amount });
      
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update request status
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'processing',
          provider_transaction_id: `stripe_${Date.now()}`
        })
        .eq('id', requestId);

      return { success: true };
    } catch (error) {
      console.error('Error processing Stripe withdrawal:', error);
      return { success: false, error: 'Failed to process Stripe withdrawal' };
    }
  }

  /**
   * Process M-Pesa withdrawal
   */
  private static async processMpesaWithdrawal(
    requestId: string,
    paymentMethod: PaymentMethod,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Processing M-Pesa withdrawal:', { requestId, amount, phone: paymentMethod.phone_number });
      
      // Implement M-Pesa STK Push logic here
      // This would involve calling M-Pesa API to send money to the phone number
      
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update request status
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'processing',
          provider_transaction_id: `mpesa_${Date.now()}`
        })
        .eq('id', requestId);

      return { success: true };
    } catch (error) {
      console.error('Error processing M-Pesa withdrawal:', error);
      return { success: false, error: 'Failed to process M-Pesa withdrawal' };
    }
  }

  /**
   * Process bank transfer withdrawal
   */
  private static async processBankTransferWithdrawal(
    requestId: string,
    paymentMethod: PaymentMethod,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Processing bank transfer withdrawal:', { requestId, amount });
      
      // Implement bank transfer logic here
      // This would involve initiating a bank transfer
      
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update request status
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'processing',
          provider_transaction_id: `bank_${Date.now()}`
        })
        .eq('id', requestId);

      return { success: true };
    } catch (error) {
      console.error('Error processing bank transfer withdrawal:', error);
      return { success: false, error: 'Failed to process bank transfer withdrawal' };
    }
  }

  /**
   * Calculate processing fee
   */
  private static calculateProcessingFee(amount: number, provider: string): number {
    switch (provider) {
      case 'stripe':
        return Math.max(amount * 0.029 + 0.30, 0.50); // 2.9% + $0.30, minimum $0.50
      case 'mpesa':
        return Math.max(amount * 0.02, 0.10); // 2%, minimum $0.10
      case 'bank_transfer':
        return 1.00; // Fixed $1.00 fee
      default:
        return 0;
    }
  }

  /**
   * Validate Kenyan phone number
   */
  private static isValidKenyanPhoneNumber(phoneNumber: string): boolean {
    // Remove any spaces or dashes
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    
    // Check if it starts with +254 or 254
    if (cleaned.startsWith('+254')) {
      return /^\+254[0-9]{9}$/.test(cleaned);
    } else if (cleaned.startsWith('254')) {
      return /^254[0-9]{9}$/.test(cleaned);
    }
    
    return false;
  }

  /**
   * Send M-Pesa verification SMS
   */
  private static async sendMpesaVerificationSMS(phoneNumber: string): Promise<void> {
    try {
      // Implement SMS sending logic here
      console.log('Sending M-Pesa verification SMS to:', phoneNumber);
      
      // This would typically involve calling an SMS provider API
      // For now, just log the action
    } catch (error) {
      console.error('Error sending M-Pesa verification SMS:', error);
    }
  }

  /**
   * Initialize Paystack payment
   */
  static async initializePaystackPayment(
    userId: string,
    userEmail: string,
    amount: number,
    tokens: number,
    currency: string = 'NGN'
  ): Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string }> {
    try {
      const paystackService = PaystackService.getInstance();
      
      // Create payment session in database
      const { data: session, error: sessionError } = await supabase
        .from('paystack_payment_sessions')
        .insert({
          user_id: userId,
          reference: `SOMA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: amount,
          currency: currency,
          tokens: tokens,
          status: 'pending',
          metadata: {
            user_email: userEmail,
            platform: 'SomaTogether.ai'
          }
        })
        .select('reference')
        .single();

      if (sessionError) {
        console.error('Error creating payment session:', sessionError);
        return { success: false, error: 'Failed to create payment session' };
      }

      // Initialize payment with Paystack
      const result = await paystackService.purchaseTokens(
        userId,
        userEmail,
        amount,
        tokens,
        currency
      );

      if (result.success && result.authorizationUrl && result.reference) {
        // Update session with authorization URL
        await supabase
          .from('paystack_payment_sessions')
          .update({
            authorization_url: result.authorization_url,
            access_code: result.reference,
            status: 'processing'
          })
          .eq('reference', session.reference);

        return {
          success: true,
          authorizationUrl: result.authorizationUrl,
          reference: result.reference
        };
      }

      return { success: false, error: result.error || 'Failed to initialize payment' };
    } catch (error) {
      console.error('Paystack payment initialization error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Verify Paystack payment
   */
  static async verifyPaystackPayment(
    reference: string
  ): Promise<{ success: boolean; transaction?: any; error?: string }> {
    try {
      const paystackService = PaystackService.getInstance();
      const result = await paystackService.verifyTransaction(reference);

      if (result.success && result.data) {
        const transaction = result.data.data;
        
        // Update payment session status
        await supabase
          .from('paystack_payment_sessions')
          .update({
            status: transaction.status === 'success' ? 'completed' : 'failed',
            paystack_transaction_id: transaction.id,
            updated_at: new Date().toISOString()
          })
          .eq('reference', reference);

        // If successful, process the payment
        if (transaction.status === 'success') {
          const paymentResult = await paystackService.handlePaymentSuccess(transaction);
          if (!paymentResult.success) {
            return { success: false, error: paymentResult.error };
          }
        }

        return { success: true, transaction };
      }

      return { success: false, error: result.error || 'Payment verification failed' };
    } catch (error) {
      console.error('Paystack payment verification error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get Paystack payment session
   */
  static async getPaystackPaymentSession(
    reference: string
  ): Promise<{ success: boolean; session?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('paystack_payment_sessions')
        .select('*')
        .eq('reference', reference)
        .single();

      if (error) {
        return { success: false, error: 'Payment session not found' };
      }

      return { success: true, session: data };
    } catch (error) {
      console.error('Error fetching payment session:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get supported payment methods
   */
  static getSupportedPaymentMethods(): Array<{
    id: string;
    name: string;
    description: string;
    available: boolean;
    features: string[];
  }> {
    return [
      {
        id: 'paystack',
        name: 'Paystack',
        description: 'Cards, Bank Transfer, Mobile Money',
        available: true,
        features: ['Visa/Mastercard', 'Bank Transfer', 'Mobile Money', 'Multi-currency']
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'International Cards',
        available: true,
        features: ['Visa/Mastercard', 'International', 'Apple Pay', 'Google Pay']
      },
      {
        id: 'mpesa',
        name: 'M-Pesa',
        description: 'Mobile Money (Kenya)',
        available: true,
        features: ['Mobile Money', 'Kenya Only', 'SMS Confirmation']
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct Bank Transfer',
        available: false,
        features: ['Bank Transfer', 'Manual Processing']
      }
    ];
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ transactions: any[], total: number }> {
    try {
      const { data, error, count } = await supabase
        .from('token_transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching payment history:', error);
        return { transactions: [], total: 0 };
      }

      return {
        transactions: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      return { transactions: [], total: 0 };
    }
  }
}

export default PaymentService;
