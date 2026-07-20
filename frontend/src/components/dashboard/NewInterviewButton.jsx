import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { DOMAINS, DIFFICULTIES, DURATIONS } from '../../lib/constants';
import { apiPost } from '../../services/api';

export default function NewInterviewButton({ userId }) {
  const navigate = useNavigate();

  // Controls whether the modal is open or closed
  const [open,    setOpen]    = useState(false);
  // Step 1 = pick domain, Step 2 = pick difficulty & duration
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // The user's selections
  const [domainId,   setDomainId]   = useState('');
  const [difficulty, setDifficulty] = useState('mid');
  const [duration,   setDuration]   = useState(20);

  // Find the full domain object from the selected ID
  const selectedDomain = DOMAINS.find(d => d.id === domainId);

  // Starts the interview setup: generates questions, creates the interview, navigates
  async function handleStart() {
    if (!selectedDomain) return;
    setLoading(true);
    setError('');

    try {
      // Step 1: Find how many questions to generate based on the chosen duration
      const durationConfig = DURATIONS.find(d => d.value === duration);
      const numberOfQuestions = durationConfig?.questions ?? 5;

      // Step 2: Ask our backend (which uses Gemini AI) to generate interview questions
      const generatedQuestions = await apiPost('/vapi/generate', {
        domain:       selectedDomain.id,
        domainLabel:  selectedDomain.label,
        difficulty,
        topics:       selectedDomain.topics,
        numQuestions: numberOfQuestions,
      });

      // Step 3: Save the new interview to the database
      const createdInterview = await apiPost('/interviews', {
        userId,
        domain:      selectedDomain.id,
        domainLabel: selectedDomain.label,
        domainIcon:  selectedDomain.icon,
        difficulty,
        duration,
        questions:   generatedQuestions.questions,
      });

      // Step 4: Close the modal and navigate to the interview room
      closeModal();
      navigate(`/interview/${createdInterview.interview.id}`);

    } catch (error) {
      setError(error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Resets all state and closes the modal
  function closeModal() {
    setOpen(false);
    setStep(1);
    setDomainId('');
    setError('');
  }

  return (
    <>
      {/* Button that opens the modal */}
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus size={16} /> New interview
      </button>

      {/* Modal — only shown when open is true */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-up border border-surface-200">

            {/* ─── Modal header ─── */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-surface-100">
              <div>
                <h2 className="font-bold text-ink text-lg">New Interview</h2>
                {/* Step progress indicator (two small bars) */}
                <div className="flex gap-1 mt-2">
                  {[1, 2].map(stepNumber => (
                    <div
                      key={stepNumber}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        stepNumber <= step ? 'bg-brand-600 w-8' : 'bg-surface-200 w-4'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button onClick={closeModal} className="btn-ghost p-2 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">

              {/* ─── Step 1: Pick a domain ─── */}
              {step === 1 && (
                <>
                  <p className="label mb-4">What are you interviewing for?</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {DOMAINS.map(domain => (
                      <button
                        key={domain.id}
                        onClick={() => setDomainId(domain.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all hover:border-brand-300 ${
                          domainId === domain.id
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-surface-200 bg-surface'
                        }`}
                      >
                        <div className="text-2xl mb-2">{domain.icon}</div>
                        <div className="font-medium text-sm text-ink leading-snug">{domain.label}</div>
                        <div className="text-xs text-ink-muted mt-0.5">{domain.description}</div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!domainId}
                    className="btn-primary w-full gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                </>
              )}

              {/* ─── Step 2: Pick difficulty & duration ─── */}
              {step === 2 && (
                <>
                  {/* Difficulty selector */}
                  <div className="mb-5">
                    <p className="label mb-3">Your experience level</p>
                    <div className="grid grid-cols-3 gap-2">
                      {DIFFICULTIES.map(level => (
                        <button
                          key={level.value}
                          onClick={() => setDifficulty(level.value)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            difficulty === level.value
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-surface-200 hover:border-brand-200'
                          }`}
                        >
                          <div className="font-semibold text-sm text-ink">{level.label}</div>
                          <div className="text-xs text-ink-muted mt-0.5">{level.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration selector */}
                  <div className="mb-5">
                    <p className="label mb-3">Interview duration</p>
                    <div className="grid grid-cols-3 gap-2">
                      {DURATIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => setDuration(option.value)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            duration === option.value
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-surface-200 hover:border-brand-200'
                          }`}
                        >
                          <div className="font-bold text-lg text-ink">{option.label}</div>
                          <div className="text-xs text-ink-muted">~{option.questions} questions</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary of selections before starting */}
                  <div className="flex items-center gap-4 bg-surface-50 rounded-2xl p-4 mb-5">
                    <span className="text-3xl">{selectedDomain?.icon}</span>
                    <div>
                      <p className="font-semibold text-ink">{selectedDomain?.label}</p>
                      <p className="text-xs text-ink-muted capitalize mt-0.5">
                        {difficulty} level · {duration} min · ~{DURATIONS.find(d => d.value === duration)?.questions} questions
                      </p>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-danger">{error}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="btn-secondary gap-1.5">
                      <ChevronLeft size={15} /> Back
                    </button>
                    <button
                      onClick={handleStart}
                      disabled={loading}
                      className="btn-primary flex-1 gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? <><Loader2 size={15} className="animate-spin" /> Preparing...</>
                        : <><span>🎙️</span> Start Interview</>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
