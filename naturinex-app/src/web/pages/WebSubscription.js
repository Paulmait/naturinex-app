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
  const isPremium = currentTier === 'PLUS' || currentTier === 'PRO';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Subscription & Billing
      </Typography>

      {/* Current Plan */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Current Plan
            </Typography>
            <Chip
              label={currentTier}
              color={isPremium ? 'success' : 'default'}
              icon={isPremium ? <Star /> : undefined}
            />
          </Box>
          {isPremium ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                You&apos;re enjoying all {PRICING_TIERS[currentTier].name} features!
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Next billing date: {new Date(userData.subscriptionStartDate).toLocaleDateString()}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                sx={{ mt: 2 }}
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Subscription
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" gutterBottom>
                Upgrade to unlock premium features
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

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

      {/* Plan Comparison */}
      <Grid container spacing={3}>
        {/* Free Plan */}
        <Grid item xs={12} md={4}>
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

        {/* Plus Plan */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
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
              POPULAR
            </Box>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {PRICING_TIERS.PLUS.name}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                ${billingCycle === 'monthly' ? '6.99' : '69.99'}
                <Typography component="span" variant="h6" color="text.secondary">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </Typography>
              </Typography>
              {billingCycle === 'yearly' && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                  Save $13.89/year
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                {PRICING_TIERS.PLUS.description}
              </Typography>
              <List sx={{ mt: 3 }}>
                {PRICING_TIERS.PLUS.benefits.map((feature, index) => (
                  <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              {currentTier === 'PLUS' ? (
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
                  onClick={() => handleUpgrade('PLUS')}
                >
                  Upgrade to Plus
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pro Plan */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {PRICING_TIERS.PRO.name}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="secondary">
                ${billingCycle === 'monthly' ? '12.99' : '129.99'}
                <Typography component="span" variant="h6" color="text.secondary">
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </Typography>
              </Typography>
              {billingCycle === 'yearly' && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                  Save $26.89/year
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                {PRICING_TIERS.PRO.description}
              </Typography>
              <List sx={{ mt: 3 }}>
                {PRICING_TIERS.PRO.benefits.map((feature, index) => (
                  <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircle color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              {currentTier === 'PRO' ? (
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  disabled
                  sx={{ mt: 3 }}
                >
                  Current Plan
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  sx={{ mt: 3 }}
                  onClick={() => handleUpgrade('PRO')}
                >
                  Upgrade to Pro
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Special Offers */}
      {!isPremium && (
        <Card sx={{ mt: 4, background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Box sx={{ color: 'white' }}>
                <Typography variant="h6" fontWeight="bold">
                  Limited Time Offer!
                </Typography>
                <Typography variant="body2">
                  Get 20% off your first month with code WELLNESS20
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
                onClick={() => handleUpgrade('PLUS')}
              >
                Claim Offer
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
            Are you sure you want to cancel your {PRICING_TIERS[currentTier]?.name} subscription?
            You&apos;ll lose access to:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary={currentTier === 'PRO' ? 'Unlimited scans' : '100 scans per month'} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Advanced wellness insights" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Export capabilities" />
            </ListItem>
            {currentTier === 'PRO' && (
              <>
                <ListItem>
                  <ListItemIcon>
                    <Cancel color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Family sharing (5 accounts)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Cancel color="error" />
                  </ListItemIcon>
                  <ListItemText primary="2 consultations per month" />
                </ListItem>
              </>
            )}
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
