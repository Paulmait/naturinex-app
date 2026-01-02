import React from 'react';
import { ScrollView, Text, StyleSheet, View, Linking, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PRIVACY_URL = 'https://naturinex.com/privacy';
const SUPPORT_EMAIL = 'support@naturinex.com';
const DELETION_URL = 'https://naturinex.com/delete-account';

const PrivacyPolicyScreen = ({ navigation }) => {
  const openURL = (url) => {
    Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.effectiveDate}>Effective Date: January 1, 2025</Text>
      <Text style={styles.lastUpdated}>Last Updated: January 2, 2026</Text>

      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>Cien Rios LLC dba Naturinex Wellness Guide</Text>
        <Text style={styles.companyAddress}>17113 Miramar Parkway</Text>
        <Text style={styles.companyAddress}>Miramar, FL 33027, United States</Text>
        <Text style={styles.companyAddress}>Phone: (754) 254-7141</Text>
        <TouchableOpacity onPress={() => openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.companyLink}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.text}>
          Naturinex Wellness Guide ("we," "our," or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you use our mobile application and related services.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Information We Collect</Text>

        <Text style={styles.subTitle}>2.1 Information You Provide</Text>
        <Text style={styles.text}>
          • Account information (email address, name if using Sign in with Apple or Google){'\n'}
          • Medication and product scan data{'\n'}
          • Preferences and settings{'\n'}
          • Communications with our support team
        </Text>

        <Text style={styles.subTitle}>2.2 Automatically Collected Information</Text>
        <Text style={styles.text}>
          • Device information (device type, operating system, unique device identifiers){'\n'}
          • Usage data (features used, scan frequency, app interactions){'\n'}
          • Crash reports and performance data{'\n'}
          • IP address (not stored long-term)
        </Text>

        <Text style={styles.subTitle}>2.3 Images and Camera Data</Text>
        <Text style={styles.text}>
          When you use our scan feature, images are processed to identify medications and products.
          Images are processed locally on your device and/or transmitted securely to our servers
          for analysis. We do not store the original images after processing unless you explicitly
          save them to your scan history.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.text}>
          We use collected information to:{'\n\n'}
          • Provide and improve our wellness guide services{'\n'}
          • Process and analyze medication/product scans{'\n'}
          • Maintain your scan history and preferences{'\n'}
          • Send service-related communications{'\n'}
          • Prevent fraud and ensure security{'\n'}
          • Comply with legal obligations{'\n'}
          • Improve our app and develop new features
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Data Sharing and Disclosure</Text>
        <Text style={styles.text}>
          We do not sell your personal information. We may share information with:{'\n\n'}
          • Service providers who assist in operating our app (hosting, analytics, payment processing){'\n'}
          • Legal authorities when required by law{'\n'}
          • Business partners (only with your consent){'\n\n'}
          Third-party services we use include:{'\n'}
          • Firebase (authentication and analytics){'\n'}
          • Supabase (data storage){'\n'}
          • Stripe (payment processing){'\n'}
          • Apple (Sign in with Apple, App Store)
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.text}>
          We implement appropriate technical and organizational measures to protect your data,
          including encryption in transit and at rest, secure authentication, and regular
          security assessments. However, no method of transmission over the Internet is 100% secure.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Data Retention</Text>
        <Text style={styles.text}>
          We retain your personal information for as long as your account is active or as needed
          to provide services. You can request deletion of your account and associated data at
          any time (see Section 8).
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Your Rights</Text>
        <Text style={styles.text}>
          Depending on your location, you may have rights to:{'\n\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate data{'\n'}
          • Request deletion of your data{'\n'}
          • Object to or restrict processing{'\n'}
          • Data portability{'\n'}
          • Withdraw consent{'\n\n'}
          California residents have additional rights under the CCPA/CPRA.
        </Text>
      </View>

      <View style={[styles.section, styles.deleteSection]}>
        <Text style={styles.sectionTitle}>8. Delete Your Data</Text>
        <Text style={styles.text}>
          You can request deletion of your Naturinex account and associated data at any time
          through the app (Settings {'>'} Account {'>'} Delete Account) or by visiting:
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => openURL(DELETION_URL)}>
          <MaterialIcons name="delete-forever" size={20} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
        </TouchableOpacity>
        <Text style={styles.text}>
          {'\n'}Deletion removes your profile and stored scan history from our systems,
          subject to limited retention required by law or fraud prevention (typically 30-90 days).
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.text}>
          Our service is not intended for children under 13. We do not knowingly collect
          personal information from children under 13. If you believe we have collected
          information from a child, please contact us immediately.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. International Data Transfers</Text>
        <Text style={styles.text}>
          Your information may be transferred to and processed in the United States and
          other countries. We ensure appropriate safeguards are in place for such transfers.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. Changes to This Policy</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy periodically. We will notify you of material
          changes through the app or via email. Continued use after changes constitutes acceptance.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.text}>
          For privacy-related questions or to exercise your rights, contact us at:
        </Text>
        <View style={styles.contactInfo}>
          <TouchableOpacity onPress={() => openURL(`mailto:${SUPPORT_EMAIL}`)}>
            <Text style={styles.contactLink}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
          <Text style={styles.contactText}>
            Cien Rios LLC{'\n'}
            17113 Miramar Parkway{'\n'}
            Miramar, FL 33027{'\n'}
            United States
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewFullButton} onPress={() => openURL(PRIVACY_URL)}>
        <Text style={styles.viewFullButtonText}>View Full Privacy Policy Online</Text>
        <MaterialIcons name="open-in-new" size={16} color="#10B981" />
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  effectiveDate: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  companyInfo: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  companyAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  companyLink: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#374151',
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  deleteSection: {
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  contactInfo: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 10,
  },
  contactLink: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  viewFullButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  bottomPadding: {
    height: 40,
  },
});

export default PrivacyPolicyScreen;
