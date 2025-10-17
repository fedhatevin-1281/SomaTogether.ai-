// AI Memory Cleanup Service - Handles periodic cleanup of expired conversations
import { supabase } from './supabaseClient';

export class AIMemoryCleanupService {
  private static instance: AIMemoryCleanupService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  public static getInstance(): AIMemoryCleanupService {
    if (!AIMemoryCleanupService.instance) {
      AIMemoryCleanupService.instance = new AIMemoryCleanupService();
    }
    return AIMemoryCleanupService.instance;
  }

  /**
   * Start automatic cleanup every 15 minutes
   */
  startAutoCleanup(): void {
    if (this.isRunning) {
      console.log('🧹 AI Memory cleanup is already running');
      return;
    }

    console.log('🧹 Starting AI Memory auto-cleanup (every 15 minutes)');
    this.isRunning = true;

    // Run cleanup immediately
    this.runCleanup();

    // Then run every 15 minutes
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, 15 * 60 * 1000); // 15 minutes
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('🧹 AI Memory auto-cleanup stopped');
  }

  /**
   * Run cleanup manually
   */
  async runCleanup(): Promise<number> {
    try {
      console.log('🧹 Running AI Memory cleanup...');
      
      const { data, error } = await supabase.rpc('cleanup_expired_ai_conversations');

      if (error) {
        console.error('Error during AI Memory cleanup:', error);
        return 0;
      }

      const cleanedCount = data || 0;
      console.log(`🧹 AI Memory cleanup completed: ${cleanedCount} expired conversations removed`);
      
      return cleanedCount;
    } catch (error) {
      console.error('Error during AI Memory cleanup:', error);
      return 0;
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    totalExpiredConversations: number;
    lastCleanupTime: string;
    isAutoCleanupRunning: boolean;
  }> {
    try {
      // Get count of expired conversations
      const { count: expiredCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'direct')
        .eq('metadata->>ai_session', 'true')
        .lt('metadata->>expires_at', new Date().toISOString());

      return {
        totalExpiredConversations: expiredCount || 0,
        lastCleanupTime: new Date().toISOString(),
        isAutoCleanupRunning: this.isRunning
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      return {
        totalExpiredConversations: 0,
        lastCleanupTime: 'Error fetching data',
        isAutoCleanupRunning: this.isRunning
      };
    }
  }
}
