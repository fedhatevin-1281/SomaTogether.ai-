import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Loader2, CreditCard, Globe, CheckCircle, XCircle } from 'lucide-react';
import { PaystackService } from '../../services/paystackService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

interface PaystackPaymentProps {
  amount: number;
  tokens: number;
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentSession {
  reference: string;
  authorizationUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export function PaystackPayment({ amount, tokens, onSuccess, onError, onCancel }: PaystackPaymentProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState('KES');
  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const paystackService = PaystackService.getInstance();
  const supportedCurrencies = paystackService.getSupportedCurrencies();

  // Convert USD to selected currency
  const localAmount = paystackService.convertToLocalCurrency(amount, selectedCurrency);

  useEffect(() => {
    // Pre-fill user data if available
    if (user) {
      setEmail(user.email || '');
      // You might want to fetch user profile data here
    }
  }, [user]);

  const handleInitializePayment = async () => {
    if (!user || !email || !firstName || !lastName) {
      onError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Create payment session in database first
      const { data: sessionData, error: sessionError } = await supabase
        .rpc('initialize_paystack_payment', {
          p_user_id: user.id,
          p_amount_usd: amount,
          p_tokens: tokens,
          p_currency: selectedCurrency
        });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      const result = await paystackService.purchaseTokens(
        user.id,
        email,
        amount,
        tokens,
        selectedCurrency,
        sessionData.reference
      );

      if (result.success && result.authorizationUrl && result.reference) {
        setPaymentSession({
          reference: result.reference,
          authorizationUrl: result.authorizationUrl,
          status: 'pending'
        });
        
        // Open Paystack payment page
        window.open(result.authorizationUrl, '_blank');
        
        // Start polling for payment status
        startPaymentStatusPolling(result.reference);
      } else {
        onError(result.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      onError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const startPaymentStatusPolling = (reference: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Check database first for payment status
        const { data: dbResult, error: dbError } = await supabase
          .rpc('verify_paystack_payment', { p_reference: reference });

        if (dbError) {
          console.error('Database verification error:', dbError);
          return;
        }

        if (dbResult && dbResult.success) {
          if (dbResult.status === 'completed') {
            setPaymentSession(prev => prev ? { ...prev, status: 'completed' } : null);
            clearInterval(pollInterval);
            onSuccess(reference);
            return;
          } else if (dbResult.status === 'failed') {
            setPaymentSession(prev => prev ? { ...prev, status: 'failed' } : null);
            clearInterval(pollInterval);
            onError('Payment failed');
            return;
          }
        }

        // Fallback to Paystack API verification
        const result = await paystackService.verifyTransaction(reference);
        
        if (result.success && result.data) {
          const transaction = result.data.data;
          
          if (transaction.status === 'success') {
            setPaymentSession(prev => prev ? { ...prev, status: 'completed' } : null);
            clearInterval(pollInterval);
            onSuccess(reference);
          } else if (transaction.status === 'failed') {
            setPaymentSession(prev => prev ? { ...prev, status: 'failed' } : null);
            clearInterval(pollInterval);
            onError('Payment failed');
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentSession?.status === 'pending') {
        setPaymentSession(prev => prev ? { ...prev, status: 'cancelled' } : null);
        onError('Payment timeout');
      }
    }, 600000);
  };

  const getStatusIcon = () => {
    if (!paymentSession) return null;
    
    switch (paymentSession.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    if (!paymentSession) return '';
    
    switch (paymentSession.status) {
      case 'completed':
        return 'Payment completed successfully!';
      case 'failed':
        return 'Payment failed. Please try again.';
      case 'processing':
        return 'Processing payment...';
      case 'cancelled':
        return 'Payment was cancelled.';
      default:
        return 'Initializing payment...';
    }
  };

  if (paymentSession) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          <h3 className="text-lg font-semibold">Payment Status</h3>
          <p className="text-gray-600">{getStatusText()}</p>
          
          {paymentSession.status === 'pending' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Reference: {paymentSession.reference}
              </p>
              <p className="text-sm text-gray-500">
                Please complete the payment in the new tab that opened.
              </p>
            </div>
          )}
          
          {paymentSession.status === 'failed' && (
            <Button onClick={() => setPaymentSession(null)} className="w-full">
              Try Again
            </Button>
          )}
          
          {paymentSession.status === 'cancelled' && (
            <Button onClick={() => setPaymentSession(null)} className="w-full">
              Start Over
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Pay with Paystack</h3>
          <p className="text-gray-600">
            Purchase {tokens} tokens for ${amount.toFixed(2)} USD
          </p>
        </div>

        <div className="space-y-4">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {supportedCurrencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>{currency}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Amount: {localAmount.toLocaleString()} {selectedCurrency}
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
            />
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Tokens:</span>
            <Badge variant="secondary">{tokens} tokens</Badge>
          </div>
          <div className="flex justify-between">
            <span>Amount (USD):</span>
            <span>${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Amount ({selectedCurrency}):</span>
            <span>{localAmount.toLocaleString()} {selectedCurrency}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleInitializePayment}
            disabled={isLoading || !email || !firstName || !lastName}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay with Paystack'
            )}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 Your payment is secured by Paystack</p>
          <p>We support cards, bank transfers, and mobile money</p>
        </div>
      </div>
    </Card>
  );
}
