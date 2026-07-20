import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { DOMAINS } from '../../lib/constants';
import { ChevronRight, Mic, CheckCircle, Clock } from 'lucide-react';

// Enable the "X minutes ago" format for dates
dayjs.extend(relativeTime);

// Maps a verdict string to a badge style class
const VERDICT_BADGE_CLASS = {
  'Strong Hire': 'badge-success',
  'Hire':        'badge-success',
  'Maybe':       'badge-warning',
  'No Hire':     'badge-danger',
};

// Returns the correct color class for a score number
function getScoreColorClass(score) {
  if (score >= 75) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
}

export default function InterviewCard({ interview, feedback }) {
  // Find the full domain object (icon, label, etc.) by the stored domain ID
  const domain = DOMAINS.find(d => d.id === interview.domain);

  // Decide which URL to link to: completed → feedback page, ongoing → interview room
  const linkDestination = interview.status === 'completed'
    ? `/interview/${interview.id}/feedback`
    : `/interview/${interview.id}`;

  return (
    <Link to={linkDestination} className="card-hover block p-5">

      {/* ─── Top row: domain + status icon ─── */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Domain icon circle */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${domain?.color}15` }}
          >
            {interview.domainIcon}
          </div>

          {/* Domain label + difficulty */}
          <div>
            <p className="font-semibold text-ink text-sm">{interview.domainLabel}</p>
            <p className="text-xs text-ink-muted capitalize">{interview.difficulty} level</p>
          </div>
        </div>

        {/* Green checkmark for completed, clock for in-progress */}
        {interview.status === 'completed' ? (
          <CheckCircle size={16} className="text-success mt-0.5" />
        ) : (
          <Clock size={16} className="text-ink-muted mt-0.5" />
        )}
      </div>

      {/* ─── Score and verdict (only shown if feedback exists) ─── */}
      {feedback ? (
        <div className="flex items-center justify-between mb-3">
          <span className={`text-2xl font-bold ${getScoreColorClass(feedback.overallScore)}`}>
            {feedback.overallScore}
            <span className="text-sm font-normal text-ink-muted">/100</span>
          </span>
          <span className={`badge ${VERDICT_BADGE_CLASS[feedback.verdict] ?? 'badge-brand'}`}>
            {feedback.verdict}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3">
          <Mic size={14} className="text-brand-500" />
          <span className="text-sm text-ink-secondary">
            {interview.status === 'pending' ? 'Ready to start' : 'In progress'}
          </span>
        </div>
      )}

      {/* ─── Footer: timestamp + arrow ─── */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-100">
        <span className="text-xs text-ink-muted">
          {dayjs(interview.createdAt).fromNow()}
        </span>
        <ChevronRight size={15} className="text-ink-muted" />
      </div>
    </Link>
  );
}
