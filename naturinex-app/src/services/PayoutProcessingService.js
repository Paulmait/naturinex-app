// Automated Payout Processing Service for NaturineX Affiliates
// Handles commission calculations, payout scheduling, fraud detection, and payment processing
// Created: 2025-09-16

import { supabase } from '../config/supabase';
import CryptoJS from 'crypto-js';

class PayoutProcessingService {
  constructor() {
    this.minimumPayoutThreshold = 50.00;
    this.processingFee = 2.50; // Standard processing fee
    this.fraudCheckEnabled = true;
    this.supportedPaymentMethods = ['bank_transfer', 'paypal', 'stripe', 'wire_transfer'];
    this.maxRetries = 3;
    this.payoutSchedule = {
      frequency: 'weekly', // weekly, biweekly, monthly
      dayOfWeek: 'friday',
      timeOfDay: '14:00' // 2 PM UTC
    };
  }

  // ================================================
  // AUTOMATED PAYOUT PROCESSING
  // ================================================

  /**
   * Main function to process all eligible payouts
   * Called by scheduled task
   */
  async processScheduledPayouts() {
    try {
      console.log('Starting scheduled payout processing...');

      // Get all affiliates eligible for payout
      const eligibleAffiliates = await this.getEligibleAffiliates();

      if (eligibleAffiliates.length === 0) {
        console.log('No affiliates eligible for payout');
        return { success: true, processed: 0 };
      }

      console.log(`Found ${eligibleAffiliates.length} affiliates eligible for payout`);

      const results = {
        processed: 0,
        failed: 0,
        totalAmount: 0,
        errors: []
      };

      // Process each affiliate payout
      for (const affiliate of eligibleAffiliates) {
        try {
          const result = await this.processAffiliatePayout(affiliate);

          if (result.success) {
            results.processed++;
            results.totalAmount += result.amount;
          } else {
            results.failed++;
            results.errors.push({
              affiliateId: affiliate.id,
              error: result.error
            });
          }
        } catch (error) {
          console.error(`Error processing payout for affiliate ${affiliate.id}:`, error);
          results.failed++;
          results.errors.push({
            affiliateId: affiliate.id,
            error: error.message
          });
        }
      }

      // Send summary notification to admin
      await this.sendPayoutSummaryNotification(results);

      return {
        success: true,
        ...results
      };

    } catch (error) {
      console.error('Scheduled payout processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get affiliates eligible for payout
   */
  async getEligibleAffiliates() {
    try {
      // Get affiliates with pending commissions above threshold
      const { data: affiliates, error } = await supabase
        .from('affiliates')
        .select(`
          *,
          commission_calculations!inner(
            id,
            commission_amount,
            status,
            transaction_date
          )
        `)
        .eq('status', 'approved')
        .eq('commission_calculations.status', 'confirmed')
        .is('commission_calculations.payout_id', null);

      if (error) throw error;

      // Group and filter by minimum threshold
      const eligibleAffiliates = [];
      const affiliateMap = new Map();

      affiliates.forEach(affiliate => {
        const key = affiliate.id;
        if (!affiliateMap.has(key)) {
          affiliateMap.set(key, {
            ...affiliate,
            totalPending: 0,
            commissionIds: []
          });
        }

        const affiliateData = affiliateMap.get(key);
        affiliateData.totalPending += parseFloat(affiliate.commission_calculations.commission_amount);
        affiliateData.commissionIds.push(affiliate.commission_calculations.id);
      });

      // Filter by minimum threshold and other criteria
      for (const affiliate of affiliateMap.values()) {
        if (await this.isEligibleForPayout(affiliate)) {
          eligibleAffiliates.push(affiliate);
        }
      }

      return eligibleAffiliates;

    } catch (error) {
      console.error('Error getting eligible affiliates:', error);
      throw error;
    }
  }

  /**
   * Check if affiliate is eligible for payout
   */
  async isEligibleForPayout(affiliate) {
    // Check minimum threshold
    if (affiliate.totalPending < (affiliate.minimum_payout || this.minimumPayoutThreshold)) {
      return false;
    }

    // Check fraud indicators
    if (this.fraudCheckEnabled) {
      const fraudCheck = await this.performFraudCheck(affiliate);
      if (!fraudCheck.passed) {
        await this.createFraudAlert(affiliate.id, fraudCheck.reasons);
        return false;
      }
    }

    // Check account status
    if (affiliate.status !== 'approved') {
      return false;
    }

    // Check if payment method is valid
    if (!this.supportedPaymentMethods.includes(affiliate.payment_method)) {
      return false;
    }

    // Check for recent failed payouts
    const recentFailures = await this.getRecentFailedPayouts(affiliate.id);
    if (recentFailures.length >= this.maxRetries) {
      return false;
    }

    return true;
  }

  /**
   * Process individual affiliate payout
   */
  async processAffiliatePayout(affiliate) {
    try {
      console.log(`Processing payout for affiliate ${affiliate.id} - $${affiliate.totalPending}`);

      // Calculate fees and net amount
      const calculations = this.calculatePayoutAmounts(affiliate.totalPending);

      // Create payout record
      const payoutData = {
        affiliate_id: affiliate.id,
        amount: calculations.netAmount,
        gross_amount: affiliate.totalPending,
        processing_fee: calculations.processingFee,
        tax_withheld: calculations.taxWithheld,
        currency: 'USD',
        commission_count: affiliate.commissionIds.length,
        period_start: await this.getEarliestCommissionDate(affiliate.commissionIds),
        period_end: new Date().toISOString().split('T')[0],
        payment_method: affiliate.payment_method,
        status: 'processing'
      };

      const { data: payout, error: payoutError } = await supabase
        .from('payout_history')
        .insert([payoutData])
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Update commission records with payout ID
      await this.linkCommissionsToPayout(affiliate.commissionIds, payout.id);

      // Process the actual payment
      const paymentResult = await this.processPayment(affiliate, payout);

      if (paymentResult.success) {
        // Update payout status to completed
        await supabase
          .from('payout_history')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            payment_reference: paymentResult.reference,
            payment_provider: paymentResult.provider
          })
          .eq('id', payout.id);

        // Update affiliate total paid
        await supabase
          .from('affiliates')
          .update({
            total_commission_paid: affiliate.total_commission_paid + calculations.netAmount
          })
          .eq('id', affiliate.id);

        // Send success notification to affiliate
        await this.sendPayoutSuccessNotification(affiliate, payout, paymentResult);

        return {
          success: true,
          payoutId: payout.id,
          amount: calculations.netAmount,
          reference: paymentResult.reference
        };

      } else {
        // Mark payout as failed
        await supabase
          .from('payout_history')
          .update({
            status: 'failed',
            failure_reason: paymentResult.error
          })
          .eq('id', payout.id);

        // Send failure notification
        await this.sendPayoutFailureNotification(affiliate, payout, paymentResult.error);

        return {
          success: false,
          error: paymentResult.error
        };
      }

    } catch (error) {
      console.error(`Payout processing error for affiliate ${affiliate.id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate payout amounts including fees and taxes
   */
  calculatePayoutAmounts(grossAmount) {
    const processingFee = Math.min(this.processingFee, grossAmount * 0.05); // Max 5%
    const taxWithheld = 0; // Implement tax withholding logic if needed
    const netAmount = grossAmount - processingFee - taxWithheld;

    return {
      grossAmount,
      processingFee,
      taxWithheld,
      netAmount: Math.max(0, netAmount)
    };
  }

  /**
   * Process payment through appropriate provider
   */
  async processPayment(affiliate, payout) {
    try {
      const paymentMethod = affiliate.payment_method;
      const paymentDetails = this.decryptPaymentDetails(affiliate.payment_details);

      switch (paymentMethod) {
        case 'bank_transfer':
          return await this.processBankTransfer(affiliate, payout, paymentDetails);

        case 'paypal':
          return await this.processPayPalTransfer(affiliate, payout, paymentDetails);

        case 'stripe':
          return await this.processStripeTransfer(affiliate, payout, paymentDetails);

        case 'wire_transfer':
          return await this.processWireTransfer(affiliate, payout, paymentDetails);

        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process ACH bank transfer
   */
  async processBankTransfer(affiliate, payout, paymentDetails) {
    try {
      // Integration with banking API (e.g., Plaid, Dwolla, etc.)
      const transferData = {
        amount: payout.amount,
        currency: 'USD',
        destination: {
          accountNumber: paymentDetails.accountNumber,
          routingNumber: paymentDetails.routingNumber,
          accountType: 'checking',
          accountHolderName: paymentDetails.accountHolderName
        },
        description: `NaturineX Affiliate Payout - ${payout.id}`,
        metadata: {
          affiliateId: affiliate.id,
          payoutId: payout.id
        }
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In production, integrate with actual banking API
      const mockResponse = {
        success: true,
        transactionId: `ACH${Date.now()}`,
        status: 'pending',
        estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 business days
      };

      return {
        success: true,
        reference: mockResponse.transactionId,
        provider: 'bank_ach',
        status: mockResponse.status,
        estimatedArrival: mockResponse.estimatedArrival
      };

    } catch (error) {
      console.error('Bank transfer error:', error);
      return {
        success: false,
        error: 'Bank transfer failed: ' + error.message
      };
    }
  }

  /**
   * Process PayPal transfer
   */
  async processPayPalTransfer(affiliate, payout, paymentDetails) {
    try {
      // Integration with PayPal Payouts API
      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `NAT_PAYOUT_${payout.id}`,
          email_subject: 'NaturineX Affiliate Commission Payout',
          email_message: 'Your affiliate commission payout from NaturineX'
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: {
            value: payout.amount.toFixed(2),
            currency: 'USD'
          },
          receiver: paymentDetails.paypalEmail,
          note: `Affiliate commission payout for period ${payout.period_start} to ${payout.period_end}`,
          sender_item_id: payout.id
        }]
      };

      // Simulate PayPal API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResponse = {
        batch_header: {
          payout_batch_id: `PAYPAL${Date.now()}`,
          batch_status: 'PENDING'
        }
      };

      return {
        success: true,
        reference: mockResponse.batch_header.payout_batch_id,
        provider: 'paypal',
        status: 'pending'
      };

    } catch (error) {
      console.error('PayPal transfer error:', error);
      return {
        success: false,
        error: 'PayPal transfer failed: ' + error.message
      };
    }
  }

  /**
   * Process Stripe Express transfer
   */
  async processStripeTransfer(affiliate, payout, paymentDetails) {
    try {
      // Integration with Stripe Connect/Express
      const transferData = {
        amount: Math.round(payout.amount * 100), // Convert to cents
        currency: 'usd',
        destination: paymentDetails.stripeAccountId,
        description: `NaturineX Affiliate Payout - ${payout.id}`,
        metadata: {
          affiliate_id: affiliate.id,
          payout_id: payout.id
        }
      };

      // Simulate Stripe API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockResponse = {
        id: `tr_${Date.now()}`,
        amount: transferData.amount,
        currency: 'usd',
        destination: transferData.destination,
        created: Math.floor(Date.now() / 1000)
      };

      return {
        success: true,
        reference: mockResponse.id,
        provider: 'stripe',
        status: 'completed'
      };

    } catch (error) {
      console.error('Stripe transfer error:', error);
      return {
        success: false,
        error: 'Stripe transfer failed: ' + error.message
      };
    }
  }

  /**
   * Process wire transfer (for international payouts)
   */
  async processWireTransfer(affiliate, payout, paymentDetails) {
    try {
      // Integration with international wire transfer service
      const wireData = {
        amount: payout.amount,
        currency: 'USD',
        beneficiary: {
          name: paymentDetails.beneficiaryName,
          address: paymentDetails.beneficiaryAddress,
          bankName: paymentDetails.bankName,
          bankAddress: paymentDetails.bankAddress,
          iban: paymentDetails.iban,
          swiftCode: paymentDetails.swiftCode
        },
        purpose: 'Affiliate Commission Payment',
        reference: `NAT-PAYOUT-${payout.id}`
      };

      // Simulate wire transfer API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockResponse = {
        reference: `WIRE${Date.now()}`,
        status: 'processing',
        estimatedArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 business days
      };

      return {
        success: true,
        reference: mockResponse.reference,
        provider: 'wire_transfer',
        status: 'processing',
        estimatedArrival: mockResponse.estimatedArrival
      };

    } catch (error) {
      console.error('Wire transfer error:', error);
      return {
        success: false,
        error: 'Wire transfer failed: ' + error.message
      };
    }
  }

  // ================================================
  // FRAUD DETECTION & SECURITY
  // ================================================

  /**
   * Perform comprehensive fraud check
   */
  async performFraudCheck(affiliate) {
    const reasons = [];
    let riskScore = 0;

    try {
      // Check conversion rate anomalies
      const conversionRate = affiliate.total_conversions > 0
        ? affiliate.total_conversions / affiliate.total_clicks
        : 0;

      if (conversionRate > 0.15) { // Suspiciously high conversion rate
        reasons.push('Abnormally high conversion rate');
        riskScore += 30;
      }

      // Check for suspicious click patterns
      const recentClicks = await this.getRecentClickAnalysis(affiliate.id);
      if (recentClicks.suspiciousPatterns) {
        reasons.push('Suspicious click patterns detected');
        riskScore += 25;
      }

      // Check for duplicate payment details
      const duplicatePayments = await this.checkDuplicatePaymentDetails(affiliate);
      if (duplicatePayments.length > 0) {
        reasons.push('Duplicate payment details found');
        riskScore += 20;
      }

      // Check recent commission velocity
      const commissionVelocity = await this.analyzeCommissionVelocity(affiliate.id);
      if (commissionVelocity.suspicious) {
        reasons.push('Unusual commission earning velocity');
        riskScore += 15;
      }

      // Check geolocation consistency
      const geoConsistency = await this.checkGeolocationConsistency(affiliate.id);
      if (!geoConsistency.consistent) {
        reasons.push('Inconsistent geographic patterns');
        riskScore += 10;
      }

      return {
        passed: riskScore < 50, // Threshold for blocking payout
        riskScore,
        reasons
      };

    } catch (error) {
      console.error('Fraud check error:', error);
      return {
        passed: false,
        riskScore: 100,
        reasons: ['Fraud check system error']
      };
    }
  }

  /**
   * Analyze recent click patterns for fraud indicators
   */
  async getRecentClickAnalysis(affiliateId) {
    try {
      const { data: recentClicks } = await supabase
        .from('referral_tracking')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .gte('clicked_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('clicked_at', { ascending: false });

      if (!recentClicks || recentClicks.length === 0) {
        return { suspiciousPatterns: false };
      }

      // Analyze patterns
      const ipCounts = {};
      const userAgentCounts = {};
      const hourlyDistribution = new Array(24).fill(0);

      recentClicks.forEach(click => {
        // Count IPs
        if (click.visitor_ip) {
          ipCounts[click.visitor_ip] = (ipCounts[click.visitor_ip] || 0) + 1;
        }

        // Count user agents
        if (click.visitor_user_agent) {
          userAgentCounts[click.visitor_user_agent] = (userAgentCounts[click.visitor_user_agent] || 0) + 1;
        }

        // Hourly distribution
        const hour = new Date(click.clicked_at).getHours();
        hourlyDistribution[hour]++;
      });

      // Check for suspicious patterns
      const suspiciousPatterns =
        Object.values(ipCounts).some(count => count > recentClicks.length * 0.7) || // 70% from same IP
        Object.values(userAgentCounts).some(count => count > recentClicks.length * 0.8) || // 80% same user agent
        Math.max(...hourlyDistribution) > recentClicks.length * 0.5; // 50% in same hour

      return { suspiciousPatterns };

    } catch (error) {
      console.error('Click analysis error:', error);
      return { suspiciousPatterns: true }; // Err on side of caution
    }
  }

  /**
   * Check for duplicate payment details across affiliates
   */
  async checkDuplicatePaymentDetails(affiliate) {
    try {
      if (!affiliate.payment_details) return [];

      const paymentDetails = this.decryptPaymentDetails(affiliate.payment_details);
      if (!paymentDetails) return [];

      // Hash sensitive details for comparison
      const accountHash = this.hashPaymentDetails(paymentDetails);

      const { data: duplicates } = await supabase
        .from('affiliates')
        .select('id, email')
        .neq('id', affiliate.id)
        .not('payment_details', 'is', null);

      const matches = [];
      if (duplicates) {
        for (const other of duplicates) {
          const otherDetails = this.decryptPaymentDetails(other.payment_details);
          if (otherDetails && this.hashPaymentDetails(otherDetails) === accountHash) {
            matches.push(other);
          }
        }
      }

      return matches;

    } catch (error) {
      console.error('Duplicate payment check error:', error);
      return [];
    }
  }

  /**
   * Analyze commission earning velocity for anomalies
   */
  async analyzeCommissionVelocity(affiliateId) {
    try {
      const { data: commissions } = await supabase
        .from('commission_calculations')
        .select('commission_amount, transaction_date')
        .eq('affiliate_id', affiliateId)
        .eq('status', 'confirmed')
        .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('transaction_date', { ascending: true });

      if (!commissions || commissions.length < 5) {
        return { suspicious: false };
      }

      // Calculate daily earnings
      const dailyEarnings = {};
      commissions.forEach(commission => {
        const date = commission.transaction_date.split('T')[0];
        dailyEarnings[date] = (dailyEarnings[date] || 0) + parseFloat(commission.commission_amount);
      });

      const amounts = Object.values(dailyEarnings);
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const max = Math.max(...amounts);

      // Flag if any day is more than 5x the average
      const suspicious = max > avg * 5 && max > 100;

      return { suspicious };

    } catch (error) {
      console.error('Commission velocity analysis error:', error);
      return { suspicious: false };
    }
  }

  // ================================================
  // UTILITY FUNCTIONS
  // ================================================

  /**
   * Decrypt payment details
   */
  decryptPaymentDetails(encryptedData) {
    if (!encryptedData) return null;

    try {
      const key = process.env.REACT_APP_ENCRYPTION_KEY || 'default-key';
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Hash payment details for comparison
   */
  hashPaymentDetails(paymentDetails) {
    const sensitiveFields = [
      paymentDetails.accountNumber,
      paymentDetails.routingNumber,
      paymentDetails.paypalEmail,
      paymentDetails.iban
    ].filter(Boolean);

    return CryptoJS.SHA256(sensitiveFields.join('|')).toString();
  }

  /**
   * Get earliest commission date for period calculation
   */
  async getEarliestCommissionDate(commissionIds) {
    try {
      const { data: commission } = await supabase
        .from('commission_calculations')
        .select('transaction_date')
        .in('id', commissionIds)
        .order('transaction_date', { ascending: true })
        .limit(1)
        .single();

      return commission ? commission.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Link commission records to payout
   */
  async linkCommissionsToPayout(commissionIds, payoutId) {
    await supabase
      .from('commission_calculations')
      .update({
        payout_id: payoutId,
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .in('id', commissionIds);
  }

  /**
   * Get recent failed payouts for an affiliate
   */
  async getRecentFailedPayouts(affiliateId) {
    const { data: failedPayouts } = await supabase
      .from('payout_history')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .eq('status', 'failed')
      .gte('requested_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    return failedPayouts || [];
  }

  /**
   * Create fraud alert
   */
  async createFraudAlert(affiliateId, reasons) {
    await supabase
      .from('fraud_detection')
      .insert([{
        affiliate_id: affiliateId,
        fraud_type: 'payout_fraud',
        confidence_score: 0.8,
        risk_level: 'high',
        detection_method: 'automated',
        evidence: { reasons },
        action_taken: 'block_payout'
      }]);
  }

  /**
   * Send payout success notification
   */
  async sendPayoutSuccessNotification(affiliate, payout, paymentResult) {
    await supabase
      .from('affiliate_notifications')
      .insert([{
        affiliate_id: affiliate.id,
        title: 'Payout Processed Successfully',
        message: `Your payout of $${payout.amount.toFixed(2)} has been processed via ${affiliate.payment_method}. Reference: ${paymentResult.reference}`,
        notification_type: 'payout',
        priority: 'high'
      }]);

    // Also send email notification
    console.log(`Sending payout success email to ${affiliate.email}`);
  }

  /**
   * Send payout failure notification
   */
  async sendPayoutFailureNotification(affiliate, payout, error) {
    await supabase
      .from('affiliate_notifications')
      .insert([{
        affiliate_id: affiliate.id,
        title: 'Payout Processing Failed',
        message: `Your payout of $${payout.amount.toFixed(2)} failed to process. Error: ${error}. Please update your payment information.`,
        notification_type: 'alert',
        priority: 'urgent'
      }]);

    console.log(`Sending payout failure email to ${affiliate.email}`);
  }

  /**
   * Send payout summary notification to admin
   */
  async sendPayoutSummaryNotification(results) {
    const summary = {
      processed: results.processed,
      failed: results.failed,
      totalAmount: results.totalAmount,
      errors: results.errors.length
    };

    console.log('Payout Summary:', summary);

    // Send to admin notification system
    // Implementation depends on admin notification preferences
  }

  /**
   * Check geolocation consistency
   */
  async checkGeolocationConsistency(affiliateId) {
    // Implementation for checking geographic consistency of clicks/conversions
    // This would integrate with IP geolocation services
    return { consistent: true };
  }

  // ================================================
  // MANUAL PAYOUT PROCESSING
  // ================================================

  /**
   * Process manual payout request from admin
   */
  async processManualPayout(affiliateId, options = {}) {
    try {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('*')
        .eq('id', affiliateId)
        .single();

      if (!affiliate) {
        throw new Error('Affiliate not found');
      }

      // Override automatic checks if specified
      if (!options.skipEligibilityCheck) {
        const eligibility = await this.isEligibleForPayout(affiliate);
        if (!eligibility) {
          throw new Error('Affiliate not eligible for payout');
        }
      }

      // Get pending commissions
      const { data: commissions } = await supabase
        .from('commission_calculations')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .eq('status', 'confirmed')
        .is('payout_id', null);

      if (!commissions || commissions.length === 0) {
        throw new Error('No pending commissions found');
      }

      const totalAmount = commissions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);
      const commissionIds = commissions.map(c => c.id);

      // Process the payout
      const result = await this.processAffiliatePayout({
        ...affiliate,
        totalPending: totalAmount,
        commissionIds
      });

      return result;

    } catch (error) {
      console.error('Manual payout error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payout processing status
   */
  async getPayoutStatus(payoutId) {
    try {
      const { data: payout } = await supabase
        .from('payout_history')
        .select(`
          *,
          affiliates(first_name, last_name, email)
        `)
        .eq('id', payoutId)
        .single();

      return {
        success: true,
        payout
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retry failed payout
   */
  async retryFailedPayout(payoutId) {
    try {
      const { data: payout } = await supabase
        .from('payout_history')
        .select(`
          *,
          affiliates(*)
        `)
        .eq('id', payoutId)
        .eq('status', 'failed')
        .single();

      if (!payout) {
        throw new Error('Failed payout not found');
      }

      // Update retry count
      await supabase
        .from('payout_history')
        .update({
          retry_count: (payout.retry_count || 0) + 1,
          status: 'processing'
        })
        .eq('id', payoutId);

      // Retry payment processing
      const paymentResult = await this.processPayment(payout.affiliates, payout);

      if (paymentResult.success) {
        await supabase
          .from('payout_history')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            payment_reference: paymentResult.reference,
            failure_reason: null
          })
          .eq('id', payoutId);

        return { success: true, reference: paymentResult.reference };
      } else {
        await supabase
          .from('payout_history')
          .update({
            status: 'failed',
            failure_reason: paymentResult.error
          })
          .eq('id', payoutId);

        return { success: false, error: paymentResult.error };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const payoutProcessingService = new PayoutProcessingService();

export default payoutProcessingService;