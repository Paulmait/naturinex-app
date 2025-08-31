// Re-export from the web-specific config
import { auth, db, app } from './config/firebase.web.js';
import { GoogleAuthProvider } from "firebase/auth";

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

export { auth, db, provider, app };
export default app;