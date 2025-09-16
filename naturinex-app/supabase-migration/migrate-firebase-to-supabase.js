// Firebase to Supabase Migration Script
// Migrates all data from Firebase to Supabase with progress tracking

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const firebaseDb = getFirestore(firebaseApp);

// Initialize Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin access
);

// Migration statistics
let stats = {
  users: { total: 0, migrated: 0, failed: 0 },
  scans: { total: 0, migrated: 0, failed: 0 },
  feedback: { total: 0, migrated: 0, failed: 0 },
  notifications: { total: 0, migrated: 0, failed: 0 },
  startTime: Date.now(),
};

// Progress logging
function logProgress(category, message) {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  console.log(`[${elapsed}s] [${category}] ${message}`);
}

// Batch processing helper
async function processBatch(items, batchSize, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );
    results.push(...batchResults);

    // Progress indicator
    const progress = Math.round((i + batch.length) / items.length * 100);
    process.stdout.write(`\rProgress: ${progress}%`);
  }
  console.log(''); // New line after progress
  return results;
}

// Migrate users
async function migrateUsers() {
  logProgress('USERS', 'Starting user migration...');

  try {
    // Get all users from Firebase
    const usersSnapshot = await getDocs(collection(firebaseDb, 'users'));
    const users = [];

    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    stats.users.total = users.length;
    logProgress('USERS', `Found ${users.length} users to migrate`);

    // Process users in batches
    const results = await processBatch(users, 50, async (user) => {
      try {
        // First, create auth user in Supabase if email exists
        let supabaseUserId = user.id;

        if (user.email) {
          // Check if user already exists
          const { data: existingUser } = await supabase.auth.admin.getUserById(user.id);

          if (!existingUser) {
            // Create new auth user
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: user.email,
              email_confirm: true,
              user_metadata: {
                firebase_uid: user.id,
                migrated_at: new Date().toISOString(),
              },
            });

            if (authError) throw authError;
            supabaseUserId = authUser.user.id;
          }
        }

        // Transform user data for Supabase schema
        const profileData = {
          user_id: supabaseUserId,
          email: user.email || `${user.id}@migrated.local`,
          full_name: user.displayName || user.name || null,

          // Subscription data
          subscription_status: user.subscription?.status || 'free',
          subscription_tier: user.subscription?.plan || 'basic',
          subscription_expires_at: user.subscription?.expiresAt || null,
          stripe_customer_id: user.stripeCustomerId || null,
          stripe_subscription_id: user.stripeSubscriptionId || null,

          // Stats
          total_scans: user.stats?.totalScans || 0,
          last_scan_date: user.stats?.lastScanDate || null,
          most_scanned_category: user.stats?.mostScannedCategory || 'unknown',
          total_session_time: user.stats?.totalSessionTime || 0,
          session_count: user.stats?.sessionCount || 0,
          last_active_date: user.stats?.lastActiveDate || user.lastSeen || null,

          // Gamification
          points: user.achievements?.points || 0,
          level: user.achievements?.level || 1,
          badges: user.achievements?.badges || [],

          // Privacy
          privacy_consent: user.privacyConsent?.accepted || false,
          privacy_consent_date: user.privacyConsent?.date || null,
          medical_disclaimer_accepted: user.medicalDisclaimer?.accepted || false,
          medical_disclaimer_date: user.medicalDisclaimer?.date || null,

          // Metadata
          created_at: user.createdAt || user.metadata?.createdAt || new Date(),
          updated_at: user.updatedAt || user.metadata?.updatedAt || new Date(),
          preferences: user.preferences || {},
          feature_flags: user.featureFlags || {},
        };

        // Insert into Supabase
        const { error } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'user_id' });

        if (error) throw error;

        stats.users.migrated++;
        return { success: true, userId: user.id };
      } catch (error) {
        stats.users.failed++;
        logProgress('ERROR', `Failed to migrate user ${user.id}: ${error.message}`);
        return { success: false, userId: user.id, error: error.message };
      }
    });

    logProgress('USERS', `Migration complete: ${stats.users.migrated} succeeded, ${stats.users.failed} failed`);
  } catch (error) {
    logProgress('ERROR', `User migration failed: ${error.message}`);
  }
}

