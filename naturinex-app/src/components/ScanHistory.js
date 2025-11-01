import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple scan history component - minimal for MVP
const ScanHistory = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Scan history will be available soon.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});

export default ScanHistory;
