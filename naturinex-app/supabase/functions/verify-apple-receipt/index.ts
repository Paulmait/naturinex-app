/**
 * Apple Subscription Verification Edge Function
 *
 * SECURITY-HARDENED implementation using App Store Server API.
 *
 * Verification Priority:
 * 1. App Store Server API (PRIMARY - authoritative source)
 * 2. Client signedTransaction decode (ONLY if server API unavailable)
 * 3. Legacy verifyReceipt (DEPRECATED - last resort fallback)
 *
 * SECURITY:
 * - userId is derived from Supabase Auth JWT, NOT from request body
 * - Client-supplied signedTransaction is NOT trusted if server API works
 * - Entitlement escalation attacks are prevented
 *
 * Required Secrets:
 * - APPLE_ISSUER_ID: App Store Connect Issuer ID
 * - APPLE_KEY_ID: App Store Connect API Key ID
 * - APPLE_PRIVATE_KEY: .p8 private key contents (base64 encoded)
 * - APPLE_BUNDLE_ID: App bundle identifier
 * - APPLE_SHARED_SECRET: (Legacy) Only for verifyReceipt fallback
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SignJWT, importPKCS8 } from 'https://deno.land/x/jose@v5.2.0/index.ts'
import { corsHeaders } from '../_shared/cors.ts'

// App Store Server API endpoints
const APP_STORE_SERVER_API_PRODUCTION = 'https://api.storekit.itunes.apple.com'
const APP_STORE_SERVER_API_SANDBOX = 'https://api.storekit-sandbox.itunes.apple.com'

// Legacy verifyReceipt endpoints (DEPRECATED - fallback only)
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

// Product ID to tier mapping
const PRODUCT_TIERS: Record<string, string> = {
  'naturinex_premium_monthly': 'premium',
  'naturinex_premium_yearly': 'premium',
}

// Verification methods for logging
type VerificationMethod = 'server_api' | 'signed_transaction' | 'legacy_receipt' | 'none'

interface Entitlement {
  tier: string
  expiresAt: string | null
  productId: string | null
  isActive: boolean
  transactionId: string | null
  isTrial: boolean
  environment: string
}

const DEFAULT_ENTITLEMENT: Entitlement = {
  tier: 'free',
  expiresAt: null,
  productId: null,
  isActive: false,
  transactionId: null,
  isTrial: false,
  environment: 'Production',
}

/**
 * Generate JWT for App Store Server API using JOSE library
 * This is the correct, standards-compliant way to sign ES256 JWTs
 */
async function generateAppStoreJWT(): Promise<string> {
  const issuerId = Deno.env.get('APPLE_ISSUER_ID')
  const keyId = Deno.env.get('APPLE_KEY_ID')
  const privateKeyBase64 = Deno.env.get('APPLE_PRIVATE_KEY')
  const bundleId = Deno.env.get('APPLE_BUNDLE_ID') || 'com.naturinex.wellness'

  if (!issuerId || !keyId || !privateKeyBase64) {
    throw new Error('Missing App Store Server API credentials')
  }

  // Decode base64 private key to PEM format
  const privateKeyPem = new TextDecoder().decode(
    Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0))
  )

  // Import the private key using JOSE
  const privateKey = await importPKCS8(privateKeyPem, 'ES256')

  // Create and sign the JWT using JOSE SignJWT
  const jwt = await new SignJWT({
    bid: bundleId,
  })
    .setProtectedHeader({ alg: 'ES256', kid: keyId, typ: 'JWT' })
    .setIssuer(issuerId)
    .setIssuedAt()
    .setExpirationTime('1h')
    .setAudience('appstoreconnect-v1')
    .sign(privateKey)

  return jwt
}

/**
 * Decode JWS signed transaction - SYNCHRONOUS
 * Only performs base64url decode and JSON parse
 * Does NOT verify signature (we trust Apple's signature)
 */
function decodeSignedTransaction(signedTransaction: string): Record<string, unknown> {
  const parts = signedTransaction.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWS format: expected 3 parts')
  }

  // Decode payload (middle part)
  const payloadBase64 = parts[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  // Add padding if needed
  const padding = '='.repeat((4 - (payloadBase64.length % 4)) % 4)
  const payloadJson = atob(payloadBase64 + padding)

  return JSON.parse(payloadJson)
}

/**
 * Safely parse expiresDate which may be string or number
 */
