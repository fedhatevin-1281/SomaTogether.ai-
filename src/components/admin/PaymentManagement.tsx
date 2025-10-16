import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface PaymentManagementProps {
  onBack: () => void;
}

export function PaymentManagement({ onBack }: PaymentManagementProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-slate-600">Monitor platform payments and transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Monthly Revenue</p>
              <p className="text-2xl font-bold">$45.2K</p>
              <p className="text-xs text-green-600">+18% from last month</p>
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
              <p className="text-2xl font-bold">$2.26K</p>
              <p className="text-xs text-blue-600">5% commission</p>
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
              <p className="text-2xl font-bold">$12.4K</p>
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
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-red-600">Need attention</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {[
            { id: 1, amount: 45, from: 'Alex Thompson', to: 'Dr. Sarah Johnson', status: 'completed', date: '2025-10-04' },
            { id: 2, amount: 50, from: 'Emma Rodriguez', to: 'Prof. Michael Chen', status: 'completed', date: '2025-10-03' },
            { id: 3, amount: 35, from: 'Mike Chen', to: 'Ms. Emily Davis', status: 'pending', date: '2025-10-03' }
          ].map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">${transaction.amount} payment</p>
                <p className="text-sm text-slate-600">{transaction.from} → {transaction.to}</p>
                <p className="text-xs text-slate-500">{transaction.date}</p>
              </div>
              <Badge className={transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {transaction.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}