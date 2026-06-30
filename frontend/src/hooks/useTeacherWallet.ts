import { useState, useEffect, useCallback } from 'react';
import { 
  TeacherWalletService, 
  TeacherWalletData, 
  TeacherTransaction, 
  WithdrawalRequest, 
  MonthlyEarnings, 
  TeacherWalletStats 
} from '../services/teacherWalletService';

export interface UseTeacherWalletResult {
  // Data
  walletData: TeacherWalletData | null;
  transactions: TeacherTransaction[];
  withdrawalRequests: WithdrawalRequest[];
  monthlyEarnings: MonthlyEarnings[];
  stats: TeacherWalletStats | null;
  
  // Loading states
  loading: {
    wallet: boolean;
    transactions: boolean;
    withdrawals: boolean;
    monthlyEarnings: boolean;
    stats: boolean;
  };
  
  // Error states
  error: string | null;
  
  // Actions
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshWithdrawals: () => Promise<void>;
  refreshMonthlyEarnings: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Pagination
  loadMoreTransactions: () => Promise<void>;
  hasMoreTransactions: boolean;
  
  // Filters
  setTransactionFilter: (filter: { type?: string; status?: string }) => void;
  transactionFilter: { type?: string; status?: string };
  
  // Withdrawal
  createWithdrawalRequest: (amount: number, paymentMethodId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useTeacherWallet(teacherId: string): UseTeacherWalletResult {
  // State
  const [walletData, setWalletData] = useState<TeacherWalletData | null>(null);
  const [transactions, setTransactions] = useState<TeacherTransaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarnings[]>([]);
  const [stats, setStats] = useState<TeacherWalletStats | null>(null);
  
  const [loading, setLoading] = useState({
    wallet: false,
    transactions: false,
    withdrawals: false,
    monthlyEarnings: false,
    stats: false,
  });
  
  const [error, setError] = useState<string | null>(null);
  const [transactionPage, setTransactionPage] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [transactionFilter, setTransactionFilterState] = useState<{ type?: string; status?: string }>({});

  // Fetch wallet data
  const refreshWallet = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, wallet: true }));
    setError(null);
    
    try {
      const data = await TeacherWalletService.getWalletData(teacherId);
      setWalletData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet data');
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  }, [teacherId]);

  // Fetch transactions
  const refreshTransactions = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, transactions: true }));
    setError(null);
    
    try {
      const data = await TeacherWalletService.getTransactions(
        teacherId, 
        page, 
        20, 
        transactionFilter.type, 
        transactionFilter.status
      );
      
      if (append) {
        setTransactions(prev => [...prev, ...data]);
      } else {
        setTransactions(data);
      }
      
      setHasMoreTransactions(data.length === 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, [teacherId, transactionFilter]);

  // Load more transactions
  const loadMoreTransactions = useCallback(async () => {
    if (!hasMoreTransactions || loading.transactions) return;
    
    const nextPage = transactionPage + 1;
    setTransactionPage(nextPage);
    await refreshTransactions(nextPage, true);
  }, [hasMoreTransactions, loading.transactions, transactionPage, refreshTransactions]);

  // Fetch withdrawal requests
  const refreshWithdrawals = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, withdrawals: true }));
    setError(null);
    
    try {
      const data = await TeacherWalletService.getWithdrawalRequests(teacherId);
      setWithdrawalRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch withdrawal requests');
    } finally {
      setLoading(prev => ({ ...prev, withdrawals: false }));
    }
  }, [teacherId]);

  // Fetch monthly earnings
  const refreshMonthlyEarnings = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, monthlyEarnings: true }));
    setError(null);
    
    try {
      const data = await TeacherWalletService.getMonthlyEarnings(teacherId);
      setMonthlyEarnings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch monthly earnings');
    } finally {
      setLoading(prev => ({ ...prev, monthlyEarnings: false }));
    }
  }, [teacherId]);

  // Fetch wallet stats
  const refreshStats = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(prev => ({ ...prev, stats: true }));
    setError(null);
    
    try {
      const data = await TeacherWalletService.getWalletStats(teacherId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wallet stats');
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [teacherId]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshWallet(),
      refreshTransactions(0, false),
      refreshWithdrawals(),
      refreshMonthlyEarnings(),
      refreshStats(),
    ]);
  }, [refreshWallet, refreshTransactions, refreshWithdrawals, refreshMonthlyEarnings, refreshStats]);

  // Set transaction filter
  const setTransactionFilter = useCallback((filter: { type?: string; status?: string }) => {
    setTransactionFilterState(filter);
    setTransactionPage(0);
    setHasMoreTransactions(true);
  }, []);

  // Create withdrawal request
  const createWithdrawalRequest = useCallback(async (
    amount: number, 
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!teacherId) return { success: false, error: 'No teacher ID provided' };
    
    try {
      const result = await TeacherWalletService.createWithdrawalRequest(teacherId, amount, paymentMethodId);
      
      if (result.success) {
        // Refresh wallet data and withdrawals after successful withdrawal request
        await Promise.all([refreshWallet(), refreshWithdrawals()]);
      }
      
      return result;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create withdrawal request' };
    }
  }, [teacherId, refreshWallet, refreshWithdrawals]);

  // Initial load
  useEffect(() => {
    if (teacherId) {
      refreshAll();
    }
  }, [teacherId, refreshAll]);

  // Reset transactions when filter changes
  useEffect(() => {
    if (teacherId) {
      refreshTransactions(0, false);
    }
  }, [transactionFilter, refreshTransactions, teacherId]);

  return {
    // Data
    walletData,
    transactions,
    withdrawalRequests,
    monthlyEarnings,
    stats,
    
    // Loading states
    loading,
    
    // Error state
    error,
    
    // Actions
    refreshWallet,
    refreshTransactions,
    refreshWithdrawals,
    refreshMonthlyEarnings,
    refreshStats,
    refreshAll,
    
    // Pagination
    loadMoreTransactions,
    hasMoreTransactions,
    
    // Filters
    setTransactionFilter,
    transactionFilter,
    
    // Withdrawal
    createWithdrawalRequest,
  };
}
