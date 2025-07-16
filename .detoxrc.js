module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  specs: 'e2e',
  apps: {
    'android.emu.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_33' // Change to your emulator name if different
      }
    }
  },
  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.emu.debug'
    }
  }
}; 