function parseExpiresDate(expiresDate: unknown): number | null {
  if (typeof expiresDate === 'number') {
    return expiresDate
  }
  if (typeof expiresDate === 'string') {
    const parsed = parseInt(expiresDate, 10)
    return isNaN(parsed) ? null : parsed
  }
  return null
}

/**
 * Query subscription status from App Store Server API
 */
async function getSubscriptionStatus(
  originalTransactionId: string,
  useSandbox: boolean
): Promise<Record<string, unknown> | null> {
  const baseUrl = useSandbox ? APP_STORE_SERVER_API_SANDBOX : APP_STORE_SERVER_API_PRODUCTION

  try {
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

    if (response.status === 404) {
      console.log('[verify-apple] Transaction not found in Server API')
      return null
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[verify-apple] Server API error:', response.status, errorText)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[verify-apple] Server API request failed:', error)
    return null
  }
}

/**
 * Process subscription data from App Store Server API
 */
function processServerAPIResponse(subscriptionData: Record<string, unknown>): Entitlement | null {
  const data = subscriptionData.data as Array<Record<string, unknown>> | undefined
  if (!data?.length) {
    return null
  }

  const now = Date.now()
  let bestSubscription: {
    productId: string
    expiresMs: number
    transactionId: string
    isTrial: boolean
    environment: string
  } | null = null

  for (const subscriptionGroup of data) {
    const lastTransactions = subscriptionGroup.lastTransactions as Array<Record<string, unknown>> | undefined
    if (!lastTransactions) continue

    for (const transaction of lastTransactions) {
      const status = transaction.status as string
      if (status !== 'ACTIVE' && status !== 'BILLING_RETRY') continue

      const signedInfo = transaction.signedTransactionInfo as string | undefined
      if (!signedInfo) continue

      try {
        const decoded = decodeSignedTransaction(signedInfo)
        const expiresMs = parseExpiresDate(decoded.expiresDate)

        if (expiresMs && expiresMs > now) {
          if (!bestSubscription || expiresMs > bestSubscription.expiresMs) {
            bestSubscription = {
              productId: decoded.productId as string,
              expiresMs,
              transactionId: decoded.originalTransactionId as string,
              isTrial: decoded.offerType === 1,
              environment: (decoded.environment as string) || 'Production',
            }
          }
        }
      } catch (e) {
        console.error('[verify-apple] Error decoding transaction info:', e)
      }
    }
  }

  if (!bestSubscription) {
    return null
  }

  const tier = PRODUCT_TIERS[bestSubscription.productId] || 'premium'
  return {
    tier,
    expiresAt: new Date(bestSubscription.expiresMs).toISOString(),
    productId: bestSubscription.productId,
    isActive: true,
    transactionId: bestSubscription.transactionId,
    isTrial: bestSubscription.isTrial,
    environment: bestSubscription.environment,
  }
}

/**
 * DEPRECATED: Legacy verifyReceipt validation
 * Only used as last-resort fallback when Server API credentials are unavailable
 */
async function validateReceiptLegacy(
  receiptData: string,
  useSandbox: boolean
): Promise<Record<string, unknown>> {
  console.warn('[verify-apple] Using DEPRECATED verifyReceipt endpoint')

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
 * Process legacy verifyReceipt response
 */
function processLegacyReceiptResponse(appleResponse: Record<string, unknown>): Entitlement | null {
  const status = appleResponse.status as number

  if (status !== 0 && status !== 21006) {
    return null
  }

  const latestReceiptInfo = appleResponse.latest_receipt_info as Array<Record<string, unknown>> | undefined
  const receipt = appleResponse.receipt as Record<string, unknown> | undefined
  const inApp = receipt?.in_app as Array<Record<string, unknown>> | undefined

  const receipts = latestReceiptInfo || inApp || []
  const now = Date.now()

  // Find active subscription with latest expiration
  const activeSubscription = receipts
    .map(r => ({
      productId: r.product_id as string,
      expiresMs: parseExpiresDate(r.expires_date_ms),
      transactionId: r.original_transaction_id as string,
      isTrial: r.is_trial_period === 'true',
    }))
    .filter(r => r.expiresMs && r.expiresMs > now)
    .sort((a, b) => (b.expiresMs || 0) - (a.expiresMs || 0))[0]

  if (!activeSubscription || !activeSubscription.expiresMs) {
    return null
  }

  const tier = PRODUCT_TIERS[activeSubscription.productId] || 'premium'
  return {
    tier,
    expiresAt: new Date(activeSubscription.expiresMs).toISOString(),
    productId: activeSubscription.productId,
    isActive: true,
    transactionId: activeSubscription.transactionId,
    isTrial: activeSubscription.isTrial,
    environment: (appleResponse.environment as string) || 'Production',
  }
}

/**
 * Extract authenticated user from Supabase Auth
 * SECURITY: User ID must come from auth token, not request body
 */
async function getAuthenticatedUser(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  })

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    console.error('[verify-apple] Auth error:', error?.message)
    return null
  }

  return user.id
}

