const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const DatabaseService = require('./src/services/databaseService');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoemhycHdjZmFja3FpbmF3b2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE2MDQsImV4cCI6MjA3NTU5NzYwNH0.tOHiPVTyyMh0a3tCl3YYtgVZEMEVmHvQlJ8QEs4bb8g';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Student Dashboard API endpoints

// Get student dashboard stats
app.get('/api/student/dashboard/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Fetching dashboard stats for user:', userId);

    // Fetch wallet data
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance, tokens')
      .eq('user_id', userId)
      .single();

    // Fetch class count
    const { count: classCount, error: classError } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
      .eq('status', 'active');

    // Fetch completed assignments count
    const { count: assignmentCount, error: assignmentError } = await supabase
      .from('assignment_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
      .eq('status', 'graded');

    // Fetch upcoming sessions
    const { count: sessionCount, error: sessionError } = await supabase
      .from('class_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_start', new Date().toISOString());

    // Fetch unread messages
    const { count: messageCount, error: messageError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    const stats = {
      wallet_balance: walletData?.balance || 0,
      tokens: walletData?.tokens || 0,
      total_classes: classCount || 0,
      completed_assignments: assignmentCount || 0,
      upcoming_sessions: sessionCount || 0,
      unread_messages: messageCount || 0
    };

    console.log('Dashboard stats fetched:', stats);
    res.json(stats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get student classes
app.get('/api/student/classes', async (req, res) => {
  try {
    const { userId, status = 'active', limit = 5 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Fetching classes for user:', userId);

    // First check if the classes table exists and has data
    const { data, error } = await supabase
      .from('classes')
      .select('id, title, status, student_id')
      .eq('student_id', userId)
      .limit(1);

    if (error) {
      console.error('Database error fetching classes:', error);
      // Return empty array if table doesn't exist or user has no classes
      return res.json([]);
    }

    // If no classes found, return empty array
    if (!data || data.length === 0) {
      console.log('No classes found for user:', userId);
      return res.json([]);
    }

    // Fetch detailed class data
    const { data: detailedData, error: detailedError } = await supabase
      .from('classes')
      .select(`
        id,
        title,
        status,
        completed_sessions,
        hourly_rate,
        created_at,
        subjects!classes_subject_id_fkey (
          name
        ),
        teachers!classes_teacher_id_fkey (
          id,
          profiles!teachers_id_fkey (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('student_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (detailedError) {
      console.error('Error fetching detailed class data:', detailedError);
      return res.json([]);
    }

    const classData = (detailedData || []).map(cls => ({
      id: cls.id,
      title: cls.title,
      subject: cls.subjects?.name || 'Unknown Subject',
      teacher_name: cls.teachers?.profiles?.full_name || 'Unknown Teacher',
      teacher_avatar: cls.teachers?.profiles?.avatar_url,
      progress: Math.min(100, Math.round((cls.completed_sessions / 10) * 100)),
      status: cls.status,
      hourly_rate: cls.hourly_rate,
      created_at: cls.created_at
    }));

    console.log('Classes fetched:', classData.length);
    res.json(classData);

  } catch (error) {
    console.error('Error fetching classes:', error);
    // Return empty array instead of error to prevent frontend crashes
    res.json([]);
  }
});

// Get student assignments
app.get('/api/student/assignments', async (req, res) => {
  try {
    const { userId, status = 'upcoming', limit = 5 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Fetching assignments for user:', userId);

    let query = supabase
      .from('assignments')
      .select(`
        id,
        title,
        due_date,
        max_points,
        status,
        difficulty_level,
        created_at,
        subjects!assignments_subject_id_fkey (
          name
        ),
        teachers!assignments_teacher_id_fkey (
          id,
          profiles!teachers_id_fkey (
            full_name
          )
        )
      `)
      .eq('is_published', true)
      .order('due_date', { ascending: true })
      .limit(parseInt(limit));

    if (status === 'upcoming') {
      query = query.gte('due_date', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching assignments:', error);
      // Return empty array instead of error to prevent frontend crashes
      return res.json([]);
    }

    const assignmentData = (data || []).map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.subjects?.name || 'Unknown Subject',
      teacher_name: assignment.teachers?.profiles?.full_name || 'Unknown Teacher',
      due_date: assignment.due_date,
      status: assignment.status,
      max_points: assignment.max_points,
      difficulty_level: assignment.difficulty_level,
      created_at: assignment.created_at
    }));

    console.log('Assignments fetched:', assignmentData.length);
    res.json(assignmentData);

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get student notifications
app.get('/api/student/notifications', async (req, res) => {
  try {
    const { userId, unreadOnly = false, limit = 5 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Fetching notifications for user:', userId);

    let query = supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (unreadOnly === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }

    console.log('Notifications fetched:', data?.length || 0);
    res.json(data || []);

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get upcoming class sessions
app.get('/api/student/sessions', async (req, res) => {
  try {
    const { userId, limit = 5 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Fetching upcoming sessions for user:', userId);

    const { data, error } = await supabase
      .from('class_sessions')
      .select(`
        id,
        title,
        description,
        scheduled_start,
        scheduled_end,
        status,
        meeting_url,
        classes!class_sessions_class_id_fkey (
          title,
          subjects!classes_subject_id_fkey (
            name
          ),
          teachers!classes_teacher_id_fkey (
            id,
            profiles!teachers_id_fkey (
              full_name,
              avatar_url
            )
          )
        )
      `)
      .eq('student_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_start', new Date().toISOString())
      .order('scheduled_start', { ascending: true })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching sessions:', error);
      // Return empty array instead of error to prevent frontend crashes
      return res.json([]);
    }

    const sessionData = (data || []).map(session => ({
      id: session.id,
      title: session.title,
      description: session.description,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      status: session.status,
      meeting_url: session.meeting_url,
      class_title: session.classes?.title || 'Unknown Class',
      subject: session.classes?.subjects?.name || 'Unknown Subject',
      teacher_name: session.classes?.teachers?.profiles?.full_name || 'Unknown Teacher',
      teacher_avatar: session.classes?.teachers?.profiles?.avatar_url
    }));

    console.log('Sessions fetched:', sessionData.length);
    res.json(sessionData);

  } catch (error) {
    console.error('Error fetching sessions:', error);
    // Return empty array instead of error to prevent frontend crashes
    res.json([]);
  }
});

// Get wallet balance and transactions
app.get('/api/student/wallet', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('Fetching wallet data for user:', userId);

    // Fetch wallet balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance, tokens, currency')
      .eq('user_id', userId);

    // Fetch recent transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('id, type, amount, currency, description, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (walletError || !walletData || walletData.length === 0) {
      console.error('Error fetching wallet or no wallet found:', walletError);
      return res.json({
        balance: 0,
        tokens: 0,
        currency: 'USD',
        transactions: []
      });
    }

    const wallet = {
      balance: walletData[0]?.balance || 0,
      tokens: walletData[0]?.tokens || 0,
      currency: walletData[0]?.currency || 'USD',
      transactions: transactions || []
    };

    console.log('Wallet data fetched:', { balance: wallet.balance, tokens: wallet.tokens });
    res.json(wallet);

  } catch (error) {
    console.error('Error fetching wallet:', error);
    // Return default wallet data instead of error
    res.json({
      balance: 0,
      tokens: 0,
      currency: 'USD',
      transactions: []
    });
  }
});

// Create payment intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;

    console.log('Creating payment intent:', { amount, currency, metadata });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency || 'usd',
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    });
  }
});

// Create customer endpoint
app.post('/api/create-customer', async (req, res) => {
  try {
    const { email, name, userId } = req.body;

    console.log('Creating customer:', { email, name, userId });

    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        userId: userId,
      },
    });

    console.log('Customer created:', customer.id);

    res.json({ customerId: customer.id });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ 
      error: 'Failed to create customer',
      details: error.message 
    });
  }
});

// Get payment methods endpoint
app.get('/api/payment-methods', async (req, res) => {
  try {
    const { customer_id } = req.query;

    console.log('Fetching payment methods for customer:', customer_id);

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer_id,
      type: 'card',
    });

    res.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payment methods',
      details: error.message 
    });
  }
});

// Process withdrawal endpoint
app.post('/api/process-withdrawal', async (req, res) => {
  try {
    const { teacherId, amount, bankAccount } = req.body;

    console.log('Processing withdrawal:', { teacherId, amount });

    // Create bank account token
    const bankToken = await stripe.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_number: bankAccount.account_number,
        routing_number: bankAccount.routing_number,
        account_holder_name: bankAccount.account_holder_name,
        account_holder_type: bankAccount.account_holder_type,
      },
    });

    // Create transfer to bank account
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: 'usd',
      destination: bankToken.id,
      metadata: {
        teacherId: teacherId,
        type: 'withdrawal',
      },
    });

    console.log('Withdrawal processed:', transfer.id);

    res.json({
      success: true,
      transferId: transfer.id,
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Webhook endpoint for handling Stripe events
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('Webhook event received:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      handlePaymentFailure(event.data.object);
      break;
    case 'transfer.created':
      handleTransferCreated(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  try {
    const { userId, userRole, tokens, tokenPackage } = paymentIntent.metadata;
    
    console.log(`Payment succeeded for user ${userId}: ${tokens} tokens`);
    
    // Update user's token balance
    const tokenUpdate = await DatabaseService.updateUserTokens(userId, parseInt(tokens), 'add');
    if (!tokenUpdate.success) {
      console.error('Failed to update user tokens:', tokenUpdate.error);
      return;
    }
    
    // Create transaction record
    const transaction = await DatabaseService.createTransactionRecord({
      userId: userId,
      type: 'deposit',
      amount: paymentIntent.amount / 100, // Convert cents to dollars
      currency: 'USD',
      description: `Token purchase - ${tokens} tokens`,
      referenceId: paymentIntent.id,
      status: 'completed',
      metadata: {
        package_id: tokenPackage,
        tokens_purchased: tokens,
        token_rate: userRole === 'student' ? 0.10 : 0.04
      }
    });
    
    if (!transaction.success) {
      console.error('Failed to create transaction record:', transaction.error);
      return;
    }
    
    console.log(`Payment processing completed for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
  try {
    const { userId } = paymentIntent.metadata;
    
    console.log(`Payment failed for user ${userId}`);
    
    // Update transaction status
    await DatabaseService.updateTransactionStatus(paymentIntent.id, 'failed');
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle transfer creation
async function handleTransferCreated(transfer) {
  try {
    const { teacherId } = transfer.metadata;
    
    console.log(`Withdrawal completed for teacher ${teacherId}: ${transfer.amount}`);
    
    // Update withdrawal status
    await DatabaseService.updateWithdrawalStatus(teacherId, transfer.id, 'completed');
    
  } catch (error) {
    console.error('Error handling transfer creation:', error);
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📡 API endpoints available at http://localhost:${port}/api`);
  console.log(`💳 Stripe integration enabled`);
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  Warning: STRIPE_SECRET_KEY not found in environment variables');
  } else {
    console.log('✅ Stripe secret key loaded');
  }
});

module.exports = app;
