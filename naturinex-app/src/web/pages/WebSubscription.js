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
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// Firebase auth imported from firebase.web
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.web';
import webConfig from '../../config/webConfig';

function WebSubscription() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  
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

  const premiumFeatures = [
    'Unlimited product scans',
    'Advanced wellness insights',
    'Natural alternatives database',
    'Drug interaction checker',
    'Personalized recommendations',
    'Priority customer support',
    'Export scan history',
    'No advertisements',
  ];

  const freeFeatures = [
    '5 scans per day',
    'Basic wellness information',
    'Save scan history',
    'Community support',
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  const isPremium = userData?.subscriptionType === 'premium';

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
              label={isPremium ? 'PREMIUM' : 'FREE'}
              color={isPremium ? 'success' : 'default'}
              icon={isPremium ? <Star /> : undefined}
            />
          </Box>
          
          {isPremium ? (
            <Box>
              <Typography variant="body1" gutterBottom>
                You&apos;re enjoying all premium features!
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
                Upgrade to Premium for unlimited access
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => navigate('/payment')}
              >
                Upgrade to Premium
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Free Plan
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="text.secondary">
                $0
                <Typography component="span" variant="h6" color="text.secondary">
                  /month
                </Typography>
              </Typography>
              
              <List sx={{ mt: 3 }}>
                {freeFeatures.map((feature, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
              
              {!isPremium && (
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
        
        <Grid item xs={12} md={6}>
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
              RECOMMENDED
            </Box>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Premium Plan
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                $9.99
                <Typography component="span" variant="h6" color="text.secondary">
                  /month
                </Typography>
              </Typography>
              
              <List sx={{ mt: 3 }}>
                {premiumFeatures.map((feature, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemIcon>
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
                  onClick={() => navigate('/payment')}
                >
                  Upgrade Now
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                onClick={() => navigate('/payment')}
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
            Are you sure you want to cancel your premium subscription?
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
              <ListItemText primary="Advanced wellness insights" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Cancel color="error" />
              </ListItemIcon>
              <ListItemText primary="Natural alternatives database" />
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