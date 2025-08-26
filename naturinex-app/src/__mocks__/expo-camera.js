// Mock for expo-camera
import React from 'react';
import { View } from 'react-native';

const CameraView = ({ children, ...props }) => {
  return <View {...props}>{children}</View>;
};

export { CameraView };
export default CameraView; 