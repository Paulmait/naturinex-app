import React from 'react';
import { View } from 'react-native';

// Simple wrapper component - no special launch gate logic needed for MVP
const AppLaunchGate = ({ children }) => {
  return <View style={{ flex: 1 }}>{children}</View>;
};

export default AppLaunchGate;
