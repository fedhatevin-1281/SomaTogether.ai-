import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Load Stripe outside of component to avoid recreating Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

interface StripePaymentProps {
  amount: number;
  tokens: number;
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const CheckoutForm = ({ onSuccess, onError, amount, tokens }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Avoid automatic redirect to allow SPA handling
    });

    if (error) {
      onError(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    } else {
      onError('Payment status is unknown');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex space-x-3 mt-6">
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
};

export function StripePayment({ amount, tokens, onSuccess, onError, onCancel }: StripePaymentProps) {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializePaymentIntent = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('http://localhost:3001/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // amount in cents
            currency: 'usd',
            metadata: {
              userId: user.id,
              userRole: user.user_metadata?.role || 'student',
              tokens: tokens.toString(),
              description: `Purchase of ${tokens} tokens`
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to initialize payment');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        onError('Could not initialize Stripe payment. Please check your connection.');
      } finally {
        setIsInitializing(false);
      }
    };

    initializePaymentIntent();
  }, [amount, tokens, user, onError]);

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Pay with Stripe</h3>
          <p className="text-gray-600">
            Purchase {tokens} tokens for ${amount.toFixed(2)} USD
          </p>
        </div>

        {isInitializing && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-500">Loading secure checkout...</p>
          </div>
        )}

        {!isInitializing && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm 
              onSuccess={onSuccess} 
              onError={onError} 
              amount={amount} 
              tokens={tokens} 
            />
          </Elements>
        )}

        {!isInitializing && (
          <div className="flex justify-center">
             <Button variant="outline" onClick={onCancel} className="mt-4 w-full">
               Cancel
             </Button>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <p>🔒 Your payment is secured by Stripe</p>
          <p>We do not store your full card details</p>
        </div>
      </div>
    </Card>
  );
}
