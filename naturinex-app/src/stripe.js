import { loadStripe } from '@stripe/stripe-js';
import Constants from 'expo-constants';
let stripePromise;
const getStripe = async () => {
  if (!stripePromise) {
    try {
      // Use the configured Stripe key from app.json
      const stripePublishableKey = Constants.expoConfig?.extra?.stripePublishableKey;
      if (stripePublishableKey) {
        stripePromise = loadStripe(stripePublishableKey);
      } else {
        // Get the public key from our server as fallback
        const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app-1.onrender.com';
        const response = await fetch(`${apiUrl}/stripe-config`);
        const { publicKey } = await response.json();
        stripePromise = loadStripe(publicKey);
      }
    } catch (error) {
      console.error('Failed to load Stripe:', error);
      // Fail gracefully - don't use hardcoded keys
      throw new Error('Stripe configuration missing. Please set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    }
  }
  return stripePromise;
};
export default getStripe;
