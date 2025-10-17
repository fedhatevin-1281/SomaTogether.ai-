// Paystack Configuration
export const PAYSTACK_CONFIG = {
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  secretKey: import.meta.env.VITE_PAYSTACK_SECRET_KEY || '',
  baseUrl: 'https://api.paystack.co'
};

// Test cards for development
export const PAYSTACK_TEST_CARDS = {
  success: '4084084084084081',
  declined: '4084084084084085',
  insufficient: '4084084084084082'
};
