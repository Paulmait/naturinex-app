// One-Click Subscription Cancellation Component
// Provides easy cancellation with retention offers

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  Cancel,
  CheckCircle,
  LocalOffer,
  Timer,
  Warning,
} from '@mui/icons-material';
import subscriptionManager from '../services/subscriptionManager';
import { useAuth } from '../contexts/AuthContext';

export default function SubscriptionCancellation({ subscription, onCancel, onClose }) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState('confirm'); // confirm, reason, offer, processing, complete
  const [cancellationReason, setCancellationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retentionOffer, setRetentionOffer] = useState(null);

  const reasons = [
    { value: 'too_expensive', label: 'Too expensive' },
    { value: 'not_using', label: 'Not using enough' },
    { value: 'missing_features', label: 'Missing features I need' },
    { value: 'found_alternative', label: 'Found a better alternative' },
    { value: 'technical_issues', label: 'Too many technical issues' },
    { value: 'other', label: 'Other reason' },
  ];

  // Handle initial cancellation click
  const handleCancelClick = () => {
    if (!cancellationReason) {
      setError('Please select a reason for cancellation');
      return;
    }

    // Check for retention offer based on reason
    const offer = getRetentionOffer(cancellationReason);
    if (offer) {
      setRetentionOffer(offer);
      setStep('offer');
    } else {
      processCancellation();
    }
  };

  // Get personalized retention offer
  const getRetentionOffer = (reason) => {
    switch (reason) {
      case 'too_expensive':
        return {
          type: 'discount',
          title: '50% Off for 3 Months!',
          description: 'We value you as a customer. Stay with us for 50% off your next 3 months.',
          value: 50,
          duration: 3,
          code: 'STAY50',
        };

      case 'not_using':
        return {
          type: 'pause',
          title: 'Pause Instead of Cancel',
          description: 'Take a break! Pause your subscription for up to 3 months and come back when you\'re ready.',
          duration: 3,
        };

      case 'missing_features':
        return {
          type: 'upgrade',
          title: 'Free Pro Upgrade!',
          description: 'Get our Pro plan at your current price for the next 2 months.',
          tier: 'pro',
          duration: 2,
        };

      default:
        return null;
    }
  };

  // Accept retention offer
  const acceptOffer = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/subscription/apply-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripeId,
          offer: retentionOffer,
        }),
      });

      if (response.ok) {
        setStep('complete');
        if (onClose) onClose('offer_accepted');
      } else {
        throw new Error('Failed to apply offer');
      }
    } catch (err) {
      setError('Unable to apply offer. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  // Process cancellation
  const processCancellation = async () => {
    setStep('processing');
    setLoading(true);
    setError('');

    try {
      const result = await subscriptionManager.cancelSubscription();

      if (result.canceled) {
        setStep('complete');
        if (onCancel) onCancel(result);
      } else {
        throw new Error(result.error || 'Cancellation failed');
      }
    } catch (err) {
      setError(err.message);
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  // Render based on current step
  const renderContent = () => {
    switch (step) {
      case 'confirm':
        return (
          <>
            <Alert severity="warning" sx={{ mb: 3 }}>
              You're about to cancel your {subscription.tier} subscription.
              You'll lose access to premium features on {new Date(subscription.expiresAt).toLocaleDateString()}.
            </Alert>

            <Typography variant="subtitle1" gutterBottom>
              Why are you canceling?
            </Typography>

            <RadioGroup
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            >
              {reasons.map(reason => (
                <FormControlLabel
                  key={reason.value}
                  value={reason.value}
                  control={<Radio />}
                  label={reason.label}
                />
              ))}
            </RadioGroup>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
              Your feedback helps us improve Naturinex for everyone.
            </Typography>
          </>
        );

      case 'offer':
        return (
          <>
            <Box textAlign="center" mb={3}>
              <LocalOffer color="primary" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                {retentionOffer.title}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {retentionOffer.description}
              </Typography>
            </Box>

            <Card sx={{ bgcolor: 'primary.light', color: 'white', mb: 3 }}>
              <CardContent>
                {retentionOffer.type === 'discount' && (
                  <>
                    <Typography variant="h3" align="center">
                      {retentionOffer.value}% OFF
                    </Typography>
                    <Typography align="center">
                      for the next {retentionOffer.duration} months
                    </Typography>
                  </>
                )}

                {retentionOffer.type === 'pause' && (
                  <>
                    <Timer sx={{ fontSize: 40, display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography variant="h6" align="center">
                      Pause for up to {retentionOffer.duration} months
                    </Typography>
                    <Typography variant="body2" align="center">
                      No charges during pause period
                    </Typography>
                  </>
                )}

                {retentionOffer.type === 'upgrade' && (
                  <>
                    <Typography variant="h6" align="center">
                      Get {retentionOffer.tier.toUpperCase()} features
                    </Typography>
                    <Typography align="center">
                      at your current price for {retentionOffer.duration} months!
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={acceptOffer}
                disabled={loading}
              >
                Accept Offer & Stay
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={processCancellation}
                disabled={loading}
              >
                No Thanks, Cancel
              </Button>
            </Box>
          </>
        );

      case 'processing':
        return (
          <Box textAlign="center" py={4}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6">
              Processing your cancellation...
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This will just take a moment
            </Typography>
          </Box>
        );

      case 'complete':
        return (
          <Box textAlign="center">
            <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Cancellation Complete
            </Typography>

            <Alert severity="info" sx={{ mt: 3, mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                What happens next:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>You'll keep access until {new Date(subscription.expiresAt).toLocaleDateString()}</li>
                <li>No more charges to your card</li>
                <li>Your data will be saved for 90 days</li>
                <li>You can resubscribe anytime</li>
              </ul>
            </Alert>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" color="textSecondary" gutterBottom>
              Changed your mind?
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={() => subscriptionManager.reactivateSubscription()}
            >
              Reactivate Subscription
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={true}
      onClose={() => onClose && onClose('closed')}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Cancel color="error" />
          <Typography variant="h6">
            {step === 'complete' ? 'Cancellation Complete' : 'Cancel Subscription'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {renderContent()}
      </DialogContent>

      {step !== 'processing' && step !== 'complete' && (
        <DialogActions>
          <Button onClick={() => onClose && onClose('closed')}>
            Keep Subscription
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelClick}
            disabled={loading || !cancellationReason}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {step === 'offer' ? 'No Thanks, Cancel' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      )}

      {step === 'complete' && (
        <DialogActions>
          <Button onClick={() => onClose && onClose('completed')} variant="contained">
            Done
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}