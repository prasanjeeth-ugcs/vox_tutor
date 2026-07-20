import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * ThemeToggle — A button that switches the app between light and dark mode.
 *
 * How it works:
 *   1. On load, reads the saved preference from localStorage (or the system preference).
 *   2. Adds/removes the CSS class "dark" from the <html> element.
 *   3. Our index.css has rules like `html.dark .bg-surface { ... }` that respond to this class.
 *   4. Saves the user's choice in localStorage so it persists on the next visit.
 */

/**
 * getInitialTheme — Reads the saved theme preference.
 *
 * Priority order:
 *   1. If the user previously chose a theme, use that.
 *   2. Otherwise, use the system's dark/light preference.
 */
function getInitialTheme() {
  // Check if the user has manually selected a theme before
  const savedTheme = localStorage.getItem('voxtutor-theme');
  if (savedTheme) {
    return savedTheme === 'dark';
  }

  // No saved preference — fall back to the OS/browser preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * applyTheme — Adds or removes the "dark" class from the <html> element.
 * Also saves the current preference to localStorage.
 */
function applyTheme(isDark) {
  const htmlElement = window.document.documentElement;

  if (isDark) {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }

  // Persist the choice so the correct theme loads on the next visit
  localStorage.setItem('voxtutor-theme', isDark ? 'dark' : 'light');
}

export default function ThemeToggle() {
  // Initialize state using the saved/system preference
  const [isDark, setIsDark] = useState(getInitialTheme);

  // Apply the theme whenever isDark changes (e.g. user clicks the button)
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Also apply on first render — ensures the class is set before the page paints
  useEffect(() => {
    applyTheme(isDark);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Flip isDark when the button is clicked
  function handleToggle() {
    setIsDark(previousValue => !previousValue);
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-xl text-ink-secondary hover:text-brand-600 hover:bg-brand-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Show sun icon in dark mode (click to go light), moon in light mode (click to go dark) */}
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
