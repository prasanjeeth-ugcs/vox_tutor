import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Sign the user out and redirect to the sign-in page
  async function handleSignOut() {
    await logout();
    navigate('/sign-in');
  }

  // Don't render the navbar if no one is logged in
  if (!user) return null;

  // Check if the current page is the dashboard (to highlight the nav link)
  const isOnDashboard = pathname === '/dashboard';

  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 bg-surface border-b border-surface-200 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">

        {/* ─── Brand logo (links to dashboard) ─── */}
        <Link to="/dashboard" className="font-semibold text-lg tracking-tight text-ink">
          Vox<span className="text-brand-600">Tutor</span>
        </Link>

        {/* ─── Navigation links ─── */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isOnDashboard
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-100'
            }`}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
        </div>

        {/* ─── Right side: theme toggle + user info + sign out ─── */}
        <div className="flex items-center gap-3">

          {/* Light/dark mode toggle button */}
          <ThemeToggle />

          {/* User's avatar and name */}
          <div className="hidden sm:flex items-center gap-2">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              // If no photo, show the first letter of their name in a circle
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-ink">{user.name.split(' ')[0]}</span>
          </div>

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="btn-ghost text-ink-secondary gap-1.5 text-sm"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
