import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';

function WebTerms() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Terms of Service
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Last updated: September 3, 2025
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Effective Date: September 3, 2025 | Version 2.0
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography paragraph>
            These Terms of Service ("Terms", "Agreement") constitute a legally binding agreement between you 
            ("User", "you", "your") and Cien Rios LLC, doing business as Naturinex Wellness Guide 
            ("Naturinex", "Company", "we", "our", "us"), governing your access to and use of the Naturinex 
            web and mobile applications, APIs, and related services (collectively, the "Service").
          </Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Acceptance of Terms & Eligibility
          </Typography>
          <Typography paragraph>
            By accessing or using our Service, you acknowledge that you have read, understood, and agree to be 
            bound by these Terms and our Privacy Policy. If you disagree with any part, you must discontinue use immediately.
          </Typography>
          <Typography component="div" paragraph>
            <strong>Eligibility Requirements:</strong>
            <ul>
              <li>You must be at least 13 years old (or age of digital consent in your jurisdiction)</li>
              <li>If under 18, you must have parental/guardian consent and supervision</li>
              <li>You must provide accurate, current, and complete information</li>
              <li>You must not be prohibited from using the Service under applicable laws</li>
              <li>You must not have been previously banned from the Service</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            2. Medical & Health Disclaimer
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold', backgroundColor: '#fff3cd', p: 2, borderRadius: 1 }}>
            ⚠️ IMPORTANT MEDICAL DISCLAIMER: THE SERVICE IS NOT INTENDED TO BE A SUBSTITUTE FOR PROFESSIONAL 
            MEDICAL ADVICE, DIAGNOSIS, OR TREATMENT.
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Educational Purpose Only:</strong> All content, including AI-generated insights, is for informational and educational purposes only</li>
              <li><strong>Not Medical Advice:</strong> Never disregard professional medical advice or delay seeking it because of information from our Service</li>
              <li><strong>Healthcare Provider Consultation:</strong> Always consult qualified healthcare professionals for medical conditions, symptoms, or treatments</li>
              <li><strong>Emergency Situations:</strong> For medical emergencies, immediately call emergency services (911 in US) or go to the nearest emergency room</li>
              <li><strong>No Doctor-Patient Relationship:</strong> Use of the Service does not create a doctor-patient or therapist-client relationship</li>
              <li><strong>Individual Results Vary:</strong> Wellness suggestions are general; individual results and experiences will vary</li>
              <li><strong>Supplement Risks:</strong> Dietary supplements can interact with medications and have side effects. Consult healthcare providers before use</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            3. AI-Powered Features & Limitations
          </Typography>
          <Typography paragraph>
            Our Service uses artificial intelligence (AI) and machine learning (ML) technologies:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Probabilistic Nature:</strong> AI outputs are probabilistic predictions, not deterministic facts</li>
              <li><strong>Accuracy Limitations:</strong> AI may produce incorrect, outdated, or biased information</li>
              <li><strong>No Guarantee:</strong> We do not guarantee accuracy, completeness, or reliability of AI-generated content</li>
              <li><strong>Human Verification Required:</strong> Always verify AI suggestions with authoritative sources</li>
              <li><strong>Training Data:</strong> AI models are trained on datasets that may not reflect your specific circumstances</li>
              <li><strong>Continuous Improvement:</strong> Models are updated regularly; outputs may change over time</li>
              <li><strong>Your Responsibility:</strong> You are solely responsible for decisions based on AI outputs</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            4. User Accounts & Security
          </Typography>
          <Typography component="div" paragraph>
            <strong>Account Responsibilities:</strong>
            <ul>
              <li>Maintain accurate and current account information</li>
              <li>Protect account credentials (use strong, unique passwords)</li>
              <li>Enable two-factor authentication when available</li>
              <li>Immediately notify us of unauthorized access or security breaches</li>
              <li>Accept liability for all activities under your account</li>
              <li>Not share accounts or credentials with others</li>
              <li>Not create multiple accounts to circumvent restrictions</li>
            </ul>
          </Typography>
          <Typography paragraph>
            We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent 
            activity, or pose security risks. Account termination may result in loss of access to data and services.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            5. Subscriptions, Billing & Refunds
          </Typography>
          <Typography component="div" paragraph>
            <strong>Subscription Terms:</strong>
            <ul>
              <li><strong>Billing Cycles:</strong> Monthly or annual (prepaid), auto-renewing unless cancelled</li>
              <li><strong>Price Changes:</strong> 30-day notice for price increases; continued use constitutes acceptance</li>
              <li><strong>Payment Methods:</strong> Major credit cards, debit cards, and approved digital wallets</li>
              <li><strong>Failed Payments:</strong> Service suspension after 3 failed attempts; data retained for 30 days</li>
              <li><strong>Taxes:</strong> Prices exclude applicable taxes; you're responsible for all applicable taxes</li>
            </ul>
          </Typography>
          <Typography component="div" paragraph>
            <strong>Cancellation & Refunds:</strong>
            <ul>
              <li>Cancel anytime via account settings; access continues until billing period ends</li>
              <li>No prorated refunds for partial periods</li>
              <li>Annual plans: 14-day money-back guarantee from initial purchase</li>
              <li>Refunds for service issues evaluated case-by-case</li>
              <li>Chargebacks may result in immediate account termination</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            6. Prohibited Uses & Conduct
          </Typography>
          <Typography paragraph>
            You agree NOT to:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Provide false or misleading information</li>
              <li>Use the Service for unauthorized commercial purposes</li>
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated systems (bots, scrapers) without permission</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Circumvent usage limits or access restrictions</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Use the Service for illegal drug activities</li>
              <li>Impersonate others or misrepresent affiliation</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            7. Intellectual Property Rights
          </Typography>
          <Typography component="div" paragraph>
            <strong>Our Property:</strong>
            <ul>
              <li>All Service content, features, functionality, and AI models are owned by Cien Rios LLC or licensors</li>
              <li>Protected by copyright, trademark, trade secret, and other IP laws</li>
              <li>"Naturinex" and related logos are our trademarks</li>
              <li>No rights granted except as explicitly stated in these Terms</li>
            </ul>
          </Typography>
          <Typography component="div" paragraph>
            <strong>Your Content:</strong>
            <ul>
              <li>You retain ownership of content you submit</li>
              <li>You grant us a worldwide, royalty-free license to use, process, and display your content for Service operation</li>
              <li>You warrant that your content doesn't violate third-party rights</li>
              <li>We may remove content that violates these Terms or applicable laws</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            8. Limitation of Liability & Indemnification
          </Typography>
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW:
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND</li>
              <li>WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
              <li>WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>WE ARE NOT LIABLE FOR LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION</li>
              <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE PAST 12 MONTHS</li>
              <li>WE ARE NOT LIABLE FOR THIRD-PARTY ACTIONS OR CONTENT</li>
              <li>WE ARE NOT LIABLE FOR HEALTH OUTCOMES RESULTING FROM SERVICE USE</li>
            </ul>
          </Typography>
          <Typography paragraph>
            <strong>Indemnification:</strong> You agree to defend, indemnify, and hold harmless Cien Rios LLC, its officers, 
            directors, employees, and agents from any claims, damages, losses, and expenses (including attorney fees) arising 
            from your use of the Service, violation of these Terms, or infringement of any third-party rights.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            9. Privacy & Data Protection
          </Typography>
          <Typography paragraph>
            Your use of the Service is subject to our Privacy Policy. By using the Service, you consent to 
            data practices described in the Privacy Policy. We implement industry-standard security measures but 
            cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account.
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            10. Dispute Resolution & Governing Law
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Governing Law:</strong> These Terms are governed by the laws of the State of Florida, USA, without regard to conflict of law principles</li>
              <li><strong>Arbitration:</strong> Disputes shall be resolved through binding arbitration under AAA Commercial Arbitration Rules</li>
              <li><strong>Class Action Waiver:</strong> You waive the right to participate in class actions against us</li>
              <li><strong>Venue:</strong> Any legal proceedings shall be brought in Broward County, Florida</li>
              <li><strong>Limitation Period:</strong> Claims must be filed within one year of the event giving rise to the claim</li>
              <li><strong>Informal Resolution:</strong> Before formal proceedings, parties agree to attempt good-faith dispute resolution</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            11. Service Availability & Modifications
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Service provided with target 99.5% uptime but no guarantee of uninterrupted availability</li>
              <li>We may modify, suspend, or discontinue features with or without notice</li>
              <li>Scheduled maintenance communicated via email/in-app notifications</li>
              <li>No liability for Service unavailability or data loss due to factors beyond our control</li>
              <li>We reserve the right to impose usage limits to ensure Service quality</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            12. Termination
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li>Either party may terminate the agreement at any time</li>
              <li>We may terminate immediately for Terms violations or illegal activities</li>
              <li>Upon termination, your right to use the Service ceases immediately</li>
              <li>Certain provisions survive termination (IP rights, liability limitations, dispute resolution)</li>
              <li>We may retain anonymized data for analytics and service improvement</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            13. Changes to Terms
          </Typography>
          <Typography paragraph>
            We reserve the right to modify these Terms at any time. Material changes will be notified via email 
            and in-app notice at least 30 days before taking effect. Continued use after the effective date 
            constitutes acceptance. If you disagree with changes, you must discontinue use and may be eligible 
            for a prorated refund.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            14. Miscellaneous Provisions
          </Typography>
          <Typography component="div" paragraph>
            <ul>
              <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between parties</li>
              <li><strong>Severability:</strong> If any provision is invalid, other provisions remain in effect</li>
              <li><strong>No Waiver:</strong> Failure to enforce any right doesn't constitute waiver</li>
              <li><strong>Assignment:</strong> You may not assign rights; we may assign to successors</li>
              <li><strong>Force Majeure:</strong> No liability for delays due to circumstances beyond reasonable control</li>
              <li><strong>Export Compliance:</strong> You comply with all applicable export laws and regulations</li>
              <li><strong>Government Use:</strong> If government entity, additional terms may apply</li>
            </ul>
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            15. Contact Information
          </Typography>
          <Typography component="div" paragraph>
            <strong>Cien Rios LLC d/b/a Naturinex Wellness Guide</strong><br/>
            17113 Miramar Parkway<br/>
            Miramar, FL 33027<br/>
            United States<br/><br/>
            
            <strong>Customer Support:</strong> support@naturinex.com<br/>
            <strong>Legal Inquiries:</strong> legal@naturinex.com<br/>
            <strong>Phone:</strong> (754) 254-7141<br/>
            <strong>Business Hours:</strong> Monday-Friday, 9 AM - 5 PM EST<br/>
            <strong>Response Time:</strong> 1-2 business days<br/><br/>
            
            For DMCA copyright concerns, contact our designated agent at: dmca@naturinex.com
          </Typography>
          
          <Typography variant="caption" display="block" sx={{ mt: 4, fontStyle: 'italic' }}>
            By using Naturinex Wellness Guide, you acknowledge that you have read, understood, and agree to 
            be bound by these Terms of Service. These Terms were last reviewed by legal counsel and are 
            compliant with applicable US federal and state regulations.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default WebTerms;