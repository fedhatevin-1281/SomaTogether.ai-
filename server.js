const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const DatabaseService = require('./src/services/databaseService');
const { createClient } = require('@supabase/supabase-js');
const zoomServerService = require('./src/services/zoomServerService');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://jhzhrpwcfackqinawobg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoemhycHdjZmFja3FpbmF3b2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjE2MDQsImV4cCI6MjA3NTU5NzYwNH0.tOHiPVTyyMh0a3tCl3YYtgVZEMEVmHvQlJ8QEs4bb8g';
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

// Webhook endpoint for handling Paystack events
app.post('/api/paystack-webhook', async (req, res) => {
  try {
    const crypto = require('crypto');
    const secret = process.env.PAYSTACK_SECRET_KEY || process.env.VITE_PAYSTACK_SECRET_KEY;
    
    if (secret) {
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
      if (hash !== req.headers['x-paystack-signature']) {
        console.error('Paystack webhook signature verification failed');
        return res.status(400).send('Invalid signature');
      }
    }

    const event = req.body;
    console.log('Received Paystack webhook:', event.event);

    const { data, error } = await supabase
      .rpc('handle_paystack_webhook', {
        p_event_data: event
      });

    if (error) {
      console.error('Paystack webhook processing error:', error);
      return res.status(500).json({ message: 'Webhook processing failed' });
    }

    console.log('Paystack webhook processed successfully');
    return res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Paystack webhook handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

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

function sendZoomError(res, error, fallbackMessage = 'Unable to connect to Zoom. Please try again later.') {
  console.error('Zoom integration error:', error.response?.data || error.message || error);

  if (error.code === 'ZOOM_NOT_CONFIGURED') {
    return res.status(503).json({
      success: false,
      configured: false,
      error: 'Zoom is not configured by the administrator.',
      missing: error.missing || []
    });
  }

  return res.status(502).json({
    success: false,
    error: fallbackMessage
  });
}

async function saveZoomAccountForTeacher(teacherId, zoomUser) {
  const names = {
    first_name: zoomUser.first_name || 'Zoom',
    last_name: zoomUser.last_name || 'Host'
  };

  const { data: zoomAccount, error } = await supabase
    .from('zoom_accounts')
    .upsert({
      teacher_id: teacherId,
      zoom_user_id: `${zoomUser.id}:${teacherId}`,
      email: zoomUser.email || `${zoomUser.id}@zoom.local`,
      first_name: names.first_name,
      last_name: names.last_name,
      personal_meeting_url: zoomUser.personal_meeting_url || zoomUser.vanity_url || null,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'teacher_id' })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('teachers')
    .update({
      zoom_connected: true,
      zoom_email: zoomAccount.email,
      updated_at: new Date().toISOString()
    })
    .eq('id', teacherId);

  return zoomAccount;
}

async function createAndStoreZoomMeetingForSession(session, options = {}) {
  const zoomUserId = options.zoomUserId || 'me';
  const duration = Number(options.duration || session.duration_minutes || 60);
  const topic = options.topic || session.title;
  const startTime = new Date(options.startTime || session.scheduled_start).toISOString();

  const zoomMeeting = await zoomServerService.createZoomMeeting({
    zoomUserId,
    topic,
    startTime,
    duration,
    timezone: options.timezone || 'UTC',
    password: options.password,
    agenda: options.agenda || session.description || `SomaTogether class session: ${topic}`
  });

  const { data: meeting, error: meetingError } = await supabase
    .from('zoom_meetings')
    .insert({
      meeting_id: String(zoomMeeting.id),
      teacher_id: session.teacher_id,
      class_session_id: session.id,
      topic: zoomMeeting.topic,
      description: zoomMeeting.agenda,
      start_time: zoomMeeting.start_time,
      duration_minutes: zoomMeeting.duration,
      timezone: zoomMeeting.timezone || options.timezone || 'UTC',
      join_url: zoomMeeting.join_url,
      start_url: zoomMeeting.start_url,
      password: zoomMeeting.password,
      meeting_type: zoomMeeting.type,
      status: 'scheduled',
      settings: zoomMeeting.settings || {}
    })
    .select()
    .single();

  if (meetingError) throw meetingError;

  const { error: sessionUpdateError } = await supabase
    .from('class_sessions')
    .update({
      meeting_url: zoomMeeting.join_url,
      meeting_id: String(zoomMeeting.id),
      zoom_meeting_id: meeting.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (sessionUpdateError) throw sessionUpdateError;

  return meeting;
}

function publicZoomMeeting(meeting) {
  if (!meeting) return null;
  const { start_url, ...safeMeeting } = meeting;
  return safeMeeting;
}

app.get('/api/zoom/configuration', (req, res) => {
  res.json(zoomServerService.getZoomConfigurationStatus());
});

app.get('/api/zoom/status/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const configuration = zoomServerService.getZoomConfigurationStatus();

    const { data: zoomAccount, error } = await supabase
      .from('zoom_accounts')
      .select('id, teacher_id, zoom_user_id, email, first_name, last_name, personal_meeting_url, is_active, created_at')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      configured: configuration.configured,
      missing: configuration.missing,
      connected: configuration.configured && !!zoomAccount,
      account: zoomAccount || null
    });
  } catch (error) {
    sendZoomError(res, error, 'Failed to fetch Zoom status');
  }
});

app.post('/api/zoom/connect', async (req, res) => {
  try {
    const { teacherId } = req.body;

    if (!teacherId) {
      return res.status(400).json({ success: false, error: 'Teacher ID is required' });
    }

    await zoomServerService.getZoomAccessToken();

    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', teacherId)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }

    const zoomUser = await zoomServerService.getZoomUser('me');
    const zoomAccount = await saveZoomAccountForTeacher(teacherId, zoomUser);

    res.json({
      success: true,
      message: 'Zoom Connected',
      connected: true,
      account: zoomAccount
    });
  } catch (error) {
    sendZoomError(res, error);
  }
});

app.post('/api/zoom/meetings/create', async (req, res) => {
  try {
    const { sessionId, topic, startTime, duration, timezone = 'UTC', password } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ success: false, error: 'Class session not found' });
    }

    const meeting = await createAndStoreZoomMeetingForSession(session, {
      topic,
      startTime,
      duration,
      timezone,
      password
    });

    res.json({ success: true, meeting });
  } catch (error) {
    sendZoomError(res, error, 'Failed to create Zoom meeting');
  }
});

