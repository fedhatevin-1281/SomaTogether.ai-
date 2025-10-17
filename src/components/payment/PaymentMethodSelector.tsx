import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CreditCard, Smartphone, Building2, Globe } from 'lucide-react';
import { PaystackPayment } from './PaystackPayment';

interface PaymentMethodSelectorProps {
  amount: number;
  tokens: number;
  onSuccess: (reference: string, method: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

type PaymentMethod = 'stripe' | 'paystack' | 'mpesa' | 'bank_transfer';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  features: string[];
  processingTime: string;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Cards, Bank Transfer, Mobile Money',
    icon: <Globe className="h-6 w-6" />,
    available: true,
    features: ['Visa/Mastercard', 'Bank Transfer', 'Mobile Money', 'Multi-currency'],
    processingTime: 'Instant'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'International Cards',
    icon: <CreditCard className="h-6 w-6" />,
    available: true,
    features: ['Visa/Mastercard', 'International', 'Apple Pay', 'Google Pay'],
    processingTime: 'Instant'
  },
  {
    id: 'mpesa',
    name: 'M-Pesa',
    description: 'Mobile Money (Kenya)',
    icon: <Smartphone className="h-6 w-6" />,
    available: true,
    features: ['Mobile Money', 'Kenya Only', 'SMS Confirmation'],
    processingTime: '1-2 minutes'
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Direct Bank Transfer',
    icon: <Building2 className="h-6 w-6" />,
    available: false,
    features: ['Bank Transfer', 'Manual Processing'],
    processingTime: '1-3 business days'
  }
];

export function PaymentMethodSelector({ amount, tokens, onSuccess, onError, onCancel }: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleMethodSelect = (method: PaymentMethod) => {
    if (paymentMethods.find(m => m.id === method)?.available) {
      setSelectedMethod(method);
    }
  };

  const handlePaymentSuccess = (reference: string) => {
    onSuccess(reference, selectedMethod || '');
  };

  const handleBack = () => {
    setSelectedMethod(null);
  };

  if (selectedMethod === 'paystack') {
    return (
      <PaystackPayment
        amount={amount}
        tokens={tokens}
        onSuccess={handlePaymentSuccess}
        onError={onError}
        onCancel={handleBack}
      />
    );
  }

  // For other payment methods, you would render their respective components
  if (selectedMethod) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">
            {paymentMethods.find(m => m.id === selectedMethod)?.name} Payment
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
        <h3 className="text-xl font-semibold mb-2">Choose Payment Method</h3>
        <p className="text-gray-600">
          Purchase {tokens} tokens for ${amount.toFixed(2)} USD
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={`p-4 cursor-pointer transition-all duration-200 ${
              method.available
                ? 'hover:shadow-md hover:border-blue-300'
                : 'opacity-50 cursor-not-allowed'
            } ${
              selectedMethod === method.id
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'border-gray-200'
            }`}
            onClick={() => handleMethodSelect(method.id)}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    method.available ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {method.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{method.name}</h4>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
                {method.available ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Available
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                    Coming Soon
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {method.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Processing time: {method.processingTime}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center space-x-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>🔒 All payments are secured and encrypted</p>
        <p>Your payment information is never stored on our servers</p>
      </div>
    </div>
  );
}
