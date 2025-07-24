import * as admin from 'firebase-admin';
import { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Generate a unique referral code for a user
 */
export async function generateReferralCode(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    // Check if user already has a referral code
    const existingCode = await getUserReferralCode(userId);
    if (existingCode) {
      return res.json({ 
        referralCode: existingCode,
        referralLink: generateReferralLink(existingCode),
        message: 'Using existing referral code'
      });
    }
    
    // Generate new code
    const code = await createUniqueReferralCode(userId);
    
    // Save to database
    await admin.firestore().collection('referrals').doc(code).set({
      userId,
      code,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usageCount: 0,
      earnings: 0
    });
    
    // Update user document
    await admin.firestore().collection('users').doc(userId).update({
      referralCode: code,
      referralStats: {
        totalReferrals: 0,
        activeReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0
      }
    });
    
    res.json({
      referralCode: code,
      referralLink: generateReferralLink(code),
      shareMessage: getShareMessage(code),
      message: 'Referral code created successfully'
    });
    
  } catch (error) {
    console.error('Error generating referral code:', error);
    res.status(500).json({ error: 'Failed to generate referral code' });
  }
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    // Get user's referral code
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.referralCode) {
      return res.json({
        hasReferralCode: false,
        stats: null
      });
    }
    
    // Get referral signups
    const signupsSnapshot = await admin.firestore()
      .collection('referral_signups')
      .where('referralCode', '==', userData.referralCode)
      .get();
    
    const referrals = signupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate stats
    const stats = {
      referralCode: userData.referralCode,
      referralLink: generateReferralLink(userData.referralCode),
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.status === 'completed').length,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      totalEarnings: userData.referralStats?.totalEarnings || 0,
      referrals: referrals.map(r => ({
        date: r.createdAt?.toDate(),
        status: r.status,
        earned: r.status === 'completed' ? 5 : 0 // $5 per successful referral
      }))
    };
    
    res.json({
      hasReferralCode: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
}

/**
 * Process referral completion (called from webhook)
 */
export async function completeReferral(
  referredUserId: string, 
  subscriptionId: string,
  amountPaid: number
) {
  try {
    // Find pending referral
    const referralSnapshot = await admin.firestore()
      .collection('referral_signups')
      .where('referredUserId', '==', referredUserId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    
    if (referralSnapshot.empty) return;
    
    const referralDoc = referralSnapshot.docs[0];
    const referralData = referralDoc.data();
    const referrerId = referralData.referrerId;
    
    // Update referral status
    await referralDoc.ref.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      subscriptionId,
      amountPaid
    });
    
    // Reward referrer
    const rewardAmount = 5; // $5 per referral
    
    // Update referrer stats
    await admin.firestore().collection('users').doc(referrerId).update({
      'referralStats.totalReferrals': admin.firestore.FieldValue.increment(1),
      'referralStats.activeReferrals': admin.firestore.FieldValue.increment(1),
      'referralStats.pendingReferrals': admin.firestore.FieldValue.increment(-1),
      'referralStats.totalEarnings': admin.firestore.FieldValue.increment(rewardAmount),
      accountBalance: admin.firestore.FieldValue.increment(rewardAmount * 100) // in cents
    });
    
    // Create reward transaction
    await admin.firestore().collection('referral_rewards').add({
      referrerId,
      referredUserId,
      referralCode: referralData.referralCode,
      rewardAmount,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send notification to referrer
    await sendReferralSuccessNotification(referrerId, rewardAmount);
    
    // Apply permanent discount to referrer's subscription if they have one
    const referrerDoc = await admin.firestore().collection('users').doc(referrerId).get();
    const referrerData = referrerDoc.data();
    
    if (referrerData?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(referrerData.stripeSubscriptionId, {
          coupon: 'FRIEND15'
        });
      } catch (error) {
        console.error('Error applying referrer discount:', error);
      }
    }
    
  } catch (error) {
    console.error('Error completing referral:', error);
  }
}

/**
 * Create unique referral code
 */
async function createUniqueReferralCode(userId: string): Promise<string> {
  const baseCode = userId.substring(0, 6).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  let code = `${baseCode}${randomPart}`;
  
  // Ensure uniqueness
  let attempts = 0;
  while (attempts < 10) {
    const existing = await admin.firestore()
      .collection('referrals')
      .doc(code)
      .get();
    
    if (!existing.exists) {
      return code;
    }
    
    // Generate new code
    code = `${baseCode}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    attempts++;
  }
  
  throw new Error('Could not generate unique referral code');
}

/**
 * Get user's referral code if exists
 */
async function getUserReferralCode(userId: string): Promise<string | null> {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  return userDoc.data()?.referralCode || null;
}

/**
 * Generate referral link
 */
function generateReferralLink(code: string): string {
  const baseUrl = process.env.APP_BASE_URL || 'https://app.naturinex.com';
  return `${baseUrl}/pricing?ref=${code}`;
}

/**
 * Get share message templates
 */
function getShareMessage(code: string): Record<string, string> {
  const link = generateReferralLink(code);
  
  return {
    sms: `Check out Naturinex - the AI health scanner app I'm using! Get 15% off forever with my link: ${link}`,
    email: `Hi! I've been using Naturinex for AI-powered health scanning and it's amazing. You can get 15% off forever using my referral link: ${link}`,
    social: `🌿 I'm loving @Naturinex for instant health insights! Get 15% off forever when you sign up with my link: ${link} #HealthTech #Wellness`,
    whatsapp: `Hey! I'm using this amazing app called Naturinex that uses AI to scan and analyze health products. You should try it! 

Get 15% off forever with my referral link: ${link}`
  };
}

/**
 * Send referral success notification
 */
async function sendReferralSuccessNotification(userId: string, amount: number) {
  await admin.firestore().collection('notifications').add({
    userId,
    type: 'referral_success',
    title: '🎉 Referral Reward Earned!',
    message: `Your friend just subscribed! You've earned $${amount} and both of you get 15% off forever.`,
    data: {
      amount,
      action: 'view_referrals'
    },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Cash out referral earnings
 */
export async function cashOutReferralEarnings(req: Request, res: Response) {
  try {
    const { userId, method, details } = req.body;
    
    // Get user balance
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    const balance = userData?.accountBalance || 0;
    
    if (balance < 2000) { // Minimum $20
      return res.status(400).json({
        error: 'Minimum cashout amount is $20',
        currentBalance: balance / 100
      });
    }
    
    // Create payout request
    await admin.firestore().collection('payout_requests').add({
      userId,
      amount: balance / 100,
      method, // 'paypal', 'venmo', 'account_credit'
      details,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Reset balance
    await userDoc.ref.update({
      accountBalance: 0,
      'referralStats.lastCashout': admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: 'Cashout request submitted',
      amount: balance / 100
    });
    
  } catch (error) {
    console.error('Error processing cashout:', error);
    res.status(500).json({ error: 'Failed to process cashout' });
  }
}