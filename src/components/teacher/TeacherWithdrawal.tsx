import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ArrowDownLeft, DollarSign, Wallet, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { tokenService, TokenService } from '../../services/tokenService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';

interface WithdrawalRequest {
  id: string;
  amount_usd: number;
  amount_tokens: number;
  status: string;
  created_at: string;
  processed_at?: string;
  payment_methods?: {
    type: string;
    provider: string;
    last_four?: string;
    bank_name?: string;
  };
}

interface PaymentMethod {
  id: string;
  type: string;
  provider: string;
  last_four?: string;
  bank_name?: string;
  is_default: boolean;
}

export function TeacherWithdrawal() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPaymentMethods(),
        fetchWithdrawalRequests(),
        fetchTokenBalance()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return;
      }

      setPaymentMethods(data || []);
      if (data && data.length > 0 && !selectedPaymentMethod) {
        const defaultMethod = data.find(method => method.is_default) || data[0];
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    if (!user) return;

    try {
      const requests = await TokenService.getWithdrawalRequests(user.id);
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };

  const fetchTokenBalance = async () => {
    if (!user) return;

    try {
      const balance = await TokenService.getTokenBalance(user.id);
      // You could set this in state if needed for display
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  const handleWithdrawal = async () => {
    if (!user || !selectedPaymentMethod) return;

    const tokenAmount = parseInt(tokens);
    const validation = TokenService.validateWithdrawalRequest(tokenAmount);

    if (!validation.valid) {
      setError(validation.error || 'Invalid withdrawal request');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const result = await TokenService.processWithdrawalRequest(
        user.id,
        tokenAmount,
        selectedPaymentMethod
      );

      if (result.success) {
        setSuccess('Withdrawal request submitted successfully!');
        setTokens('');
        await fetchWithdrawalRequests();
        await fetchTokenBalance();
      } else {
        setError(result.error || 'Failed to process withdrawal request');
      }
    } catch (error) {
      setError('Failed to process withdrawal request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatPaymentMethod = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return `**** ${method.last_four} (${method.provider})`;
    } else if (method.type === 'bank_account') {
      return `${method.bank_name} **** ${method.last_four}`;
    }
    return `${method.type} (${method.provider})`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading withdrawal options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Withdraw Earnings</h1>
        <p className="text-slate-600">Convert your tokens to cash and withdraw to your bank account</p>
      </div>

      {/* Token Economy Info */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-green-100 rounded-full">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Teacher Token Economy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-600">Token Value</p>
                <p>1 token = $0.04 USD</p>
              </div>
              <div>
                <p className="font-medium text-blue-600">Minimum Withdrawal</p>
                <p>$10.00 USD</p>
              </div>
              <div>
                <p className="font-medium text-purple-600">Processing Fee</p>
                <p>2% (min $0.50)</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Request Withdrawal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Number of Tokens</label>
                <Input
                  type="number"
                  placeholder="Enter tokens to withdraw"
                  value={tokens}
                  onChange={(e) => setTokens(e.target.value)}
                  min="250" // 250 tokens = $10 minimum
                />
                {tokens && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span>Withdrawal Amount:</span>
                      <span className="font-bold">
                        ${TokenService.calculateWithdrawalAmount(parseInt(tokens) || 0).usd.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Processing Fee:</span>
                      <span>${TokenService.calculateWithdrawalAmount(parseInt(tokens) || 0).processingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>You'll Receive:</span>
                      <span>${TokenService.calculateWithdrawalAmount(parseInt(tokens) || 0).netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                {paymentMethods.length > 0 ? (
                  <select
                    className="w-full p-3 border rounded-lg"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {formatPaymentMethod(method)} {method.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-slate-600">No payment methods added</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleWithdrawal}
                disabled={isProcessing || !tokens || !selectedPaymentMethod || paymentMethods.length === 0}
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <ArrowDownLeft className="h-4 w-4" />
                    <span>Request Withdrawal</span>
                  </div>
                )}
              </Button>
            </div>
          </Card>

          {/* Quick Withdrawal Options */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Withdrawal</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { tokens: 250, label: '$10' },
                { tokens: 500, label: '$20' },
                { tokens: 1000, label: '$40' },
                { tokens: 2500, label: '$100' }
              ].map((option) => (
                <Button
                  key={option.tokens}
                  variant="outline"
                  size="sm"
                  onClick={() => setTokens(option.tokens.toString())}
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-slate-600">{option.tokens} tokens</span>
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Withdrawal History */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Withdrawal History</h2>
            
            {withdrawalRequests.length > 0 ? (
              <div className="space-y-3">
                {withdrawalRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">${request.amount_usd.toFixed(2)}</p>
                        <p className="text-sm text-slate-600">{request.amount_tokens} tokens</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                      {request.processed_at && (
                        <span>
                          Processed: {new Date(request.processed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {request.payment_methods && (
                      <div className="mt-2 text-xs text-slate-600">
                        {formatPaymentMethod(request.payment_methods)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>No withdrawal requests yet</p>
                <p className="text-sm">Your withdrawal history will appear here</p>
              </div>
            )}
          </Card>

          {/* Info Cards */}
          <Card className="p-6 bg-blue-50">
            <h4 className="font-semibold mb-3 text-blue-800">Withdrawal Process</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Processing time: 1-3 business days</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Secure bank transfer</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>2% processing fee applies</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

