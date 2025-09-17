/**
 * Enterprise Billing Service
 * Handles subscription management, invoicing, payments, and billing automation
 */

import { supabase } from '../config/supabase';
import Stripe from 'stripe';

class EnterpriseBillingService {
  constructor() {
    this.supabase = supabase;
    this.stripe = new Stripe(process.env.REACT_APP_STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });

    // Enterprise pricing tiers
    this.pricingTiers = {
      starter: {
        name: 'Starter',
        monthlyPrice: 299,
        annualPrice: 2990,
        seatsIncluded: 50,
        apiQuotaMonthly: 10000,
        features: ['basic_analytics', 'email_support', 'standard_sla']
      },
      professional: {
        name: 'Professional',
        monthlyPrice: 799,
        annualPrice: 7990,
        seatsIncluded: 200,
        apiQuotaMonthly: 50000,
        features: ['advanced_analytics', 'priority_support', 'enhanced_sla', 'custom_integrations']
      },
      enterprise: {
        name: 'Enterprise',
        monthlyPrice: 1999,
        annualPrice: 19990,
        seatsIncluded: 1000,
        apiQuotaMonthly: 200000,
        features: ['full_analytics', 'dedicated_support', 'premium_sla', 'white_label', 'sso', 'custom_development']
      }
    };
  }

  // =============================================================================
  // SUBSCRIPTION MANAGEMENT
  // =============================================================================

  /**
   * Create enterprise subscription
   */
  async createSubscription(organizationId, subscriptionData) {
    try {
      const {
        planId,
        billingCycle = 'monthly',
        seatsCount,
        paymentMethodId,
        billingDetails,
        trialDays = 0
      } = subscriptionData;

      // Get organization details
      const { data: organization, error: orgError } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;

      // Create or get Stripe customer
      let stripeCustomer = await this.getOrCreateStripeCustomer(organization, billingDetails);

      // Attach payment method to customer
      if (paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomer.id
        });

        await this.stripe.customers.update(stripeCustomer.id, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      // Calculate pricing
      const pricing = this.calculateSubscriptionPricing(planId, billingCycle, seatsCount);

      // Create Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pricing.planName} Plan`,
                description: `Enterprise ${pricing.planName} subscription`
              },
              unit_amount: pricing.unitAmount,
              recurring: {
                interval: billingCycle === 'annual' ? 'year' : 'month'
              }
            },
            quantity: 1
          }
        ],
        trial_period_days: trialDays,
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          organization_id: organizationId,
          plan_id: planId,
          seats_count: seatsCount || pricing.seatsIncluded
        }
      });

      // Store billing information in database
      const billingRecord = await this.createBillingRecord(
        organizationId,
        stripeSubscription,
        pricing
      );

      return {
        success: true,
        data: {
          subscription: stripeSubscription,
          billing: billingRecord.data
        }
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update subscription (change plan, seats, etc.)
   */
  async updateSubscription(organizationId, updates) {
    try {
      const {
        planId,
        seatsCount,
        billingCycle
      } = updates;

      // Get current billing record
      const { data: currentBilling, error: billingError } = await this.supabase
        .from('enterprise_billing')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      if (billingError) throw billingError;

      // Calculate new pricing
      const newPricing = this.calculateSubscriptionPricing(planId, billingCycle, seatsCount);

      // Update Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        currentBilling.subscription_id
      );

      const updatedSubscription = await this.stripe.subscriptions.update(
        currentBilling.subscription_id,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${newPricing.planName} Plan`,
                  description: `Enterprise ${newPricing.planName} subscription`
                },
                unit_amount: newPricing.unitAmount,
                recurring: {
                  interval: billingCycle === 'annual' ? 'year' : 'month'
                }
              },
              quantity: 1
            }
          ],
          proration_behavior: 'create_prorations'
        }
      );

      // Update billing record
      const { data: updatedBilling, error: updateError } = await this.supabase
        .from('enterprise_billing')
        .update({
          plan_id: planId,
          plan_name: newPricing.planName,
          seats_included: newPricing.seatsIncluded,
          monthly_fee: newPricing.monthlyFee,
          api_quota_monthly: newPricing.apiQuotaMonthly,
          billing_cycle: billingCycle
        })
        .eq('id', currentBilling.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update organization quotas
      await this.updateOrganizationQuotas(organizationId, newPricing);

      return {
        success: true,
        data: {
          subscription: updatedSubscription,
          billing: updatedBilling
        }
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(organizationId, cancelImmediately = false) {
    try {
      // Get current billing record
      const { data: currentBilling, error: billingError } = await this.supabase
        .from('enterprise_billing')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      if (billingError) throw billingError;

      // Cancel Stripe subscription
      const canceledSubscription = await this.stripe.subscriptions.update(
        currentBilling.subscription_id,
        {
          cancel_at_period_end: !cancelImmediately
        }
      );

      if (cancelImmediately) {
        await this.stripe.subscriptions.cancel(currentBilling.subscription_id);
      }

      // Update billing record
      const { data: updatedBilling, error: updateError } = await this.supabase
        .from('enterprise_billing')
        .update({
          status: cancelImmediately ? 'cancelled' : 'cancelling'
        })
        .eq('id', currentBilling.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: {
          subscription: canceledSubscription,
          billing: updatedBilling
        }
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================================================
  // INVOICE MANAGEMENT
  // =============================================================================

  /**
   * Generate invoice
   */
  async generateInvoice(organizationId, invoiceData) {
    try {
      const {
        billingId,
        lineItems,
        dueDate,
        customFields = {},
        sendEmail = true
      } = invoiceData;

      // Get billing and organization details
      const [billingResult, orgResult] = await Promise.all([
        this.supabase.from('enterprise_billing').select('*').eq('id', billingId).single(),
        this.supabase.from('organizations').select('*').eq('id', organizationId).single()
      ]);

      if (billingResult.error) throw billingResult.error;
      if (orgResult.error) throw orgResult.error;

      const billing = billingResult.data;
      const organization = orgResult.data;

      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
      const taxRate = this.calculateTaxRate(organization.billing_address);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;

      // Create Stripe invoice
      const stripeInvoice = await this.stripe.invoices.create({
        customer: billing.customer_id,
        collection_method: 'send_invoice',
        days_until_due: this.calculateDaysUntilDue(dueDate),
        metadata: {
          organization_id: organizationId,
          billing_id: billingId
        }
      });

      // Add line items to Stripe invoice
      for (const item of lineItems) {
        await this.stripe.invoiceItems.create({
          customer: billing.customer_id,
          invoice: stripeInvoice.id,
          amount: item.amount * 100, // Convert to cents
          currency: 'usd',
          description: item.description,
          quantity: item.quantity
        });
      }

      // Finalize invoice
      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(stripeInvoice.id);

      // Store invoice in database
      const { data: invoiceRecord, error: invoiceError } = await this.supabase
        .from('enterprise_invoices')
        .insert([{
          organization_id: organizationId,
          billing_id: billingId,
          stripe_invoice_id: finalizedInvoice.id,
          amount_due: total,
          tax_amount: taxAmount,
          currency: 'USD',
          status: 'open',
          due_date: dueDate,
          invoice_url: finalizedInvoice.hosted_invoice_url,
          pdf_url: finalizedInvoice.invoice_pdf,
          line_items: lineItems,
          metadata: customFields
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Send invoice email if requested
      if (sendEmail) {
        await this.stripe.invoices.sendInvoice(finalizedInvoice.id);
      }

      return {
        success: true,
        data: {
          invoice: finalizedInvoice,
          record: invoiceRecord
        }
      };
    } catch (error) {
      console.error('Error generating invoice:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get invoices for organization
   */
  async getInvoices(organizationId, options = {}) {
    try {
      const {
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = options;

      let query = this.supabase
        .from('enterprise_invoices')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId);

      if (status) query = query.eq('status', status);
      if (startDate) query = query.gte('created_at', startDate);
      if (endDate) query = query.lte('created_at', endDate);

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: {
          invoices: data,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Pay invoice manually (for failed payments)
   */
  async payInvoice(invoiceId, paymentMethodId) {
    try {
      // Get invoice details
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('enterprise_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      // Attempt payment through Stripe
      const stripeInvoice = await this.stripe.invoices.pay(
        invoice.stripe_invoice_id,
        {
          payment_method: paymentMethodId
        }
      );

      // Update invoice status
      const { data: updatedInvoice, error: updateError } = await this.supabase
        .from('enterprise_invoices')
        .update({
          status: stripeInvoice.status,
          paid_at: stripeInvoice.status === 'paid' ? new Date().toISOString() : null
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        data: {
          invoice: stripeInvoice,
          record: updatedInvoice
        }
      };
    } catch (error) {
      console.error('Error paying invoice:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================================================
  // USAGE-BASED BILLING
  // =============================================================================

  /**
   * Calculate usage charges
   */
  async calculateUsageCharges(organizationId, billingPeriod) {
    try {
      const { startDate, endDate } = billingPeriod;

      // Get usage data for the billing period
      const { data: usageData, error: usageError } = await this.supabase
        .from('enterprise_usage_analytics')
        .select('metric_type, data_processed_mb, cost_credits')
        .eq('organization_id', organizationId)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (usageError) throw usageError;

      // Get organization's billing configuration
      const { data: billing, error: billingError } = await this.supabase
        .from('enterprise_billing')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      if (billingError) throw billingError;

      // Calculate overages
      const usageStats = this.aggregateUsageStats(usageData);
      const overages = this.calculateOverages(usageStats, billing);

      return {
        success: true,
        data: {
          usageStats,
          overages,
          totalOverageAmount: overages.reduce((sum, overage) => sum + overage.amount, 0)
        }
      };
    } catch (error) {
      console.error('Error calculating usage charges:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process monthly billing
   */
  async processMonthlyBilling(organizationId) {
    try {
      const now = new Date();
      const billingPeriod = {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
      };

      // Calculate usage charges
      const usageResult = await this.calculateUsageCharges(organizationId, billingPeriod);
      if (!usageResult.success) throw new Error(usageResult.error);

      const { overages, totalOverageAmount } = usageResult.data;

      // Generate invoice if there are overages
      if (totalOverageAmount > 0) {
        const lineItems = overages.map(overage => ({
          description: overage.description,
          amount: overage.amount,
          quantity: 1
        }));

        const invoiceResult = await this.generateInvoice(organizationId, {
          billingId: await this.getBillingId(organizationId),
          lineItems,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          customFields: {
            billing_period: billingPeriod,
            overage_charges: true
          }
        });

        return invoiceResult;
      }

      return { success: true, data: { message: 'No overages to bill' } };
    } catch (error) {
      console.error('Error processing monthly billing:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================================================
  // PAYMENT METHODS & CUSTOMER MANAGEMENT
  // =============================================================================

  /**
   * Add payment method
   */
  async addPaymentMethod(organizationId, paymentMethodData) {
    try {
      const { paymentMethodId, setAsDefault = false } = paymentMethodData;

      // Get billing record
      const { data: billing, error: billingError } = await this.supabase
        .from('enterprise_billing')
        .select('customer_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      if (billingError) throw billingError;

      // Attach payment method to Stripe customer
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: billing.customer_id
      });

      // Set as default if requested
      if (setAsDefault) {
        await this.stripe.customers.update(billing.customer_id, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      return { success: true, data: paymentMethod };
    } catch (error) {
      console.error('Error adding payment method:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(organizationId) {
    try {
      // Get customer ID
      const { data: billing, error: billingError } = await this.supabase
        .from('enterprise_billing')
        .select('customer_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();

      if (billingError) throw billingError;

      // Get payment methods from Stripe
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: billing.customer_id,
        type: 'card'
      });

      return { success: true, data: paymentMethods.data };
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================================================
  // WEBHOOKS & EVENT HANDLING
  // =============================================================================

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return { success: false, error: error.message };
    }
  }

  async handleInvoicePaymentSucceeded(invoice) {
    // Update invoice status in database
    await this.supabase
      .from('enterprise_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        amount_paid: invoice.amount_paid / 100
      })
      .eq('stripe_invoice_id', invoice.id);
  }

  async handleInvoicePaymentFailed(invoice) {
    // Update invoice status and handle failed payment
    await this.supabase
      .from('enterprise_invoices')
      .update({
        status: 'past_due'
      })
      .eq('stripe_invoice_id', invoice.id);

    // Implement dunning management logic here
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  async getOrCreateStripeCustomer(organization, billingDetails) {
    // Check if customer already exists
    const { data: billing } = await this.supabase
      .from('enterprise_billing')
      .select('customer_id')
      .eq('organization_id', organization.id)
      .single();

    if (billing?.customer_id) {
      return await this.stripe.customers.retrieve(billing.customer_id);
    }

    // Create new Stripe customer
    return await this.stripe.customers.create({
      name: organization.name,
      email: billingDetails.email || organization.billing_email,
      address: billingDetails.address,
      metadata: {
        organization_id: organization.id
      }
    });
  }

  calculateSubscriptionPricing(planId, billingCycle, seatsCount) {
    const tier = this.pricingTiers[planId];
    if (!tier) throw new Error('Invalid plan ID');

    const basePrice = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
    const additionalSeats = Math.max(0, (seatsCount || 0) - tier.seatsIncluded);
    const seatPrice = billingCycle === 'annual' ? 120 : 12; // Per seat per period

    return {
      planName: tier.name,
      seatsIncluded: tier.seatsIncluded,
      additionalSeats,
      unitAmount: (basePrice + (additionalSeats * seatPrice)) * 100, // Convert to cents
      monthlyFee: billingCycle === 'annual' ? basePrice / 12 : basePrice,
      apiQuotaMonthly: tier.apiQuotaMonthly,
      features: tier.features
    };
  }

  async createBillingRecord(organizationId, stripeSubscription, pricing) {
    return await this.supabase
      .from('enterprise_billing')
      .insert([{
        organization_id: organizationId,
        subscription_id: stripeSubscription.id,
        customer_id: stripeSubscription.customer,
        plan_id: stripeSubscription.metadata.plan_id,
        plan_name: pricing.planName,
        seats_included: pricing.seatsIncluded,
        additional_seats: pricing.additionalSeats,
        monthly_fee: pricing.monthlyFee,
        api_quota_monthly: pricing.apiQuotaMonthly,
        billing_cycle: stripeSubscription.items.data[0].price.recurring.interval,
        status: 'active',
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString()
      }])
      .select()
      .single();
  }

  async updateOrganizationQuotas(organizationId, pricing) {
    await this.supabase
      .from('organizations')
      .update({
        api_quota_monthly: pricing.apiQuotaMonthly,
        max_users: pricing.seatsIncluded + pricing.additionalSeats,
        features: pricing.features
      })
      .eq('id', organizationId);
  }

  calculateTaxRate(billingAddress) {
    // Implement tax calculation based on billing address
    // This is a simplified example - use a proper tax service in production
    if (billingAddress?.state === 'CA') return 8.25; // California tax rate
    if (billingAddress?.country === 'US') return 5.0; // Generic US tax rate
    return 0; // No tax for international
  }

  calculateDaysUntilDue(dueDate) {
    if (!dueDate) return 30; // Default 30 days
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  }

  aggregateUsageStats(usageData) {
    return usageData.reduce((stats, record) => {
      stats.totalApiCalls = (stats.totalApiCalls || 0) + (record.metric_type === 'api_call' ? 1 : 0);
      stats.totalDataProcessed = (stats.totalDataProcessed || 0) + (record.data_processed_mb || 0);
      stats.totalCostCredits = (stats.totalCostCredits || 0) + (record.cost_credits || 0);
      return stats;
    }, {});
  }

  calculateOverages(usageStats, billing) {
    const overages = [];

    // API quota overage
    if (usageStats.totalApiCalls > billing.api_quota_monthly) {
      const overageCount = usageStats.totalApiCalls - billing.api_quota_monthly;
      overages.push({
        type: 'api_overage',
        description: `API calls overage (${overageCount} calls)`,
        amount: overageCount * 0.01, // $0.01 per extra call
        quantity: overageCount
      });
    }

    return overages;
  }

  async getBillingId(organizationId) {
    const { data, error } = await this.supabase
      .from('enterprise_billing')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    if (error) throw error;
    return data.id;
  }

  async handleSubscriptionUpdated(subscription) {
    // Update billing record when subscription changes
    await this.supabase
      .from('enterprise_billing')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('subscription_id', subscription.id);
  }

  async handleSubscriptionDeleted(subscription) {
    // Mark subscription as cancelled
    await this.supabase
      .from('enterprise_billing')
      .update({
        status: 'cancelled'
      })
      .eq('subscription_id', subscription.id);
  }
}

export default new EnterpriseBillingService();