import { Routes, Route } from 'react-router-dom';
import AuthLayout  from './layouts/AuthLayout';
import RootLayout  from './layouts/RootLayout';
import HomePage    from './pages/HomePage';
import SignInPage  from './pages/SignInPage';
import SignUpPage  from './pages/SignUpPage';
import DashboardPage  from './pages/DashboardPage';
import InterviewPage  from './pages/InterviewPage';
import FeedbackPage   from './pages/FeedbackPage';

/**
 * App — Defines all the URL routes in the application.
 *
 * Route structure:
 *
 *   /                         → HomePage        (public landing page)
 *
 *   AuthLayout (no auth required — redirects to dashboard if already logged in)
 *     /sign-in                → SignInPage
 *     /sign-up                → SignUpPage
 *
 *   RootLayout (protected — redirects to /sign-in if not logged in)
 *     /dashboard              → DashboardPage
 *     /interview/:id          → InterviewPage   (live voice interview)
 *     /interview/:id/feedback → FeedbackPage    (AI feedback report)
 *
 * Layout components (AuthLayout, RootLayout) use React Router's <Outlet />
 * to render the matching child route inside themselves.
 */
export default function App() {
  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<HomePage />} />

      {/* Auth pages (sign-in, sign-up) — wrapped in AuthLayout for the minimal navbar */}
      <Route element={<AuthLayout />}>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
      </Route>

      {/* Protected pages — wrapped in RootLayout which checks if the user is logged in */}
      <Route element={<RootLayout />}>
        <Route path="/dashboard"                   element={<DashboardPage />} />
        <Route path="/interview/:id"               element={<InterviewPage />} />
        <Route path="/interview/:id/feedback"      element={<FeedbackPage />} />
      </Route>
    </Routes>
  );
}
