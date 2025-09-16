@echo off
echo ======================================================
echo     Supabase Enterprise Setup for Naturinex
echo ======================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Install Supabase CLI if not present
echo [1/8] Checking Supabase CLI...
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Supabase CLI...
    npm install -g supabase
) else (
    echo Supabase CLI already installed
)

REM Create necessary directories
echo.
echo [2/8] Creating project structure...
if not exist "supabase" mkdir supabase
if not exist "supabase\functions" mkdir supabase\functions
if not exist "supabase\migrations" mkdir supabase\migrations

REM Copy schema to migrations
echo.
echo [3/8] Setting up database migrations...
copy supabase-migration\schema.sql supabase\migrations\001_initial_schema.sql >nul

REM Create config file
echo.
echo [4/8] Creating Supabase configuration...
(
echo # Supabase Project Configuration
echo.
echo [project]
echo id = "your-project-ref"
echo
echo [api]
echo enabled = true
echo port = 54321
echo schemas = ["public", "storage", "graphql_public"]
echo extra_search_path = ["public", "extensions"]
echo max_rows = 1000
echo
echo [db]
echo port = 54322
echo shadow_port = 54320
echo major_version = 15
echo
echo [db.pooler]
echo enabled = true
echo port = 54329
echo pool_mode = "transaction"
echo default_pool_size = 20
echo max_client_conn = 100
echo
echo [studio]
echo enabled = true
echo port = 54323
echo
echo [storage]
echo enabled = true
echo
echo [auth]
echo enabled = true
echo site_url = "https://naturinex.com"
echo additional_redirect_urls = ["https://localhost:3000"]
echo jwt_expiry = 3600
echo enable_signup = true
echo email.enable_signup = true
echo email.enable_confirmations = false
echo
echo [auth.sms]
echo enable_signup = false
echo enable_confirmations = false
echo
echo [functions]
echo enabled = true
) > supabase\config.toml

REM Create environment template
echo.
echo [5/8] Creating environment configuration template...
(
echo # Supabase Environment Variables for Naturinex
echo # Copy this to .env.local and fill in your values
echo.
echo # Get these from your Supabase project settings
echo REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
echo REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
echo NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
echo.
echo # For server-side operations
echo SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
echo.
echo # Redis (Upstash) for caching
echo UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
echo UPSTASH_REDIS_REST_TOKEN=your-redis-token
echo.
echo # Monitoring
echo SENTRY_DSN=your-sentry-dsn
echo.
echo # Keep existing Stripe configuration
echo REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
echo STRIPE_SECRET_KEY=your-stripe-secret-key
echo STRIPE_WEBHOOK_SECRET=your-webhook-secret
) > .env.supabase.example

echo.
echo [6/8] Installing required packages...
call npm install --save @supabase/supabase-js @supabase/auth-helpers-react @sentry/react

echo.
echo [7/8] Creating deployment script...
(
echo @echo off
echo echo Deploying Edge Functions to Supabase...
echo supabase functions deploy api --project-ref YOUR_PROJECT_REF
echo echo Deployment complete!
) > supabase\deploy-functions.bat

echo.
echo [8/8] Setup complete!
echo.
echo ======================================================
echo     NEXT STEPS:
echo ======================================================
echo.
echo 1. Create a Supabase project at https://app.supabase.com
echo.
echo 2. Get your project credentials:
echo    - Project URL
echo    - Anon Key
echo    - Service Role Key
echo    - Project Reference ID
echo.
echo 3. Update .env.supabase.example with your credentials
echo    and save as .env.local
echo.
echo 4. Run database setup:
echo    supabase link --project-ref YOUR_PROJECT_REF
echo    supabase db push
echo.
echo 5. Deploy Edge Functions:
echo    cd supabase
echo    supabase functions deploy api
echo.
echo 6. Run migration script to move Firebase data
echo.
echo ======================================================
pause