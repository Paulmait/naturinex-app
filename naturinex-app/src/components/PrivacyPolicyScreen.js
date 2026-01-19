import React from 'react';
import { ScrollView, Text, StyleSheet, View, Linking, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const PRIVACY_URL = 'https://naturinex.com/privacy';
const SUPPORT_EMAIL = 'support@naturinex.com';
const PRIVACY_EMAIL = 'privacy@naturinex.com';
const DELETION_URL = 'https://naturinex.com/delete-account';

const PrivacyPolicyScreen = ({ navigation }) => {
  const openURL = (url) => {
    Linking.openURL(url).catch((err) => console.error('Error opening URL:', err));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last Updated: January 18, 2026</Text>
      <Text style={styles.effectiveDate}>Effective Date: January 18, 2026</Text>

      <View style={styles.companyInfo}>
        <Text style={styles.companyName}>Cien Rios LLC dba Naturinex Wellness Guide</Text>
        <Text style={styles.companyAddress}>17113 Miramar Parkway</Text>
        <Text style={styles.companyAddress}>Miramar, FL 33027, United States</Text>
        <Text style={styles.companyAddress}>Phone: (754) 254-7141</Text>
        <TouchableOpacity onPress={() => openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.companyLink}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.introSection}>
        <Text style={styles.text}>
          Cien Rios LLC, doing business as Naturinex Wellness Guide ("Naturinex," "we," "our," or "us"),
          respects your privacy and is committed to protecting your personal data. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you use our web
          and mobile applications in compliance with applicable data protection regulations including
          GDPR, CCPA, and HIPAA where applicable.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.text}>We collect the following categories of information:</Text>

        <Text style={styles.subTitle}>Personal Information</Text>
        <Text style={styles.text}>
          Name, email address, phone number, and account credentials when you create an account
        </Text>

        <Text style={styles.subTitle}>Health & Wellness Data</Text>
        <Text style={styles.text}>
          Product scans, wellness notes, health preferences, and supplement tracking (encrypted at rest)
        </Text>

        <Text style={styles.subTitle}>Usage Data</Text>
        <Text style={styles.text}>
          App interactions, feature usage, scan history, and performance metrics
        </Text>

        <Text style={styles.subTitle}>Device Information</Text>
        <Text style={styles.text}>
          Device type, OS version, unique device identifiers, IP address (anonymized after 90 days)
        </Text>

        <Text style={styles.subTitle}>AI-Generated Insights</Text>
        <Text style={styles.text}>
          Wellness recommendations and product analysis from our ML models
        </Text>

        <Text style={styles.subTitle}>Payment Information</Text>
        <Text style={styles.text}>
          Processed securely via PCI-compliant third-party processors (we do not store card details)
        </Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            Data retention: Active account data retained for service duration plus 90 days.
            Anonymized analytics retained for 2 years.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.text}>
          We process your information based on the following legal bases:{'\n\n'}
          • <Text style={styles.bold}>Service Delivery (Contractual):</Text> Provide core app functionality, process subscriptions, customer support{'\n\n'}
          • <Text style={styles.bold}>Legitimate Interests:</Text> Improve AI models, prevent fraud, ensure security, analyze usage patterns{'\n\n'}
          • <Text style={styles.bold}>Consent:</Text> Marketing communications, beta features, research participation{'\n\n'}
          • <Text style={styles.bold}>Legal Obligations:</Text> Compliance with laws, respond to legal requests, enforce terms
        </Text>

        <View style={styles.aiDisclosure}>
          <MaterialIcons name="psychology" size={24} color="#7C3AED" />
          <View style={styles.aiDisclosureContent}>
            <Text style={styles.aiDisclosureTitle}>AI Processing Disclosure</Text>
            <Text style={styles.aiDisclosureText}>
              Our AI systems analyze your data locally when possible. Cloud processing uses encrypted,
              de-identified data. AI outputs are probabilistic and not medical advice. You maintain
              full control over AI-generated insights and can delete them at any time.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Data Security & Infrastructure</Text>
        <Text style={styles.text}>We implement enterprise-grade security measures:</Text>

        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Encryption:</Text> AES-256 at rest, TLS 1.3+ in transit, end-to-end for sensitive health data
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Access Controls:</Text> Multi-factor authentication, role-based permissions, principle of least privilege
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Infrastructure:</Text> SOC 2 Type II certified cloud providers, regular security audits, WAF protection
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Monitoring:</Text> 24/7 threat detection, automated incident response, quarterly penetration testing
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Compliance:</Text> GDPR, CCPA, COPPA compliant. HIPAA-ready infrastructure for health data
        </Text>
        <Text style={styles.bulletItem}>
          • <Text style={styles.bold}>Data Residency:</Text> Primary data centers in US-East. EU data processed in EU regions per GDPR
        </Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            Incident Response: Security incidents are logged, investigated within 24 hours, and
            reportable breaches disclosed within 72 hours per regulatory requirements.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Data Sharing & Third Parties</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>We do not sell your personal information.</Text> We share data only as follows:{'\n\n'}
          • <Text style={styles.bold}>Service Providers:</Text> Payment processors (Stripe), hosting (AWS/GCP), analytics (privacy-focused, anonymized){'\n\n'}
          • <Text style={styles.bold}>Legal Requirements:</Text> Law enforcement requests (with warrant), regulatory compliance, safety emergencies{'\n\n'}
          • <Text style={styles.bold}>Business Transfers:</Text> In case of merger/acquisition, with data protection agreements{'\n\n'}
          • <Text style={styles.bold}>Aggregated Data:</Text> De-identified statistics for research (no individual identification possible)
        </Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            All third parties are contractually bound to maintain confidentiality and implement
            adequate security measures. We conduct annual vendor security assessments.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Your Privacy Rights</Text>
        <Text style={styles.text}>
          You have comprehensive rights regarding your personal data:{'\n\n'}
          • <Text style={styles.bold}>Access:</Text> Request copy of your data via account settings or API (JSON export available){'\n\n'}
          • <Text style={styles.bold}>Rectification:</Text> Update inaccurate information through profile settings{'\n\n'}
          • <Text style={styles.bold}>Deletion:</Text> Request account deletion (processed within 30 days, some data retained for legal obligations){'\n\n'}
          • <Text style={styles.bold}>Portability:</Text> Export your data in machine-readable format (JSON/CSV){'\n\n'}
          • <Text style={styles.bold}>Restriction:</Text> Limit processing of your data for specific purposes{'\n\n'}
          • <Text style={styles.bold}>Objection:</Text> Opt-out of marketing, analytics, AI training{'\n\n'}
          • <Text style={styles.bold}>Automated Decision-Making:</Text> Request human review of AI-only decisions
        </Text>

        <View style={styles.regionBox}>
          <Text style={styles.regionTitle}>California Residents (CCPA)</Text>
          <Text style={styles.regionText}>
            Additional rights including opt-out of "sale" (though we don't sell data) and
            non-discrimination for exercising rights.
          </Text>
        </View>

        <View style={styles.regionBox}>
          <Text style={styles.regionTitle}>EU/UK Residents (GDPR)</Text>
          <Text style={styles.regionText}>
            Lodge complaints with supervisory authorities. Our DPO contact: {PRIVACY_EMAIL}
          </Text>
        </View>
      </View>

      <View style={[styles.section, styles.deleteSection]}>
        <Text style={styles.sectionTitle}>Delete Your Data</Text>
        <Text style={styles.text}>
          You can request deletion of your Naturinex account and associated data at any time
          through the app (Profile {'>'} Account {'>'} Delete Account) or by visiting:
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => openURL(DELETION_URL)}>
          <MaterialIcons name="delete-forever" size={20} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Request Account Deletion</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Children's Privacy</Text>
        <Text style={styles.text}>
          Our services are not directed to children under 13. We do not knowingly collect data
          from children under 13. If you believe a child has provided us data, contact us
          immediately for deletion.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. International Data Transfers</Text>
        <Text style={styles.text}>
          Your data may be transferred to and processed in countries other than your residence.
          We ensure adequate protection through Standard Contractual Clauses, adequacy decisions,
          or other approved mechanisms.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Cookies & Tracking</Text>
        <Text style={styles.text}>
          We use essential cookies for authentication and security. Analytics cookies are opt-in.
          You can manage preferences via cookie banner or browser settings. We honor Do Not Track signals.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. Updates to Privacy Policy</Text>
        <Text style={styles.text}>
          We may update this policy to reflect legal, technical, or business changes. Material
          changes will be notified via email and in-app notice. Continued use after changes
          constitutes acceptance.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <Text style={styles.text}>
          For privacy-related questions or to exercise your rights, contact us at:
        </Text>
        <View style={styles.contactInfo}>
          <TouchableOpacity onPress={() => openURL(`mailto:${PRIVACY_EMAIL}`)}>
            <Text style={styles.contactLink}>{PRIVACY_EMAIL}</Text>
          </TouchableOpacity>
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
    marginBottom: 6,
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
  bulletItem: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
    marginBottom: 8,
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
  aiDisclosure: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiDisclosureContent: {
    flex: 1,
    marginLeft: 12,
  },
  aiDisclosureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 6,
  },
  aiDisclosureText: {
    fontSize: 14,
    color: '#6B21A8',
    lineHeight: 20,
  },
  regionBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  regionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  regionText: {
    fontSize: 14,
    color: '#1E3A8A',
    lineHeight: 20,
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
    marginBottom: 6,
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
