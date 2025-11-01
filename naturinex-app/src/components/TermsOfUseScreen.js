import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

const TermsOfUseScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms of Use</Text>
      <Text style={styles.text}>
        Terms of use content will be displayed here.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default TermsOfUseScreen;
