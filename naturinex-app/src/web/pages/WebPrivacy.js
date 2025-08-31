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
          Last updated: {new Date().toLocaleDateString()}
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography paragraph>
            We collect information you provide directly to us, such as when you create an account,
            scan products, or contact us for support.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            2. How We Use Your Information
          </Typography>
          <Typography paragraph>
            We use the information we collect to provide, maintain, and improve our services,
            process transactions, and communicate with you.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            3. Data Security
          </Typography>
          <Typography paragraph>
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            4. Data Sharing
          </Typography>
          <Typography paragraph>
            We do not sell, trade, or otherwise transfer your personal information to third parties
            without your consent, except as described in this policy.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            5. Your Rights
          </Typography>
          <Typography paragraph>
            You have the right to access, update, or delete your personal information at any time
            through your account settings.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            6. Contact Us
          </Typography>
          <Typography paragraph>
            If you have any questions about this Privacy Policy, please contact us at
            support@naturinex.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default WebPrivacy;