/**
 * constants.js — App-wide configuration data.
 *
 * Contains the lists of domains, difficulty levels, and interview durations.
 * These are used across multiple pages (NewInterviewButton, InterviewCard, FeedbackPage).
 * Keeping them here avoids repeating the same data in multiple files.
 */

/**
 * DOMAINS — The interview topic areas a user can choose from.
 *
 * Each domain has:
 *   id          — Short string used as the key in the database
 *   label       — Human-readable name shown in the UI
 *   icon        — Emoji used as the visual icon
 *   description — Short subtitle shown in the selection grid
 *   color       — Brand color for the domain (used for icon backgrounds, charts)
 *   topics      — List of specific subjects the AI will ask about
 */
export const DOMAINS = [
  {
    id: 'software',
    label: 'Software Engineering',
    icon: '💻',
    description: 'System design, algorithms, architecture',
    color: '#6366f1',
    topics: ['System Design', 'Data Structures', 'Algorithms', 'Architecture', 'Code Quality'],
  },
  {
    id: 'finance',
    label: 'Finance & Banking',
    icon: '📈',
    description: 'Valuation, financial modeling, risk',
    color: '#10b981',
    topics: ['DCF Valuation', 'Financial Modeling', 'Risk Analysis', 'M&A', 'Capital Markets'],
  },
  {
    id: 'marketing',
    label: 'Marketing & Brand',
    icon: '🎯',
    description: 'Brand strategy, growth, analytics',
    color: '#f59e0b',
    topics: ['Brand Strategy', 'Digital Marketing', 'Growth', 'Analytics', 'Campaigns'],
  },
  {
    id: 'product',
    label: 'Product Management',
    icon: '🚀',
    description: 'Roadmaps, user research, metrics',
    color: '#ec4899',
    topics: ['Product Strategy', 'User Research', 'Roadmapping', 'Metrics', 'Prioritization'],
  },
  {
    id: 'data_science',
    label: 'Data Science & AI',
    icon: '🤖',
    description: 'ML models, statistics, AI products',
    color: '#8b5cf6',
    topics: ['Machine Learning', 'Statistics', 'Model Evaluation', 'Feature Engineering', 'Deep Learning'],
  },
  {
    id: 'consulting',
    label: 'Management Consulting',
    icon: '🏢',
    description: 'Case interviews, strategy, problem solving',
    color: '#f97316',
    topics: ['Case Analysis', 'Market Sizing', 'Strategy Frameworks', 'Operations', 'Problem Solving'],
  },
];

/**
 * DIFFICULTIES — Experience levels for the interview.
 *
 * Each level has:
 *   value       — Stored in the database (used as a key)
 *   label       — Shown in the UI button
 *   description — Subtitle shown under the label
 */
export const DIFFICULTIES = [
  { value: 'entry',  label: 'Entry Level', description: '0–2 years experience' },
  { value: 'mid',    label: 'Mid Level',   description: '2–5 years experience' },
  { value: 'senior', label: 'Senior',      description: '5+ years experience'  },
];

/**
 * DURATIONS — How long the interview will last.
 *
 * Each option has:
 *   value     — Duration in minutes (stored in the database)
 *   label     — Shown in the UI button (e.g. "10 min")
 *   questions — Approx number of questions generated for this length
 */
export const DURATIONS = [
  { value: 10, label: '10 min', questions: 3 },
  { value: 20, label: '20 min', questions: 5 },
  { value: 30, label: '30 min', questions: 7 },
];
