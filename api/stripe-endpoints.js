// Backend API endpoints for Stripe integration
// These should be implemented in your backend (Node.js/Express, Next.js API routes, etc.)

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency || 'usd',
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Create customer endpoint
app.post('/api/create-customer', async (req, res) => {
  try {
    const { email, name, userId } = req.body;

    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        userId: userId,
      },
    });

    res.json({ customerId: customer.id });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get payment methods endpoint
app.get('/api/payment-methods', async (req, res) => {
  try {
    const { customer_id } = req.query;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer_id,
      type: 'card',
    });

    res.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Process withdrawal endpoint
app.post('/api/process-withdrawal', async (req, res) => {
  try {
    const { teacherId, amount, bankAccount } = req.body;

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
    
    // Update user's token balance in database
    await updateUserTokens(userId, parseInt(tokens), 'add');
    
    // Create transaction record
    await createTransactionRecord({
      userId: userId,
      type: 'purchase',
      amount: parseInt(tokens),
      description: `Token purchase - ${tokenPackage}`,
      referenceId: paymentIntent.id,
      status: 'completed'
    });

    console.log(`Payment succeeded for user ${userId}: ${tokens} tokens`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
  try {
    const { userId } = paymentIntent.metadata;
    
    // Update transaction record as failed
    await updateTransactionStatus(paymentIntent.id, 'failed');
    
    console.log(`Payment failed for user ${userId}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle transfer creation
async function handleTransferCreated(transfer) {
  try {
    const { teacherId } = transfer.metadata;
    
    // Update withdrawal request status
    await updateWithdrawalStatus(teacherId, transfer.id, 'completed');
    
    console.log(`Withdrawal completed for teacher ${teacherId}: ${transfer.amount}`);
  } catch (error) {
    console.error('Error handling transfer creation:', error);
  }
}

// Database helper functions (implement based on your database)
async function updateUserTokens(userId, tokens, operation) {
  // Implement database update logic
  console.log(`Updating tokens for user ${userId}: ${operation} ${tokens}`);
}

async function createTransactionRecord(transactionData) {
  // Implement database insert logic
  console.log('Creating transaction record:', transactionData);
}

async function updateTransactionStatus(paymentIntentId, status) {
  // Implement database update logic
  console.log(`Updating transaction status: ${paymentIntentId} -> ${status}`);
}

async function updateWithdrawalStatus(teacherId, transferId, status) {
  // Implement database update logic
  console.log(`Updating withdrawal status for teacher ${teacherId}: ${status}`);
}

module.exports = {
  createPaymentIntent,
  createCustomer,
  getPaymentMethods,
  processWithdrawal,
  handleWebhook
};

