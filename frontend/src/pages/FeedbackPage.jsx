import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiGet } from '../services/api';
import { DOMAINS } from '../lib/constants';
import ScoreRing from '../components/common/ScoreRing';
import { CheckCircle, AlertCircle, XCircle, ArrowLeft, RotateCcw, TrendingUp, Loader2 } from 'lucide-react';

// Maps a verdict string to its icon and color styling
const VERDICT_CONFIG = {
  'Strong Hire': { colorClass: 'text-success', icon: CheckCircle, bgClass: 'bg-emerald-50 border-emerald-200' },
  'Hire':        { colorClass: 'text-success', icon: CheckCircle, bgClass: 'bg-emerald-50 border-emerald-200' },
  'Maybe':       { colorClass: 'text-warning',  icon: AlertCircle, bgClass: 'bg-amber-50 border-amber-200'   },
  'No Hire':     { colorClass: 'text-danger',   icon: XCircle,     bgClass: 'bg-red-50 border-red-200'       },
};

// Maps a category rating to a text color
const RATING_COLOR = {
  excellent: 'text-success',
  good:      'text-brand-600',
  average:   'text-warning',
  poor:      'text-danger',
};

// Returns a progress bar color based on score
function getBarColor(score) {
  if (score >= 75) return 'bg-success';
  if (score >= 50) return 'bg-warning';
  return 'bg-danger';
}

export default function FeedbackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [interview, setInterview] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load both interview and feedback data when the page opens
  useEffect(() => {
    loadFeedbackData();
  }, [id]);

  async function loadFeedbackData() {
    try {
      // Fetch interview and feedback at the same time to save loading time
      const [interviewData, feedbackData] = await Promise.all([
        apiGet(`/interviews/${id}`),
        apiGet(`/feedback/${id}`),
      ]);

      // Security check: make sure this interview belongs to the logged-in user
      if (!interviewData.interview || interviewData.interview.userId !== user.uid) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setInterview(interviewData.interview);
      setFeedback(feedbackData.feedback);

    } catch {
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  // Show a loading spinner while fetching data
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <Loader2 size={28} className="animate-spin text-brand-500 mx-auto mb-4" />
        <p className="text-ink-muted">Loading feedback...</p>
      </div>
    );
  }

  // If the interview record failed to load, render nothing
  if (!interview) return null;

  // Find the domain info (icon, label) for this interview
  const domain = DOMAINS.find(d => d.id === interview.domain);

  // If feedback is not ready yet (still being generated), show a waiting message
  if (!feedback) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-ink-secondary mb-4">Feedback is still being generated...</p>
        <Link to="/dashboard" className="btn-secondary">← Back to dashboard</Link>
      </div>
    );
  }

  // Get the verdict styling (icon, color, background) for this feedback result
  const verdictStyle = VERDICT_CONFIG[feedback.verdict] ?? VERDICT_CONFIG['Maybe'];
  const VerdictIcon = verdictStyle.icon;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* ─── Back button ─── */}
      <Link to="/dashboard" className="btn-ghost gap-1.5 mb-6 -ml-1 text-ink-muted">
        <ArrowLeft size={15} /> Dashboard
      </Link>

      {/* ─── Page title ─── */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-3xl">{domain?.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-ink">Feedback Report</h1>
          <p className="text-sm text-ink-muted capitalize">{interview.domainLabel} · {interview.difficulty} level</p>
        </div>
      </div>

      {/* ─── Overall score card ─── */}
      <div className="card p-8 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-8">

          {/* Big score ring */}
          <ScoreRing score={feedback.overallScore} size={110} />

          {/* Verdict + summary */}
          <div className="flex-1 text-center md:text-left">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold mb-3 ${verdictStyle.bgClass} ${verdictStyle.colorClass}`}>
              <VerdictIcon size={16} />
              {feedback.verdict}
            </div>
            <p className="text-ink-secondary leading-relaxed">{feedback.summary}</p>
          </div>

          {/* Small per-category score rings */}
          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            {feedback.categories.map(category => (
              <div key={category.name} className="flex flex-col items-center gap-1">
                <ScoreRing score={category.score} size={56} />
                <p className="text-xs text-ink-muted text-center leading-tight w-16">
                  {category.name.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Per-category breakdown ─── */}
      <h2 className="font-semibold text-ink mb-4">Detailed breakdown</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {feedback.categories.map(category => {
          const barColor = getBarColor(category.score);
          const scoreWidth = `${category.score}%`;

          return (
            <div key={category.name} className="card p-5">
              {/* Category name + score */}
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-ink">{category.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold capitalize ${RATING_COLOR[category.rating]}`}>
                    {category.rating}
                  </span>
                  <span className="font-bold text-ink">{category.score}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-surface-200 rounded-full mb-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-700`}
                  style={{ width: scoreWidth }}
                />
              </div>

              {/* Feedback text for this category */}
              <p className="text-sm text-ink-secondary leading-relaxed">{category.feedback}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Strengths & improvements ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Strengths */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-success" /> Strengths
          </h3>
          <ul className="space-y-2.5">
            {feedback.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-ink-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to improve */}
        <div className="card p-5">
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-warning" /> Areas to improve
          </h3>
          <ul className="space-y-2.5">
            {feedback.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-ink-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 flex-shrink-0" />
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── Next steps ─── */}
      <div className="card p-6 mb-8">
        <h3 className="font-semibold text-ink mb-4">Recommended next steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feedback.nextSteps.map((step, index) => (
            <div key={index} className="bg-brand-50 rounded-2xl p-4">
              <div className="text-brand-600 font-bold text-lg mb-2">0{index + 1}</div>
              <p className="text-sm text-ink-secondary leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Interview transcript (only shown if it exists) ─── */}
      {interview.transcript && interview.transcript.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="font-semibold text-ink mb-4">Interview transcript</h3>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {interview.transcript.map((entry, index) => (
              <div key={index} className="flex gap-2 text-sm">
                <span className={`font-semibold flex-shrink-0 ${entry.role === 'interviewer' ? 'text-brand-600' : 'text-ink'}`}>
                  {entry.role === 'interviewer' ? 'Alex:' : 'You:'}
                </span>
                <span className="text-ink-secondary leading-relaxed">{entry.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Action buttons ─── */}
      <div className="flex items-center justify-center gap-4">
        <Link to="/dashboard" className="btn-secondary gap-2">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <Link to="/dashboard" className="btn-primary gap-2">
          <RotateCcw size={16} /> Practice again
        </Link>
      </div>
    </div>
  );
}
