import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.web';
import { useNavigate, useLocation } from 'react-router-dom';
import webConfig from '../../config/webConfig';
import { PRICING_TIERS } from '../../config/pricing';

// Only load Stripe if properly configured
const stripePromise = webConfig.STRIPE_PUBLISHABLE_KEY &&
  webConfig.STRIPE_PUBLISHABLE_KEY !== 'your_stripe_publishable_key_here'
  ? loadStripe(webConfig.STRIPE_PUBLISHABLE_KEY)
  : null;

function CheckoutForm({ tier, priceId, billingCycle, tierData, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const user = auth.currentUser;
  const navigate = useNavigate();
  const API_URL = webConfig.API_URL;

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setName(user.displayName || '');
    }
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch(`${API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          priceId,
          email,
          name,
          tier: tier.toLowerCase(),
          billingCycle,
        }),
      }).catch(err => {
        console.error('Network error:', err);
        throw new Error('Payment service is temporarily unavailable. Please try again later or contact support at guampaul@gmail.com');
      });

      const data = await response.json().catch(() => {
        throw new Error('Invalid response from payment service');
      });

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed. Please try again.');
      }

      // Confirm payment
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name,
            email,
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          setSucceeded(true);

          // Update user subscription in Firestore
          await updateDoc(doc(db, 'users', user.uid), {
            subscriptionType: tier.toLowerCase(),
            subscriptionStartDate: new Date().toISOString(),
            stripeCustomerId: data.customerId,
            stripeSubscriptionId: data.subscriptionId,
            billingCycle: billingCycle,
          });

          if (onSuccess) {
            onSuccess();
          } else {
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          }
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  const price = billingCycle === 'monthly' ? tierData.price.monthly : tierData.price.yearly;
  const period = billingCycle === 'monthly' ? 'month' : 'year';

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Card Details
          </Typography>
          <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <CardElement options={cardElementOptions} />
          </Box>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {succeeded && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Payment successful! Redirecting to dashboard...
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={!stripe || processing || succeeded}
        sx={{ mt: 3 }}
      >
        {processing ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          `Subscribe for $${price}/${period}`
        )}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        Your subscription will automatically renew each {period}.
        Cancel anytime from your subscription settings.
      </Typography>

      {/* Test card info */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          <strong>Test Mode:</strong> Use card 4242 4242 4242 4242, any future expiry, any CVC
        </Typography>
      </Alert>
    </form>
  );
}

function WebPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tier, setTier] = useState('');
  const [priceId, setPriceId] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [tierData, setTierData] = useState(null);

  useEffect(() => {
    // Get parameters from URL
    const searchParams = new URLSearchParams(location.search);
    const tierParam = searchParams.get('tier');
    const priceIdParam = searchParams.get('priceId');
    const billingCycleParam = searchParams.get('billingCycle');

    if (!tierParam || !priceIdParam) {
      // Redirect back to subscription page if missing params
      navigate('/subscription');
      return;
    }

    setTier(tierParam);
    setPriceId(priceIdParam);
    setBillingCycle(billingCycleParam || 'monthly');

    // Get tier data from pricing config
    const data = PRICING_TIERS[tierParam.toUpperCase()];
    if (data) {
      setTierData(data);
    }
  }, [location, navigate]);

  if (!tierData) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  const price = billingCycle === 'monthly' ? tierData.price.monthly : tierData.price.yearly;
  const period = billingCycle === 'monthly' ? 'month' : 'year';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Back Button */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/subscription')}
          variant="text"
          sx={{ color: 'text.secondary' }}
        >
          Back to Plans
        </Button>
      </Box>

      <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
        Complete Your Subscription
      </Typography>

      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        You're subscribing to {tierData.name}
      </Typography>

      {/* Plan Summary */}
      <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              {tierData.name}
            </Typography>
            <Chip label={billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} color="primary" />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
            <Typography variant="h3" fontWeight="bold" color="primary">
              ${price}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              /{period}
            </Typography>
          </Box>

          {billingCycle === 'yearly' && (
            <Chip label={`Save ${tier === 'PLUS' ? '$13.89' : '$26.89'}/year`} color="success" size="small" sx={{ mb: 2 }} />
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            What's included:
          </Typography>
          <Box>
            {tierData.benefits.map((benefit, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                ✓ {benefit}
              </Typography>
            ))}
          </Box>

          <Button
            variant="text"
            size="small"
            onClick={() => navigate('/subscription')}
            sx={{ mt: 2 }}
          >
            ← Change Plan
          </Button>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Details
          </Typography>

          {!webConfig.STRIPE_PUBLISHABLE_KEY || webConfig.STRIPE_PUBLISHABLE_KEY === 'your_stripe_publishable_key_here' ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Payment Processing Unavailable
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Our payment system is currently being set up. Stripe integration is not yet configured.
                Please check back later or contact support at guampaul@gmail.com.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                For administrators: Configure STRIPE_PUBLISHABLE_KEY in your environment variables.
              </Typography>
            </Alert>
          ) : (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                tier={tier}
                priceId={priceId}
                billingCycle={billingCycle}
                tierData={tierData}
              />
            </Elements>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          🔒 Secure Payment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your payment information is encrypted and secure. We use Stripe for payment processing
          and never store your card details. PCI-DSS Level 1 compliant.
        </Typography>
      </Box>
    </Container>
  );
}

export default WebPayment;
