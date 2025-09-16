// Modern Landing Page for Naturinex
// Clean, safe, and user-friendly natural medication alternative platform

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Alert,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  LocalHospital,
  CameraAlt,
  Search,
  CheckCircle,
  TrendingUp,
  Groups,
  VerifiedUser,
  Login,
  PersonAdd,
  Menu as MenuIcon,
  ExpandMore,
  Star,
  ArrowForward,
  Healing,
  Science,
  Psychology,
  Spa,
  FavoriteOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function WebHomeLanding() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Main features with natural alternatives focus
  const mainFeatures = [
    {
      icon: <Healing sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Natural Alternatives Finder',
      description: 'Discover safe, evidence-based natural alternatives to conventional medications',
      color: '#10B981',
    },
    {
      icon: <CameraAlt sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Medication Scanner',
      description: 'Scan any medication label to instantly find natural substitutes',
      color: '#3B82F6',
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI provides personalized recommendations based on your health profile',
      color: '#8B5CF6',
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Safety First',
      description: 'All recommendations verified by healthcare professionals and scientific research',
      color: '#F59E0B',
    },
  ];

  // How it works steps
  const howItWorks = [
    {
      step: '1',
      title: 'Scan or Search',
      description: 'Take a photo of your medication or type its name',
      icon: <Search />,
    },
    {
      step: '2',
      title: 'Get Alternatives',
      description: 'Receive instant natural alternatives with scientific backing',
      icon: <Spa />,
    },
    {
      step: '3',
      title: 'Compare & Choose',
      description: 'Compare effectiveness, safety, and cost of natural options',
      icon: <Science />,
    },
    {
      step: '4',
      title: 'Track Progress',
      description: 'Monitor your wellness journey with personalized insights',
      icon: <TrendingUp />,
    },
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Verified User',
      content: 'Found natural alternatives for my anxiety medication. Life-changing!',
      rating: 5,
    },
    {
      name: 'Dr. James L.',
      role: 'Naturopath',
      content: 'Finally, a platform that bridges conventional and natural medicine responsibly.',
      rating: 5,
    },
    {
      name: 'Maria K.',
      role: 'Premium Member',
      content: 'The AI recommendations are incredibly accurate and personalized.',
      rating: 5,
    },
  ];

  // FAQs
  const faqs = [
    {
      question: 'Is this medical advice?',
      answer: 'No. Naturinex provides educational information about natural alternatives. Always consult with healthcare professionals before making changes to your medication.',
    },
    {
      question: 'How accurate is the OCR scanning?',
      answer: 'Our advanced OCR technology has 99%+ accuracy for medication labels. You can always manually verify or edit the detected text.',
    },
    {
      question: 'Are the natural alternatives safe?',
      answer: 'All recommendations are based on peer-reviewed research and verified by healthcare professionals. We provide safety information and potential interactions.',
    },
    {
      question: 'How much does it cost?',
      answer: 'Start with 5 free scans per month. Upgrade to Plus ($6.99/mo) or Pro ($12.99/mo) for unlimited access and premium features.',
    },
  ];

  const handleQuickSearch = () => {
    if (searchQuery.trim()) {
      if (currentUser) {
        navigate(`/scan?query=${encodeURIComponent(searchQuery)}`);
      } else {
        navigate(`/login?redirect=/scan&query=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Spa sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography
              variant="h6"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              Naturinex
            </Typography>
            <Chip
              label="BETA"
              size="small"
              color="secondary"
              sx={{ ml: 1 }}
            />
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Button
                color="inherit"
                onClick={() => navigate('#features')}
                sx={{ color: 'text.primary' }}
              >
                Features
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('#how-it-works')}
                sx={{ color: 'text.primary' }}
              >
                How It Works
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/pricing')}
                sx={{ color: 'text.primary' }}
              >
                Pricing
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('#faq')}
                sx={{ color: 'text.primary' }}
              >
                FAQ
              </Button>
            </Box>
          )}

          {/* Auth Buttons */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {currentUser ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/dashboard')}
                  startIcon={<LocalHospital />}
                >
                  Dashboard
                </Button>
                <Avatar
                  sx={{ width: 36, height: 36, cursor: 'pointer' }}
                  onClick={() => navigate('/profile')}
                >
                  {currentUser.email?.[0]?.toUpperCase()}
                </Avatar>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate('/login')}
                  sx={{ color: 'text.primary', display: { xs: 'none', sm: 'inline-flex' } }}
                  startIcon={<Login />}
                >
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/login?mode=signup')}
                  startIcon={<PersonAdd />}
                >
                  Sign Up Free
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            {isMobile && (
              <IconButton
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                sx={{ color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Fade in timeout={1000}>
              <Box>
                <Chip
                  label="🌿 Natural Health Revolution"
                  color="success"
                  sx={{ mb: 2 }}
                />
                <Typography
                  variant={isMobile ? 'h3' : 'h2'}
                  fontWeight="bold"
                  gutterBottom
                  sx={{
                    background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Discover Natural Alternatives to Any Medication
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 4 }}
                >
                  Scan medication labels instantly and get science-backed natural alternatives.
                  Join thousands switching to safer, natural solutions.
                </Typography>

                {/* Quick Search */}
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Enter medication name (e.g., Aspirin, Ibuprofen)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="contained"
                          onClick={handleQuickSearch}
                          disabled={!searchQuery.trim()}
                        >
                          Search
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    onClick={() => navigate(currentUser ? '/scan' : '/login')}
                    startIcon={<CameraAlt />}
                    sx={{ py: 1.5 }}
                  >
                    Scan Medication Now
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('#how-it-works')}
                    sx={{ py: 1.5 }}
                  >
                    Learn More
                  </Button>
                </Box>

                {/* Trust Indicators */}
                <Box sx={{ display: 'flex', gap: 3, mt: 4, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" />
                    <Typography variant="body2">5 Free Scans/Month</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUser color="primary" />
                    <Typography variant="body2">Doctor Verified</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Groups color="secondary" />
                    <Typography variant="body2">10,000+ Users</Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          </Grid>

          <Grid item xs={12} md={6}>
            <Fade in timeout={1500}>
              <Box
                sx={{
                  position: 'relative',
                  textAlign: 'center',
                }}
              >
                <img
                  src="/assets/app-mockup.png"
                  alt="Naturinex App"
                  style={{
                    width: '100%',
                    maxWidth: 500,
                    height: 'auto',
                    borderRadius: 16,
                  }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="600" viewBox="0 0 500 600"%3E%3Crect width="500" height="600" fill="%23f0f0f0"/%3E%3Ctext x="250" y="300" font-family="Arial" font-size="20" fill="%23999" text-anchor="middle"%3EApp Preview%3C/text%3E%3C/svg%3E';
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'white',
                    borderRadius: 2,
                    p: 2,
                    boxShadow: 3,
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                  }}
                >
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <CameraAlt />
                  </Avatar>
                  <Box textAlign="left">
                    <Typography variant="subtitle2">Instant Scanning</Typography>
                    <Typography variant="caption" color="text.secondary">
                      99% Accuracy with OCR
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box id="features" sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
            Everything You Need for Natural Wellness
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Comprehensive features to support your natural health journey
          </Typography>

          <Grid container spacing={3}>
            {mainFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: `${feature.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box id="how-it-works" sx={{ py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
            How Naturinex Works
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Four simple steps to natural wellness
          </Typography>

          <Grid container spacing={3}>
            {howItWorks.map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      fontSize: 24,
                      fontWeight: 'bold',
                    }}
                  >
                    {step.step}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                  {index < howItWorks.length - 1 && !isMobile && (
                    <ArrowForward
                      sx={{
                        position: 'absolute',
                        right: -20,
                        top: 60,
                        color: 'grey.400',
                      }}
                    />
                  )}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
            Trusted by Thousands
          </Typography>
          <Typography
            variant="h6"
            align="center"
            sx={{ mb: 6, opacity: 0.9 }}
          >
            Real stories from real users
          </Typography>

          <Grid container spacing={3}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    p: 3,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} sx={{ color: '#FFC107' }} />
                    ))}
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    "{testimonial.content}"
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {testimonial.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {testimonial.role}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box id="faq" sx={{ py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h3" align="center" fontWeight="bold" gutterBottom>
            Frequently Asked Questions
          </Typography>
          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Everything you need to know about Naturinex
          </Typography>

          {faqs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Start Your Natural Wellness Journey Today
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Join thousands discovering safer, natural alternatives
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={() => navigate('/login?mode=signup')}
              startIcon={<FavoriteOutlined />}
              sx={{ py: 2, px: 4 }}
            >
              Start Free (5 Scans)
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/pricing')}
              sx={{ py: 2, px: 4 }}
            >
              View Pricing
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 4, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="body2">
              <strong>Medical Disclaimer:</strong> Naturinex provides educational information only.
              Always consult healthcare professionals before changing medications.
            </Typography>
          </Alert>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Spa />
                <Typography variant="h6" fontWeight="bold">
                  Naturinex
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Your trusted companion for natural medication alternatives
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/privacy')}
                    sx={{ opacity: 0.8 }}
                  >
                    Privacy Policy
                  </Button>
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/terms')}
                    sx={{ opacity: 0.8 }}
                  >
                    Terms of Service
                  </Button>
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <Button
                    color="inherit"
                    onClick={() => navigate('/contact')}
                    sx={{ opacity: 0.8 }}
                  >
                    Contact Support
                  </Button>
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Download App
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                Available on iOS and Android
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <img
                  src="/assets/app-store.png"
                  alt="App Store"
                  style={{ height: 40 }}
                  onError={(e) => e.target.style.display = 'none'}
                />
                <img
                  src="/assets/google-play.png"
                  alt="Google Play"
                  style={{ height: 40 }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </Box>
            </Grid>
          </Grid>
          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)', opacity: 0.6 }}
          >
            © 2025 Naturinex. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}