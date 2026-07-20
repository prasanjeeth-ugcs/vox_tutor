import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mic, BarChart2, Clock, Zap, ArrowRight, Shield, Sparkles, Brain, MessageSquare, TrendingUp } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ThemeToggle from '../components/ui/ThemeToggle';

/* ───────── Animated Counter (triggers on scroll-into-view) ───────── */
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now) => {
            const p = Math.min((now - t0) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(eased * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ───────── Scroll-reveal wrapper ───────── */
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <main className="min-h-screen bg-surface overflow-hidden transition-colors duration-300">

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight text-ink">
            Vox<span className="text-brand-600">Tutor</span>
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/sign-in" className="btn-ghost">Sign in</Link>
            <Link to="/sign-up" className="btn-primary">Get started</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-28 px-6">
        {/* Subtle radial gradient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-brand-100/60 via-brand-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <Reveal>
            <div className="inline-flex items-center gap-2 badge-brand mb-6 px-4 py-1.5 text-sm">
              <Sparkles size={14} />
              Powered by Gemini AI + Vapi Voice
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={80}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-ink leading-[1.08] mb-6 tracking-tight">
              Interview practice that
              <br />
              <span className="bg-gradient-to-r from-brand-600 via-purple-500 to-brand-500 bg-clip-text text-transparent">
                actually talks back.
              </span>
            </h1>
          </Reveal>

          {/* Subheading */}
          <Reveal delay={160}>
            <p className="text-lg md:text-xl text-ink-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              VoxTutor runs real voice interviews tailored to your domain and experience level.
              Adaptive follow-ups. AI-generated feedback. All in your browser.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/sign-up" className="group btn-primary btn-lg shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:scale-[1.02] transition-all">
                Start practicing free
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/sign-in" className="btn-secondary btn-lg">
                Sign in
              </Link>
            </div>
          </Reveal>

          {/* ─── Live Demo Card ─── */}
          <Reveal delay={320}>
            <div className="relative max-w-md mx-auto">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand-200/40 to-purple-200/30 rounded-3xl blur-2xl scale-105" />

              <div className="relative bg-surface rounded-3xl border border-surface-200 shadow-xl p-8">
                {/* Mic icon */}
                <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-5">
                  <Mic size={24} className="text-brand-600" />
                </div>

                {/* Waveform bars */}
                <div className="flex items-end justify-center gap-[3px] h-16 mb-4">
                  {[12,20,32,44,36,52,40,48,28,36,44,52,36,28,20,44,32,24,40,16].map((h, i) => (
                    <div
                      key={i}
                      className="wave-bar"
                      style={{ height: h, animationDelay: `${i * 0.06}s` }}
                    />
                  ))}
                </div>

                <p className="text-sm text-ink-muted">Live AI interview in progress...</p>

                {/* Floating chips */}
                <div className="absolute -left-3 top-6 sm:-left-12 sm:top-10 bg-surface rounded-xl border border-surface-200 shadow-lg px-3 py-2 flex items-center gap-2 text-xs font-medium text-ink-secondary animate-fade-up" style={{ animationDelay: '0.6s' }}>
                  <Brain size={13} className="text-purple-500" />
                  Gemini AI
                </div>

                <div className="absolute -right-3 top-14 sm:-right-14 sm:top-20 bg-surface rounded-xl border border-surface-200 shadow-lg px-3 py-2 flex items-center gap-2 text-xs font-medium text-ink-secondary animate-fade-up" style={{ animationDelay: '0.8s' }}>
                  <MessageSquare size={13} className="text-emerald-500" />
                  Real-time voice
                </div>

                <div className="absolute -right-2 bottom-6 sm:-right-10 sm:bottom-10 bg-surface rounded-xl border border-surface-200 shadow-lg px-3 py-2 flex items-center gap-2 text-xs font-medium text-ink-secondary animate-fade-up" style={{ animationDelay: '1s' }}>
                  <BarChart2 size={13} className="text-brand-500" />
                  Instant feedback
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Social Proof Stats ─── */}
      <section className="py-14 px-6 border-y border-surface-200 bg-surface-50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 1200, suffix: '+', label: 'Interviews conducted' },
            { value: 6, suffix: '', label: 'Domains covered' },
            { value: 95, suffix: '%', label: 'User satisfaction' },
            { value: 4.9, suffix: '', label: 'Average rating', display: '4.9/5' },
          ].map(({ value, suffix, label, display }) => (
            <Reveal key={label}>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-ink mb-1">
                  {display || <AnimatedCounter target={value} suffix={suffix} />}
                </p>
                <p className="text-sm text-ink-muted">{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="section-label text-center mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-ink mb-16 tracking-tight">Three steps to your best interview</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: Zap,
                color: 'bg-brand-50 text-brand-600 border-brand-100',
                title: 'Pick your domain',
                desc: 'Choose from 6 professional domains — Software Engineering, Finance, Product, Marketing, Data Science, or Consulting. Set your experience level and duration.',
              },
              {
                step: '02',
                icon: Mic,
                color: 'bg-purple-50 text-purple-600 border-purple-100',
                title: 'Talk to Alex, your AI interviewer',
                desc: 'Alex asks smart, adaptive questions generated by Gemini AI. Speak naturally — your mic picks up your answers just like a real interview.',
              },
              {
                step: '03',
                icon: BarChart2,
                color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                title: 'Get instant feedback',
                desc: 'Receive a detailed report card scored across 4 categories — with strengths, areas to improve, and actionable next steps.',
              },
            ].map(({ step, icon: Icon, color, title, desc }, i) => (
              <Reveal key={step} delay={i * 120}>
                <div className="relative p-6 rounded-2xl border border-surface-200 bg-surface hover:shadow-lg hover:border-brand-200 transition-all duration-300 group h-full">
                  {/* Step number */}
                  <span className="text-xs font-bold text-ink-faint mb-4 block tracking-widest">{step}</span>

                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${color}`}>
                    <Icon size={20} />
                  </div>

                  <h3 className="font-semibold text-ink text-lg mb-2">{title}</h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">{desc}</p>

                  {/* Connector line on desktop */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 border-t-2 border-dashed border-surface-300" />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="py-24 px-6 bg-surface-50 border-y border-surface-200">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="section-label text-center mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-ink mb-16 tracking-tight">Everything you need to ace your interview</h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Mic,
                title: 'Voice-First Experience',
                desc: 'A real AI agent speaks questions aloud and listens to your answers — no typing required.',
              },
              {
                icon: Brain,
                title: 'Gemini-Powered Questions',
                desc: 'Questions are generated on-the-fly by Google Gemini AI, tailored to your exact skill level.',
              },
              {
                icon: BarChart2,
                title: 'Detailed Score Reports',
                desc: 'Get scored across Technical Knowledge, Communication, Problem-Solving, and Domain Experience.',
              },
              {
                icon: Clock,
                title: 'Flexible Durations',
                desc: 'Quick 10-min warmup or a full 30-min deep dive — choose what fits your schedule.',
              },
              {
                icon: Shield,
                title: 'Private & Secure',
                desc: 'Your data never leaves your account. Firebase Auth + encrypted storage keep you safe.',
              },
              {
                icon: TrendingUp,
                title: 'Track Your Progress',
                desc: 'Every interview is saved with full transcript and feedback. Watch yourself improve over time.',
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="card p-6 hover:shadow-lg hover:border-brand-200 transition-all duration-300 group h-full">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                    <Icon size={20} className="text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-ink mb-2">{title}</h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Domains ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <p className="section-label text-center mb-3">Domains covered</p>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-ink mb-4 tracking-tight">Practice for any role</h2>
            <p className="text-center text-ink-secondary max-w-lg mx-auto mb-12">
              Each domain comes with curated topics and difficulty levels from Entry to Senior.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '💻', label: 'Software Engineering', topics: 'System Design, Algorithms, Architecture' },
              { icon: '📈', label: 'Finance & Banking', topics: 'Valuation, Financial Modeling, Risk' },
              { icon: '🎯', label: 'Marketing & Brand', topics: 'Brand Strategy, Growth, Analytics' },
              { icon: '🚀', label: 'Product Management', topics: 'Roadmaps, User Research, Metrics' },
              { icon: '🤖', label: 'Data Science & AI', topics: 'ML Models, Statistics, Deep Learning' },
              { icon: '🏢', label: 'Management Consulting', topics: 'Case Analysis, Strategy, Problem Solving' },
            ].map((d, i) => (
              <Reveal key={d.label} delay={i * 60}>
                <div className="card p-5 hover:shadow-lg hover:border-brand-200 transition-all duration-300 cursor-default group h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{d.icon}</span>
                    <span className="font-semibold text-ink text-sm">{d.label}</span>
                  </div>
                  <p className="text-xs text-ink-muted pl-10 group-hover:text-ink-secondary transition-colors">{d.topics}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ─── CTA ─── */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-brand-600 via-brand-700 to-purple-700 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Ready to ace your next interview?</h2>
            <p className="text-brand-200 mb-10 text-lg">No credit card. No setup. Just open your browser and start practicing.</p>
            <Link to="/sign-up" className="group inline-flex items-center gap-2 bg-surface text-brand-700 font-semibold px-10 py-4 rounded-2xl hover:bg-surface-50 transition-all text-base shadow-xl hover:scale-[1.02]">
              Create free account
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-6 border-t border-surface-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-semibold text-sm text-ink">
            Vox<span className="text-brand-600">Tutor</span>
          </span>
          <p className="text-sm text-ink-muted">
            © 2025 VoxTutor · Built with Vapi + Gemini + Firebase
          </p>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="hover:text-ink transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-ink transition-colors cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
