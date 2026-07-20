import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { apiPost } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

/**
 * AuthForm — Handles both sign-in and sign-up in one component.
 *
 * Props:
 *   mode — Either "sign-in" or "sign-up"
 *
 * The sign-in/sign-up flow:
 *   1. User enters credentials (or clicks Google)
 *   2. Firebase verifies the credentials
 *   3. We send the Firebase ID token to our backend to create a session cookie
 *   4. We save/update the user's profile in our MongoDB database
 *   5. We update the React auth state so the app knows the user is logged in
 *   6. We redirect to the dashboard
 */
export default function AuthForm({ mode }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Determines which form variant to show
  const isSignUp = mode === 'sign-up';

  // Form field values
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  /**
   * onAuthSuccess — Called after any successful Firebase sign-in (email or Google).
   *
   * Steps:
   *   1. Send the Firebase ID token to our backend → it creates a session cookie
   *   2. Save/update the user's profile in MongoDB
   *   3. Update local React state so the app knows we're logged in
   *   4. Redirect to the dashboard
   */
  async function onAuthSuccess(idToken, uid, displayName, userEmail, photoURL) {
    // Step 1: Exchange the Firebase token for our backend session cookie
    await apiPost('/auth/session', { idToken });

    // Step 2: Save or update the user's profile in our database
    await apiPost('/auth/upsert-user', { uid, name: displayName, email: userEmail, photoURL });

    // Step 3: Tell React that the user is now logged in
    login({ uid, name: displayName, email: userEmail, photoURL });

    // Step 4: Redirect to the main app
    navigate('/dashboard');
  }

  /**
   * handleEmailSubmit — Handles sign-in or sign-up with email and password.
   */
  async function handleEmailSubmit(event) {
    event.preventDefault(); // Prevent the browser from refreshing the page
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // ── Sign Up ─────────────────────────────────────────────
        // Step 1: Create the new user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Step 2: Set their display name in Firebase
        await updateProfile(userCredential.user, { displayName: name });

        // Step 3: Get the ID token and complete the login flow
        const idToken = await userCredential.user.getIdToken();
        await onAuthSuccess(idToken, userCredential.user.uid, name, email);

      } else {
        // ── Sign In ─────────────────────────────────────────────
        // Step 1: Verify their credentials with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Step 2: Get the ID token and complete the login flow
        const idToken = await userCredential.user.getIdToken();
        await onAuthSuccess(
          idToken,
          userCredential.user.uid,
          userCredential.user.displayName ?? email,
          email,
          userCredential.user.photoURL ?? undefined
        );
      }

    } catch (firebaseError) {
      // Map Firebase error codes to user-friendly messages
      const errorCode = firebaseError?.code ?? '';

      if (errorCode.includes('email-already')) {
        setError('Email already in use. Sign in instead.');
      } else if (errorCode.includes('wrong-password') || errorCode.includes('invalid-credential')) {
        setError('Incorrect email or password.');
      } else if (errorCode.includes('user-not-found')) {
        setError('No account found. Sign up instead.');
      } else if (errorCode.includes('weak-password')) {
        setError('Password must be at least 6 characters.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * handleGoogleSignIn — Opens the Google OAuth popup and signs the user in.
   */
  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);

    try {
      // Step 1: Open the Google sign-in popup
      const googleProvider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, googleProvider);

      // Step 2: Get the ID token and complete the login flow
      const idToken = await userCredential.user.getIdToken();
      await onAuthSuccess(
        idToken,
        userCredential.user.uid,
        userCredential.user.displayName ?? '',
        userCredential.user.email ?? '',
        userCredential.user.photoURL ?? undefined
      );
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8">

        {/* ─── Title ─── */}
        <h1 className="text-2xl font-bold text-ink mb-1">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-ink-secondary mb-6">
          {isSignUp ? 'Start practicing interviews for free.' : 'Sign in to continue your prep.'}
        </p>

        {/* ─── Google sign-in button ─── */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn-secondary w-full mb-4 gap-3"
        >
          {/* Google logo SVG (4 coloured paths = the G icon) */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* ─── Divider ─── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 divider" />
          <span className="text-xs text-ink-muted">or</span>
          <div className="flex-1 divider" />
        </div>

        {/* ─── Email & password form ─── */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">

          {/* Name field — only shown on sign-up */}
          {isSignUp && (
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password field with show/hide toggle */}
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
              />
              {/* Toggle to show or hide the password */}
              <button
                type="button"
                onClick={() => setShowPassword(previousValue => !previousValue)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message (shown only when an error occurred) */}
          {error && (
            <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* ─── Switch between sign-in and sign-up ─── */}
        <p className="text-center text-sm text-ink-secondary mt-5">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            to={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-brand-600 font-medium hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
  );
}