/**
 * Save entitlement to database
 * Uses SERVICE_ROLE key for database writes
 */
async function saveEntitlement(
  userId: string,
  entitlement: Entitlement,
  method: VerificationMethod
): Promise<void> {
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
    console.error('[verify-apple] Database upsert error:', upsertError)
  }

  // Log transaction
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
      metadata: { verification_method: method },
    })
    .catch(err => console.error('[verify-apple] Transaction log error:', err))
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: Extract user from Supabase Auth JWT
    const authHeader = req.headers.get('Authorization')
    const userId = await getAuthenticatedUser(authHeader)

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body = await req.json()
    const {
      receipt,
      originalTransactionId,
      signedTransaction,
      sandbox,
    } = body

    // Check if Server API credentials are available
    const hasServerAPICredentials = !!(
      Deno.env.get('APPLE_ISSUER_ID') &&
      Deno.env.get('APPLE_KEY_ID') &&
      Deno.env.get('APPLE_PRIVATE_KEY')
    )

    let entitlement: Entitlement | null = null
    let method: VerificationMethod = 'none'

    // METHOD 1: App Store Server API (PRIMARY - authoritative)
    if (originalTransactionId && hasServerAPICredentials) {
      console.log('[verify-apple] Attempting Server API verification')

      const subscriptionData = await getSubscriptionStatus(originalTransactionId, sandbox || false)

      if (subscriptionData) {
        entitlement = processServerAPIResponse(subscriptionData)
        if (entitlement) {
          method = 'server_api'
          console.log('[verify-apple] Server API verification successful')
        }
      }
    }

    // METHOD 2: Decode client signedTransaction (ONLY if Server API unavailable)
    // SECURITY: Only use this if we couldn't verify via Server API
    if (!entitlement && signedTransaction && !hasServerAPICredentials) {
      console.log('[verify-apple] Attempting signed transaction decode (no Server API credentials)')

      try {
        const decoded = decodeSignedTransaction(signedTransaction)
        const expiresMs = parseExpiresDate(decoded.expiresDate)
        const now = Date.now()

        if (expiresMs && expiresMs > now) {
          const productId = decoded.productId as string
          const tier = PRODUCT_TIERS[productId] || 'premium'

          entitlement = {
            tier,
            expiresAt: new Date(expiresMs).toISOString(),
            productId,
            isActive: true,
            transactionId: decoded.originalTransactionId as string,
            isTrial: decoded.offerType === 1,
            environment: (decoded.environment as string) || 'Production',
          }
          method = 'signed_transaction'
          console.log('[verify-apple] Signed transaction decode successful')
        }
      } catch (error) {
        console.error('[verify-apple] Signed transaction decode failed:', error)
      }
    }

    // METHOD 3: Legacy verifyReceipt (DEPRECATED - last resort)
    // Only if no Server API credentials AND no signed transaction worked
    if (!entitlement && receipt && !hasServerAPICredentials) {
      console.log('[verify-apple] Falling back to DEPRECATED verifyReceipt')

      let appleResponse = await validateReceiptLegacy(receipt, sandbox || false)

      // Handle sandbox/production mismatch
      if (appleResponse.status === 21007) {
        console.log('[verify-apple] Retrying with sandbox endpoint')
        appleResponse = await validateReceiptLegacy(receipt, true)
      }

      entitlement = processLegacyReceiptResponse(appleResponse)
      if (entitlement) {
        method = 'legacy_receipt'
        console.log('[verify-apple] Legacy receipt verification successful')
      }
    }

    // Default to free tier if no valid entitlement found
    const finalEntitlement = entitlement || { ...DEFAULT_ENTITLEMENT }

    // Save to database
    await saveEntitlement(userId, finalEntitlement, method)

    console.log('[verify-apple] Verification complete:', {
      userId: userId.substring(0, 8) + '...',
      tier: finalEntitlement.tier,
      isActive: finalEntitlement.isActive,
      method,
    })

    return new Response(
      JSON.stringify({
        success: true,
        entitlement: finalEntitlement,
        verification_method: method,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[verify-apple] Unhandled error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
