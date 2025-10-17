// Paystack Webhook Handler
import { supabase } from '../supabaseClient';
import { PaystackService } from '../services/paystackService';

export interface PaystackWebhookEvent {
  event: string;
  data: {
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
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      metadata: any;
      created_at: string;
      updated_at: string;
    };
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

export class PaystackWebhookHandler {
  private static instance: PaystackWebhookHandler;
  private paystackService: PaystackService;

  constructor() {
    this.paystackService = PaystackService.getInstance();
  }

  public static getInstance(): PaystackWebhookHandler {
    if (!PaystackWebhookHandler.instance) {
      PaystackWebhookHandler.instance = new PaystackWebhookHandler();
    }
    return PaystackWebhookHandler.instance;
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(payload: string, signature: string, secret: string): boolean {
    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(
    event: PaystackWebhookEvent,
    signature: string,
    secret: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify webhook signature
      const payload = JSON.stringify(event);
      if (!this.verifySignature(payload, signature, secret)) {
        console.error('Invalid webhook signature');
        return { success: false, error: 'Invalid signature' };
      }

      // Store webhook event
      const { error: webhookError } = await supabase
        .from('paystack_webhook_events')
        .insert({
          event_type: event.event,
          paystack_event_id: event.data.id.toString(),
          transaction_reference: event.data.reference,
          user_id: event.data.metadata?.user_id || null,
          amount: event.data.amount / 100, // Convert from kobo
          currency: event.data.currency,
          status: event.data.status,
          raw_data: event,
          processed: false
        });

      if (webhookError) {
        console.error('Error storing webhook event:', webhookError);
        return { success: false, error: 'Failed to store webhook event' };
      }

      // Process different event types
      switch (event.event) {
        case 'charge.success':
          return await this.handleChargeSuccess(event);
        case 'charge.failed':
          return await this.handleChargeFailed(event);
        case 'transfer.success':
          return await this.handleTransferSuccess(event);
        case 'transfer.failed':
          return await this.handleTransferFailed(event);
        default:
          console.log(`Unhandled webhook event: ${event.event}`);
          return { success: true };
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Handle successful charge
   */
  private async handleChargeSuccess(event: PaystackWebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = event;
      const userId = data.metadata?.user_id;
      const tokens = data.metadata?.tokens;

      if (!userId || !tokens) {
        console.error('Missing user_id or tokens in metadata');
        return { success: false, error: 'Invalid metadata' };
      }

      // Process payment success
      const result = await this.paystackService.handlePaymentSuccess({
        id: data.id,
        domain: data.domain,
        status: data.status,
        reference: data.reference,
        amount: data.amount,
        message: data.message,
        gateway_response: data.gateway_response,
        paid_at: data.paid_at,
        created_at: data.created_at,
        channel: data.channel,
        currency: data.currency,
        ip_address: data.ip_address,
        metadata: data.metadata,
        log: data.log,
        fees: data.fees,
        fees_split: data.fees_split,
        authorization: data.authorization,
        customer: data.customer,
        plan: data.plan,
        split: data.split,
        order_id: data.order_id,
        paidAt: data.paidAt,
        createdAt: data.createdAt,
        requested_amount: data.requested_amount,
        pos_transaction_data: data.pos_transaction_data,
        source: data.source,
        fees_breakdown: data.fees_breakdown
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Mark webhook as processed
      await supabase
        .from('paystack_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('paystack_event_id', data.id.toString());

      return { success: true };
    } catch (error) {
      console.error('Error handling charge success:', error);
      return { success: false, error: 'Failed to process charge success' };
    }
  }

  /**
   * Handle failed charge
   */
  private async handleChargeFailed(event: PaystackWebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = event;
      const reference = data.reference;

      // Update payment session status
      await supabase
        .from('paystack_payment_sessions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('reference', reference);

      // Mark webhook as processed
      await supabase
        .from('paystack_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('paystack_event_id', data.id.toString());

      return { success: true };
    } catch (error) {
      console.error('Error handling charge failure:', error);
      return { success: false, error: 'Failed to process charge failure' };
    }
  }

  /**
   * Handle successful transfer (for teacher withdrawals)
   */
  private async handleTransferSuccess(event: PaystackWebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = event;
      const transferCode = data.reference;

      // Update withdrawal request status
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          provider_transaction_id: data.id.toString(),
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('reference_id', transferCode);

      // Mark webhook as processed
      await supabase
        .from('paystack_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('paystack_event_id', data.id.toString());

      return { success: true };
    } catch (error) {
      console.error('Error handling transfer success:', error);
      return { success: false, error: 'Failed to process transfer success' };
    }
  }

  /**
   * Handle failed transfer
   */
  private async handleTransferFailed(event: PaystackWebhookEvent): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = event;
      const transferCode = data.reference;

      // Update withdrawal request status
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'failed',
          failure_reason: data.message,
          updated_at: new Date().toISOString()
        })
        .eq('reference_id', transferCode);

      // Mark webhook as processed
      await supabase
        .from('paystack_webhook_events')
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq('paystack_event_id', data.id.toString());

      return { success: true };
    } catch (error) {
      console.error('Error handling transfer failure:', error);
      return { success: false, error: 'Failed to process transfer failure' };
    }
  }

  /**
   * Get webhook processing statistics
   */
  async getWebhookStats(): Promise<{
    totalEvents: number;
    processedEvents: number;
    pendingEvents: number;
    successRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('paystack_webhook_events')
        .select('processed');

      if (error) {
        console.error('Error fetching webhook stats:', error);
        return { totalEvents: 0, processedEvents: 0, pendingEvents: 0, successRate: 0 };
      }

      const totalEvents = data?.length || 0;
      const processedEvents = data?.filter(event => event.processed).length || 0;
      const pendingEvents = totalEvents - processedEvents;
      const successRate = totalEvents > 0 ? (processedEvents / totalEvents) * 100 : 0;

      return {
        totalEvents,
        processedEvents,
        pendingEvents,
        successRate
      };
    } catch (error) {
      console.error('Error calculating webhook stats:', error);
      return { totalEvents: 0, processedEvents: 0, pendingEvents: 0, successRate: 0 };
    }
  }
}
