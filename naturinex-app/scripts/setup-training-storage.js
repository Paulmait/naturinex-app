/**
 * Setup Training Storage Bucket
 *
 * This script creates the 'training-images' storage bucket in Supabase
 * for storing anonymized training data images.
 *
 * Run with: node scripts/setup-training-storage.js
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ||
                     process.env.REACT_APP_SUPABASE_URL ||
                     'https://hxhbsxzkzarqwksbjpce.supabase.co';

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKET_NAME = 'training-images';
const BUCKET_CONFIG = {
  public: false,
  fileSizeLimit: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
};

async function setupTrainingStorage() {
  console.log('🗄️  Setting up Training Storage Bucket...\n');

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('\nTo get the service role key:');
    console.log('1. Go to https://app.supabase.com/project/hxhbsxzkzarqwksbjpce/settings/api');
    console.log('2. Copy the "service_role" key (NOT the anon key)');
    console.log('3. Set it as SUPABASE_SERVICE_ROLE_KEY environment variable');
    console.log('\nAlternatively, create the bucket manually in the Supabase Dashboard:');
    console.log('1. Go to Storage in your Supabase project');
    console.log('2. Click "New bucket"');
    console.log('3. Name: training-images');
    console.log('4. Public: OFF');
    console.log('5. File size limit: 10MB');
    console.log('6. Allowed MIME types: image/jpeg, image/png, image/webp');
    process.exit(1);
  }

  // Create Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Check if bucket already exists
    console.log('1️⃣  Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const existingBucket = buckets.find(b => b.name === BUCKET_NAME);

    if (existingBucket) {
      console.log(`   ✅ Bucket '${BUCKET_NAME}' already exists`);
      console.log(`   ID: ${existingBucket.id}`);
      console.log(`   Public: ${existingBucket.public}`);
      console.log(`   Created: ${existingBucket.created_at}`);
    } else {
      // Create the bucket
      console.log(`2️⃣  Creating bucket '${BUCKET_NAME}'...`);
      const { data: newBucket, error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        BUCKET_CONFIG
      );

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }

      console.log(`   ✅ Bucket '${BUCKET_NAME}' created successfully`);
    }

    // Set up storage policies
    console.log('\n3️⃣  Setting up storage policies...');

    // Note: Storage policies should be set via SQL or Dashboard
    // The Supabase JS client doesn't have a direct method for this
    console.log('   ℹ️  Storage policies need to be set via SQL.');
    console.log('   Run the following SQL in Supabase Dashboard SQL Editor:\n');

    const policySQL = `
-- Allow service role to upload training images
CREATE POLICY "Service role can upload training images"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = '${BUCKET_NAME}');

-- Allow service role to read training images
CREATE POLICY "Service role can read training images"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = '${BUCKET_NAME}');

-- Allow service role to delete training images
CREATE POLICY "Service role can delete training images"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = '${BUCKET_NAME}');
    `.trim();

    console.log(policySQL);

    // Verify tables exist
    console.log('\n4️⃣  Verifying training tables...');

    const tables = ['training_data_consent', 'training_scan_data', 'training_data_stats'];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table '${table}' does not exist - run migrations first`);
      } else if (error) {
        console.log(`   ⚠️  Table '${table}' - ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    }

    // Verify push notification tables
    console.log('\n5️⃣  Verifying push notification tables...');

    const pushTables = ['user_push_tokens', 'user_notification_settings', 'notification_log', 'scheduled_notifications'];

    for (const table of pushTables) {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table '${table}' does not exist - run migrations first`);
      } else if (error) {
        console.log(`   ⚠️  Table '${table}' - ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    }

    console.log('\n✅ Training storage setup complete!\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupTrainingStorage();
