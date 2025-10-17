import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../supabaseClient";
import { WalletFunding } from "./WalletFunding";

interface Transaction {
  id: string;
  type: "payment" | "refund" | "deposit" | "withdrawal" | "bonus" | "fee";
  description: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "cancelled";
  date: string;
  teacher?: string;
  subject?: string;
  currency?: string;
}

interface StudentWalletProps {
  balance: number;
  onTokenChange: (tokens: number) => void;
}

interface WalletData {
  balance: number;
  tokens: number;
  currency: string;
}

interface TransactionData {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  created_at: string;
  related_entity_type?: string;
  related_entity_id?: string;
}

export function StudentWallet() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState<WalletData>({ balance: 0, tokens: 0, currency: 'USD' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [sessionsBooked, setSessionsBooked] = useState(0);
  const [showFundingModal, setShowFundingModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await Promise.all([
        fetchWalletBalance(),
        fetchTransactions(),
        fetchMonthlyStats()
      ]);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance, tokens, currency')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet balance:', error);
        return;
      }

      if (data) {
        setWalletData({
          balance: data.balance || 0,
          tokens: data.tokens || 0,
          currency: data.currency || 'USD'
        });
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          currency,
          description,
          status,
          created_at,
          related_entity_type,
          related_entity_id
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      const formattedTransactions: Transaction[] = (data || []).map((tx: TransactionData) => ({
        id: tx.id,
        type: tx.type as any,
        description: tx.description,
        amount: tx.amount,
        status: tx.status as any,
        date: tx.created_at.split('T')[0],
        currency: tx.currency
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchMonthlyStats = async () => {
    if (!user) return;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch monthly spent amount
      const { data: spentData, error: spentError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'payment')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      if (spentData) {
        const totalSpent = spentData.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        setMonthlySpent(totalSpent);
      }

      // Fetch sessions booked this month
      const { count: sessionsCount, error: sessionsError } = await supabase
        .from('class_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (sessionsCount !== null) {
        setSessionsBooked(sessionsCount);
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const convertToTokens = (amount: number) => Math.floor(amount / 10);

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "pending") return <Clock className="w-4 h-4 text-yellow-500" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
    switch (type) {
      case "payment":
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case "refund":
      case "deposit":
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return null;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (selectedPeriod === "all") return true;
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    switch (selectedPeriod) {
      case "week":
        return transactionDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month":
        return transactionDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "3months":
        return transactionDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
          <p className="text-gray-600">Manage your payments and balance</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowFundingModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Funds
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">${walletData.balance.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Token Balance: <span className="font-medium">{walletData.tokens}</span>
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month Spent</p>
              <p className="text-2xl font-bold text-gray-900">${monthlySpent.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sessions Booked</p>
              <p className="text-2xl font-bold text-gray-900">{sessionsBooked}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Add Funds Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Funds</h2>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={() => setShowFundingModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Funds
          </Button>
        </div>
        <div className="text-center text-gray-600">
          <p>Click "Add Funds" to choose your payment method and add tokens to your wallet</p>
          <p className="text-sm mt-1">Supports Paystack, Stripe, M-Pesa, and more</p>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="border rounded-lg px-3 py-1 text-sm"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  {getTransactionIcon(transaction.type, transaction.status)}
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                      {transaction.teacher && (
                        <>
                          <span>•</span>
                          <span>{transaction.teacher}</span>
                        </>
                      )}
                      {transaction.subject && (
                        <>
                          <span>•</span>
                          <span>{transaction.subject}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`font-semibold ${
                      transaction.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                    {transaction.type === "deposit" && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({convertToTokens(transaction.amount)} tokens)
                      </span>
                    )}
                  </span>
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No transactions found</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </Card>

      {/* Funding Modal */}
      {showFundingModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFundingModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <WalletFunding
                onSuccess={() => {
                  setShowFundingModal(false);
                  fetchWalletData(); // Refresh wallet data
                }}
                onCancel={() => setShowFundingModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}