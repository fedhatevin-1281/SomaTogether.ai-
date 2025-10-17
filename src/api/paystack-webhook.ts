// Paystack Webhook Handler
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const event = req.body;
    
    // Verify webhook signature (you should implement this for security)
    // const signature = req.headers['x-paystack-signature'];
    // if (!verifyWebhookSignature(event, signature)) {
    //   return res.status(400).json({ message: 'Invalid signature' });
    // }

    console.log('Received Paystack webhook:', event.type);

    // Process the webhook event
    const { data, error } = await supabase
      .rpc('handle_paystack_webhook', {
        p_event_data: event
      });

    if (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ message: 'Webhook processing failed' });
    }

    if (data) {
      console.log('Webhook processed successfully');
      return res.status(200).json({ message: 'Webhook processed successfully' });
    } else {
      console.log('Webhook event not processed');
      return res.status(200).json({ message: 'Event not processed' });
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Function to verify webhook signature (implement for security)
function verifyWebhookSignature(payload: any, signature: string): boolean {
  // Implement Paystack webhook signature verification
  // This is important for security in production
  return true; // Placeholder - implement actual verification
}