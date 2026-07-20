import { Routes, Route } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import RootLayout from './layouts/RootLayout';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import InterviewPage from './pages/InterviewPage';
import FeedbackPage from './pages/FeedbackPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<RootLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/interview/:id/feedback" element={<FeedbackPage />} />
      </Route>
    </Routes>
  );
}
