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
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.web';
import { useNavigate } from 'react-router-dom';
import webConfig from '../../config/webConfig';

// Only load Stripe if properly configured
const stripePromise = webConfig.STRIPE_PUBLISHABLE_KEY &&
  webConfig.STRIPE_PUBLISHABLE_KEY !== 'your_stripe_publishable_key_here'
  ? loadStripe(webConfig.STRIPE_PUBLISHABLE_KEY)
  : null;
function CheckoutForm({ priceId, onSuccess }) {
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
        }),
      }).catch(err => {
        console.error('Network error:', err);
        throw new Error('Payment service is temporarily unavailable. Please try again later or contact support.');
      });

      const data = await response.json().catch(() => {
        throw new Error('Invalid response from payment service');
      });
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed');
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
            subscriptionType: 'premium',
            subscriptionStartDate: new Date().toISOString(),
            stripeCustomerId: data.customerId,
            stripeSubscriptionId: data.subscriptionId,
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
          'Subscribe for $9.99/month'
        )}
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        Your subscription will automatically renew each month.
        Cancel anytime from your profile.
      </Typography>
    </form>
  );
}
function WebPayment() {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const plans = {
    monthly: {
      name: 'Monthly Premium',
      price: '$9.99',
      period: '/month',
      priceId: 'price_monthly_premium',
      features: [
        'Unlimited scans',
        'Advanced wellness insights',
        'Natural alternatives database',
        'Interaction checker',
        'Priority support',
        'No ads',
      ],
    },
    yearly: {
      name: 'Yearly Premium',
      price: '$99.99',
      period: '/year',
      priceId: 'price_yearly_premium',
      savings: 'Save $20',
      features: [
        'Everything in Monthly',
        'Save 17%',
        'Early access to new features',
        'Premium wellness reports',
      ],
    },
  };
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
        Choose Your Plan
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Unlock premium features and take control of your wellness journey
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Object.entries(plans).map(([key, plan]) => (
          <Grid item xs={12} md={6} key={key}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedPlan === key ? '2px solid' : '1px solid',
                borderColor: selectedPlan === key ? 'primary.main' : 'grey.300',
                position: 'relative',
              }}
              onClick={() => setSelectedPlan(key)}
            >
              {plan.savings && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 20,
                    bgcolor: 'error.main',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                  }}
                >
                  {plan.savings}
                </Box>
              )}
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {plan.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                  <Typography variant="h3" fontWeight="bold" color="primary">
                    {plan.price}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {plan.period}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  {plan.features.map((feature, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      ✓ {feature}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
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
                Please check back later or contact support at support@naturinex.com.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                For administrators: Configure STRIPE_PUBLISHABLE_KEY in your environment variables.
              </Typography>
            </Alert>
          ) : (
            <Elements stripe={stripePromise}>
              <CheckoutForm priceId={plans[selectedPlan].priceId} />
            </Elements>
          )}
        </CardContent>
      </Card>
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Secure Payment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your payment information is encrypted and secure. We use Stripe for payment processing
          and never store your card details.
        </Typography>
      </Box>
    </Container>
  );
}
export default WebPayment;