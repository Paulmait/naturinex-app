/**
 * Payment Method Manager Component
 * Secure payment method management with PCI compliance
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import {
  CreditCard,
  Delete,
  Edit,
  Add,
  Star,
  StarBorder,
  Security,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { supabase } from '../config/supabase';
import subscriptionManager from '../services/subscriptionManager';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const PaymentMethodManager = ({ userId, onPaymentMethodUpdate }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addMethodDialogOpen, setAddMethodDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    if (userId) {
      loadPaymentMethods();
    }
  }, [userId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      setError('Failed to load payment methods');
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      // First, unset all existing defaults
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set the selected method as default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update Stripe default payment method
      await updateStripeDefaultPaymentMethod(paymentMethodId);

      await loadPaymentMethods();
      if (onPaymentMethodUpdate) onPaymentMethodUpdate();
    } catch (error) {
      setError('Failed to set default payment method');
      console.error('Error setting default payment method:', error);
    }
  };

  const updateStripeDefaultPaymentMethod = async (paymentMethodId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/set-default-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await subscriptionManager.getAuthToken()}`
        },
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        throw new Error('Failed to update default payment method in Stripe');
      }
    } catch (error) {
      console.error('Error updating Stripe default payment method:', error);
      throw error;
    }
  };

  const handleDeletePaymentMethod = async () => {
    if (!selectedMethod) return;

    try {
      // Delete from Stripe first
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/delete-payment-method`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await subscriptionManager.getAuthToken()}`
        },
        body: JSON.stringify({ paymentMethodId: selectedMethod.stripe_payment_method_id })
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method from Stripe');
      }

      // Delete from our database
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', selectedMethod.id)
        .eq('user_id', userId);

      if (error) throw error;

      setDeleteDialogOpen(false);
      setSelectedMethod(null);
      await loadPaymentMethods();
      if (onPaymentMethodUpdate) onPaymentMethodUpdate();
    } catch (error) {
      setError('Failed to delete payment method');
      console.error('Error deleting payment method:', error);
    }
  };

  const getCardBrandIcon = (brand) => {
    // You can replace these with actual card brand icons
    const brandIcons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      diners: '💳',
      jcb: '💳',
      unionpay: '💳'
    };
    return brandIcons[brand?.toLowerCase()] || '💳';
  };

  const formatExpiryDate = (month, year) => {
    return `${month?.toString().padStart(2, '0')}/${year?.toString().slice(-2)}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CreditCard />
              Payment Methods
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddMethodDialogOpen(true)}
            >
              Add Payment Method
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <Security sx={{ verticalAlign: 'middle', mr: 1 }} />
              All payment information is securely processed by Stripe. We never store your card details.
            </Typography>
          </Alert>

          {paymentMethods.length > 0 ? (
            <List>
              {paymentMethods.map((method, index) => (
                <React.Fragment key={method.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Typography fontSize="1.5rem">
                        {getCardBrandIcon(method.card_brand)}
                      </Typography>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {method.card_brand?.toUpperCase()} ****{method.card_last4}
                          </Typography>
                          {method.is_default && (
                            <Chip
                              label="Default"
                              color="primary"
                              size="small"
                              icon={<Star />}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Expires {formatExpiryDate(method.card_exp_month, method.card_exp_year)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Added {new Date(method.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!method.is_default && (
                          <Tooltip title="Set as default">
                            <IconButton
                              edge="end"
                              onClick={() => handleSetDefault(method.id)}
                              size="small"
                            >
                              <StarBorder />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete payment method">
                          <IconButton
                            edge="end"
                            onClick={() => {
                              setSelectedMethod(method);
                              setDeleteDialogOpen(true);
                            }}
                            size="small"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < paymentMethods.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CreditCard sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Payment Methods
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add a payment method to manage your subscription
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddMethodDialogOpen(true)}
              >
                Add Your First Payment Method
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={addMethodDialogOpen} onClose={() => setAddMethodDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Elements stripe={stripePromise}>
            <AddPaymentMethodForm
              userId={userId}
              onSuccess={() => {
                setAddMethodDialogOpen(false);
                loadPaymentMethods();
                if (onPaymentMethodUpdate) onPaymentMethodUpdate();
              }}
              onError={setError}
            />
          </Elements>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Payment Method</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this payment method?
          </Typography>
          {selectedMethod && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                {selectedMethod.card_brand?.toUpperCase()} ****{selectedMethod.card_last4}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expires {formatExpiryDate(selectedMethod.card_exp_month, selectedMethod.card_exp_year)}
              </Typography>
            </Box>
          )}
          {selectedMethod?.is_default && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This is your default payment method. You may want to set another method as default before deleting this one.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeletePaymentMethod} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Separate component for adding payment methods
const AddPaymentMethodForm = ({ userId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(true);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);

      // Create setup intent
      const setupIntentResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await subscriptionManager.getAuthToken()}`
        }
      });

      if (!setupIntentResponse.ok) {
        throw new Error('Failed to create setup intent');
      }

      const { client_secret } = await setupIntentResponse.json();

      // Confirm setup intent with payment method
      const { error, setupIntent } = await stripe.confirmCardSetup(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Customer Name', // You might want to get this from user profile
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Save payment method to database
      await savePaymentMethod(setupIntent.payment_method, setAsDefault);

      onSuccess();
    } catch (error) {
      onError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const savePaymentMethod = async (paymentMethod, isDefault) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/save-payment-method`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await subscriptionManager.getAuthToken()}`
      },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        setAsDefault: isDefault
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save payment method');
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
    },
    hidePostalCode: false,
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Card Information
        </Typography>
        <CardElement options={cardElementOptions} />
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={setAsDefault}
            onChange={(e) => setSetAsDefault(e.target.checked)}
          />
        }
        label="Set as default payment method"
        sx={{ mb: 2 }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Your card will be securely processed by Stripe. No charges will be made until your next billing cycle.
        </Typography>
      </Alert>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || processing}
          startIcon={processing ? <CircularProgress size={16} /> : <CreditCard />}
        >
          {processing ? 'Adding...' : 'Add Payment Method'}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentMethodManager;