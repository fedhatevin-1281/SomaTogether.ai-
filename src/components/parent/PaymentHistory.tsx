import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, Download, CreditCard, Calendar } from 'lucide-react';

interface PaymentHistoryProps {
  onBack?: () => void;
}

export function PaymentHistory({ onBack }: PaymentHistoryProps) {
  const payments = [
    {
      id: 1,
      date: '2025-10-01',
      teacher: 'Dr. Sarah Johnson',
      subject: 'Mathematics',
      amount: 180,
      sessions: 4,
      status: 'paid',
      method: 'Credit Card'
    },
    {
      id: 2,
      date: '2025-09-28',
      teacher: 'Prof. Michael Chen',
      subject: 'Physics',
      amount: 150,
      sessions: 3,
      status: 'paid',
      method: 'PayPal'
    },
    {
      id: 3,
      date: '2025-09-25',
      teacher: 'Ms. Emily Davis',
      subject: 'Literature',
      amount: 105,
      sessions: 3,
      status: 'paid',
      method: 'Credit Card'
    },
    {
      id: 4,
      date: '2025-09-20',
      teacher: 'Dr. Sarah Johnson',
      subject: 'Mathematics',
      amount: 225,
      sessions: 5,
      status: 'paid',
      method: 'Credit Card'
    }
  ];

  const monthlySpending = [
    { month: 'Jan', amount: 420 },
    { month: 'Feb', amount: 380 },
    { month: 'Mar', amount: 450 },
    { month: 'Apr', amount: 510 },
    { month: 'May', amount: 340 },
    { month: 'Jun', amount: 390 },
    { month: 'Jul', amount: 480 },
    { month: 'Aug', amount: 350 },
    { month: 'Sep', amount: 435 },
    { month: 'Oct', amount: 350 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-slate-600">Track all tutoring expenses and payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">This Month</p>
              <p className="text-2xl font-bold">$350</p>
              <p className="text-xs text-purple-600">12 sessions</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Average Monthly</p>
              <p className="text-2xl font-bold">$411</p>
              <p className="text-xs text-green-600">Last 6 months</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Paid</p>
              <p className="text-2xl font-bold">$4,113</p>
              <p className="text-xs text-blue-600">All time</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-bold">$0</p>
              <p className="text-xs text-orange-600">All caught up!</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recent Payments</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{payment.teacher}</h4>
                    <p className="text-sm text-slate-600">{payment.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${payment.amount}</p>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{payment.date} • {payment.sessions} sessions</span>
                  <span>{payment.method}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Spending Chart */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">Monthly Spending Trend</h3>
          <div className="space-y-3">
            {monthlySpending.slice(-6).map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 w-12">{month.month}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${(month.amount / 600) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="font-medium text-sm w-16 text-right">${month.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Payment Methods */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div>
                <p className="font-medium">**** 4532</p>
                <p className="text-sm text-slate-600">Primary</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
          
          <div className="border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-6 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">PP</span>
              </div>
              <div>
                <p className="font-medium">PayPal</p>
                <p className="text-sm text-slate-600">johnson@email.com</p>
              </div>
            </div>
            <Badge variant="outline">Backup</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}