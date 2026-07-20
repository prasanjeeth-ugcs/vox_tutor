import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiGet } from '../services/api';
import InterviewPageClient from '../components/interview/InterviewPageClient';
import { Loader2 } from 'lucide-react';

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(`/interviews/${id}`)
      .then(data => {
        const iv = data.interview;
        if (!iv || iv.userId !== user.uid) {
          navigate('/dashboard', { replace: true });
          return;
        }
        if (iv.status === 'completed') {
          navigate(`/interview/${id}/feedback`, { replace: true });
          return;
        }
        if (!iv.questions || !iv.questions.length) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setInterview(iv);
      })
      .catch(() => navigate('/dashboard', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, user.uid, navigate]);

  if (loading || !interview) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-50">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

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
