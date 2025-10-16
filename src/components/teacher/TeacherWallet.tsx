import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherWallet } from '../../hooks/useTeacherWallet';
import { tokenService } from '../../services/tokenService';

interface TeacherWalletProps {
  onBack?: () => void;
}

export function TeacherWallet({ onBack }: TeacherWalletProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { user } = useAuth();
  
  const {
    walletData,
    transactions,
    withdrawalRequests,
    monthlyEarnings,
    stats,
    loading,
    error,
    refreshAll,
    loadMoreTransactions,
    hasMoreTransactions,
    setTransactionFilter,
    transactionFilter,
  } = useTeacherWallet(user?.id || '');

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning':
      case 'payment':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdrawal': 
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'bonus':
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      case 'refund':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      case 'fee':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default: 
        return <DollarSign className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teacher Wallet</h1>
          <p className="text-slate-600">Manage your earnings and payments</p>
        </div>
        <div className="flex items-center space-x-3">
          {loading.wallet ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-slate-600">Loading...</span>
            </div>
          ) : (
            <>
              <Badge className="bg-green-100 text-green-800">
                Tokens: {walletData?.token_balance || 0} (${formatCurrency(tokenService.tokensToUSDForTeacher(walletData?.token_balance || 0))})
              </Badge>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                disabled={!walletData?.token_balance || walletData.token_balance <= 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
              <Button variant="outline" onClick={refreshAll} disabled={Object.values(loading).some(l => l)}>
                <RefreshCw className={`w-4 h-4 mr-2 ${Object.values(loading).some(l => l) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Available Balance</p>
              {loading.wallet ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-slate-600">Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(tokenService.tokensToUSDForTeacher(walletData?.token_balance || 0))}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">This Month</p>
              {loading.stats ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-slate-600">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.this_month_earnings || 0)}
                  </p>
                  <p className={`text-xs ${(stats?.earnings_growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.earnings_growth_percentage ? 
                      `${stats.earnings_growth_percentage >= 0 ? '+' : ''}${stats.earnings_growth_percentage.toFixed(1)}% from last month` :
                      'No previous data'
                    }
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              {loading.stats ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-slate-600">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.pending_withdrawals || 0)}
                  </p>
                  <p className="text-xs text-purple-600">
                    {withdrawalRequests.filter(w => ['pending', 'processing'].includes(w.status)).length} requests
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Earned</p>
              {loading.stats ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-slate-600">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats?.total_earnings || 0)}
                  </p>
                  <p className="text-xs text-orange-600">
                    {stats?.total_sessions || 0} sessions
                  </p>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex space-x-4">
        <Button className="bg-green-500 hover:bg-green-600">
          <Download className="h-4 w-4 mr-2" />
          Withdraw Funds
        </Button>
        <Button variant="outline">
          <CreditCard className="h-4 w-4 mr-2" />
          Payment Methods
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Statement
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Recent Transactions</h3>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-slate-600">{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === 'earning' ? 'text-green-600' : 'text-blue-600'}`}>
                        {transaction.type === 'earning' ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                      <Badge className={`${getStatusColor(transaction.status)} text-xs`}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Monthly Summary */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">This Month Summary</h3>
              {loading.stats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading summary...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Sessions</span>
                    <span className="font-medium">{stats?.total_sessions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Average per Session</span>
                    <span className="font-medium">
                      {formatCurrency(stats?.average_session_value || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">This Month Earnings</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(stats?.this_month_earnings || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Growth from Last Month</span>
                    <span className={`font-medium ${
                      (stats?.earnings_growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats?.earnings_growth_percentage ? 
                        `${stats.earnings_growth_percentage >= 0 ? '+' : ''}${stats.earnings_growth_percentage.toFixed(1)}%` :
                        '0%'
                      }
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Total Lifetime Earnings</span>
                    <span className="text-green-600">
                      {formatCurrency(stats?.total_earnings || 0)}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">All Transactions</h3>
              <div className="flex items-center space-x-2">
                <select 
                  className="px-3 py-1 border rounded-md text-sm"
                  value={transactionFilter.type || ''}
                  onChange={(e) => setTransactionFilter({ ...transactionFilter, type: e.target.value || undefined })}
                >
                  <option value="">All Types</option>
                  <option value="payment">Earnings</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="bonus">Bonuses</option>
                  <option value="refund">Refunds</option>
                  <option value="fee">Fees</option>
                </select>
                <select 
                  className="px-3 py-1 border rounded-md text-sm"
                  value={transactionFilter.status || ''}
                  onChange={(e) => setTransactionFilter({ ...transactionFilter, status: e.target.value || undefined })}
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            
            {loading.transactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading transactions...</span>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(transaction.type)}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <span>{formatDate(transaction.created_at)}</span>
                          {transaction.student_name && (
                            <>
                              <span>•</span>
                              <span>Student: {transaction.student_name}</span>
                            </>
                          )}
                          {transaction.class_title && (
                            <>
                              <span>•</span>
                              <span>{transaction.class_title}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={`${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </Badge>
                      <p className={`font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {hasMoreTransactions && (
                  <div className="text-center py-4">
                    <Button 
                      variant="outline" 
                      onClick={loadMoreTransactions}
                      disabled={loading.transactions}
                    >
                      {loading.transactions ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No transactions found</p>
                <p className="text-sm">Your transaction history will appear here</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-bold mb-4">Monthly Earnings Trend</h3>
              <div className="space-y-2">
                {loading.monthlyEarnings ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-slate-600">Loading earnings...</span>
                  </div>
                ) : monthlyEarnings.length > 0 ? (
                  monthlyEarnings.slice(-6).map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{stat.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min((stat.earnings / 1500) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-medium text-sm">{formatCurrency(stat.earnings)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    <p className="text-sm">No earnings data available</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-bold mb-4">Payment Breakdown</h3>
              <div className="space-y-4">
                {loading.stats ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-slate-600">Loading breakdown...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Total Sessions</span>
                      <span className="font-medium">{stats?.total_sessions || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Average per Session</span>
                      <span className="font-medium">
                        {stats?.total_sessions ? formatCurrency((stats.total_earnings || 0) / stats.total_sessions) : '$0.00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Platform Fee (5%)</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency((stats?.total_earnings || 0) * 0.05)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Processing Fee</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency((stats?.total_earnings || 0) * 0.02)}
                      </span>
                    </div>
                    <hr />
                    <div className="flex items-center justify-between font-bold text-lg">
                      <span>Net Earnings</span>
                      <span className="text-green-600">{formatCurrency(stats?.total_earnings || 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}