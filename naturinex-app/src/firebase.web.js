// Re-export from the web-specific config with auth already initialized
import { auth, db, app } from './config/firebase.web.js';
import { GoogleAuthProvider } from "firebase/auth";

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

// Export the already initialized auth instance
export { auth, db, provider, app };
export default app;