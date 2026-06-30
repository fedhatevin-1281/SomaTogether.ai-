/**
 * Production-safe logging utility
 * Prevents sensitive information from being logged in production
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

class Logger {
  private shouldLog(level: keyof LogLevel): boolean {
    if (isProduction) {
      // In production, only log errors and warnings
      return level === 'ERROR' || level === 'WARN';
    }
    // In development, log everything
    return true;
  }

  private sanitizeData(data: any): any {
    if (!isDevelopment && data) {
      // Remove sensitive fields in production
      const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
      const sanitized = { ...data };
      
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      
      return sanitized;
    }
    return data;
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('ERROR')) {
      console.error(`[ERROR] ${message}`, this.sanitizeData(data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('WARN')) {
      console.warn(`[WARN] ${message}`, this.sanitizeData(data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('INFO')) {
      console.info(`[INFO] ${message}`, this.sanitizeData(data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('DEBUG')) {
      console.debug(`[DEBUG] ${message}`, this.sanitizeData(data));
    }
  }

  // Service-specific logging methods
  serviceError(serviceName: string, operation: string, error: any): void {
    this.error(`${serviceName}: ${operation} failed`, {
      service: serviceName,
      operation,
      error: error?.message || error,
      stack: isDevelopment ? error?.stack : undefined,
    });
  }

  serviceSuccess(serviceName: string, operation: string, data?: any): void {
    this.info(`${serviceName}: ${operation} completed`, {
      service: serviceName,
      operation,
      data: this.sanitizeData(data),
    });
  }

  authEvent(event: string, userId?: string, data?: any): void {
    this.info(`Auth: ${event}`, {
      event,
      userId: userId ? userId.substring(0, 8) + '...' : undefined,
      data: this.sanitizeData(data),
    });
  }

  apiCall(method: string, endpoint: string, status?: number, duration?: number): void {
    this.info(`API: ${method} ${endpoint}`, {
      method,
      endpoint,
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const { error, warn, info, debug, serviceError, serviceSuccess, authEvent, apiCall } = logger;
