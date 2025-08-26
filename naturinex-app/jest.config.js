module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-camera|expo-media-library|expo-constants|expo-secure-store|expo-crypto|expo-device|expo-file-system|expo-image-picker|expo-sharing|expo-status-bar|expo-store-review|expo-web-browser|expo-auth-session|expo-build-properties|expo-dev-client)/)'
  ],
  moduleNameMapper: {
    '^expo-constants$': '<rootDir>/src/__mocks__/expo-constants.js',
    '^expo-secure-store$': '<rootDir>/src/__mocks__/expo-secure-store.js',
    '^expo-crypto$': '<rootDir>/src/__mocks__/expo-crypto.js',
    '^expo-device$': '<rootDir>/src/__mocks__/expo-device.js',
    '^expo-file-system$': '<rootDir>/src/__mocks__/expo-file-system.js',
    '^expo-image-picker$': '<rootDir>/src/__mocks__/expo-image-picker.js',
    '^expo-sharing$': '<rootDir>/src/__mocks__/expo-sharing.js',
    '^expo-status-bar$': '<rootDir>/src/__mocks__/expo-status-bar.js',
    '^expo-store-review$': '<rootDir>/src/__mocks__/expo-store-review.js',
    '^expo-web-browser$': '<rootDir>/src/__mocks__/expo-web-browser.js',
    '^expo-auth-session$': '<rootDir>/src/__mocks__/expo-auth-session.js',
    '^expo-build-properties$': '<rootDir>/src/__mocks__/expo-build-properties.js',
    '^expo-dev-client$': '<rootDir>/src/__mocks__/expo-dev-client.js',
    '^expo-camera$': '<rootDir>/src/__mocks__/expo-camera.js',
    '^expo-media-library$': '<rootDir>/src/__mocks__/expo-media-library.js'
  },
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/src/setupTests.js']
};
