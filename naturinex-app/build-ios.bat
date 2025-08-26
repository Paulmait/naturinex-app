@echo off
echo Starting iOS build with EAS...
echo.
echo This will build your iOS app using EAS Build service.
echo Build time: ~15-30 minutes
echo.

REM Set non-interactive mode
set CI=1

REM Start the build
eas build --platform ios --profile production --non-interactive

echo.
echo Build submitted! Check the status at:
echo https://expo.dev/accounts/guampaul/projects/naturinex/builds
echo.
echo Or run: eas build:list
pause