app.get('/api/zoom/meetings/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status = 'upcoming', limit = 10 } = req.query;

    let query = supabase
      .from('zoom_meetings')
      .select(`
        *,
        class_sessions (
          id,
          title,
          description,
          scheduled_start,
          scheduled_end
        )
      `)
      .eq('teacher_id', teacherId)
      .order('start_time', { ascending: true })
      .limit(Number(limit));

    if (status === 'upcoming') {
      query = query.gte('start_time', new Date().toISOString());
    } else if (status === 'past') {
      query = query.lt('start_time', new Date().toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    sendZoomError(res, error, 'Failed to fetch Zoom meetings');
  }
});

app.get('/api/zoom/meetings/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status = 'upcoming', limit = 10 } = req.query;

    let query = supabase
      .from('class_sessions')
      .select(`
        zoom_meetings!class_sessions_zoom_meeting_id_fkey (
          *,
          class_sessions (
            id,
            title,
            description,
            scheduled_start,
            scheduled_end
          )
        )
      `)
      .eq('student_id', studentId)
      .not('zoom_meeting_id', 'is', null)
      .order('scheduled_start', { ascending: true })
      .limit(Number(limit));

    if (status === 'upcoming') {
      query = query.gte('scheduled_start', new Date().toISOString());
    } else if (status === 'past') {
      query = query.lt('scheduled_start', new Date().toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(row => publicZoomMeeting(row.zoom_meetings)).filter(Boolean));
  } catch (error) {
    sendZoomError(res, error, 'Failed to fetch Zoom meetings');
  }
});

