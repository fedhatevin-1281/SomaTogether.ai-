import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Loader2, DollarSign, CreditCard, Smartphone, Globe } from 'lucide-react';
import { PaymentMethodSelector } from '../payment/PaymentMethodSelector';
import { PaystackPayment } from '../payment/PaystackPayment';
import { PaymentService } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';

interface WalletFundingProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function WalletFunding({ onSuccess, onCancel }: WalletFundingProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [10, 25, 50, 100, 200, 500];
  const tokens = Math.floor(parseFloat(amount) * 10); // 1 USD = 10 tokens

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
  };

  const handlePaymentSuccess = async (reference: string, method: string) => {
    setIsProcessing(true);
    try {
      // The payment has already been processed by the payment method component
      // We just need to refresh the wallet data
      console.log('Payment successful:', { reference, method });
      onSuccess();
    } catch (error) {
      console.error('Error handling payment success:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  const handleBack = () => {
    setSelectedMethod(null);
  };

  if (selectedMethod === 'paystack') {
    return (
      <PaystackPayment
        amount={parseFloat(amount)}
        tokens={tokens}
        onSuccess={(reference) => handlePaymentSuccess(reference, 'paystack')}
        onError={handlePaymentError}
        onCancel={handleBack}
      />
    );
  }

  if (selectedMethod && selectedMethod !== 'paystack') {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">
            {selectedMethod === 'stripe' ? 'Stripe' : 
             selectedMethod === 'mpesa' ? 'M-Pesa' : 
             selectedMethod === 'bank_transfer' ? 'Bank Transfer' : 'Payment'} Payment
          </h3>
          <p className="text-gray-600">
            This payment method is not yet implemented.
          </p>
          <Button onClick={handleBack} variant="outline">
            Back to Payment Methods
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Add Funds to Wallet</h2>
        <p className="text-gray-600">
          Choose an amount and payment method to add tokens to your wallet
        </p>
      </div>

      {/* Amount Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-lg"
              min="1"
              step="0.01"
            />
          </div>

          <div>
            <Label>Quick Select</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant={amount === quickAmount.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAmountSelect(quickAmount)}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {amount && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">You will receive:</span>
                <Badge variant="secondary" className="text-lg">
                  {tokens} tokens
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Rate: $1.00 = 10 tokens
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Payment Method Selection */}
      {amount && parseFloat(amount) > 0 && (
        <PaymentMethodSelector
          amount={parseFloat(amount)}
          tokens={tokens}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={onCancel}
        />
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Information */}
      <div className="text-center text-sm text-gray-500 space-y-2">
        <p>🔒 All payments are secured and encrypted</p>
        <p>💳 Multiple payment methods available</p>
        <p>⚡ Tokens are added instantly after successful payment</p>
      </div>
    </div>
  );
}
