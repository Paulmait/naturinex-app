#!/usr/bin/env node

/**
 * Email Service Test Script
 * Run: node scripts/test-email.js
 */

const emailService = require('../services/email-service');
require('dotenv').config();

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not configured');
    console.log('Please add RESEND_API_KEY to your .env file');
    process.exit(1);
  }

  const testEmail = process.argv[2] || 'test@example.com';
  const testUser = {
    id: 'test-user-123',
    email: testEmail,
    name: 'Test User'
  };

  console.log(`📧 Sending test emails to: ${testEmail}\n`);

  try {
    // Test 1: Welcome Email
    console.log('1. Testing Welcome Email...');
    try {
      const welcomeResult = await emailService.sendWelcomeEmail(testUser);
      console.log('✅ Welcome email sent successfully');
      console.log('   Email ID:', welcomeResult.data?.id);
    } catch (error) {
      console.error('❌ Welcome email failed:', error.message);
    }

    // Test 2: Verification Email
    console.log('\n2. Testing Verification Email...');
    try {
      const verifyResult = await emailService.sendVerificationEmail(testUser);
      console.log('✅ Verification email sent successfully');
      console.log('   Email ID:', verifyResult.data?.id);
    } catch (error) {
      console.error('❌ Verification email failed:', error.message);
    }

    // Test 3: Password Reset Email
    console.log('\n3. Testing Password Reset Email...');
    try {
      const resetResult = await emailService.sendPasswordResetEmail(testUser);
      console.log('✅ Password reset email sent successfully');
      console.log('   Email ID:', resetResult.data?.id);
    } catch (error) {
      console.error('❌ Password reset email failed:', error.message);
    }

    // Test 4: Scan Alert Email
    console.log('\n4. Testing Scan Alert Email...');
    try {
      const scanData = {
        productName: 'Test Product XYZ',
        harmfulIngredients: [
          { name: 'Sodium Lauryl Sulfate', reason: 'Can cause skin irritation' },
          { name: 'Parabens', reason: 'Potential hormone disruptor' }
        ],
        recommendation: 'Consider using natural alternatives without these ingredients.'
      };
      
      const alertResult = await emailService.sendScanAlert(testUser, scanData);
      console.log('✅ Scan alert email sent successfully');
      console.log('   Email ID:', alertResult.data?.id);
    } catch (error) {
      console.error('❌ Scan alert email failed:', error.message);
    }

    // Test 5: Email Validation
    console.log('\n5. Testing Email Validation...');
    const validEmails = ['user@example.com', 'test.user+tag@gmail.com'];
    const invalidEmails = ['notanemail', 'tempmail@tempmail.com', '@example.com'];
    
    console.log('Valid emails:');
    for (const email of validEmails) {
      const result = await emailService.verifyEmailAddress(email);
      console.log(`   ${email}: ${result.valid ? '✅' : '❌'} ${result.reason || ''}`);
    }
    
    console.log('Invalid emails:');
    for (const email of invalidEmails) {
      const result = await emailService.verifyEmailAddress(email);
      console.log(`   ${email}: ${result.valid ? '✅' : '❌'} ${result.reason || ''}`);
    }

    // Test 6: Rate Limiting Check
    console.log('\n6. Testing Rate Limiting...');
    try {
      const canSend = await emailService.checkRateLimit(testEmail);
      console.log(canSend ? '✅ Within rate limits' : '❌ Rate limited');
    } catch (error) {
      console.log('⚠️  Rate limiting check:', error.message);
    }

    // Test 7: Email Stats (if database is connected)
    if (process.env.DATABASE_URL) {
      console.log('\n7. Testing Email Statistics...');
      try {
        const stats = await emailService.getEmailStats(7);
        console.log('✅ Email stats retrieved:');
        console.log('   Total emails:', stats.reduce((sum, day) => sum + parseInt(day.total), 0));
        console.log('   Days tracked:', stats.length);
      } catch (error) {
        console.log('⚠️  Stats unavailable:', error.message);
      }
    }

    console.log('\n✨ Email service tests completed!');
    console.log('Check your inbox for test emails.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testEmailService();