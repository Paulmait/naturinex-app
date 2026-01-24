import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.web';
import webConfig from '../../config/webConfig';
import { PRICING_TIERS } from '../../config/pricing';

function WebSubscription() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();
  const user = auth.currentUser;
  const API_URL = webConfig.API_URL;

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const response = await fetch(`${API_URL}/api/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          subscriptionId: userData.stripeSubscriptionId,
        }),
      });

      if (response.ok) {
        await updateDoc(doc(db, 'users', user.uid), {
          subscriptionType: 'free',
          subscriptionEndDate: new Date().toISOString(),
          stripeSubscriptionId: null,
        });
        await loadUserData();
        setCancelDialogOpen(false);
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const handleUpgrade = (tier) => {
    const priceId = billingCycle === 'monthly'
      ? PRICING_TIERS[tier].stripePriceIds.monthly
      : PRICING_TIERS[tier].stripePriceIds.yearly;

    navigate(`/payment?tier=${tier}&priceId=${priceId}&billingCycle=${billingCycle}`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  const currentTier = userData?.subscriptionType?.toUpperCase() || 'FREE';
  const isPremium = currentTier === 'PREMIUM' || currentTier === 'PLUS' || currentTier === 'PRO';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom align="center">
        Choose Your Plan
      </Typography>
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Unlock the full Naturinex experience
      </Typography>

      {/* Billing Cycle Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ToggleButtonGroup
          value={billingCycle}
          exclusive
          onChange={(e, value) => value && setBillingCycle(value)}
          aria-label="billing cycle"
        >
          <ToggleButton value="monthly" aria-label="monthly">
            Monthly
          </ToggleButton>
          <ToggleButton value="yearly" aria-label="yearly">
            Yearly
            <Chip
              label="Save 17%"
              size="small"
              color="success"
              sx={{ ml: 1 }}
            />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Plan Comparison - 2 columns */}
      <Grid container spacing={3} justifyContent="center">
        {/* Free Plan */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {PRICING_TIERS.FREE.name}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="text.secondary">
                $0
                <Typography component="span" variant="h6" color="text.secondary">
                  /month
                </Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                {PRICING_TIERS.FREE.description}
              </Typography>
              <List sx={{ mt: 3 }}>
                {PRICING_TIERS.FREE.benefits.map((feature, index) => (
                  <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              {currentTier === 'FREE' && (
                <Button
                  fullWidth
                  variant="outlined"
                  disabled
                  sx={{ mt: 3 }}
                >
                  Current Plan
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Premium Plan */}
        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              height: '100%',
              border: '2px solid',
              borderColor: 'primary.main',
              position: 'relative',
              overflow: 'visible',
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
              POPULAR
            </Box>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {PRICING_TIERS.PREMIUM.name}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                ${billingCycle === 'monthly' ? '9.99' : '99.99'}
                <Typography component="span" variant="h6" color="text.secondary">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </Typography>
              </Typography>
              {billingCycle === 'yearly' && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                  Save $19.89/year (2 months free!)
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                {PRICING_TIERS.PREMIUM.description}
              </Typography>
              <List sx={{ mt: 3 }}>
                {PRICING_TIERS.PREMIUM.benefits.map((feature, index) => (
                  <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              {isPremium ? (
                <Button
                  fullWidth
                  variant="contained"
                  disabled
                  sx={{ mt: 3 }}
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                  onClick={() => handleUpgrade('PREMIUM')}
                >
                  {PRICING_TIERS.PREMIUM.trialDays ? `Start ${PRICING_TIERS.PREMIUM.trialDays}-Day Free Trial` : 'Upgrade to Premium'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Plan Status */}
      {isPremium && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Current Plan
              </Typography>
              <Chip
                label="PREMIUM"
                color="success"
                icon={<Star />}
              />
            </Box>
            <Typography variant="body1" gutterBottom>
              You&apos;re enjoying all Premium features!
            </Typography>
            {userData?.subscriptionStartDate && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Next billing date: {new Date(userData.subscriptionStartDate).toLocaleDateString()}
              </Typography>
            )}
            <Button
              variant="outlined"
              color="error"
              size="small"
              sx={{ mt: 2 }}
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancel Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Special Offers */}
      {!isPremium && (
        <Card sx={{ mt: 4, background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Box sx={{ color: 'white' }}>
                <Typography variant="h6" fontWeight="bold">
                  7-Day Free Trial
                </Typography>
                <Typography variant="body2">
                  Try Premium free for 7 days. Cancel anytime.
                </Typography>
              </Box>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
                onClick={() => handleUpgrade('PREMIUM')}
              >
                Start Free Trial
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel your Premium subscription?
            You&apos;ll lose access to:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Unlimited scans" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Advanced AI analysis" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Export capabilities" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Priority support" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Keep Subscription
          </Button>
          <Button
            onClick={handleCancelSubscription}
            color="error"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={24} /> : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default WebSubscription;
