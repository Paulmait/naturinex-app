import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PrivacyPolicy = ({ onClose }) => {
  const openEmail = () => {
    Linking.openURL('mailto:privacy@naturinex.com');
  };

  const openWebsite = () => {
    Linking.openURL('https://naturinex.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 17, 2025</Text>
        
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Naturinex ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web service (the "Service").
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        
        <Text style={styles.subTitle}>Personal Information</Text>
        <Text style={styles.paragraph}>
          • Account Information: Name, email address from Google authentication{'\n'}
          • Profile Data: Age, health goals, medical conditions (voluntary){'\n'}
          • Usage Data: Scan history, medication searches, feature usage
        </Text>

        <Text style={styles.subTitle}>Health Information</Text>
        <Text style={styles.paragraph}>
          • Medication Data: Photos and information about medications you scan{'\n'}
          • Search History: Queries and AI-generated suggestions{'\n'}
          • Preferences: Health goals and interests you provide
        </Text>

        <Text style={styles.subTitle}>Technical Information</Text>
        <Text style={styles.paragraph}>
          • Device Information: Device type, operating system, browser type{'\n'}
          • Usage Analytics: App performance, feature usage, error logs{'\n'}
          • IP Address: For security and analytics purposes
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        
        <Text style={styles.subTitle}>Primary Uses</Text>
        <Text style={styles.paragraph}>
          • Service Delivery: Process medication scans and provide AI suggestions{'\n'}
          • Account Management: Maintain your profile and preferences{'\n'}
          • Premium Features: Provide scan history, exports, and enhanced features
        </Text>

        <Text style={styles.subTitle}>Secondary Uses</Text>
        <Text style={styles.paragraph}>
          • Improvement: Enhance app functionality and user experience{'\n'}
          • Support: Provide customer service and technical assistance{'\n'}
          • Security: Detect and prevent fraud, abuse, and security issues
        </Text>

        <Text style={styles.sectionTitle}>4. Information Sharing and Disclosure</Text>
        
        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>We DO NOT Share Your Health Information</Text>
          <Text style={styles.importantText}>
            • Your medication data and health information are NEVER sold to third parties{'\n'}
            • We do not share personal health data with pharmaceutical companies{'\n'}
            • Scan results and health queries remain private to your account
          </Text>
        </View>

        <Text style={styles.subTitle}>Limited Sharing Scenarios</Text>
        <Text style={styles.paragraph}>
          • Service Providers: Trusted partners who help operate our service (Firebase, Stripe){'\n'}
          • Legal Requirements: When required by law or to protect rights and safety{'\n'}
          • Business Transfers: In case of merger, acquisition, or asset sale (with notice)
        </Text>

        <Text style={styles.subTitle}>Third-Party Services</Text>
        <Text style={styles.paragraph}>
          • Google Authentication: For secure account creation and login{'\n'}
          • Firebase: For data storage and authentication (Google Cloud security){'\n'}
          • Stripe: For payment processing (PCI DSS compliant){'\n'}
          • AI Services: For medication analysis (data anonymized)
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        
        <Text style={styles.subTitle}>Protection Measures</Text>
        <Text style={styles.paragraph}>
          • Encryption: All data transmitted using industry-standard encryption{'\n'}
          • Secure Storage: Health data stored in encrypted, HIPAA-compliant systems{'\n'}
          • Access Controls: Strict employee access limitations{'\n'}
          • Regular Audits: Security assessments and vulnerability testing
        </Text>

        <Text style={styles.subTitle}>Data Retention</Text>
        <Text style={styles.paragraph}>
          • Active Accounts: Data retained while account is active{'\n'}
          • Inactive Accounts: Data deleted after 3 years of inactivity{'\n'}
          • Deletion Requests: Honor data deletion within 30 days
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights and Choices</Text>
        
        <Text style={styles.subTitle}>Account Controls</Text>
        <Text style={styles.paragraph}>
          • Access: View and download your personal data{'\n'}
          • Correction: Update or correct your information{'\n'}
          • Deletion: Request account and data deletion{'\n'}
          • Portability: Export your data in common formats
        </Text>

        <Text style={styles.subTitle}>Communication Preferences</Text>
        <Text style={styles.paragraph}>
          • Email: Opt-out of promotional emails{'\n'}
          • Notifications: Control app notifications in settings{'\n'}
          • Marketing: Unsubscribe from marketing communications
        </Text>

        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Naturinex is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>8. International Users</Text>
        <Text style={styles.paragraph}>
          If you are accessing our Service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.
        </Text>

        <Text style={styles.sectionTitle}>9. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </Text>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us:
        </Text>
        
        <TouchableOpacity onPress={openEmail} style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Email: privacy@naturinex.com</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={openWebsite} style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Website: naturinex.com</Text>
        </TouchableOpacity>
        
        <Text style={styles.paragraph}>
          Operated by: Cien Rios LLC (DBA Naturinex)
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#10B981',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444444',
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 15,
  },
  importantBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  importantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  importantText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PrivacyPolicy;
