import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowLeft, Users, DollarSign, TrendingUp } from 'lucide-react';
import { AdminService } from '../../services/adminService';

interface AdminAnalyticsProps {
  onBack: () => void;
}

export function AdminAnalytics({ onBack }: AdminAnalyticsProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    monthlyRevenue: 0,
    successRate: 0,
    activeSessions: 0,
  });
  const [userGrowth, setUserGrowth] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [adminStats, growth, revGrowth] = await Promise.all([
          AdminService.getAdminStats(),
          AdminService.getUserCountChange(),
          AdminService.getRevenueGrowth(),
        ]);

        setStats({
          totalUsers: adminStats.totalUsers,
          monthlyRevenue: adminStats.monthlyRevenue,
          successRate: adminStats.successRate,
          activeSessions: adminStats.activeSessions,
        });
        setUserGrowth(growth);
        setRevenueGrowth(revGrowth);
      } catch (error) {
        console.error('Error fetching analytics:', error);
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
          <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-slate-600">Comprehensive platform performance metrics</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-foreground">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-blue-600">
                  {userGrowth > 0 ? '+' : ''}{userGrowth} this month
                </p>
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
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-xs text-green-600">
                  {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% growth
                </p>
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
                <p className="text-2xl font-bold text-foreground">{stats.successRate.toFixed(1)}%</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.activeSessions}</p>
                <p className="text-xs text-orange-600">Live now</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}