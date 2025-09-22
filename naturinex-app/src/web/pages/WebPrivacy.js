import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
function WebPrivacy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Privacy Policy
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated: September 3, 2025
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Effective Date: September 3, 2025
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Typography paragraph>
            Cien Rios LLC, doing business as Naturinex Wellness Guide (&ldquo;Naturinex,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), 
            respects your privacy and is committed to protecting your personal data. This Privacy Policy explains 
            how we collect, use, disclose, and safeguard your information when you use our web and mobile applications 
            in compliance with applicable data protection regulations including GDPR, CCPA, and HIPAA where applicable.
          </Typography>
        </Box>
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography paragraph fontWeight="bold">
            We collect the following categories of information:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number, and account credentials when you create an account</li>
              <li><strong>Health & Wellness Data:</strong> Product scans, wellness notes, health preferences, and supplement tracking (encrypted at rest)</li>
              <li><strong>Usage Data:</strong> App interactions, feature usage, scan history, and performance metrics</li>
              <li><strong>Device Information:</strong> Device type, OS version, unique device identifiers, IP address (anonymized after 90 days)</li>
              <li><strong>AI-Generated Insights:</strong> Wellness recommendations and product analysis from our ML models</li>
              <li><strong>Payment Information:</strong> Processed securely via PCI-compliant third-party processors (we do not store card details)</li>
            </ul>
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Data retention: Active account data retained for service duration plus 90 days. Anonymized analytics retained for 2 years.
          </Typography>
          <Typography variant="h6" gutterBottom>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We process your information based on the following legal bases:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Service Delivery (Contractual):</strong> Provide core app functionality, process subscriptions, customer support</li>
              <li><strong>Legitimate Interests:</strong> Improve AI models, prevent fraud, ensure security, analyze usage patterns</li>
              <li><strong>Consent:</strong> Marketing communications, beta features, research participation</li>
              <li><strong>Legal Obligations:</strong> Compliance with laws, respond to legal requests, enforce terms</li>
            </ul>
          </Typography>
          <Typography variant="body2" paragraph sx={{ mt: 2 }}>
            <strong>AI Processing Disclosure:</strong> Our AI systems analyze your data locally when possible. Cloud processing uses 
            encrypted, de-identified data. AI outputs are probabilistic and not medical advice. You maintain full control over 
            AI-generated insights and can delete them at any time.
          </Typography>
          <Typography variant="h6" gutterBottom>
            3. Data Security & Infrastructure
          </Typography>
          <Typography paragraph>
            We implement enterprise-grade security measures:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Encryption:</strong> AES-256 at rest, TLS 1.3+ in transit, end-to-end for sensitive health data</li>
              <li><strong>Access Controls:</strong> Multi-factor authentication, role-based permissions, principle of least privilege</li>
              <li><strong>Infrastructure:</strong> SOC 2 Type II certified cloud providers, regular security audits, WAF protection</li>
              <li><strong>Monitoring:</strong> 24/7 threat detection, automated incident response, quarterly penetration testing</li>
              <li><strong>Compliance:</strong> GDPR, CCPA, COPPA compliant. HIPAA-ready infrastructure for health data</li>
              <li><strong>Data Residency:</strong> Primary data centers in US-East. EU data processed in EU regions per GDPR</li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Incident Response:</strong> Security incidents are logged, investigated within 24 hours, and reportable 
            breaches disclosed within 72 hours per regulatory requirements.
          </Typography>
          <Typography variant="h6" gutterBottom>
            4. Data Sharing & Third Parties
          </Typography>
          <Typography paragraph>
            We do not sell your personal information. We share data only as follows:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Service Providers:</strong> Payment processors (Stripe), hosting (AWS/GCP), analytics (privacy-focused, anonymized)</li>
              <li><strong>Legal Requirements:</strong> Law enforcement requests (with warrant), regulatory compliance, safety emergencies</li>
              <li><strong>Business Transfers:</strong> In case of merger/acquisition, with data protection agreements</li>
              <li><strong>Aggregated Data:</strong> De-identified statistics for research (no individual identification possible)</li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            All third parties are contractually bound to maintain confidentiality and implement adequate security measures. 
            We conduct annual vendor security assessments.
          </Typography>
          <Typography variant="h6" gutterBottom>
            5. Your Privacy Rights
          </Typography>
          <Typography paragraph>
            You have comprehensive rights regarding your personal data:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Access:</strong> Request copy of your data via account settings or API (JSON export available)</li>
              <li><strong>Rectification:</strong> Update inaccurate information through profile settings</li>
              <li><strong>Deletion:</strong> Request account deletion (processed within 30 days, some data retained for legal obligations)</li>
              <li><strong>Portability:</strong> Export your data in machine-readable format (JSON/CSV)</li>
              <li><strong>Restriction:</strong> Limit processing of your data for specific purposes</li>
              <li><strong>Objection:</strong> Opt-out of marketing, analytics, AI training</li>
              <li><strong>Automated Decision-Making:</strong> Request human review of AI-only decisions</li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>California Residents:</strong> Additional rights under CCPA including opt-out of &ldquo;sale&rdquo; (though we don&apos;t sell data) 
            and non-discrimination for exercising rights.<br/>
            <strong>EU/UK Residents:</strong> Lodge complaints with supervisory authorities. Our DPO contact: privacy@naturinex.com
          </Typography>
          <Typography variant="h6" gutterBottom>
            6. Children's Privacy
          </Typography>
          <Typography paragraph>
            Our services are not directed to children under 13. We do not knowingly collect data from children 
            under 13. If you believe a child has provided us data, contact us immediately for deletion.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            7. International Data Transfers
          </Typography>
          <Typography paragraph>
            Your data may be transferred to and processed in countries other than your residence. We ensure adequate 
            protection through Standard Contractual Clauses, adequacy decisions, or other approved mechanisms.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            8. Cookies & Tracking
          </Typography>
          <Typography paragraph>
            We use essential cookies for authentication and security. Analytics cookies are opt-in. You can manage 
            preferences via cookie banner or browser settings. We honor Do Not Track signals.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            9. Updates to Privacy Policy
          </Typography>
          <Typography paragraph>
            We may update this policy to reflect legal, technical, or business changes. Material changes will be 
            notified via email and in-app notice 30 days before effectiveness. Continued use after changes indicates acceptance.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            10. Contact Information
          </Typography>
          <Typography component="div" paragraph>
            <strong>Cien Rios LLC d/b/a Naturinex Wellness Guide</strong><br/>
            17113 Miramar Parkway<br/>
            Miramar, FL 33027<br/>
            United States<br/><br/>
            <strong>Support:</strong> support@naturinex.com<br/>
            <strong>Privacy/DPO:</strong> privacy@naturinex.com<br/>
            <strong>Phone:</strong> (754) 254-7141<br/>
            <strong>Response Time:</strong> 1-2 business days<br/><br/>
            <strong>EU Representative:</strong> [To be appointed if required]<br/>
            <strong>UK Representative:</strong> [To be appointed if required]
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
export default WebPrivacy;