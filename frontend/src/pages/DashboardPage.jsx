import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiGet } from '../services/api';
import { Plus, Mic, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import NewInterviewButton from '../components/dashboard/NewInterviewButton';
import InterviewCard from '../components/dashboard/InterviewCard';

export default function DashboardPage() {
  const { user } = useAuth();

  // State for the list of interviews and their feedback
  const [interviews, setInterviews] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch interviews and feedback when the page loads
  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Fetch both at the same time to save loading time
      const [interviewData, feedbackData] = await Promise.all([
        apiGet('/interviews'),
        apiGet('/feedback/user'),
      ]);

      setInterviews(interviewData.interviews || []);
      setFeedbacks(feedbackData.feedbacks || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Show a loading state while data is being fetched
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-ink-muted">Loading your dashboard...</p>
      </div>
    );
  }

  // ─── Calculate stats from the loaded data ─────────────────────────

  // Count interviews that are fully done
  const completedCount = interviews.filter(i => i.status === 'completed').length;

  // Calculate the average score across all feedbacks
  const averageScore = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum, f) => sum + f.overallScore, 0) / feedbacks.length)
    : null;

  // Count how many unique domains the user has practiced
  const uniqueDomains = new Set(interviews.map(i => i.domain)).size;

  // Build a quick lookup: { interviewId -> feedback } for easy access in cards
  const feedbackByInterviewId = {};
  for (const feedback of feedbacks) {
    feedbackByInterviewId[feedback.interviewId] = feedback;
  }

  // ─── Stats cards data ──────────────────────────────────────────────
  const stats = [
    { label: 'Total sessions',    value: interviews.length,                     icon: Mic        },
    { label: 'Completed',         value: completedCount,                         icon: CheckCircle },
    { label: 'Avg score',         value: averageScore ? `${averageScore}/100` : '—', icon: BarChart2  },
    { label: 'Domains practiced', value: uniqueDomains,                          icon: Clock       },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      {/* ─── Page header ─── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-ink-secondary text-sm mt-1">
            {interviews.length === 0
              ? 'Start your first mock interview below.'
              : `You've completed ${completedCount} interview${completedCount !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <NewInterviewButton userId={user.uid} />
      </div>

      {/* ─── Stats row ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-ink-muted font-medium uppercase tracking-wide">{label}</p>
              <Icon size={15} className="text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* ─── Interviews list ─── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink">Your interviews</h2>
      </div>

      {/* Show an empty state when no interviews exist yet */}
      {interviews.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Mic size={28} className="text-brand-500" />
          </div>
          <h3 className="font-semibold text-ink mb-2">No interviews yet</h3>
          <p className="text-sm text-ink-secondary mb-6 max-w-xs mx-auto">
            Pick a domain, set your level, and start your first AI voice interview.
          </p>
          <NewInterviewButton userId={user.uid} />
        </div>
      ) : (
        // Show a grid of interview cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map(interview => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              feedback={feedbackByInterviewId[interview.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
