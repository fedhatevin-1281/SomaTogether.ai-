import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Check, CreditCard, DollarSign, Gift, Star, Zap } from 'lucide-react';
import { TokenService, TokenPackage } from '../../services/tokenService';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentMethodSelector } from '../payment/PaymentMethodSelector';

interface TokenPurchaseProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function TokenPurchase({ onBack, onSuccess }: TokenPurchaseProps) {
  const { user, profile } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const tokenPackages = TokenService.getTokenPackages();

  const handlePackageSelect = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setCustomAmount('');
    setError('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedPackage(null);
    setError('');
  };

  const getTotalTokens = (): number => {
    if (selectedPackage) {
      return selectedPackage.tokens + (selectedPackage.bonus_tokens || 0);
    }
    if (customAmount) {
      const tokens = parseInt(customAmount);
      return isNaN(tokens) ? 0 : tokens;
    }
    return 0;
  };

  const getTotalPrice = (): number => {
    if (selectedPackage) {
      return selectedPackage.price_usd;
    }
    if (customAmount) {
      const tokens = parseInt(customAmount);
      return isNaN(tokens) ? 0 : TokenService.calculatePurchaseAmount(tokens, 'student');
    }
    return 0;
  };

  const getHoursOfLearning = (): number => {
    const tokens = getTotalTokens();
    return tokens / TokenService.SESSION_RATE;
  };

  const validatePurchase = (): { valid: boolean; error?: string } => {
    if (selectedPackage) {
      return TokenService.validateTokenPurchase(selectedPackage.tokens, 'student');
    }
    if (customAmount) {
      const tokens = parseInt(customAmount);
      if (isNaN(tokens) || tokens <= 0) {
        return { valid: false, error: 'Please enter a valid number of tokens' };
      }
      return TokenService.validateTokenPurchase(tokens, 'student');
    }
    return { valid: false, error: 'Please select a package or enter custom amount' };
  };

  const handlePurchase = () => {
    const validation = validatePurchase();
    if (!validation.valid) {
      setError(validation.error || 'Invalid purchase request');
      return;
    }

    setError('');
    setShowPaymentMethods(true);
  };

  const handlePaymentSuccess = (reference: string, method: string) => {
    console.log('Payment successful:', { reference, method });
    setShowPaymentMethods(false);
    onSuccess();
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setShowPaymentMethods(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          ←
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Purchase Tokens</h1>
          <p className="text-slate-600">Buy tokens to book learning sessions with teachers</p>
        </div>
      </div>

      {/* Token Economy Info */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">How Token Economy Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-600">Session Rate</p>
                <p>10 tokens = 1 hour of learning</p>
              </div>
              <div>
                <p className="font-medium text-green-600">Token Value</p>
                <p>1 token = $0.10 USD</p>
              </div>
              <div>
                <p className="font-medium text-purple-600">Minimum Purchase</p>
                <p>100 tokens = $10 USD</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Packages */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Choose Your Package</h2>
          
          {/* Predefined Packages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokenPackages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`p-6 cursor-pointer transition-all ${
                  selectedPackage?.id === pkg.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                } ${pkg.is_popular ? 'border-blue-200' : ''}`}
                onClick={() => handlePackageSelect(pkg)}
              >
                {pkg.is_popular && (
                  <div className="flex items-center justify-center mb-4">
                    <Badge className="bg-blue-100 text-blue-800">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">{pkg.tokens} Tokens</h3>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-3xl font-bold text-green-600">${pkg.price_usd}</span>
                    {pkg.bonus_tokens && (
                      <Badge className="bg-green-100 text-green-800">
                        +{pkg.bonus_tokens} bonus
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>
                  
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>≈ {Math.floor((pkg.tokens + (pkg.bonus_tokens || 0)) / 10)} hours of learning</p>
                    <p>Rate: ${(pkg.price_usd / (pkg.tokens + (pkg.bonus_tokens || 0))).toFixed(3)} per token</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Custom Amount */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Or Enter Custom Amount</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Tokens</label>
                <Input
                  type="number"
                  placeholder="Enter tokens (minimum 100)"
                  value={customAmount}
                  onChange={(e) => handleCustomAmount(e.target.value)}
                  min="100"
                  max="10000"
                />
              </div>
              
              {customAmount && parseInt(customAmount) >= 100 && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Total Cost:</span>
                    <span className="font-bold">${TokenService.calculatePurchaseAmount(parseInt(customAmount), 'student').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Learning Hours:</span>
                    <span>{Math.floor(parseInt(customAmount) / 10)} hours</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            {getTotalTokens() > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Tokens:</span>
                  <span className="font-medium">{getTotalTokens()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Learning Hours:</span>
                  <span className="font-medium">{getHoursOfLearning().toFixed(1)} hours</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">${getTotalPrice().toFixed(2)}</span>
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handlePurchase}
                  disabled={getTotalTokens() === 0}
                >
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Choose Payment Method</span>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Gift className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Select a package or enter custom amount</p>
              </div>
            )}
          </Card>

          {/* Benefits */}
          <Card className="p-6 bg-green-50">
            <h4 className="font-semibold mb-3 text-green-800">Why Choose Tokens?</h4>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Flexible learning schedule</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>No subscription commitments</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Bonus tokens on larger packages</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-4 w-4" />
                <span>Secure payment processing</span>
              </li>
            </ul>
          </Card>

          {/* Payment Methods */}
          <Card className="p-6">
            <h4 className="font-semibold mb-3">Accepted Payment Methods</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>Credit Cards</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span>Debit Cards</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Method Selector Modal */}
      {showPaymentMethods && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PaymentMethodSelector
              amount={selectedPackage ? selectedPackage.price_usd : TokenService.calculatePurchaseAmount(parseInt(customAmount), 'student')}
              tokens={getTotalTokens()}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={() => setShowPaymentMethods(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

