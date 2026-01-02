/**
 * Apple Receipt Validation Edge Function
 *
 * Validates App Store receipts and updates user subscription status.
 * Handles both sandbox and production environments.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Apple's receipt validation endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

// Product ID to tier mapping
const PRODUCT_TIERS: Record<string, string> = {
  'naturinex_basic_monthly': 'basic',
  'naturinex_basic_yearly': 'basic',
  'naturinex_premium_monthly': 'premium',
  'naturinex_premium_yearly': 'premium',
  'naturinex_professional_monthly': 'professional',
  'naturinex_professional_yearly': 'professional',
}

interface AppleReceiptResponse {
  status: number
  environment?: string
  receipt?: {
    bundle_id: string
    in_app: Array<{
      product_id: string
      transaction_id: string
      original_transaction_id: string
      purchase_date_ms: string
      expires_date_ms?: string
      is_trial_period?: string
    }>
  }
  latest_receipt_info?: Array<{
    product_id: string
    transaction_id: string
    original_transaction_id: string
    purchase_date_ms: string
    expires_date_ms: string
    is_trial_period: string
    is_in_intro_offer_period?: string
  }>
  pending_renewal_info?: Array<{
    auto_renew_status: string
    product_id: string
  }>
}

async function validateWithApple(
  receiptData: string,
  useSandbox: boolean
): Promise<AppleReceiptResponse> {
  const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL
  const sharedSecret = Deno.env.get('APPLE_SHARED_SECRET')

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': sharedSecret,
      'exclude-old-transactions': true,
    }),
  })

  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { receipt, userId, sandbox } = await req.json()

    if (!receipt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Receipt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate with Apple - try production first, then sandbox if needed
    let appleResponse = await validateWithApple(receipt, sandbox || false)

    // Status 21007 means receipt is from sandbox but sent to production
    if (appleResponse.status === 21007) {
      console.log('[verify-apple-receipt] Retrying with sandbox environment')
      appleResponse = await validateWithApple(receipt, true)
    }

    // Check validation status
    // 0 = valid, 21006 = valid but subscription expired
    if (appleResponse.status !== 0 && appleResponse.status !== 21006) {
      console.error('[verify-apple-receipt] Apple validation failed:', appleResponse.status)
      return new Response(
        JSON.stringify({
          success: false,
          error: `Apple validation failed with status ${appleResponse.status}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the latest subscription info
    const latestReceipts = appleResponse.latest_receipt_info || appleResponse.receipt?.in_app || []

    if (latestReceipts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No subscription found in receipt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the most recent active subscription
    const now = Date.now()
    const activeSubscription = latestReceipts
      .filter(r => r.expires_date_ms && parseInt(r.expires_date_ms) > now)
      .sort((a, b) => parseInt(b.expires_date_ms || '0') - parseInt(a.expires_date_ms || '0'))[0]

    // Determine entitlement
    let entitlement = {
      tier: 'free' as string,
      expiresAt: null as string | null,
      productId: null as string | null,
      isActive: false,
      transactionId: null as string | null,
      isTrial: false,
      environment: appleResponse.environment || 'Production',
    }

    if (activeSubscription) {
      const productId = activeSubscription.product_id
      const tier = PRODUCT_TIERS[productId] || 'basic'

      entitlement = {
        tier,
        expiresAt: new Date(parseInt(activeSubscription.expires_date_ms)).toISOString(),
        productId,
        isActive: true,
        transactionId: activeSubscription.original_transaction_id,
        isTrial: activeSubscription.is_trial_period === 'true',
        environment: appleResponse.environment || 'Production',
      }
    }

    // Update user subscription in Supabase if userId provided
    if (userId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Upsert subscription record
      const { error: upsertError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          tier: entitlement.tier,
          product_id: entitlement.productId,
          expires_at: entitlement.expiresAt,
          is_active: entitlement.isActive,
          platform: 'ios',
          original_transaction_id: entitlement.transactionId,
          is_trial: entitlement.isTrial,
          environment: entitlement.environment,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })

      if (upsertError) {
        console.error('[verify-apple-receipt] Database update error:', upsertError)
        // Don't fail the request, just log the error
      }

      // Log the transaction
      await supabase
        .from('subscription_transactions')
        .insert({
          user_id: userId,
          platform: 'ios',
          product_id: entitlement.productId,
          transaction_id: entitlement.transactionId,
          action: 'verify',
          status: entitlement.isActive ? 'active' : 'expired',
          environment: entitlement.environment,
        })
        .catch(err => console.error('[verify-apple-receipt] Transaction log error:', err))
    }

    console.log('[verify-apple-receipt] Success:', {
      tier: entitlement.tier,
      isActive: entitlement.isActive,
      environment: entitlement.environment,
    })

    return new Response(
      JSON.stringify({ success: true, entitlement }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[verify-apple-receipt] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
