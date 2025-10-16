import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Users, DollarSign, TrendingUp } from 'lucide-react';

interface AdminAnalyticsProps {
  onBack: () => void;
}

export function AdminAnalytics({ onBack }: AdminAnalyticsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-slate-600">Comprehensive platform performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-2xl font-bold">2,487</p>
              <p className="text-xs text-blue-600">+127 this month</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Monthly Revenue</p>
              <p className="text-2xl font-bold">$45.2K</p>
              <p className="text-xs text-green-600">+18% growth</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Success Rate</p>
              <p className="text-2xl font-bold">94.2%</p>
              <p className="text-xs text-purple-600">Platform wide</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Sessions</p>
              <p className="text-2xl font-bold">156</p>
              <p className="text-xs text-orange-600">Live now</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}