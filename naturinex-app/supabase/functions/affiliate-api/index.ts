// Comprehensive Affiliate API Endpoints for NaturineX
// Handles all affiliate program operations via Supabase Edge Functions
// Created: 2025-09-16

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface AffiliateRequest {
  action: string
  data?: any
  affiliateId?: string
  userId?: string
}

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, data, affiliateId, userId }: AffiliateRequest = await req.json()

    let response: ApiResponse

    switch (action) {
      // ================================================
      // AFFILIATE REGISTRATION & MANAGEMENT
      // ================================================
      case 'register_affiliate':
        response = await registerAffiliate(data)
        break

      case 'approve_affiliate':
        response = await approveAffiliate(data.affiliateId, data.approvalData)
        break

      case 'update_affiliate':
        response = await updateAffiliate(data.affiliateId, data.updateData)
        break

      case 'get_affiliate':
        response = await getAffiliate(affiliateId)
        break

      case 'list_affiliates':
        response = await listAffiliates(data.filters, data.pagination)
        break

      // ================================================
      // REFERRAL TRACKING
      // ================================================
      case 'track_click':
        response = await trackClick(data)
        break

      case 'track_conversion':
        response = await trackConversion(data)
        break

      case 'get_referral_stats':
        response = await getReferralStats(affiliateId, data.dateRange)
        break

      // ================================================
      // COMMISSION MANAGEMENT
      // ================================================
      case 'calculate_commissions':
        response = await calculateCommissions(affiliateId, data.period)
        break

      case 'get_commission_history':
        response = await getCommissionHistory(affiliateId, data.pagination)
        break

      case 'update_commission_status':
        response = await updateCommissionStatus(data.commissionId, data.status)
        break

      // ================================================
      // PAYOUT PROCESSING
      // ================================================
      case 'process_payout':
        response = await processPayout(data.payoutData)
        break

      case 'get_payout_history':
        response = await getPayoutHistory(affiliateId, data.pagination)
        break

      case 'retry_failed_payout':
        response = await retryFailedPayout(data.payoutId)
        break

      // ================================================
      // CUSTOM LINKS & QR CODES
      // ================================================
      case 'create_custom_link':
        response = await createCustomLink(affiliateId, data.linkData)
        break

      case 'get_custom_links':
        response = await getCustomLinks(affiliateId)
        break

      case 'update_link_stats':
        response = await updateLinkStats(data.linkId, data.stats)
        break

      case 'generate_qr_code':
        response = await generateQRCode(data.url, data.options)
        break

      // ================================================
      // MARKETING ASSETS
      // ================================================
      case 'get_marketing_assets':
        response = await getMarketingAssets(data.tier, data.category)
        break

      case 'track_asset_download':
        response = await trackAssetDownload(data.assetId, affiliateId)
        break

      case 'upload_marketing_asset':
        response = await uploadMarketingAsset(data.assetData)
        break

      // ================================================
      // ANALYTICS & REPORTING
      // ================================================
      case 'get_dashboard_data':
        response = await getDashboardData(affiliateId)
        break

      case 'get_performance_analytics':
        response = await getPerformanceAnalytics(affiliateId, data.dateRange, data.granularity)
        break

      case 'generate_performance_report':
        response = await generatePerformanceReport(affiliateId, data.reportOptions)
        break

      // ================================================
      // TIER MANAGEMENT
      // ================================================
      case 'check_tier_eligibility':
        response = await checkTierEligibility(affiliateId)
        break

      case 'update_affiliate_tier':
        response = await updateAffiliateTier(affiliateId, data.newTier)
        break

      case 'get_tier_benefits':
        response = await getTierBenefits(data.tier)
        break

      // ================================================
      // FRAUD DETECTION
      // ================================================
      case 'analyze_fraud_risk':
        response = await analyzeFraudRisk(data.referralData)
        break

      case 'flag_suspicious_activity':
        response = await flagSuspiciousActivity(data.activityData)
        break

      case 'get_fraud_reports':
        response = await getFraudReports(data.filters)
        break

      // ================================================
      // PARTNER INTEGRATIONS
      // ================================================
      case 'register_partner':
        response = await registerPartner(data.partnerData)
        break

      case 'setup_integration':
        response = await setupIntegration(data.partnerId, data.integrationType)
        break

      case 'get_partner_integrations':
        response = await getPartnerIntegrations(data.filters)
        break

      // ================================================
      // NOTIFICATIONS
      // ================================================
      case 'create_notification':
        response = await createNotification(affiliateId, data.notification)
        break

      case 'get_notifications':
        response = await getNotifications(affiliateId, data.unreadOnly)
        break

      case 'mark_notification_read':
        response = await markNotificationRead(data.notificationId)
        break

      default:
        response = {
          success: false,
          error: `Unknown action: ${action}`
        }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.success ? 200 : 400
      }
    )

  } catch (error) {
    console.error('Affiliate API Error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// ================================================
// AFFILIATE REGISTRATION & MANAGEMENT
// ================================================

async function registerAffiliate(registrationData: any): Promise<ApiResponse> {
  try {
    // Generate unique affiliate code
    const affiliateCode = generateAffiliateCode(registrationData.email)

    // Encrypt sensitive payment information
    const encryptedPaymentDetails = await encryptSensitiveData(registrationData.bankDetails)

    // Get device fingerprint for fraud prevention
    const deviceFingerprint = registrationData.deviceFingerprint || {}

    const affiliateData = {
      affiliate_code: affiliateCode,
      email: registrationData.email.toLowerCase(),
      first_name: registrationData.firstName,
      last_name: registrationData.lastName,
      phone: registrationData.phone,
      website: registrationData.website,
      business_type: registrationData.businessType || 'individual',
      business_name: registrationData.businessName,
      tax_id: registrationData.taxId,
      social_media: registrationData.socialMedia || {},
      signup_source: registrationData.signupSource,
      payment_method: registrationData.paymentMethod || 'bank_transfer',
      payment_details: encryptedPaymentDetails,
      device_fingerprint: deviceFingerprint,
      last_login_ip: registrationData.clientIP,
      terms_accepted_at: new Date().toISOString(),
      terms_version: '1.0',
      status: 'pending'
    }

    const { data: affiliate, error } = await supabase
      .from('affiliates')
      .insert([affiliateData])
      .select()
      .single()

    if (error) throw error

    // Send verification email (implement email service integration)
    await sendVerificationEmail(affiliate)

    // Create welcome notification
    await createNotification(affiliate.id, {
      title: 'Welcome to NaturineX Affiliate Program',
      message: 'Your application has been submitted and is under review.',
      notification_type: 'welcome',
      priority: 'normal'
    })

    return {
      success: true,
      data: affiliate,
      message: 'Affiliate registration successful'
    }

  } catch (error) {
    console.error('Affiliate registration error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function approveAffiliate(affiliateId: string, approvalData: any): Promise<ApiResponse> {
  try {
    const { tier = 'bronze', customCommissionRate, notes } = approvalData

    const commissionRates = {
      bronze: 0.15,
      silver: 0.20,
      gold: 0.25,
      platinum: 0.30,
      healthcare: 0.25
    }

    const updateData = {
      status: 'approved',
      tier,
      approved_at: new Date().toISOString(),
      commission_rate: customCommissionRate || commissionRates[tier],
      approval_notes: notes
    }

    const { data, error } = await supabase
      .from('affiliates')
      .update(updateData)
      .eq('id', affiliateId)
      .select()
      .single()

    if (error) throw error

    // Create approval notification
    await createNotification(affiliateId, {
      title: 'Affiliate Application Approved!',
      message: `Congratulations! Your application has been approved with ${tier} tier status.`,
      notification_type: 'approval',
      priority: 'high'
    })

    return {
      success: true,
      data: data
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ================================================
// REFERRAL TRACKING
// ================================================

async function trackClick(trackingData: any): Promise<ApiResponse> {
  try {
    const { affiliateCode, productId, visitorInfo, utmParams } = trackingData

    // Get affiliate by code
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('affiliate_code', affiliateCode)
      .eq('status', 'approved')
      .single()

    if (!affiliate) {
      return {
        success: false,
        error: 'Invalid affiliate code'
      }
    }

    // Generate unique click ID
    const clickId = `CLK${Date.now()}${Math.random().toString(36).substring(2, 15)}`

    // Calculate fraud score
    const fraudScore = await calculateFraudScore(visitorInfo, affiliate.id)

    const trackingRecord = {
      affiliate_id: affiliate.id,
      tracking_code: generateTrackingCode(),
      click_id: clickId,
      visitor_ip: visitorInfo.ip,
      visitor_user_agent: visitorInfo.userAgent,
      visitor_fingerprint: visitorInfo.fingerprint,
      referrer_url: visitorInfo.referrer,
      landing_page: visitorInfo.landingPage,
      utm_source: utmParams?.source,
      utm_medium: utmParams?.medium,
      utm_campaign: utmParams?.campaign,
      utm_term: utmParams?.term,
      utm_content: utmParams?.content,
      product_id: productId,
      country_code: visitorInfo.countryCode,
      region: visitorInfo.region,
      city: visitorInfo.city,
      device_type: visitorInfo.deviceType,
      browser: visitorInfo.browser,
      operating_system: visitorInfo.os,
      quality_score: Math.max(0, 100 - fraudScore),
      fraud_indicators: fraudScore > 50 ? { high_risk: true, score: fraudScore } : {},
      expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString()
    }

    const { data: trackingResult, error } = await supabase
      .from('referral_tracking')
      .insert([trackingRecord])
      .select()
      .single()

    if (error) throw error

    // Flag for fraud if high risk
    if (fraudScore > 70) {
      await flagSuspiciousActivity({
        referral_id: trackingResult.id,
        fraud_type: 'click_fraud',
        confidence_score: fraudScore / 100,
        risk_level: 'high'
      })
    }

    return {
      success: true,
      data: {
        clickId,
        trackingId: trackingResult.id,
        qualityScore: trackingRecord.quality_score
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function trackConversion(conversionData: any): Promise<ApiResponse> {
  try {
    const {
      clickId,
      transactionId,
      orderId,
      customerId,
      grossAmount,
      netAmount,
      productId,
      productName,
      productCategory
    } = conversionData

    // Get referral tracking record
    const { data: referralRecord } = await supabase
      .from('referral_tracking')
      .select(`
        *,
        affiliates(*)
      `)
      .eq('click_id', clickId)
      .eq('status', 'click')
      .gte('expires_at', new Date().toISOString())
      .single()

    if (!referralRecord) {
      return {
        success: false,
        error: 'No valid referral found'
      }
    }

    // Calculate commission
    const commissionRate = referralRecord.affiliates.commission_rate
    const commissionAmount = netAmount * commissionRate
    const tierBonus = calculateTierBonus(referralRecord.affiliates.tier, netAmount)

    // Create commission record
    const commissionData = {
      affiliate_id: referralRecord.affiliate_id,
      referral_id: referralRecord.id,
      transaction_id: transactionId,
      order_id: orderId,
      customer_id: customerId,
      product_id: productId,
      product_name: productName,
      product_category: productCategory,
      gross_sale_amount: grossAmount,
      net_sale_amount: netAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      tier_at_time: referralRecord.affiliates.tier,
      tier_bonus_amount: tierBonus,
      transaction_date: new Date().toISOString(),
      quality_score: referralRecord.quality_score,
      status: 'confirmed'
    }

    const { data: commission, error: commissionError } = await supabase
      .from('commission_calculations')
      .insert([commissionData])
      .select()
      .single()

    if (commissionError) throw commissionError

    // Update referral tracking record
    await supabase
      .from('referral_tracking')
      .update({
        status: 'conversion',
        converted: true,
        converted_at: new Date().toISOString(),
        conversion_id: commission.id,
        conversion_value: netAmount,
        commission_earned: commissionAmount + tierBonus
      })
      .eq('id', referralRecord.id)

    // Create commission notification
    await createNotification(referralRecord.affiliate_id, {
      title: 'New Commission Earned!',
      message: `You earned $${(commissionAmount + tierBonus).toFixed(2)} commission from a $${netAmount.toFixed(2)} sale.`,
      notification_type: 'commission',
      priority: 'normal'
    })

    return {
      success: true,
      data: {
        commission,
        commissionAmount: commissionAmount + tierBonus
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ================================================
// DASHBOARD & ANALYTICS
// ================================================

async function getDashboardData(affiliateId: string): Promise<ApiResponse> {
  try {
    // Get affiliate summary
    const { data: summary } = await supabase
      .from('affiliate_dashboard_summary')
      .select('*')
      .eq('id', affiliateId)
      .single()

    // Get recent performance
    const { data: recentPerformance } = await supabase
      .from('performance_analytics')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .eq('period_type', 'daily')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true })

    // Get pending commissions
    const { data: pendingCommissions } = await supabase
      .from('commission_calculations')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .eq('status', 'confirmed')
      .is('payout_id', null)

    // Get recent notifications
    const { data: notifications } = await supabase
      .from('affiliate_notifications')
      .select('*')
      .eq('affiliate_id', affiliateId)
      .order('created_at', { ascending: false })
      .limit(10)

    return {
      success: true,
      data: {
        summary,
        recentPerformance,
        pendingCommissions,
        notifications
      }
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

function generateAffiliateCode(email: string): string {
  const prefix = 'NAT'
  const emailHash = email.toLowerCase().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0).toString(36).substring(0, 6).toUpperCase()
  const timestamp = Date.now().toString().slice(-4)
  return `${prefix}${emailHash}${timestamp}`
}

function generateTrackingCode(): string {
  return `TRK${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

async function encryptSensitiveData(data: any): Promise<string | null> {
  if (!data) return null
  // In production, use proper encryption
  return btoa(JSON.stringify(data))
}

async function calculateFraudScore(visitorInfo: any, affiliateId: string): Promise<number> {
  let score = 0

  // Basic fraud indicators
  if (!visitorInfo.ip || visitorInfo.ip === '127.0.0.1') score += 20
  if (!visitorInfo.userAgent || visitorInfo.userAgent.includes('bot')) score += 30
  if (!visitorInfo.referrer) score += 10

  // Check recent click patterns
  const { data: recentClicks } = await supabase
    .from('referral_tracking')
    .select('visitor_ip')
    .eq('affiliate_id', affiliateId)
    .gte('clicked_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())

  if (recentClicks && recentClicks.length > 50) score += 25

  return Math.min(100, score)
}

function calculateTierBonus(tier: string, saleAmount: number): number {
  const bonusRates = {
    bronze: 0,
    silver: 0.01,
    gold: 0.02,
    platinum: 0.03,
    healthcare: 0.015
  }
  return saleAmount * (bonusRates[tier] || 0)
}

async function createNotification(affiliateId: string, notificationData: any): Promise<void> {
  await supabase
    .from('affiliate_notifications')
    .insert([{
      affiliate_id: affiliateId,
      ...notificationData,
      created_at: new Date().toISOString()
    }])
}

async function sendVerificationEmail(affiliate: any): Promise<void> {
  // Integration with email service
  console.log(`Sending verification email to ${affiliate.email}`)
}

async function flagSuspiciousActivity(activityData: any): Promise<ApiResponse> {
  try {
    const fraudRecord = {
      ...activityData,
      detection_method: 'automated',
      detected_at: new Date().toISOString()
    }

    await supabase
      .from('fraud_detection')
      .insert([fraudRecord])

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// Placeholder implementations for remaining functions
async function updateAffiliate(affiliateId: string, updateData: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function getAffiliate(affiliateId: string): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function listAffiliates(filters: any, pagination: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: [] }
}

async function getReferralStats(affiliateId: string, dateRange: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function calculateCommissions(affiliateId: string, period: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function getCommissionHistory(affiliateId: string, pagination: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: [] }
}

async function updateCommissionStatus(commissionId: string, status: string): Promise<ApiResponse> {
  // Implementation
  return { success: true }
}

async function processPayout(payoutData: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function getPayoutHistory(affiliateId: string, pagination: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: [] }
}

async function retryFailedPayout(payoutId: string): Promise<ApiResponse> {
  // Implementation
  return { success: true }
}

async function createCustomLink(affiliateId: string, linkData: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function getCustomLinks(affiliateId: string): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: [] }
}

async function updateLinkStats(linkId: string, stats: any): Promise<ApiResponse> {
  // Implementation
  return { success: true }
}

async function generateQRCode(url: string, options: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: { qrCode: 'base64_qr_code_data' } }
}

async function getMarketingAssets(tier: string, category: string): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: [] }
}

async function trackAssetDownload(assetId: string, affiliateId: string): Promise<ApiResponse> {
  // Implementation
  return { success: true }
}

async function uploadMarketingAsset(assetData: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function getPerformanceAnalytics(affiliateId: string, dateRange: any, granularity: string): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function generatePerformanceReport(affiliateId: string, reportOptions: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: { reportUrl: 'https://example.com/report.pdf' } }
}

async function checkTierEligibility(affiliateId: string): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: { eligible: true, newTier: 'silver' } }
}

async function updateAffiliateTier(affiliateId: string, newTier: string): Promise<ApiResponse> {
  // Implementation
  return { success: true }
}

async function getTierBenefits(tier: string): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function analyzeFraudRisk(referralData: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: { riskScore: 25, riskLevel: 'low' } }
}

async function getFraudReports(filters: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: [] }
}

async function registerPartner(partnerData: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function setupIntegration(partnerId: string, integrationType: string): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: {} }
}

async function getPartnerIntegrations(filters: any): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: [] }
}

async function getNotifications(affiliateId: string, unreadOnly: boolean): Promise<ApiResponse> {
  // Implementation
  return { success: true, data: [] }
}

async function markNotificationRead(notificationId: string): Promise<ApiResponse> {
  // Implementation
  return { success: true }
}