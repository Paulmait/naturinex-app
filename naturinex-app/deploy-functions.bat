@echo off
echo Deploying Firebase Functions to mediscan-b6252...

cd functions
echo Building TypeScript...
call npm run build

cd ..
echo Deploying to Firebase...
firebase deploy --only functions --project mediscan-b6252

echo.
echo Deployment complete!
echo Your webhook endpoint is:
echo https://us-central1-mediscan-b6252.cloudfunctions.net/api/webhooks/stripe
pause