import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51R6L8gGKX9rP0035KKyzMy3GYi4wL6aiVALtV6D2KsypKbr37kCAaLe7ADWKbj4f1Y3hyEwaUbNO0LqVyfauCK1x00u3bRQoHz';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export interface PaymentIntentData {
  amount: number; // Amount in cents
  currency: string;
  metadata: {
    userId: string;
    userRole: 'student' | 'teacher';
    tokenPackage?: string;
    tokens?: number;
    description?: string;
  };
}

export interface PaymentMethodData {
  type: 'card';
  card: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details: {
    name: string;
    email: string;
  };
}

export class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    this.initializeStripe();
  }

  private async initializeStripe() {
    this.stripe = await getStripe();
  }

  /**
   * Create a payment intent for token purchase
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<{ 
    clientSecret: string; 
    paymentIntentId: string;
  }> {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();
      return { clientSecret, paymentIntentId };

    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm payment with Stripe
   */
  async confirmPayment(
    clientSecret: string,
    paymentMethod?: any
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const { error } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: 'Payment confirmation failed' };
    }
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(data: PaymentMethodData): Promise<{
    success: boolean;
    paymentMethod?: any;
    error?: string;
  }> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: data.card,
        billing_details: data.billing_details,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, paymentMethod };

    } catch (error) {
      console.error('Error creating payment method:', error);
      return { success: false, error: 'Failed to create payment method' };
    }
  }

  /**
   * Setup payment form with Stripe Elements
   */
  async setupPaymentForm(
    elements: any,
    clientSecret: string,
    formData: {
      name: string;
      email: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const { error } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement('card'),
          billing_details: {
            name: formData.name,
            email: formData.email,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Error setting up payment:', error);
      return { success: false, error: 'Payment setup failed' };
    }
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/payment-methods?customer_id=${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const { paymentMethods } = await response.json();
      return paymentMethods || [];

    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(userData: {
    email: string;
    name: string;
    userId: string;
  }): Promise<{ customerId: string } | null> {
    try {
      const response = await fetch('/api/create-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const { customerId } = await response.json();
      return { customerId };

    } catch (error) {
      console.error('Error creating customer:', error);
      return null;
    }
  }

  /**
   * Process teacher withdrawal
   */
  async processWithdrawal(data: {
    teacherId: string;
    amount: number; // Amount in cents
    bankAccount: {
      account_number: string;
      routing_number: string;
      account_holder_name: string;
      account_holder_type: 'individual' | 'company';
    };
  }): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
      const response = await fetch('/api/process-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to process withdrawal');
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error processing withdrawal:', error);
      return { success: false, error: 'Withdrawal processing failed' };
    }
  }
}

// Singleton instance
let stripeServiceInstance: StripeService | null = null;

export function getStripeService(): StripeService {
  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeService();
  }
  return stripeServiceInstance;
}

// Helper function to format amount for Stripe (convert dollars to cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (convert cents to dollars)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}

