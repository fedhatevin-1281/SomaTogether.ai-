import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { CreditCard, Shield, Clock, ArrowLeft, Check } from 'lucide-react';

interface PaymentScreenProps {
  teacher: any;
  onBack: () => void;
  onSuccess: () => void;
}

export function PaymentScreen({ teacher, onBack, onSuccess }: PaymentScreenProps) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [sessionType, setSessionType] = useState('single');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  const sessionOptions = [
    {
      id: 'single',
      title: 'Single Session',
      duration: '1 hour',
      price: teacher?.hourlyRate || 45,
      description: 'One-time session'
    },
    {
      id: 'package-4',
      title: '4-Session Package',
      duration: '4 hours total',
      price: (teacher?.hourlyRate || 45) * 4 * 0.9,
      originalPrice: (teacher?.hourlyRate || 45) * 4,
      description: 'Save 10% with package deal',
      popular: true
    },
    {
      id: 'package-8',
      title: '8-Session Package',
      duration: '8 hours total',
      price: (teacher?.hourlyRate || 45) * 8 * 0.85,
      originalPrice: (teacher?.hourlyRate || 45) * 8,
      description: 'Save 15% with package deal'
    }
  ];

  const selectedSession = sessionOptions.find(option => option.id === sessionType);
  const subtotal = selectedSession?.price || 0;
  const platformFee = subtotal * 0.05; // 5% platform fee
  const total = subtotal + platformFee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Book Session</h1>
          <p className="text-slate-600">Complete your booking with {teacher?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Selection */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Select Session Type</h3>
            <RadioGroup value={sessionType} onValueChange={setSessionType}>
              <div className="space-y-3">
                {sessionOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <label
                      htmlFor={option.id}
                      className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                        sessionType === option.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{option.title}</span>
                            {option.popular && (
                              <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                                Most Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{option.duration} • {option.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${option.price}</div>
                          {option.originalPrice && (
                            <div className="text-sm text-slate-500 line-through">${option.originalPrice}</div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="card" id="card" />
                  <label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                    <CreditCard className="h-5 w-5" />
                    <span>Credit/Debit Card</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <label htmlFor="paypal" className="cursor-pointer">PayPal</label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="apple" id="apple" />
                  <label htmlFor="apple" className="cursor-pointer">Apple Pay</label>
                </div>
              </div>
            </RadioGroup>
          </Card>

          {/* Card Details */}
          {paymentMethod === 'card' && (
            <Card className="p-6">
              <h3 className="font-bold text-lg mb-4">Card Details</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Billing Address */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Billing Address</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main Street" className="mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="New York" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="NY" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input id="zip" placeholder="10001" className="mt-1" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Teacher Info */}
          <Card className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={teacher?.image}
                alt={teacher?.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{teacher?.name}</h3>
                <p className="text-sm text-slate-600">{teacher?.subject}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Rating</span>
                <span className="font-medium">{teacher?.rating} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Experience</span>
                <span className="font-medium">{teacher?.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Hourly Rate</span>
                <span className="font-medium">${teacher?.hourlyRate}</span>
              </div>
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>{selectedSession?.title}</span>
                <span>${selectedSession?.price}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Platform fee (5%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-blue-500 hover:bg-blue-600"
              onClick={handlePayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>

            <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-slate-600">
              <Shield className="h-4 w-4" />
              <span>Secured by 256-bit SSL encryption</span>
            </div>
          </Card>

          {/* Guarantee */}
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-start space-x-3">
              <Check className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <h4 className="font-medium text-green-900">100% Satisfaction Guarantee</h4>
                <p className="text-sm text-green-700 mt-1">
                  If you're not satisfied with your session, we'll provide a full refund within 24 hours.
                </p>
              </div>
            </div>
          </Card>

          {/* What's Next */}
          <Card className="p-6">
            <h4 className="font-medium mb-3">What happens next?</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</div>
                <div>
                  <p className="font-medium">Payment confirmation</p>
                  <p className="text-slate-600">You'll receive an email confirmation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</div>
                <div>
                  <p className="font-medium">Schedule your session</p>
                  <p className="text-slate-600">Pick a time that works for you</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">3</div>
                <div>
                  <p className="font-medium">Join your session</p>
                  <p className="text-slate-600">Access via video call link</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}