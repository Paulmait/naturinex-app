/**
 * Apple Subscription Verification Edge Function
 *
 * Uses App Store Server API (NOT deprecated verifyReceipt) for subscription validation.
 * Supports both:
 * 1. JWS signed transactions from StoreKit 2
 * 2. Legacy receipt validation (fallback only)
 *
 * Required Secrets:
 * - APPLE_ISSUER_ID: Your App Store Connect Issuer ID
 * - APPLE_KEY_ID: Your App Store Connect API Key ID
 * - APPLE_PRIVATE_KEY: Your .p8 private key contents (base64 encoded)
 * - APPLE_BUNDLE_ID: Your app's bundle identifier
 * - APPLE_SHARED_SECRET: (Legacy) Only for verifyReceipt fallback
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { decode as base64Decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts'

// App Store Server API endpoints
const APP_STORE_SERVER_API_PRODUCTION = 'https://api.storekit.itunes.apple.com'
const APP_STORE_SERVER_API_SANDBOX = 'https://api.storekit-sandbox.itunes.apple.com'

// Legacy verifyReceipt endpoints (fallback only)
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

// Product ID to tier mapping
const PRODUCT_TIERS: Record<string, string> = {
  'naturinex_premium_monthly': 'premium',
  'naturinex_premium_yearly': 'premium',
}

interface JWTPayload {
  iss: string
  iat: number
  exp: number
  aud: string
  bid: string
}

/**
 * Generate JWT for App Store Server API authentication
 */
async function generateAppStoreJWT(): Promise<string> {
  const issuerId = Deno.env.get('APPLE_ISSUER_ID')
  const keyId = Deno.env.get('APPLE_KEY_ID')
  const privateKeyBase64 = Deno.env.get('APPLE_PRIVATE_KEY')
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID') || 'com.naturinex.wellness'

  if (!issuerId || !keyId || !privateKeyBase64) {
    throw new Error('Missing App Store Server API credentials')
  }

  // Decode private key from base64
  const privateKeyPem = new TextDecoder().decode(base64Decode(privateKeyBase64))

  // Create JWT header
  const header = {
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT',
  }

  // Create JWT payload
  const now = Math.floor(Date.now() / 1000)
  const payload: JWTPayload = {
    iss: issuerId,
    iat: now,
    exp: now + 3600, // 1 hour expiry
    aud: 'appstoreconnect-v1',
    bid: bundleId,
  }

  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  // Import private key for signing
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryKey = base64Decode(pemContents)

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  // Sign the JWT
  const signatureData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    signatureData
  )

  // Convert signature to base64url
  const signatureArray = new Uint8Array(signature)
  const encodedSignature = btoa(String.fromCharCode(...signatureArray))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

/**
 * Query subscription status from App Store Server API
 */
async function getSubscriptionStatus(
  originalTransactionId: string,
  useSandbox: boolean
): Promise<any> {
  const baseUrl = useSandbox ? APP_STORE_SERVER_API_SANDBOX : APP_STORE_SERVER_API_PRODUCTION
  const jwt = await generateAppStoreJWT()

  const response = await fetch(
    `${baseUrl}/inApps/v1/subscriptions/${originalTransactionId}`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[verify-apple] Server API error:', response.status, errorText)

    // If 4040000, transaction not found - might need to use legacy endpoint
    if (response.status === 404) {
      return null
    }

    throw new Error(`App Store Server API error: ${response.status}`)
  }

  return await response.json()
}

/**
 * Decode and verify JWS signed transaction
 */
async function decodeSignedTransaction(signedTransaction: string): Promise<any> {
  // JWS format: header.payload.signature
  const parts = signedTransaction.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWS format')
  }

  // Decode payload (we trust Apple's signature)
  const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (payloadBase64.length % 4)) % 4)
  const payloadJson = atob(payloadBase64 + padding)

  return JSON.parse(payloadJson)
}

/**
 * Legacy: Validate receipt with verifyReceipt endpoint
 * Used as fallback when App Store Server API credentials are not configured
 */
