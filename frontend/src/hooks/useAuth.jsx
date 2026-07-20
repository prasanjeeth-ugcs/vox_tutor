import { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, apiPost } from '../services/api';

/**
 * AuthContext — Shared state that any component can read.
 *
 * It holds:
 *   user    — The logged-in user's info (null if not logged in)
 *   loading — True while we're checking if the user is logged in on page load
 *   login   — A function to set the user after sign-in
 *   logout  — A function to sign out and clear the user
 */
const AuthContext = createContext(null);

/**
 * AuthProvider — Wraps the whole app so every component can access user state.
 *
 * On first load, it checks our backend to see if the browser has a valid session
 * cookie. If yes, the user is automatically restored. If no, user stays null.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // True while checking session on page load

  // When the app first opens, ask the backend if there's a valid session cookie
  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      // The backend reads the cookie and returns the user if it's valid
      const data = await apiGet('/auth/me');
      setUser(data.user);
    } catch {
      // No valid session — user is not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // Called after a successful sign-in to store the user in state
  function login(userData) {
    setUser(userData);
  }

  // Called when the user clicks "Sign out" — clears the session cookie on the backend
  async function logout() {
    await apiPost('/auth/revoke');
    setUser(null);
  }

  // Provide the user, loading state, and auth functions to all child components
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — A hook to read user state from any component.
 *
 * Usage:
 *   const { user, logout } = useAuth();
 *
 * Throws an error if used outside of <AuthProvider> (helps catch bugs early).
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>. Check that App is wrapped correctly.');
  }
  return context;
}
