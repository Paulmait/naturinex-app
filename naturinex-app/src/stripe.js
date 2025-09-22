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
      // Use the live key from config as last resort
      const fallbackKey = Constants.expoConfig?.extra?.stripePublishableKey || 
                         'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05';
      stripePromise = loadStripe(fallbackKey);
    }
  }
  return stripePromise;
};
export default getStripe;
