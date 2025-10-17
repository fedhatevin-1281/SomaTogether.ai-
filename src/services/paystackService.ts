// Paystack Service - Handles Paystack payment processing
import { supabase } from '../supabaseClient';

export interface PaystackConfig {
  publicKey: string;
  secretKey: string;
  baseUrl: string;
}

export interface PaystackCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface PaystackTransaction {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: any;
  log: any;
  fees: number;
  fees_split: any;
  authorization: any;
  customer: PaystackCustomer;
  plan: any;
  split: any;
  order_id: any;
  paidAt: string;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data: any;
  source: any;
  fees_breakdown: any;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackTransaction;
}

export class PaystackService {
  private static instance: PaystackService;
  private config: PaystackConfig;

  constructor() {
    this.config = {
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
      secretKey: import.meta.env.VITE_PAYSTACK_SECRET_KEY || '',
      baseUrl: 'https://api.paystack.co'
    };
  }

  public static getInstance(): PaystackService {
    if (!PaystackService.instance) {
      PaystackService.instance = new PaystackService();
    }
    return PaystackService.instance;
  }

  /**
   * Initialize a Paystack payment
   */
  async initializePayment(data: {
    email: string;
    amount: number; // Amount in kobo (smallest currency unit)
    currency?: string;
    reference?: string;
    callback_url?: string;
    metadata?: any;
  }): Promise<{ success: boolean; data?: PaystackInitializeResponse; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          amount: data.amount,
          currency: data.currency || 'NGN',
          reference: data.reference || this.generateReference(),
          callback_url: data.callback_url,
          metadata: data.metadata || {}
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Failed to initialize payment' };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return { success: false, error: 'Network error during payment initialization' };
    }
  }

  /**
   * Verify a Paystack transaction
   */
  async verifyTransaction(reference: string): Promise<{ success: boolean; data?: PaystackVerifyResponse; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Failed to verify transaction' };
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Paystack verification error:', error);
      return { success: false, error: 'Network error during transaction verification' };
    }
  }

  /**
   * Create or get Paystack customer
   */
  async createCustomer(customerData: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    metadata?: any;
  }): Promise<{ success: boolean; data?: PaystackCustomer; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/customer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Failed to create customer' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Paystack customer creation error:', error);
      return { success: false, error: 'Network error during customer creation' };
    }
  }

  /**
   * Get customer by email
   */
  async getCustomer(email: string): Promise<{ success: boolean; data?: PaystackCustomer; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/customer/${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.message || 'Customer not found' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Paystack customer fetch error:', error);
      return { success: false, error: 'Network error during customer fetch' };
    }
  }

  /**
   * Create payment method for recurring payments
   */
  async createPaymentMethod(userId: string, customerData: any): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> {
    try {
      // Store Paystack customer data as payment method
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: userId,
          type: 'card',
          provider: 'paystack',
          provider_id: customerData.id.toString(),
          account_holder_name: `${customerData.first_name} ${customerData.last_name}`,
          is_default: false,
          is_verified: true,
          verification_status: 'verified',
          metadata: {
            paystack_customer_id: customerData.id,
            email: customerData.email,
            phone: customerData.phone,
            created_at: customerData.created_at
          }
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating Paystack payment method:', error);
        return { success: false, error: 'Failed to save payment method' };
      }

      return { success: true, paymentMethodId: data.id };
    } catch (error) {
      console.error('Paystack payment method creation error:', error);
      return { success: false, error: 'Failed to create payment method' };
    }
  }

  /**
   * Process token purchase with Paystack
   */
  async purchaseTokens(
    userId: string,
    userEmail: string,
    amount: number,
    tokens: number,
    currency: string = 'NGN',
    reference?: string
  ): Promise<{ success: boolean; authorizationUrl?: string; reference?: string; error?: string }> {
    try {
      // Convert USD to NGN (approximate rate, should be dynamic)
      const ngnAmount = Math.round(amount * 1500); // 1 USD ≈ 1500 NGN

      const initResult = await this.initializePayment({
        email: userEmail,
        amount: ngnAmount,
        currency: currency,
        reference: reference || this.generateReference(),
        metadata: {
          user_id: userId,
          tokens: tokens,
          amount_usd: amount,
          platform: 'SomaTogether.ai'
        }
      });

      if (!initResult.success) {
        return { success: false, error: initResult.error };
      }

      return {
        success: true,
        authorizationUrl: initResult.data?.data.authorization_url,
        reference: initResult.data?.data.reference
      };
    } catch (error) {
      console.error('Paystack token purchase error:', error);
      return { success: false, error: 'Failed to process token purchase' };
    }
  }

  /**
   * Handle successful payment webhook
   */
  async handlePaymentSuccess(transaction: PaystackTransaction): Promise<{ success: boolean; error?: string }> {
    try {
      const { user_id, tokens, amount_usd } = transaction.metadata;

      if (!user_id || !tokens) {
        return { success: false, error: 'Invalid transaction metadata' };
      }

      // Update user's token balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (walletError) {
        console.error('Error fetching wallet:', walletError);
        return { success: false, error: 'Wallet not found' };
      }

      // Add tokens to wallet
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          tokens: wallet.tokens + parseInt(tokens),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Error updating wallet:', updateError);
        return { success: false, error: 'Failed to update wallet' };
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: user_id,
          type: 'purchase',
          amount_tokens: parseInt(tokens),
          amount_usd: parseFloat(amount_usd),
          token_rate: parseFloat(amount_usd) / parseInt(tokens),
          description: `Token purchase via Paystack - ${tokens} tokens`,
          related_entity_type: 'purchase',
          status: 'completed',
          reference_id: transaction.reference,
          metadata: {
            paystack_transaction_id: transaction.id,
            paystack_reference: transaction.reference,
            payment_method: 'paystack',
            currency: transaction.currency
          }
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        return { success: false, error: 'Failed to create transaction record' };
      }

      return { success: true };
    } catch (error) {
      console.error('Paystack payment success handling error:', error);
      return { success: false, error: 'Failed to process payment success' };
    }
  }

  /**
   * Generate unique reference
   */
  private generateReference(): string {
    return `SOMA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return ['NGN', 'GHS', 'ZAR', 'KES', 'USD'];
  }

  /**
   * Convert USD to local currency
   */
  convertToLocalCurrency(amountUSD: number, currency: string): number {
    const rates: { [key: string]: number } = {
      'NGN': 1500, // Nigerian Naira
      'GHS': 12,   // Ghanaian Cedi
      'ZAR': 18,   // South African Rand
      'KES': 150,  // Kenyan Shilling
      'USD': 1     // US Dollar
    };

    return Math.round(amountUSD * (rates[currency] || 1));
  }
}
