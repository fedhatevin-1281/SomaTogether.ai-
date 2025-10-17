// Paystack API Endpoints
import { Request, Response } from 'express';
import { PaystackService } from '../services/paystackService';
import { PaymentService } from '../services/paymentService';
import { PaystackWebhookHandler } from './paystack-webhook';

const paystackService = PaystackService.getInstance();
const webhookHandler = PaystackWebhookHandler.getInstance();

/**
 * Initialize Paystack payment
 */
export const initializePaystackPayment = async (req: Request, res: Response) => {
  try {
    const { userId, userEmail, amount, tokens, currency = 'NGN' } = req.body;

    if (!userId || !userEmail || !amount || !tokens) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, userEmail, amount, tokens'
      });
    }

    const result = await PaymentService.initializePaystackPayment(
      userId,
      userEmail,
      amount,
      tokens,
      currency
    );

    if (result.success) {
      res.json({
        success: true,
        data: {
          authorizationUrl: result.authorizationUrl,
          reference: result.reference
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Initialize Paystack payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Verify Paystack payment
 */
export const verifyPaystackPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Payment reference is required'
      });
    }

    const result = await PaymentService.verifyPaystackPayment(reference);

    if (result.success) {
      res.json({
        success: true,
        data: result.transaction
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Verify Paystack payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get Paystack payment session
 */
export const getPaystackPaymentSession = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Payment reference is required'
      });
    }

    const result = await PaymentService.getPaystackPaymentSession(reference);

    if (result.success) {
      res.json({
        success: true,
        data: result.session
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get Paystack payment session error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Create Paystack customer
 */
export const createPaystackCustomer = async (req: Request, res: Response) => {
  try {
    const { email, first_name, last_name, phone, metadata } = req.body;

    if (!email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, first_name, last_name'
      });
    }

    const result = await paystackService.createCustomer({
      email,
      first_name,
      last_name,
      phone,
      metadata
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create Paystack customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get Paystack customer
 */
export const getPaystackCustomer = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Customer email is required'
      });
    }

    const result = await paystackService.getCustomer(email);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get Paystack customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Paystack webhook handler
 */
export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!signature || !secret) {
      return res.status(400).json({
        success: false,
        error: 'Missing signature or secret key'
      });
    }

    const event = req.body as any;

    const result = await webhookHandler.processWebhookEvent(
      event,
      signature,
      secret
    );

    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Paystack webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get supported currencies
 */
export const getSupportedCurrencies = async (req: Request, res: Response) => {
  try {
    const currencies = paystackService.getSupportedCurrencies();
    
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Get supported currencies error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get webhook statistics
 */
export const getWebhookStats = async (req: Request, res: Response) => {
  try {
    const stats = await webhookHandler.getWebhookStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get webhook stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
