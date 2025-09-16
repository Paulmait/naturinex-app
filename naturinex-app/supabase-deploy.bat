@echo off
echo ========================================
echo   SUPABASE EDGE FUNCTIONS DEPLOYMENT
echo ========================================
echo.

echo Step 1: Installing Supabase CLI via npx...
echo.

echo Step 2: Setting up environment variables
echo Please ensure you have the following ready:
echo   - GEMINI_API_KEY from Render
echo   - STRIPE_SECRET_KEY from Render
echo   - STRIPE_WEBHOOK_SECRET from Render
echo.

echo MANUAL STEPS REQUIRED:
echo.
echo 1. Install Supabase CLI:
echo    For Windows: Download from https://github.com/supabase/cli/releases
echo    Or use: scoop install supabase
echo.
echo 2. Login to Supabase:
echo    supabase login
echo.
echo 3. Link your project (replace YOUR_PROJECT_REF):
echo    supabase link --project-ref YOUR_PROJECT_REF
echo.
echo 4. Set your secrets (replace with actual values):
echo    supabase secrets set GEMINI_API_KEY=your_key_here
echo    supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
echo    supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
echo.
echo 5. Deploy functions:
echo    supabase functions deploy analyze
echo    supabase functions deploy stripe-webhook
echo.
echo 6. Update Vercel:
echo    Add REACT_APP_API_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1
echo.
echo 7. Update Stripe Webhook:
echo    Change URL to: https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
echo.
pause