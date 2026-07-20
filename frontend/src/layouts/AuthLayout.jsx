import { Link, Outlet } from 'react-router-dom';
import ThemeToggle from '../components/ui/ThemeToggle';

/**
 * AuthLayout — The layout wrapper for sign-in and sign-up pages.
 *
 * Structure:
 *   - A minimal navbar at the top with just the logo and theme toggle
 *   - Centered content area where the auth form is rendered
 *
 * <Outlet /> is where React Router renders the current auth page
 * (either <SignInPage /> or <SignUpPage />).
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">

      {/* ─── Minimal top navbar (logo + theme toggle only) ─── */}
      <nav className="h-16 flex items-center justify-between px-8 border-b border-surface-200 bg-surface transition-colors duration-300">
        {/* Logo links back to the landing page */}
        <Link to="/" className="font-semibold text-lg tracking-tight text-ink">
          Vox<span className="text-brand-600">Tutor</span>
        </Link>

        {/* Light/dark mode toggle */}
        <ThemeToggle />
      </nav>

      {/* ─── Centered form area ─── */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Outlet />
      </div>
    </div>
  );
}
