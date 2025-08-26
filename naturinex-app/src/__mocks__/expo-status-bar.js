// Mock for expo-status-bar
import React from 'react';
import { View } from 'react-native';

const StatusBar = ({ ...props }) => {
  return <View {...props} />;
};

export { StatusBar };
export default StatusBar; 