import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import { handleStripeWebhook } from './stripeWebhook';

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Use raw body parsing for all requests
app.use(express.raw({ type: 'application/json' }));

// Route POST requests to /webhooks/stripe to the handleStripeWebhook function
app.post('/webhooks/stripe', handleStripeWebhook);

// Export api via functions.https.onRequest(app)
export const api = functions.https.onRequest(app);