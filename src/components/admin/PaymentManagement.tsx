import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { AdminService } from '../../services/adminService';

interface PaymentManagementProps {
  onBack: () => void;
}

export function PaymentManagement({ onBack }: PaymentManagementProps) {
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    platformFee: 0,
    pendingPayouts: 0,
    disputes: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [adminStats, paymentTransactions] = await Promise.all([
          AdminService.getAdminStats(),
          AdminService.getPaymentTransactions(10),
        ]);

        setStats({
          monthlyRevenue: adminStats.monthlyRevenue,
          platformFee: adminStats.platformFee,
          pendingPayouts: adminStats.pendingPayouts,
          disputes: adminStats.disputes,
        });
        setTransactions(paymentTransactions);
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Management</h1>
          <p className="text-slate-600">Monitor platform payments and transactions</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-foreground">Loading payment data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyRevenue)}</p>
                  <p className="text-xs text-green-600">This month</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Platform Fee</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.platformFee)}</p>
                  <p className="text-xs text-blue-600">Commission</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.pendingPayouts)}</p>
                  <p className="text-xs text-purple-600">To teachers</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Disputes</p>
                  <p className="text-2xl font-bold text-foreground">{stats.disputes}</p>
                  <p className="text-xs text-red-600">Need attention</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 text-foreground">Recent Transactions</h3>
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No transactions found</p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div>
                      <p className="font-medium text-foreground">${transaction.amount.toFixed(2)} payment</p>
                      <p className="text-sm text-slate-600">{transaction.from} → {transaction.to}</p>
                      <p className="text-xs text-slate-500">{transaction.date}</p>
                    </div>
                    <Badge className={transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {transaction.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}