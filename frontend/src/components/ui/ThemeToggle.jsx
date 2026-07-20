import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Read the saved theme from localStorage, or fall back to system preference
function getInitialTheme() {
  const saved = localStorage.getItem('voxtutor-theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Apply the dark class to <html> directly — this is what CSS variables react to
function applyTheme(isDark) {
  const html = window.document.documentElement;
  if (isDark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  localStorage.setItem('voxtutor-theme', isDark ? 'dark' : 'light');
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialTheme);

  // Apply the theme whenever the state changes
  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Also apply on first mount in case the class isn't already set
  useEffect(() => {
    applyTheme(isDark);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => setIsDark(prev => !prev);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-xl text-ink-secondary hover:text-brand-600 hover:bg-brand-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
