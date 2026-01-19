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
      <Text style={styles.lastUpdated}>Last Updated: January 18, 2026</Text>
      <Text style={styles.effectiveDate}>Effective Date: January 18, 2026</Text>

      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>Cien Rios LLC dba Naturinex Wellness Guide</Text>
        <Text style={styles.companyAddress}>17113 Miramar Parkway</Text>
        <Text style={styles.companyAddress}>Miramar, FL 33027, United States</Text>
        <TouchableOpacity onPress={() => openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.companyLink}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.introSection}>
        <Text style={styles.text}>
          These Terms of Service ("Terms", "Agreement") constitute a legally binding agreement between
          you ("User", "you", "your") and Cien Rios LLC, doing business as Naturinex Wellness Guide
          ("Naturinex", "Company", "we", "our", "us"), governing your access to and use of the
          Naturinex web and mobile applications, APIs, and related services (collectively, the "Service").
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms & Eligibility</Text>
        <Text style={styles.text}>
          By accessing or using our Service, you acknowledge that you have read, understood, and agree
          to be bound by these Terms and our Privacy Policy. If you disagree with any part, you must
          discontinue use immediately.
        </Text>

        <Text style={styles.subTitle}>Eligibility Requirements:</Text>
        <Text style={styles.text}>
          • You must be at least 13 years old (or age of digital consent in your jurisdiction){'\n'}
          • If under 18, you must have parental/guardian consent and supervision{'\n'}
          • You must provide accurate, current, and complete information{'\n'}
          • You must not be prohibited from using the Service under applicable laws{'\n'}
          • You must not have been previously banned from the Service
        </Text>
      </View>

      <View style={[styles.section, styles.warningSection]}>
        <View style={styles.warningHeader}>
          <MaterialIcons name="warning" size={24} color="#92400E" />
          <Text style={styles.warningTitle}>IMPORTANT MEDICAL DISCLAIMER</Text>
        </View>
        <Text style={styles.warningText}>
          THE SERVICE IS NOT INTENDED TO BE A SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT.
        </Text>

        <Text style={styles.text}>
          {'\n'}• <Text style={styles.bold}>Educational Purpose Only:</Text> All content, including AI-generated insights, is for informational and educational purposes only{'\n\n'}
          • <Text style={styles.bold}>Not Medical Advice:</Text> Never disregard professional medical advice or delay seeking it because of information from our Service{'\n\n'}
          • <Text style={styles.bold}>Healthcare Provider Consultation:</Text> Always consult qualified healthcare professionals for medical conditions, symptoms, or treatments{'\n\n'}
          • <Text style={styles.bold}>Emergency Situations:</Text> For medical emergencies, immediately call emergency services (911 in US) or go to the nearest emergency room{'\n\n'}
          • <Text style={styles.bold}>No Doctor-Patient Relationship:</Text> Use of the Service does not create a doctor-patient or therapist-client relationship{'\n\n'}
          • <Text style={styles.bold}>Individual Results Vary:</Text> Wellness suggestions are general; individual results and experiences will vary{'\n\n'}
          • <Text style={styles.bold}>Supplement Risks:</Text> Dietary supplements can interact with medications and have side effects. Consult healthcare providers before use
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. AI-Powered Features & Limitations</Text>
        <Text style={styles.text}>Our Service uses artificial intelligence (AI) and machine learning (ML) technologies:</Text>

        <View style={styles.aiBox}>
          <MaterialIcons name="psychology" size={24} color="#7C3AED" />
          <View style={styles.aiBoxContent}>
            <Text style={styles.text}>
              • <Text style={styles.bold}>Probabilistic Nature:</Text> AI outputs are probabilistic predictions, not deterministic facts{'\n\n'}
              • <Text style={styles.bold}>Accuracy Limitations:</Text> AI may produce incorrect, outdated, or biased information{'\n\n'}
              • <Text style={styles.bold}>No Guarantee:</Text> We do not guarantee accuracy, completeness, or reliability of AI-generated content{'\n\n'}
              • <Text style={styles.bold}>Human Verification Required:</Text> Always verify AI suggestions with authoritative sources{'\n\n'}
              • <Text style={styles.bold}>Training Data:</Text> AI models are trained on datasets that may not reflect your specific circumstances{'\n\n'}
              • <Text style={styles.bold}>Continuous Improvement:</Text> Models are updated regularly; outputs may change over time{'\n\n'}
              • <Text style={styles.bold}>Your Responsibility:</Text> You are solely responsible for decisions based on AI outputs
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. User Accounts & Security</Text>
        <Text style={styles.subTitle}>Account Responsibilities:</Text>
        <Text style={styles.text}>
          • Maintain accurate and current account information{'\n'}
          • Protect account credentials (use strong, unique passwords){'\n'}
          • Enable two-factor authentication when available{'\n'}
          • Immediately notify us of unauthorized access or security breaches{'\n'}
          • Accept liability for all activities under your account{'\n'}
          • Not share accounts or credentials with others{'\n'}
          • Not create multiple accounts to circumvent restrictions
        </Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in
            fraudulent activity, or pose security risks. Account termination may result in loss of
            access to data and services.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Subscriptions, Billing & Refunds</Text>

        <Text style={styles.subTitle}>Subscription Terms:</Text>
        <Text style={styles.text}>
          • <Text style={styles.bold}>Billing Cycles:</Text> Monthly or annual (prepaid), auto-renewing unless cancelled{'\n'}
          • <Text style={styles.bold}>Price Changes:</Text> 30-day notice for price increases; continued use constitutes acceptance{'\n'}
          • <Text style={styles.bold}>Payment Methods:</Text> Major credit cards, debit cards, and approved digital wallets{'\n'}
          • <Text style={styles.bold}>Failed Payments:</Text> Service suspension after 3 failed attempts; data retained for 30 days{'\n'}
          • <Text style={styles.bold}>Taxes:</Text> Prices exclude applicable taxes; you're responsible for all applicable taxes
        </Text>

        <Text style={styles.subTitle}>Cancellation & Refunds:</Text>
        <Text style={styles.text}>
          • Cancel anytime via account settings; access continues until billing period ends{'\n'}
          • No prorated refunds for partial periods{'\n'}
          • Annual plans: 14-day money-back guarantee from initial purchase{'\n'}
          • Refunds for service issues evaluated case-by-case{'\n'}
          • Chargebacks may result in immediate account termination
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Prohibited Uses & Conduct</Text>
        <Text style={styles.text}>You agree NOT to:</Text>

        <View style={styles.prohibitedBox}>
          <Text style={styles.text}>
            • Violate any laws, regulations, or third-party rights{'\n'}
            • Provide false or misleading information{'\n'}
            • Use the Service for unauthorized commercial purposes{'\n'}
            • Attempt to gain unauthorized access to systems or data{'\n'}
            • Reverse engineer, decompile, or disassemble any part of the Service{'\n'}
            • Use automated systems (bots, scrapers) without permission{'\n'}
            • Interfere with or disrupt the Service or servers{'\n'}
            • Transmit viruses, malware, or harmful code{'\n'}
            • Harass, abuse, or harm other users{'\n'}
            • Circumvent usage limits or access restrictions{'\n'}
            • Resell or redistribute the Service without authorization{'\n'}
            • Use the Service for illegal drug activities{'\n'}
            • Impersonate others or misrepresent affiliation
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Intellectual Property Rights</Text>

        <Text style={styles.subTitle}>Our Property:</Text>
        <Text style={styles.text}>
          • All Service content, features, functionality, and AI models are owned by Cien Rios LLC or licensors{'\n'}
          • Protected by copyright, trademark, trade secret, and other IP laws{'\n'}
          • "Naturinex" and related logos are our trademarks{'\n'}
          • No rights granted except as explicitly stated in these Terms
        </Text>

        <Text style={styles.subTitle}>Your Content:</Text>
        <Text style={styles.text}>
          • You retain ownership of content you submit{'\n'}
          • You grant us a worldwide, royalty-free license to use, process, and display your content for Service operation{'\n'}
          • You warrant that your content doesn't violate third-party rights{'\n'}
          • We may remove content that violates these Terms or applicable laws
        </Text>
      </View>

      <View style={[styles.section, styles.liabilitySection]}>
        <Text style={styles.sectionTitle}>8. Limitation of Liability & Indemnification</Text>
        <Text style={styles.legalText}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW:{'\n\n'}
          • THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND{'\n\n'}
          • WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT{'\n\n'}
          • WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES{'\n\n'}
          • WE ARE NOT LIABLE FOR LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION{'\n\n'}
          • OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE PAST 12 MONTHS{'\n\n'}
          • WE ARE NOT LIABLE FOR THIRD-PARTY ACTIONS OR CONTENT{'\n\n'}
          • WE ARE NOT LIABLE FOR HEALTH OUTCOMES RESULTING FROM SERVICE USE
        </Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            <Text style={styles.bold}>Indemnification:</Text> You agree to defend, indemnify, and hold harmless Cien Rios LLC,
            its officers, directors, employees, and agents from any claims, damages, losses, and expenses
            (including attorney fees) arising from your use of the Service, violation of these Terms,
            or infringement of any third-party rights.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Privacy & Data Protection</Text>
        <Text style={styles.text}>
          Your use of the Service is subject to our Privacy Policy. By using the Service, you consent
          to data practices described in the Privacy Policy. We implement industry-standard security
          measures but cannot guarantee absolute security. You are responsible for maintaining the
          confidentiality of your account.
        </Text>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('PrivacyPolicy')}>
          <Text style={styles.linkButtonText}>View Privacy Policy</Text>
          <MaterialIcons name="chevron-right" size={20} color="#10B981" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Dispute Resolution & Governing Law</Text>
        <Text style={styles.text}>
          • <Text style={styles.bold}>Governing Law:</Text> These Terms are governed by the laws of the State of Florida, USA, without regard to conflict of law principles{'\n\n'}
          • <Text style={styles.bold}>Arbitration:</Text> Disputes shall be resolved through binding arbitration under AAA Commercial Arbitration Rules{'\n\n'}
          • <Text style={styles.bold}>Class Action Waiver:</Text> You waive the right to participate in class actions against us{'\n\n'}
          • <Text style={styles.bold}>Venue:</Text> Any legal proceedings shall be brought in Broward County, Florida{'\n\n'}
          • <Text style={styles.bold}>Limitation Period:</Text> Claims must be filed within one year of the event giving rise to the claim{'\n\n'}
          • <Text style={styles.bold}>Informal Resolution:</Text> Before formal proceedings, parties agree to attempt good-faith dispute resolution
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. Service Availability & Modifications</Text>
        <Text style={styles.text}>
          • Service provided with target 99.5% uptime but no guarantee of uninterrupted availability{'\n'}
          • We may modify, suspend, or discontinue features with or without notice{'\n'}
          • Scheduled maintenance communicated via email/in-app notifications{'\n'}
          • No liability for Service unavailability or data loss due to factors beyond our control{'\n'}
          • We reserve the right to impose usage limits to ensure Service quality
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>12. Termination</Text>
        <Text style={styles.text}>
          • Either party may terminate the agreement at any time{'\n'}
          • We may terminate immediately for Terms violations or illegal activities{'\n'}
          • Upon termination, your right to use the Service ceases immediately{'\n'}
          • Certain provisions survive termination (IP rights, liability limitations, dispute resolution){'\n'}
          • We may retain anonymized data for analytics and service improvement
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>13. Changes to Terms</Text>
        <Text style={styles.text}>
          We reserve the right to modify these Terms at any time. Material changes will be notified
          via email and in-app notice at least 30 days before taking effect. Continued use after the
          effective date constitutes acceptance. If you disagree with changes, you must discontinue
          use and may be eligible for a prorated refund.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>14. Miscellaneous Provisions</Text>
        <Text style={styles.text}>
          • <Text style={styles.bold}>Entire Agreement:</Text> These Terms constitute the entire agreement between parties{'\n\n'}
          • <Text style={styles.bold}>Severability:</Text> If any provision is invalid, other provisions remain in effect{'\n\n'}
          • <Text style={styles.bold}>No Waiver:</Text> Failure to enforce any right doesn't constitute waiver{'\n\n'}
          • <Text style={styles.bold}>Assignment:</Text> You may not assign rights; we may assign to successors{'\n\n'}
          • <Text style={styles.bold}>Force Majeure:</Text> No liability for delays due to circumstances beyond reasonable control{'\n\n'}
          • <Text style={styles.bold}>Export Compliance:</Text> You comply with all applicable export laws and regulations{'\n\n'}
          • <Text style={styles.bold}>Government Use:</Text> If government entity, additional terms may apply
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>15. Contact Information</Text>
        <Text style={styles.text}>For questions about these Terms, contact us at:</Text>
        <View style={styles.contactInfo}>
          <TouchableOpacity onPress={() => openURL(`mailto:${SUPPORT_EMAIL}`)}>
            <Text style={styles.contactLink}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
          <Text style={styles.contactText}>
            {'\n'}Cien Rios LLC{'\n'}
            17113 Miramar Parkway{'\n'}
            Miramar, FL 33027{'\n'}
            United States{'\n'}
            Phone: (754) 254-7141
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewFullButton} onPress={() => openURL(TERMS_URL)}>
        <Text style={styles.viewFullButtonText}>View Full Terms of Service Online</Text>
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
    marginBottom: 4,
  },
  companyInfo: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    marginTop: 10,
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
  introSection: {
    marginBottom: 24,
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
  bold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  warningSection: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginLeft: 10,
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    textAlign: 'center',
    backgroundColor: '#FDE68A',
    padding: 10,
    borderRadius: 8,
  },
  aiBox: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    padding: 15,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiBoxContent: {
    flex: 1,
    marginLeft: 12,
  },
  highlightBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  highlightText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  prohibitedBox: {
    backgroundColor: '#FEF2F2',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  liabilitySection: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legalText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#6B7280',
    fontStyle: 'italic',
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
    fontSize: 15,
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
