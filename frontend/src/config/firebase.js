import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Firebase Client SDK — Used in the frontend for user authentication.
 *
 * All keys come from .env variables (VITE_FIREBASE_*).
 * These are public keys — it's safe to expose them in the browser.
 * Security is enforced through Firebase Security Rules, not by hiding these keys.
 */
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize the Firebase app only once.
// getApps() returns all already-initialized apps — if one exists, reuse it.
// This prevents "duplicate app" errors if this file is imported multiple times.
const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// Export the Auth service (used for sign-in, sign-up, Google login, etc.)
export const auth = getAuth(firebaseApp);

export default firebaseApp;
