import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TermsOfUse = ({ onClose }) => {
  const openEmail = () => {
    Linking.openURL('mailto:legal@naturinex.com');
  };

  const openWebsite = () => {
    Linking.openURL('https://naturinex.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Terms of Use</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 17, 2025</Text>
        
        <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using the Naturinex application ("Service"), you agree to be bound by these Terms of Use ("Terms"). If you disagree with any part of these terms, you may not access the Service.
        </Text>

        <View style={styles.criticalBox}>
          <Text style={styles.criticalTitle}>⚠️ CRITICAL MEDICAL DISCLAIMER</Text>
          <Text style={styles.criticalText}>
            Naturinex is for educational and informational purposes only and is NOT intended to provide medical advice, diagnosis, or treatment recommendations.
          </Text>
          <Text style={styles.criticalSubText}>
            • Not Medical Advice: Information provided is not a substitute for professional medical consultation{'\n'}
            • No Doctor-Patient Relationship: Use of this Service does not create a doctor-patient relationship{'\n'}
            • Consult Healthcare Providers: Always seek advice from qualified healthcare professionals{'\n'}
            • Emergency Situations: Do not use this app for medical emergencies - call emergency services
          </Text>
        </View>

        <Text style={styles.sectionTitle}>2. Your Acknowledgment</Text>
        <Text style={styles.paragraph}>
          By using Naturinex, you acknowledge and agree that:
        </Text>
        <Text style={styles.paragraph}>
          • You understand the limitations of AI-generated health information{'\n'}
          • You will not rely solely on our suggestions for medical decisions{'\n'}
          • You will consult healthcare providers before making medication changes{'\n'}
          • You use the Service at your own risk
        </Text>

        <Text style={styles.sectionTitle}>3. Service Description</Text>
        <Text style={styles.paragraph}>
          Naturinex provides:
        </Text>
        <Text style={styles.paragraph}>
          • Medication Scanning: Photo and barcode recognition of medications{'\n'}
          • AI Suggestions: Educational information about natural alternatives{'\n'}
          • Health Information: General wellness and medication information{'\n'}
          • Premium Features: Enhanced functionality for paying subscribers
        </Text>

        <Text style={styles.sectionTitle}>4. User Accounts and Responsibilities</Text>
        
        <Text style={styles.subTitle}>Account Creation</Text>
        <Text style={styles.paragraph}>
          • You must provide accurate and complete information{'\n'}
          • You are responsible for maintaining account security{'\n'}
          • You must be at least 13 years old to use the Service{'\n'}
          • One account per person
        </Text>

        <Text style={styles.subTitle}>Prohibited Uses</Text>
        <Text style={styles.paragraph}>
          You agree NOT to:
        </Text>
        <Text style={styles.paragraph}>
          • Use the Service for illegal or unauthorized purposes{'\n'}
          • Attempt to gain unauthorized access to our systems{'\n'}
          • Interfere with or disrupt the Service{'\n'}
          • Use the Service to harm others or yourself{'\n'}
          • Share false or misleading medical information{'\n'}
          • Attempt to reverse engineer the app
        </Text>

        <Text style={styles.sectionTitle}>5. Subscription and Payment</Text>
        
        <Text style={styles.subTitle}>Premium Subscriptions</Text>
        <Text style={styles.paragraph}>
          • Premium features require a paid subscription{'\n'}
          • Subscriptions are billed through Stripe{'\n'}
          • You can cancel at any time{'\n'}
          • No refunds for partial months
        </Text>

        <Text style={styles.subTitle}>Payment Terms</Text>
        <Text style={styles.paragraph}>
          • All payments are processed securely through Stripe{'\n'}
          • Prices may change with 30 days notice{'\n'}
          • Failed payments may result in service suspension{'\n'}
          • You authorize recurring charges for subscriptions
        </Text>

        <Text style={styles.sectionTitle}>6. AI Technology and Limitations</Text>
        
        <View style={styles.aiBox}>
          <Text style={styles.aiTitle}>🤖 AI Technology Notice</Text>
          <Text style={styles.aiText}>
            Naturinex uses artificial intelligence to analyze medication information and provide suggestions. Important limitations:
          </Text>
          <Text style={styles.aiSubText}>
            • AI suggestions are for educational purposes only{'\n'}
            • AI may make errors or provide incomplete information{'\n'}
            • AI suggestions are not medical advice{'\n'}
            • Always verify information with healthcare professionals{'\n'}
            • AI technology is constantly evolving and improving
          </Text>
        </View>

        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          • The Service and its content are owned by Cien Rios LLC{'\n'}
          • You retain ownership of your user-generated content{'\n'}
          • You grant us license to use your content for service improvement{'\n'}
          • You may not copy, modify, or distribute our content
        </Text>

        <Text style={styles.sectionTitle}>8. Privacy and Data Protection</Text>
        <Text style={styles.paragraph}>
          Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
        </Text>

        <Text style={styles.sectionTitle}>9. Geographic Restrictions</Text>
        <Text style={styles.paragraph}>
          The Service is intended for users in the United States. We make no representation that the Service is appropriate or available for use in other locations.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use constitutes acceptance of the modified Terms.
        </Text>

        <Text style={styles.sectionTitle}>11. Termination</Text>
        
        <Text style={styles.subTitle}>By You</Text>
        <Text style={styles.paragraph}>
          • You may stop using the Service at any time{'\n'}
          • You may delete your account through the Profile section
        </Text>

        <Text style={styles.subTitle}>By Us</Text>
        <Text style={styles.paragraph}>
          • We may terminate or suspend your account for Terms violations{'\n'}
          • We may discontinue the Service with reasonable notice{'\n'}
          • Termination does not affect accrued rights or obligations
        </Text>

        <Text style={styles.sectionTitle}>12. Dispute Resolution</Text>
        
        <Text style={styles.subTitle}>Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms are governed by the laws of Florida, United States, without regard to conflict of law principles.
        </Text>

        <Text style={styles.subTitle}>Dispute Resolution Process</Text>
        <Text style={styles.paragraph}>
          1. Direct Communication: Contact us first to resolve disputes{'\n'}
          2. Mediation: Good faith attempt at mediation if needed{'\n'}
          3. Arbitration: Binding arbitration for unresolved disputes{'\n'}
          4. Class Action Waiver: No class action lawsuits permitted
        </Text>

        <View style={styles.liabilityBox}>
          <Text style={styles.liabilityTitle}>🛡️ LIMITATION OF LIABILITY</Text>
          <Text style={styles.liabilityText}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW:
          </Text>
          <Text style={styles.liabilitySubText}>
            • We are not liable for any health outcomes from using Naturinex{'\n'}
            • We are not liable for indirect, incidental, or consequential damages{'\n'}
            • Our total liability is limited to the amount you paid us in the past 12 months{'\n'}
            • You use Naturinex at your own risk
          </Text>
        </View>

        <Text style={styles.sectionTitle}>13. Indemnification</Text>
        <Text style={styles.paragraph}>
          You agree to defend and hold harmless Cien Rios LLC from claims arising from your use of Naturinex, violation of these terms, or harm to others.
        </Text>

        <Text style={styles.sectionTitle}>14. Severability</Text>
        <Text style={styles.paragraph}>
          If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
        </Text>

        <Text style={styles.sectionTitle}>15. Contact Information</Text>
        <Text style={styles.paragraph}>
          Questions about these Terms? Contact us:
        </Text>
        
        <TouchableOpacity onPress={openEmail} style={styles.contactButton}>
          <Text style={styles.contactButtonText}>Email: legal@naturinex.com</Text>
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
  criticalBox: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  criticalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
  },
  criticalText: {
    fontSize: 14,
    color: '#721c24',
    lineHeight: 20,
    marginBottom: 8,
  },
  criticalSubText: {
    fontSize: 13,
    color: '#721c24',
    lineHeight: 18,
  },
  aiBox: {
    backgroundColor: '#d1ecf1',
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c5460',
    marginBottom: 8,
  },
  aiText: {
    fontSize: 14,
    color: '#0c5460',
    lineHeight: 20,
    marginBottom: 8,
  },
  aiSubText: {
    fontSize: 13,
    color: '#0c5460',
    lineHeight: 18,
  },
  liabilityBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  liabilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  liabilityText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: 8,
  },
  liabilitySubText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
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

export default TermsOfUse;