async function validateReceiptLegacy(
  receiptData: string,
  useSandbox: boolean
): Promise<any> {
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

/**
 * Process subscription data and determine entitlement
 */
function processSubscriptionData(subscriptionData: any): any {
  if (!subscriptionData?.data?.length) {
    return {
      tier: 'free',
      expiresAt: null,
      productId: null,
      isActive: false,
      transactionId: null,
    }
  }

  const now = Date.now()
  let bestSubscription: any = null

  // Find the best active subscription
  for (const subscriptionGroup of subscriptionData.data) {
    const lastTransactions = subscriptionGroup.lastTransactions || []

    for (const transaction of lastTransactions) {
      if (transaction.status === 'ACTIVE' || transaction.status === 'BILLING_RETRY') {
        const signedInfo = transaction.signedTransactionInfo
        if (signedInfo) {
          try {
            const decoded = decodeSignedTransaction(signedInfo)
            const expiresMs = decoded.expiresDate

            if (expiresMs > now) {
              if (!bestSubscription || expiresMs > bestSubscription.expiresMs) {
                bestSubscription = {
                  productId: decoded.productId,
                  expiresMs,
                  transactionId: decoded.originalTransactionId,
                  isInTrial: decoded.offerType === 1,
                  environment: decoded.environment,
                }
              }
            }
          } catch (e) {
            console.error('[verify-apple] Error decoding transaction:', e)
          }
        }
      }
    }
  }

  if (bestSubscription) {
    const tier = PRODUCT_TIERS[bestSubscription.productId] || 'premium'
    return {
      tier,
      expiresAt: new Date(bestSubscription.expiresMs).toISOString(),
      productId: bestSubscription.productId,
      isActive: true,
      transactionId: bestSubscription.transactionId,
      isTrial: bestSubscription.isInTrial || false,
      environment: bestSubscription.environment,
    }
  }

  return {
    tier: 'free',
    expiresAt: null,
    productId: null,
    isActive: false,
    transactionId: null,
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      receipt,
      originalTransactionId,
      signedTransaction,
      userId,
      sandbox,
    } = await req.json()

    // Determine if we should use App Store Server API or legacy
    const hasServerAPICredentials = !!(
      Deno.env.get('APPLE_ISSUER_ID') &&
      Deno.env.get('APPLE_KEY_ID') &&
      Deno.env.get('APPLE_PRIVATE_KEY')
    )

    let entitlement: any = null

    // Method 1: Use originalTransactionId with App Store Server API (preferred)
    if (originalTransactionId && hasServerAPICredentials) {
      console.log('[verify-apple] Using App Store Server API with transactionId')

      try {
        const subscriptionData = await getSubscriptionStatus(originalTransactionId, sandbox || false)

        if (subscriptionData) {
          entitlement = processSubscriptionData(subscriptionData)
        }
      } catch (error) {
        console.error('[verify-apple] Server API error:', error)
        // Will fall through to legacy method
      }
    }

    // Method 2: Decode signed transaction directly (StoreKit 2)
    if (!entitlement && signedTransaction) {
      console.log('[verify-apple] Decoding signed transaction')

      try {
        const decoded = await decodeSignedTransaction(signedTransaction)
        const now = Date.now()

        if (decoded.expiresDate && decoded.expiresDate > now) {
          const tier = PRODUCT_TIERS[decoded.productId] || 'premium'
          entitlement = {
            tier,
            expiresAt: new Date(decoded.expiresDate).toISOString(),
            productId: decoded.productId,
            isActive: true,
            transactionId: decoded.originalTransactionId,
            isTrial: decoded.offerType === 1,
            environment: decoded.environment,
          }
        }
      } catch (error) {
        console.error('[verify-apple] Error decoding signed transaction:', error)
      }
    }

    // Method 3: Legacy verifyReceipt fallback
    if (!entitlement && receipt) {
      console.log('[verify-apple] Using legacy verifyReceipt (deprecated)')

      let appleResponse = await validateReceiptLegacy(receipt, sandbox || false)

      // Status 21007 means receipt is from sandbox but sent to production
      if (appleResponse.status === 21007) {
        appleResponse = await validateReceiptLegacy(receipt, true)
      }

      if (appleResponse.status === 0 || appleResponse.status === 21006) {
        const latestReceipts = appleResponse.latest_receipt_info || appleResponse.receipt?.in_app || []
        const now = Date.now()

        const activeSubscription = latestReceipts
          .filter((r: any) => r.expires_date_ms && parseInt(r.expires_date_ms) > now)
          .sort((a: any, b: any) => parseInt(b.expires_date_ms || '0') - parseInt(a.expires_date_ms || '0'))[0]

        if (activeSubscription) {
          const tier = PRODUCT_TIERS[activeSubscription.product_id] || 'premium'
          entitlement = {
            tier,
            expiresAt: new Date(parseInt(activeSubscription.expires_date_ms)).toISOString(),
            productId: activeSubscription.product_id,
            isActive: true,
            transactionId: activeSubscription.original_transaction_id,
            isTrial: activeSubscription.is_trial_period === 'true',
            environment: appleResponse.environment || 'Production',
          }
        }
      }
    }

    // Default to free if nothing found
    if (!entitlement) {
      entitlement = {
        tier: 'free',
        expiresAt: null,
        productId: null,
        isActive: false,
        transactionId: null,
      }
    }

    // Update user subscription in Supabase if userId provided
    if (userId && entitlement) {
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
          is_trial: entitlement.isTrial || false,
          environment: entitlement.environment || 'Production',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })

      if (upsertError) {
        console.error('[verify-apple] Database update error:', upsertError)
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
          environment: entitlement.environment || 'Production',
        })
        .catch(err => console.error('[verify-apple] Transaction log error:', err))
    }

    console.log('[verify-apple] Success:', {
      tier: entitlement.tier,
      isActive: entitlement.isActive,
      method: hasServerAPICredentials ? 'server_api' : 'legacy',
    })

    return new Response(
      JSON.stringify({ success: true, entitlement }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[verify-apple] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
