import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  LocalHospital,
  Security,
  Speed,
  CheckCircle,
} from '@mui/icons-material';

function WebHome() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <LocalHospital fontSize="large" />,
      title: 'Wellness Insights',
      description: 'Get comprehensive wellness information and natural alternatives',
    },
    {
      icon: <Speed fontSize="large" />,
      title: 'Quick Scanning',
      description: 'Scan product labels instantly with your camera or upload images',
    },
    {
      icon: <Security fontSize="large" />,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and never shared',
    },
    {
      icon: <CheckCircle fontSize="large" />,
      title: 'Expert Verified',
      description: 'Information reviewed by healthcare professionals',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                fontWeight="bold"
                gutterBottom
              >
                Your Personal Wellness Guide
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
                Discover natural wellness alternatives and make informed health decisions
                with AI-powered product analysis
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'grey.100',
                    },
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/assets/hero-image.png"
                alt="Naturinex App"
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
          Why Choose Naturinex?
        </Typography>
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 6 }}
        >
          Professional wellness guidance at your fingertips
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pricing Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
            Simple, Transparent Pricing
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Free
                </Typography>
                <Typography variant="h2" fontWeight="bold" color="primary">
                  $0
                  <Typography component="span" variant="h6" color="text.secondary">
                    /month
                  </Typography>
                </Typography>
                <Box sx={{ my: 3 }}>
                  <Typography>✓ 5 scans per day</Typography>
                  <Typography>✓ Basic wellness information</Typography>
                  <Typography>✓ Save scan history</Typography>
                </Box>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Start Free
                </Button>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  p: 4,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 20,
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                  }}
                >
                  MOST POPULAR
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Premium
                </Typography>
                <Typography variant="h2" fontWeight="bold" color="primary">
                  $9.99
                  <Typography component="span" variant="h6" color="text.secondary">
                    /month
                  </Typography>
                </Typography>
                <Box sx={{ my: 3 }}>
                  <Typography>✓ Unlimited scans</Typography>
                  <Typography>✓ Advanced wellness insights</Typography>
                  <Typography>✓ Natural alternatives</Typography>
                  <Typography>✓ Interaction checker</Typography>
                  <Typography>✓ Priority support</Typography>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Start Premium
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4, px: 2 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Naturinex
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Your trusted wellness companion
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Legal
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate('/privacy')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Privacy Policy
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate('/terms')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Terms of Service
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Contact
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                support@naturinex.com
              </Typography>
            </Grid>
          </Grid>
          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}
          >
            © 2024 Naturinex. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default WebHome;