// Migrate scans
async function migrateScans() {
  logProgress('SCANS', 'Starting scan migration...');

  try {
    const scansSnapshot = await getDocs(collection(firebaseDb, 'scans'));
    const scans = [];

    scansSnapshot.forEach((doc) => {
      scans.push({ id: doc.id, ...doc.data() });
    });

    stats.scans.total = scans.length;
    logProgress('SCANS', `Found ${scans.length} scans to migrate`);

    // Process scans in batches
    const results = await processBatch(scans, 100, async (scan) => {
      try {
        // Get the Supabase user ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('email', scan.userEmail || `${scan.userId}@migrated.local`)
          .single();

        if (!profile) {
          throw new Error(`Profile not found for scan ${scan.id}`);
        }

        const scanData = {
          user_id: profile.user_id,
          profile_id: profile.id,

          // Scan data
          barcode: scan.barcode || scan.productBarcode || null,
          product_name: scan.productName || scan.name || null,
          brand: scan.brand || null,
          category: scan.category || null,
          image_url: scan.imageUrl || scan.scanImageUrl || null,

          // Analysis results
          ingredients: scan.ingredients || scan.analysis?.ingredients || null,
          allergens: scan.allergens || scan.analysis?.allergens || null,
          nutritional_info: scan.nutritionalInfo || scan.analysis?.nutrition || null,
          health_analysis: scan.healthAnalysis || scan.analysis?.health || null,
          ai_insights: scan.aiInsights || scan.analysis?.insights || null,

          // Metadata
          scan_date: scan.timestamp || scan.createdAt || new Date(),
          scan_method: scan.scanType || 'camera',
          processing_time_ms: scan.processingTime || null,
          confidence_score: scan.confidence || null,

          // Location (if available)
          latitude: scan.location?.latitude || null,
          longitude: scan.location?.longitude || null,
          location_name: scan.location?.name || null,
        };

        const { error } = await supabase
          .from('scans')
          .insert(scanData);

        if (error) throw error;

        stats.scans.migrated++;
        return { success: true, scanId: scan.id };
      } catch (error) {
        stats.scans.failed++;
        logProgress('ERROR', `Failed to migrate scan ${scan.id}: ${error.message}`);
        return { success: false, scanId: scan.id, error: error.message };
      }
    });

    logProgress('SCANS', `Migration complete: ${stats.scans.migrated} succeeded, ${stats.scans.failed} failed`);
  } catch (error) {
    logProgress('ERROR', `Scan migration failed: ${error.message}`);
  }
}

// Migrate feedback
async function migrateFeedback() {
  logProgress('FEEDBACK', 'Starting feedback migration...');

  try {
    const feedbackSnapshot = await getDocs(collection(firebaseDb, 'beta_feedback'));
    const feedbackItems = [];

    feedbackSnapshot.forEach((doc) => {
      feedbackItems.push({ id: doc.id, ...doc.data() });
    });

    stats.feedback.total = feedbackItems.length;
    logProgress('FEEDBACK', `Found ${feedbackItems.length} feedback items to migrate`);

    const results = await processBatch(feedbackItems, 50, async (feedback) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, user_id')
          .eq('email', feedback.userEmail || `${feedback.userId}@migrated.local`)
          .single();

        if (!profile) {
          throw new Error(`Profile not found for feedback ${feedback.id}`);
        }

        const feedbackData = {
          user_id: profile.user_id,
          profile_id: profile.id,
          title: feedback.title || 'Untitled Feedback',
          description: feedback.description || feedback.message || '',
          type: feedback.type || 'other',
          priority: feedback.priority || 'medium',
          status: feedback.status || 'open',
          attachments: feedback.attachments || [],
          created_at: feedback.createdAt || new Date(),
          updated_at: feedback.updatedAt || new Date(),
        };

        const { error } = await supabase
          .from('feedback')
          .insert(feedbackData);

        if (error) throw error;

        stats.feedback.migrated++;
        return { success: true };
      } catch (error) {
        stats.feedback.failed++;
        logProgress('ERROR', `Failed to migrate feedback ${feedback.id}: ${error.message}`);
        return { success: false, error: error.message };
      }
    });

    logProgress('FEEDBACK', `Migration complete: ${stats.feedback.migrated} succeeded, ${stats.feedback.failed} failed`);
  } catch (error) {
    logProgress('ERROR', `Feedback migration failed: ${error.message}`);
  }
}

// Main migration function
async function migrate() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     Firebase to Supabase Migration Tool           ║');
  console.log('║     Naturinex Enterprise Scale Migration          ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Check connections
    logProgress('INIT', 'Checking Firebase connection...');
    const testDoc = await getDocs(collection(firebaseDb, 'users'));
    logProgress('INIT', `Firebase connected. Found ${testDoc.size} users.`);

    logProgress('INIT', 'Checking Supabase connection...');
    const { error: supabaseError } = await supabase.from('profiles').select('count').limit(1);
    if (supabaseError) throw supabaseError;
    logProgress('INIT', 'Supabase connected successfully.');

    // Run migrations
    await migrateUsers();
    await migrateScans();
    await migrateFeedback();

    // Final statistics
    const totalTime = ((Date.now() - stats.startTime) / 1000).toFixed(2);
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║              Migration Complete!                   ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Migration Statistics:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`Users:        ${stats.users.migrated}/${stats.users.total} migrated (${stats.users.failed} failed)`);
    console.log(`Scans:        ${stats.scans.migrated}/${stats.scans.total} migrated (${stats.scans.failed} failed)`);
    console.log(`Feedback:     ${stats.feedback.migrated}/${stats.feedback.total} migrated (${stats.feedback.failed} failed)`);
    console.log(`Total Time:   ${totalTime} seconds`);
    console.log('─────────────────────────────────────────────────────');

    if (stats.users.failed > 0 || stats.scans.failed > 0 || stats.feedback.failed > 0) {
      console.log('');
      console.log('⚠️  Some items failed to migrate. Check the logs above for details.');
    }

    console.log('');
    console.log('✅ Next steps:');
    console.log('1. Verify data in Supabase dashboard');
    console.log('2. Update your app to use Supabase client');
    console.log('3. Test authentication and data access');
    console.log('4. Deploy Edge Functions');
    console.log('5. Switch DNS when ready');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Debug information:');
    console.error(error);
  }

  process.exit(0);
}

// Run migration
migrate();