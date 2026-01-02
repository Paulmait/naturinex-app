import React from 'react';
import { ScrollView, Text, StyleSheet, View, Linking, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TERMS_URL = 'https://naturinex.com/terms';
const PRIVACY_URL = 'https://naturinex.com/privacy';
const SUPPORT_EMAIL = 'support@naturinex.com';

const TermsOfUseScreen = ({ navigation }) => {
  const openURL = (url) => {
    Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.subtitle}>(End User License Agreement)</Text>
      <Text style={styles.effectiveDate}>Effective Date: January 1, 2025</Text>
      <Text style={styles.lastUpdated}>Last Updated: January 2, 2026</Text>

      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>Cien Rios LLC dba Naturinex Wellness Guide</Text>
        <Text style={styles.companyAddress}>17113 Miramar Parkway</Text>
        <Text style={styles.companyAddress}>Miramar, FL 33027, United States</Text>
        <TouchableOpacity onPress={() => openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.companyLink}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.importantNotice}>
        <MaterialIcons name="warning" size={24} color="#92400E" />
        <Text style={styles.importantText}>
          Please read these terms carefully before using Naturinex Wellness Guide.
          By using the app, you agree to be bound by these terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By downloading, installing, or using Naturinex Wellness Guide ("the App"),
          you agree to these Terms of Service ("Terms") and our Privacy Policy.
          If you do not agree, do not use the App.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Service Description</Text>
        <Text style={styles.text}>
          Naturinex Wellness Guide provides educational wellness information by analyzing
          medications and products through image scanning or manual entry. The App suggests
          natural wellness alternatives and provides general health information.
        </Text>
      </View>

      <View style={[styles.section, styles.warningSection]}>
        <Text style={styles.sectionTitle}>3. Medical Disclaimer</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>IMPORTANT: </Text>
          Naturinex Wellness Guide is for educational and informational purposes only.
          It is NOT a substitute for professional medical advice, diagnosis, or treatment.{'\n\n'}
          • Always consult with a qualified healthcare provider before making any changes
          to your medications or health regimen.{'\n'}
          • Never disregard professional medical advice or delay seeking it because of
          information provided by this App.{'\n'}
          • The natural alternatives suggested are for educational purposes and may not
          be suitable for your specific health conditions.{'\n'}
          • If you think you have a medical emergency, call your doctor or emergency
          services immediately.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Account Registration</Text>
        <Text style={styles.text}>
          To access certain features, you must create an account. You agree to:{'\n\n'}
          • Provide accurate and complete information{'\n'}
          • Maintain the security of your account credentials{'\n'}
          • Notify us immediately of any unauthorized access{'\n'}
          • Be responsible for all activities under your account{'\n\n'}
          We reserve the right to suspend or terminate accounts that violate these Terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Subscription Terms</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>5.1 Free Tier</Text>{'\n'}
          Free users receive limited scans per month with basic features.{'\n\n'}

          <Text style={styles.bold}>5.2 Premium Subscriptions</Text>{'\n'}
          Premium subscriptions unlock additional features including:{'\n'}
          • Increased or unlimited scans{'\n'}
          • Advanced AI analysis{'\n'}
          • Scan history and export features{'\n'}
          • Priority support{'\n\n'}

          <Text style={styles.bold}>5.3 Billing</Text>{'\n'}
          • Payment is charged to your Apple ID account at confirmation of purchase{'\n'}
          • Subscriptions automatically renew unless cancelled at least 24 hours before
          the end of the current period{'\n'}
          • Your account will be charged for renewal within 24 hours prior to the end
          of the current period{'\n'}
          • You can manage and cancel subscriptions in your App Store account settings{'\n\n'}

          <Text style={styles.bold}>5.4 Free Trial</Text>{'\n'}
          If offered, free trial periods allow you to try premium features. If you do not
          cancel before the trial ends, you will be automatically charged the subscription price.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. User Conduct</Text>
        <Text style={styles.text}>
          You agree not to:{'\n\n'}
          • Use the App for any unlawful purpose{'\n'}
          • Attempt to reverse engineer or modify the App{'\n'}
          • Interfere with or disrupt the App's functionality{'\n'}
          • Upload malicious content or code{'\n'}
          • Impersonate others or misrepresent your affiliation{'\n'}
          • Use the App in any way that could harm others{'\n'}
          • Share your account credentials with others{'\n'}
          • Circumvent usage limits or free trial restrictions
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.text}>
          All content, features, and functionality of the App, including but not limited to
          text, graphics, logos, and software, are owned by Cien Rios LLC and are protected
          by copyright, trademark, and other intellectual property laws.{'\n\n'}
          You are granted a limited, non-exclusive, non-transferable license to use the App
          for personal, non-commercial purposes.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Privacy</Text>
        <Text style={styles.text}>
          Your use of the App is also governed by our Privacy Policy, which describes how
          we collect, use, and protect your information.
        </Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation?.navigate?.('PrivacyPolicy') || openURL(PRIVACY_URL)}
        >
          <Text style={styles.linkButtonText}>View Privacy Policy</Text>
          <MaterialIcons name="chevron-right" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Disclaimer of Warranties</Text>
        <Text style={styles.text}>
          THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
          EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT:{'\n\n'}
          • The App will be uninterrupted or error-free{'\n'}
          • Results from the App will be accurate or reliable{'\n'}
          • The quality of information will meet your expectations{'\n'}
          • Any errors will be corrected
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.text}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, CIEN RIOS LLC SHALL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
          LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY
          LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.{'\n\n'}
          OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM YOUR USE OF THE APP SHALL NOT
          EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. Indemnification</Text>
        <Text style={styles.text}>
          You agree to indemnify and hold harmless Cien Rios LLC and its officers, directors,
          employees, and agents from any claims, damages, losses, or expenses arising from
          your use of the App or violation of these Terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>12. Termination</Text>
        <Text style={styles.text}>
          We may terminate or suspend your access to the App at any time, with or without
          cause or notice. Upon termination, your right to use the App will cease immediately.
          You may also delete your account at any time through the App settings.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
        <Text style={styles.text}>
          We may modify these Terms at any time. We will notify you of material changes
          through the App or via email. Your continued use after changes constitutes
          acceptance of the modified Terms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>14. Governing Law</Text>
        <Text style={styles.text}>
          These Terms shall be governed by and construed in accordance with the laws of the
          State of Florida, United States, without regard to its conflict of law provisions.
          Any disputes shall be resolved in the courts of Broward County, Florida.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>15. Contact Us</Text>
        <Text style={styles.text}>
          For questions about these Terms, please contact us:
        </Text>
        <View style={styles.contactInfo}>
          <TouchableOpacity onPress={() => openURL(`mailto:${SUPPORT_EMAIL}`)}>
            <Text style={styles.contactLink}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
          <Text style={styles.contactText}>
            Cien Rios LLC{'\n'}
            17113 Miramar Parkway{'\n'}
            Miramar, FL 33027{'\n'}
            United States{'\n'}
            Phone: (754) 254-7141
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewFullButton} onPress={() => openURL(TERMS_URL)}>
        <Text style={styles.viewFullButtonText}>View Full Terms Online</Text>
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
    marginBottom: 4,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 10,
    fontStyle: 'italic',
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
  importantNotice: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  importantText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  warningSection: {
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  bold: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  linkButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
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

export default TermsOfUseScreen;
