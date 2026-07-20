import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/ui/Navbar';
import { Loader2 } from 'lucide-react';

/**
 * RootLayout — The main layout wrapper for all protected pages (dashboard, interview, etc.).
 *
 * What it does:
 *   1. Waits for the auth state to finish loading (checking the session cookie).
 *   2. If the user is not logged in, redirects them to /sign-in.
 *   3. If logged in, renders the Navbar + the page content below it.
 *
 * <Outlet /> is where React Router renders the matched child route's component.
 * For example, if the URL is /dashboard, <DashboardPage /> is rendered inside <Outlet />.
 */
export default function RootLayout() {
  const { user, loading } = useAuth();

  // Step 1: Show a spinner while we're checking if the user is logged in
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  // Step 2: If no user is found, redirect to the sign-in page
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  // Step 3: User is logged in — show the app layout
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Sticky top navigation bar */}
      <Navbar />

      {/* Page content — padded down so it doesn't hide behind the fixed navbar */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
