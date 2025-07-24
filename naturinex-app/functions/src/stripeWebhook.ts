import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Get webhook endpoint secret from environment
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Secure webhook handler for Stripe events
 * Verifies webhook signature and processes payment events
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<Response> {
  // Get the signature from Stripe headers
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    console.error('⚠️ Webhook Error: No stripe-signature header present');
    return res.status(400).send('Webhook Error: Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    // Verify the webhook signature using the raw body
    event = stripe.webhooks.constructEvent(
      req.body, // This must be the raw body (Buffer)
      sig,
      endpointSecret
    );
    
    console.log('✅ Webhook signature verified successfully');
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    console.error('Signature:', sig);
    console.error('Endpoint Secret exists:', !!endpointSecret);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log the event type
  console.log(`📩 Received event: ${event.type}`);
  console.log(`Event ID: ${event.id}`);

  // Handle the event based on its type
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      // Optional: Handle other events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded': {
        console.log(`ℹ️ Received ${event.type} event - processing may be added later`);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return res.status(200).json({ received: true, type: event.type });
  } catch (error) {
    console.error('❌ Error processing webhook event:', error);
    // Still return 200 to prevent Stripe from retrying
    return res.status(200).json({ received: true, error: 'Processing failed but acknowledged' });
  }
}

/**
 * Handle successful checkout session completion
 * This is where you provision access to your service
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout.session.completed');
  
  // Log the session data
  console.log('Session ID:', session.id);
  console.log('Customer Email:', session.customer_email);
  console.log('Customer ID:', session.customer);
  console.log('Payment Status:', session.payment_status);
  console.log('Amount Total:', session.amount_total);
  console.log('Currency:', session.currency);
  console.log('Subscription ID:', session.subscription);
  console.log('Payment Intent:', session.payment_intent);
  
  // Log metadata (contains userId, plan, billingCycle)
  console.log('Metadata:', JSON.stringify(session.metadata, null, 2));
  
  // Extract metadata
  const { userId, plan, billingCycle } = session.metadata || {};
  
  if (!userId) {
    console.error('⚠️ No userId found in session metadata');
    return;
  }

  try {
    // If this is a subscription, get subscription details
    let subscriptionData = null;
    if (session.subscription && session.mode === 'subscription') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      };
      console.log('Subscription Details:', JSON.stringify(subscriptionData, null, 2));
    }

    // Update user document in Firestore
    const updateData: any = {
      isPremium: true,
      subscriptionPlan: plan || 'premium',
      billingCycle: billingCycle || 'monthly',
      stripeCustomerId: session.customer as string,
      lastPaymentAmount: session.amount_total,
      lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (subscriptionData) {
      updateData.stripeSubscriptionId = subscriptionData.id;
      updateData.subscriptionStatus = subscriptionData.status;
      updateData.subscriptionCurrentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
    }

    await admin.firestore().collection('users').doc(userId).update(updateData);
    console.log(`✅ Successfully updated user ${userId} to premium status`);

    // Log successful payment in payments collection
    await admin.firestore().collection('payments').add({
      userId,
      sessionId: session.id,
      customerId: session.customer,
      customerEmail: session.customer_email,
      amount: session.amount_total,
      currency: session.currency,
      status: 'succeeded',
      plan: plan || 'premium',
      billingCycle: billingCycle || 'monthly',
      subscriptionId: session.subscription,
      paymentIntentId: session.payment_intent,
      metadata: session.metadata,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Payment logged successfully');

    // Send success notification
    await admin.firestore().collection('notifications').add({
      userId,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your ${plan || 'premium'} subscription is now active!`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  } catch (error) {
    console.error('❌ Error updating user after successful payment:', error);
    // Log the error but don't throw - we don't want Stripe to retry
    await admin.firestore().collection('webhook_errors').add({
      event: 'checkout.session.completed',
      sessionId: session.id,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Handle failed invoice payment
 * This is where you might suspend access or notify the user
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Processing invoice.payment_failed');
  
  // Log the invoice data
  console.log('Invoice ID:', invoice.id);
  console.log('Customer ID:', invoice.customer);
  console.log('Customer Email:', invoice.customer_email);
  console.log('Amount Due:', invoice.amount_due);
  console.log('Currency:', invoice.currency);
  console.log('Subscription ID:', invoice.subscription);
  console.log('Attempt Count:', invoice.attempt_count);
  console.log('Next Payment Attempt:', invoice.next_payment_attempt);
  
  const customerId = invoice.customer as string;
  
  try {
    // Find user by Stripe customer ID
    const userSnapshot = await admin.firestore()
      .collection('users')
      .where('stripeCustomerId', '==', customerId)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.error('⚠️ No user found with customer ID:', customerId);
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    
    // Log failed payment
    await admin.firestore().collection('payments').add({
      userId,
      invoiceId: invoice.id,
      customerId,
      customerEmail: invoice.customer_email,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      attemptCount: invoice.attempt_count,
      subscriptionId: invoice.subscription,
      nextPaymentAttempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send payment failure notification
    await admin.firestore().collection('notifications').add({
      userId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `We couldn't process your payment of $${(invoice.amount_due / 100).toFixed(2)}. Please update your payment method to continue your subscription.`,
      invoiceId: invoice.id,
      actionUrl: invoice.hosted_invoice_url,
      priority: 'high',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // If this is the final attempt, consider suspending access
    if (!invoice.next_payment_attempt) {
      console.log('⚠️ Final payment attempt failed, considering suspension');
      // You might want to update the user's premium status here
      // But be careful - Stripe might still retry or the user might update their card
      
      // Optional: Add a grace period flag instead of immediately removing access
      await userDoc.ref.update({
        paymentFailureDate: admin.firestore.FieldValue.serverTimestamp(),
        hasPaymentIssue: true,
      });
    }

    console.log(`✅ Payment failure handled for user ${userId}`);

  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    // Log the error but don't throw
    await admin.firestore().collection('webhook_errors').add({
      event: 'invoice.payment_failed',
      invoiceId: invoice.id,
      customerId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// Export individual handlers for testing
export { handleCheckoutSessionCompleted, handleInvoicePaymentFailed };