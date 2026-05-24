import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: '🧠', title: 'Real AI Predictions',     desc: 'Trained Random Forest + Gradient Boosting ensemble on clinical-style sleep data.' },
  { icon: '📊', title: 'Interactive Dashboard',   desc: 'Visualize your sleep trends, risk history, and disorder distribution with Chart.js.' },
  { icon: '📄', title: 'Professional PDF Reports', desc: 'Download medical-style PDF reports with your assessment data and AI diagnosis.' },
  { icon: '🔒', title: 'Secure & Private',         desc: 'JWT authentication and MongoDB storage. Your data stays private.' },
  { icon: '⚡', title: 'Instant Analysis',         desc: 'FastAPI microservice delivers predictions in milliseconds.' },
  { icon: '📱', title: 'Responsive Design',        desc: 'Modern healthcare UI that works beautifully on all devices.' },
]

const DISORDERS = [
  { name: 'Insomnia',                  color: 'text-sky-400',    border: 'border-sky-500/20',    bg: 'rgba(14,165,233,0.08)',   icon: '😴' },
  { name: 'Sleep Apnea',               color: 'text-amber-400',  border: 'border-amber-500/20',  bg: 'rgba(245,158,11,0.08)',   icon: '😮‍💨' },
  { name: 'Narcolepsy',                color: 'text-purple-400', border: 'border-purple-500/20', bg: 'rgba(168,85,247,0.08)',   icon: '💤' },
  { name: 'Restless Legs Syndrome',    color: 'text-red-400',    border: 'border-red-500/20',    bg: 'rgba(239,68,68,0.08)',    icon: '🦵' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060d1f' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
               style={{ background: 'rgba(14,165,233,0.06)' }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl"
               style={{ background: 'rgba(6,182,212,0.05)' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-slate-400 mb-8"
               style={{ borderColor: 'rgba(14,165,233,0.2)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Educational AI Platform · Not a medical device
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Sleep Smarter.<br />
            <span className="gradient-text">Diagnose Faster.</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered sleep disorder diagnosis using real machine learning.
            Detect Insomnia, Sleep Apnea, Narcolepsy, and RLS with confidence
            scores and personalized health recommendations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg px-8 py-4">
              Start Free Assessment →
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8 py-4">
              Sign In
            </Link>
          </div>

          <p className="text-xs text-slate-600 mt-6">
            ⚠ For educational purposes only. Not a substitute for professional medical advice.
          </p>
        </div>
      </section>

      {/* ── Disorders ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Disorders We Detect</h2>
            <p className="text-slate-400 text-lg">Our AI classifies four major sleep disorders with high accuracy.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DISORDERS.map((d) => (
              <div key={d.name}
                className={`border ${d.border} rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1`}
                style={{ backgroundColor: d.bg }}>
                <span className="text-4xl block mb-4">{d.icon}</span>
                <h3 className={`font-bold text-lg ${d.color}`}>{d.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Full-Stack AI Platform</h2>
            <p className="text-slate-400 text-lg">Everything for sleep health monitoring in one place.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-6 transition-all duration-200 hover:border-white/20">
                <span className="text-3xl block mb-4">{f.icon}</span>
                <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Built With Modern Tech</h2>
          <p className="text-slate-400 mb-10">
            React · Vite · Tailwind · Node.js · Express · MongoDB · Python · FastAPI · Scikit-learn · PDFKit
          </p>
          <Link to="/register" className="btn-primary text-lg px-10 py-4">
            Try the Assessment Now →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-slate-600 text-sm">
        <p>🌙 SleepSense AI · Educational purposes only · Not a medical device</p>
      </footer>
    </div>
  )
}
