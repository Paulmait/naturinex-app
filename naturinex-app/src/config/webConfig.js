// Web-specific configuration
const webConfig = {
  API_URL: process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com',
  STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_KEY || 'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05',
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w",
    authDomain: "naturinex-app.firebaseapp.com",
    projectId: "naturinex-app",
    storageBucket: "naturinex-app.firebasestorage.app",
    messagingSenderId: "398613963385",
    appId: "1:398613963385:web:91b3c8e67976c252f0aaa8",
    measurementId: "G-04VE09YVEC"
  }
};

export default webConfig;