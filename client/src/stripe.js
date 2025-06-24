import { loadStripe } from '@stripe/stripe-js';

let stripePromise;

const getStripe = async () => {
  if (!stripePromise) {
    try {
      // Get the public key from our server
      const response = await fetch('http://localhost:5000/stripe-config');
      const { publicKey } = await response.json();
      stripePromise = loadStripe(publicKey);
    } catch (error) {
      console.error('Failed to load Stripe:', error);
      // Fallback to test key
      stripePromise = loadStripe('pk_test_51234567890abcdefghijklmnopqrstuvwxyz');
    }
  }
  return stripePromise;
};

export default getStripe;