app.get('/api/zoom/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const { data: meeting, error } = await supabase
      .from('zoom_meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error || !meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    sendZoomError(res, error, 'Failed to fetch Zoom meeting');
  }
});

app.put('/api/zoom/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { data: storedMeeting, error: fetchError } = await supabase
      .from('zoom_meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (fetchError || !storedMeeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    const updates = {
      topic: req.body.topic,
      start_time: req.body.startTime || req.body.start_time,
      duration: req.body.duration || req.body.duration_minutes,
      timezone: req.body.timezone,
      password: req.body.password,
      agenda: req.body.description || req.body.agenda
    };

    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const zoomMeeting = await zoomServerService.updateZoomMeeting(storedMeeting.meeting_id, updates);

    const { data: updatedMeeting, error: updateError } = await supabase
      .from('zoom_meetings')
      .update({
        topic: zoomMeeting.topic,
        description: zoomMeeting.agenda,
        start_time: zoomMeeting.start_time,
        duration_minutes: zoomMeeting.duration,
        timezone: zoomMeeting.timezone || storedMeeting.timezone,
        join_url: zoomMeeting.join_url,
        start_url: zoomMeeting.start_url || storedMeeting.start_url,
        password: zoomMeeting.password,
        settings: zoomMeeting.settings || storedMeeting.settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (storedMeeting.class_session_id) {
      await supabase
        .from('class_sessions')
        .update({
          meeting_url: updatedMeeting.join_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', storedMeeting.class_session_id);
    }

    res.json({ success: true, meeting: updatedMeeting });
  } catch (error) {
    sendZoomError(res, error, 'Failed to update Zoom meeting');
  }
});

app.delete('/api/zoom/meetings/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { data: meeting, error: fetchError } = await supabase
      .from('zoom_meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (fetchError || !meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    await zoomServerService.deleteZoomMeeting(meeting.meeting_id);

    if (meeting.class_session_id) {
      await supabase
        .from('class_sessions')
        .update({
          meeting_url: null,
          meeting_id: null,
          zoom_meeting_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', meeting.class_session_id);
    }

    const { error: deleteError } = await supabase
      .from('zoom_meetings')
      .delete()
      .eq('id', meetingId);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error) {
    sendZoomError(res, error, 'Failed to delete Zoom meeting');
  }
});

app.post('/api/zoom/meetings/:meetingId/join', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      return res.status(400).json({ success: false, error: 'Missing user information' });
    }

    const { data: meeting, error: meetingError } = await supabase
      .from('zoom_meetings')
      .select('*, class_sessions(student_id, teacher_id)')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    const enrolledStudent = userType === 'student' && meeting.class_sessions?.student_id === userId;
    const owningTeacher = userType === 'teacher' && meeting.teacher_id === userId;

    if (!enrolledStudent && !owningTeacher) {
      return res.status(403).json({ success: false, error: 'You are not enrolled in this Zoom class.' });
    }

    const { data: participant, error: participantError } = await supabase
      .from('meeting_participants')
      .upsert({
        meeting_id: meetingId,
        user_id: userId,
        user_type: userType,
        join_time: new Date().toISOString(),
        is_host: userType === 'teacher'
      })
      .select()
      .single();

    if (participantError) throw participantError;

    await supabase
      .from('zoom_meetings')
      .update({
        status: 'started',
        participants_count: (meeting.participants_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', meetingId);

    res.json({
      success: true,
      joinUrl: meeting.join_url,
      participant
    });
  } catch (error) {
    sendZoomError(res, error, 'Failed to join Zoom meeting');
  }
});

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
