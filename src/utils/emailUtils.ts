/**
 * Email utilities for handling development vs production email behavior
 * This helps prevent bounce rates by using appropriate email addresses
 */

// Check if we're in development mode
export const isDevelopment = import.meta.env.DEV;
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
export const skipEmailVerification = import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true';

/**
 * Get email configuration based on environment
 */
export const getEmailConfig = () => {
  return {
    skipVerification: isDevelopment || isDemoMode || skipEmailVerification,
    useLocalEmails: isDevelopment || isDemoMode,
    customDomain: isDemoMode ? '@localhost.local' : undefined,
    isDevelopment,
    isDemoMode
  };
};

/**
 * Validate email address format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if email is a test/demo email that might cause bounces
 */
export const isTestEmail = (email: string): boolean => {
  const testDomains = [
    '@demo.com',
    '@test.com',
    '@example.com',
    '@localhost',
    '@localhost.local'
  ];
  
  return testDomains.some(domain => email.toLowerCase().includes(domain));
};

/**
 * Generate a safe demo email address
 */
export const generateDemoEmail = (role: string): string => {
  const timestamp = Date.now();
  return `demo+${role}+${timestamp}@localhost.local`;
};

/**
 * Format email for development (adds tags to real emails)
 */
export const formatDevEmail = (baseEmail: string, tag: string): string => {
  if (!baseEmail.includes('@')) {
    return baseEmail;
  }
  
  const [localPart, domain] = baseEmail.split('@');
  return `${localPart}+${tag}@${domain}`;
};

/**
 * Get appropriate email address based on environment
 */
export const getSafeEmail = (role: string, baseEmail?: string): string => {
  const config = getEmailConfig();
  
  if (config.useLocalEmails) {
    return generateDemoEmail(role);
  }
  
  if (baseEmail && validateEmail(baseEmail)) {
    return formatDevEmail(baseEmail, role);
  }
  
  // Fallback to local email
  return generateDemoEmail(role);
};

/**
 * Check if email verification should be skipped
 */
export const shouldSkipEmailVerification = (): boolean => {
  return getEmailConfig().skipVerification;
};

/**
 * Log email configuration for debugging
 */
export const logEmailConfig = () => {
  const config = getEmailConfig();
  console.log('📧 Email Configuration:', {
    isDevelopment: config.isDevelopment,
    isDemoMode: config.isDemoMode,
    skipVerification: config.skipVerification,
    useLocalEmails: config.useLocalEmails,
    customDomain: config.customDomain
  });
};
