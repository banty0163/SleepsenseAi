import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js'
import api from '../utils/api'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const D_ICONS = {
  None: '✅', Insomnia: '😴', 'Sleep Apnea': '😮‍💨',
  Narcolepsy: '💤', 'Restless Legs Syndrome': '🦵',
}
const D_COLOR = {
  None: '#22d3ee', Insomnia: '#0ea5e9',
  'Sleep Apnea': '#f59e0b', Narcolepsy: '#a855f7', 'Restless Legs Syndrome': '#ef4444',
}
const CHART_COLORS = ['#22d3ee', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444']

/** Safely convert Mongoose Map / plain object → JS object */
function toObj(raw) {
  if (!raw) return {}
  if (typeof raw === 'object' && !(raw instanceof Map)) return raw
  return Object.fromEntries(raw)
}

export default function ResultPage() {
  const { id }   = useParams()
  const location = useLocation()

  const [result, setResult]         = useState(location.state?.result || null)
  const [loading, setLoading]       = useState(!result)
  const [downloading, setDownloading] = useState(false)
  const [dlErr, setDlErr]           = useState('')

  useEffect(() => {
    if (result) return
    api.get(`/history/${id}`)
      .then(({ data }) => {
        const p = data.prediction
        setResult({
          predictionId:     p._id,
          disorder:         p.result.disorder,
          risk:             p.result.risk,
          confidence:       p.result.confidence,
          recommendations:  p.result.recommendations,
          allProbabilities: toObj(p.result.allProbabilities),
          analyzedAt:       p.result.analyzedAt,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, result])

  const downloadPdf = async () => {
    setDownloading(true)
    setDlErr('')
    try {
      const resp = await api.get(`/download-report/${id}`, { responseType: 'blob' })
      const url  = URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      const a    = Object.assign(document.createElement('a'), { href: url, download: `SleepSense_Report_${id}.pdf` })
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setDlErr('PDF generation failed: ' + e.message)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <LoadingSpinner fullscreen text="Loading result…" />
  if (!result) return (
    <div className="text-center mt-24">
      <p className="text-slate-400 mb-4">Result not found.</p>
      <Link to="/history" className="btn-secondary">← History</Link>
    </div>
  )

  const probs   = toObj(result.allProbabilities)
  const labels  = Object.keys(probs)
  const pcts    = Object.values(probs).map((v) => Math.round(v * 100))
  const accentC = D_COLOR[result.disorder] || '#38bdf8'
  const confPct = (result.confidence * 100).toFixed(1)

  const doughnutData = {
    labels,
    datasets: [{
      data: pcts,
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }
  const barData = {
    labels,
    datasets: [{
      data: pcts,
      backgroundColor: labels.map((l) =>
        l === result.disorder ? 'rgba(14,165,233,0.85)' : 'rgba(255,255,255,0.07)'
      ),
      borderRadius: 6,
      borderSkipped: false,
    }],
  }
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 14, boxWidth: 12 } } },
  }
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', callback: (v) => `${v}%`, font: { size: 10 } }, min: 0, max: 100 },
    },
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6 pb-8">

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">AI Diagnosis Result</h1>
          {result.analyzedAt && (
            <p className="page-subtitle">
              {new Date(result.analyzedAt).toLocaleString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button onClick={downloadPdf} disabled={downloading}
            className="btn-secondary text-sm py-2 px-4 gap-2">
            {downloading
              ? <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-300 rounded-full animate-spin inline-block" />
              : '📄'}
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
          <Link to="/assessment" className="btn-primary text-sm py-2 px-4">New Assessment</Link>
        </div>
      </div>

      {dlErr && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-400"
          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)' }}>
          {dlErr}
        </div>
      )}

      {/* main card */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${accentC}0d` }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="text-6xl select-none">{D_ICONS[result.disorder] || '🧠'}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Detected Disorder
            </p>
            <h2 className="text-4xl font-bold mb-3 break-words" style={{ color: accentC }}>
              {result.disorder}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge risk={result.risk} />
              <span className="text-sm font-mono px-3 py-1 rounded-full"
                style={{ background: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.2)' }}>
                {confPct}% confidence
              </span>
            </div>
          </div>
          {/* confidence ring */}
          <div className="flex-shrink-0">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={accentC} strokeWidth="2.5"
                  strokeDasharray={`${result.confidence * 100} 100`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{Math.round(result.confidence * 100)}%</span>
                <span className="text-xs text-slate-500">conf.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* charts */}
      {labels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <p className="text-sm font-semibold text-slate-200 mb-0.5">Probability Distribution</p>
            <p className="text-xs text-slate-500 mb-4">Likelihood of each disorder</p>
            <div className="h-52"><Doughnut data={doughnutData} options={doughnutOpts} /></div>
          </div>
          <div className="glass-card p-6">
            <p className="text-sm font-semibold text-slate-200 mb-0.5">Disorder Scores</p>
            <p className="text-xs text-slate-500 mb-4">Highlighted = predicted disorder</p>
            <div className="h-52"><Bar data={barData} options={barOpts} /></div>
          </div>
        </div>
      )}

      {/* recommendations */}
      {result.recommendations?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-5">💡 Health Recommendations</h3>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sky-400 font-bold text-sm flex-shrink-0 w-5 mt-0.5">{i + 1}.</span>
                <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* disclaimer */}
      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <p className="text-amber-400 text-sm font-semibold mb-1">⚠ Educational Disclaimer</p>
        <p className="text-xs leading-relaxed" style={{ color: 'rgba(251,191,36,0.65)' }}>
          This AI analysis is for educational purposes only. It is NOT a medical diagnosis and must
          NOT replace professional medical consultation. Always consult a qualified healthcare provider.
        </p>
      </div>

      {/* nav */}
      <div className="flex gap-3">
        <Link to="/history"   className="btn-secondary flex-1 justify-center">View History</Link>
        <Link to="/dashboard" className="btn-secondary flex-1 justify-center">Dashboard</Link>
      </div>
    </div>
  )
}
