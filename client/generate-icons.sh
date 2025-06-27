#!/bin/bash

# Naturinex App Icon Generator Script
# This script generates all required app icons from the source logo

# Source logo path (using your existing Naturinex logo)
SOURCE_LOGO="../client/src/assets/logos/NaturinexLogo.png"

# Create directories for icons
mkdir -p android/app/src/main/res/mipmap-ldpi
mkdir -p android/app/src/main/res/mipmap-mdpi  
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

mkdir -p ios/App/App/Assets.xcassets/AppIcon.appiconset

# Generate Android icons
echo "Generating Android app icons..."

# Android icon sizes
convert "$SOURCE_LOGO" -resize 36x36 android/app/src/main/res/mipmap-ldpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert "$SOURCE_LOGO" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Generate round icons for Android
convert "$SOURCE_LOGO" -resize 36x36 android/app/src/main/res/mipmap-ldpi/ic_launcher_round.png
convert "$SOURCE_LOGO" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
convert "$SOURCE_LOGO" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
convert "$SOURCE_LOGO" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
convert "$SOURCE_LOGO" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
convert "$SOURCE_LOGO" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

echo "Generating iOS app icons..."

# iOS icon sizes
convert "$SOURCE_LOGO" -resize 20x20 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-20x20@1x.png
convert "$SOURCE_LOGO" -resize 29x29 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@1x.png
convert "$SOURCE_LOGO" -resize 40x40 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@1x.png
convert "$SOURCE_LOGO" -resize 58x58 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@2x.png
convert "$SOURCE_LOGO" -resize 60x60 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-30x30@2x.png
convert "$SOURCE_LOGO" -resize 80x80 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-40x40@2x.png
convert "$SOURCE_LOGO" -resize 87x87 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-29x29@3x.png
convert "$SOURCE_LOGO" -resize 120x120 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-60x60@2x.png
convert "$SOURCE_LOGO" -resize 180x180 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-60x60@3x.png
convert "$SOURCE_LOGO" -resize 1024x1024 ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024x1024@1x.png

# Generate store icons
mkdir -p store-assets
convert "$SOURCE_LOGO" -resize 512x512 store-assets/google-play-icon.png
convert "$SOURCE_LOGO" -resize 1024x1024 store-assets/app-store-icon.png

echo "App icons generated successfully!"
echo "Next steps:"
echo "1. Review generated icons in android/ and ios/ directories"
echo "2. Open Android Studio: npx cap open android"
echo "3. Open Xcode: npx cap open ios"
echo "4. Build and test on devices"
