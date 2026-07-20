import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiGet } from '../services/api';
import InterviewPageClient from '../components/interview/InterviewPageClient';
import { Loader2 } from 'lucide-react';

export default function InterviewPage() {
  // Get the interview ID from the URL (e.g. /interview/abc123)
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the interview data when the page opens
  useEffect(() => {
    loadInterview();
  }, [id]);

  async function loadInterview() {
    try {
      // Fetch the interview record from the backend
      const data = await apiGet(`/interviews/${id}`);
      const interviewRecord = data.interview;

      // If the interview doesn't exist, go back to dashboard
      if (!interviewRecord) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // Security check: make sure this interview belongs to the current user
      if (interviewRecord.userId !== user.uid) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // If this interview is already done, go to the feedback page instead
      if (interviewRecord.status === 'completed') {
        navigate(`/interview/${id}/feedback`, { replace: true });
        return;
      }

      // If there are no questions, something went wrong — go back to dashboard
      if (!interviewRecord.questions || interviewRecord.questions.length === 0) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // All checks passed — save the interview to state
      setInterview(interviewRecord);

    } catch {
      // On any error (e.g. network failure), redirect to dashboard
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  // Show a spinner while loading
  if (loading || !interview) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-50">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  // Render the live interview UI, passing all the interview config as props
  return (
    <InterviewPageClient
      interviewId={interview.id}
      userId={user.uid}
      questions={interview.questions}
      domainId={interview.domain}
      difficulty={interview.difficulty}
      duration={interview.duration}
    />
  );
}
