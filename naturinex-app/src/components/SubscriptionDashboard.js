/**
 * Subscription Management Dashboard
 * Comprehensive subscription management with billing history, payment methods, and usage tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  CreditCard,
  Receipt,
  Download,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Cancel,
  Refresh,
  Settings,
  TrendingUp,
  Calendar,
  Dollar
} from '@mui/icons-material';
import { supabase } from '../config/supabase';
import subscriptionManager from '../services/subscriptionManager';
import { stripeWebhookService } from '../services/StripeWebhookService';

const SubscriptionDashboard = ({ userId, userProfile }) => {
  const [subscription, setSubscription] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] = useState(false);
  const [billingDetailsDialogOpen, setBillingDetailsDialogOpen] = useState(false);

  // Form states
  const [cancellationReason, setCancellationReason] = useState('');
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  useEffect(() => {
    if (userId) {
      loadSubscriptionData();
    }
  }, [userId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSubscription(),
        loadBillingHistory(),
        loadPaymentMethods(),
        loadInvoices(),
        loadUsageData()
      ]);
    } catch (error) {
      setError('Failed to load subscription data');
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    const sub = await subscriptionManager.loadSubscription();
    setSubscription(sub);
  };

  const loadBillingHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBillingHistory(data || []);
    } catch (error) {
      console.error('Error loading billing history:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const loadUsageData = async () => {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process usage data
      const usage = {
        scans: data?.filter(d => d.action === 'scan').length || 0,
        aiAnalyses: data?.filter(d => d.action === 'ai_analysis').length || 0,
        exports: data?.filter(d => d.action === 'export').length || 0,
        consultations: data?.filter(d => d.action === 'consultation').length || 0
      };

      setUsageData(usage);
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const result = await subscriptionManager.cancelSubscription();

      if (result.canceled) {
        setCancelDialogOpen(false);
        await loadSubscription();
        setError('');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      const result = await subscriptionManager.reactivateSubscription();

      if (result.reactivated) {
        await loadSubscription();
        setError('');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to reactivate subscription');
    }
  };

  const handleUpdatePaymentMethod = async () => {
    // This would typically redirect to Stripe's hosted page or open Stripe Elements
    const checkoutUrl = `${process.env.REACT_APP_API_URL}/api/create-billing-portal-session`;

    try {
      const response = await fetch(checkoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await subscriptionManager.getAuthToken()}`
        },
        body: JSON.stringify({
          customerId: userProfile?.stripe_customer_id,
          returnUrl: window.location.href
        })
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        setError('Failed to open billing portal');
      }
    } catch (error) {
      setError('Failed to update payment method');
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/download-invoice/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${await subscriptionManager.getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download invoice');
      }
    } catch (error) {
      setError('Failed to download invoice');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'trialing': return 'info';
      case 'past_due': return 'warning';
      case 'canceled': return 'error';
      case 'incomplete': return 'warning';
      default: return 'default';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Loading subscription data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings />
        Subscription Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Subscription Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CreditCard />
                Current Subscription
              </Typography>

              {subscription ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
                      {subscription.tier}
                    </Typography>
                    <Chip
                      label={subscription.status}
                      color={getStatusColor(subscription.status)}
                      variant="outlined"
                    />
                  </Box>

                  {subscription.expiresAt && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {subscription.status === 'canceled' ? 'Access until' : 'Next billing'}: {formatDate(subscription.expiresAt)}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {subscription.status === 'active' || subscription.status === 'trialing' ? (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => setCancelDialogOpen(true)}
                        size="small"
                      >
                        Cancel Subscription
                      </Button>
                    ) : subscription.status === 'canceled' && subscription.expiresAt > new Date() ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleReactivateSubscription}
                        size="small"
                      >
                        Reactivate
                      </Button>
                    ) : null}

                    <Button
                      variant="outlined"
                      onClick={handleUpdatePaymentMethod}
                      size="small"
                    >
                      Manage Payment
                    </Button>
                  </Box>
                </>
              ) : (
                <Typography>No active subscription</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Summary Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp />
                Usage This Month
              </Typography>

              {usageData ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Scans</Typography>
                    <Typography variant="h6">{usageData.scans}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">AI Analyses</Typography>
                    <Typography variant="h6">{usageData.aiAnalyses}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Exports</Typography>
                    <Typography variant="h6">{usageData.exports}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Consultations</Typography>
                    <Typography variant="h6">{usageData.consultations}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">No usage data available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Methods */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Payment Methods</Typography>
                <Button
                  variant="outlined"
                  onClick={() => setPaymentMethodDialogOpen(true)}
                  size="small"
                >
                  Add Payment Method
                </Button>
              </Box>

              {paymentMethods.length > 0 ? (
                <List>
                  {paymentMethods.map((method) => (
                    <ListItem key={method.id} divider>
                      <ListItemIcon>
                        <CreditCard />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${method.card_brand?.toUpperCase()} ****${method.card_last4}`}
                        secondary={`Expires ${method.card_exp_month}/${method.card_exp_year}`}
                      />
                      {method.is_default && (
                        <Chip label="Default" color="primary" size="small" />
                      )}
                      <IconButton size="small" color="error">
                        <Delete />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No payment methods on file</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Billing History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt />
                Billing History
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingHistory.length > 0 ? (
                      billingHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.created_at)}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{formatCurrency(item.amount, item.currency)}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.status}
                              color={item.status === 'paid' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item.invoice_id && (
                              <Tooltip title="Download Invoice">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadInvoice(item.invoice_id)}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary">No billing history</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Invoices */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Invoices
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Period</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoice_number}</TableCell>
                          <TableCell>{formatDate(invoice.created_at)}</TableCell>
                          <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.status}
                              color={invoice.status === 'paid' ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {invoice.period_start && invoice.period_end ? (
                              `${formatDate(invoice.period_start)} - ${formatDate(invoice.period_end)}`
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadInvoice(invoice.stripe_invoice_id)}
                              >
                                <Download />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary">No invoices available</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cancellation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Reason for cancellation</InputLabel>
            <Select
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              label="Reason for cancellation"
            >
              <MenuItem value="too_expensive">Too expensive</MenuItem>
              <MenuItem value="not_using">Not using enough</MenuItem>
              <MenuItem value="found_alternative">Found alternative</MenuItem>
              <MenuItem value="technical_issues">Technical issues</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Subscription</Button>
          <Button onClick={handleCancelSubscription} color="error" variant="contained">
            Cancel Subscription
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={paymentMethodDialogOpen} onClose={() => setPaymentMethodDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            You'll be redirected to our secure payment portal to add a new payment method.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentMethodDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdatePaymentMethod} variant="contained">
            Continue to Payment Portal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionDashboard;