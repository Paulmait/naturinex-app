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
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography paragraph>
            By using Naturinex Wellness Guide, you agree to be bound by these Terms of Service
            and all applicable laws and regulations.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            2. Medical Disclaimer
          </Typography>
          <Typography paragraph>
            Naturinex provides educational wellness information only. It is not a substitute for
            professional medical advice, diagnosis, or treatment. Always consult your healthcare
            provider with any questions about a medical condition.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            3. User Accounts
          </Typography>
          <Typography paragraph>
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activities that occur under your account.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            4. Subscription and Payments
          </Typography>
          <Typography paragraph>
            Premium subscriptions are billed monthly or annually. You may cancel your subscription
            at any time through your account settings.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            5. Intellectual Property
          </Typography>
          <Typography paragraph>
            All content and materials available through Naturinex are protected by intellectual
            property rights and remain the property of Naturinex or its licensors.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            6. Limitation of Liability
          </Typography>
          <Typography paragraph>
            Naturinex shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages resulting from your use or inability to use the service.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            7. Changes to Terms
          </Typography>
          <Typography paragraph>
            We reserve the right to modify these terms at any time. Continued use of the service
            after changes constitutes acceptance of the new terms.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            8. Contact Information
          </Typography>
          <Typography paragraph>
            For questions about these Terms of Service, please contact us at
            support@naturinex.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default WebTerms;