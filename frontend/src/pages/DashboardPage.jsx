import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Filler,
} from 'chart.js'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import StatCard from '../components/StatCard'
import RiskBadge from '../components/RiskBadge'
import LoadingSpinner from '../components/LoadingSpinner'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const DISORDER_HEX = {
  None: '#22d3ee', Insomnia: '#0ea5e9',
  'Sleep Apnea': '#f59e0b', Narcolepsy: '#a855f7', 'Restless Legs Syndrome': '#ef4444',
}
const RISK_THEME = {
  High:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   txt: '#f87171', dot: '#ef4444' },
  Medium: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  txt: '#fbbf24', dot: '#f59e0b' },
  Low:    { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', txt: '#34d399', dot: '#10b981' },
}

function timeOfDay() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

export default function DashboardPage() {
  const { user }   = useAuth()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState('')

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner fullscreen text="Loading dashboard…" />
  if (err) return (
    <div className="max-w-md mx-auto mt-24 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <p className="text-red-400 mb-6 text-sm">{err}</p>
      <button className="btn-secondary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  )

  const hasData = stats?.total > 0

  /* chart data */
  const doughnutData = hasData && stats.disorderDistribution?.length ? {
    labels: stats.disorderDistribution.map((d) => d.disorder),
    datasets: [{
      data: stats.disorderDistribution.map((d) => d.count),
      backgroundColor: stats.disorderDistribution.map((d) => DISORDER_HEX[d.disorder] || '#64748b'),
      borderWidth: 0, hoverOffset: 6,
    }],
  } : null

  const trendLabels = (stats?.recentTrend || []).map((p) =>
    new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  )
  const trendDataset = {
    labels: trendLabels,
    datasets: [{
      label: 'Confidence %',
      data: (stats?.recentTrend || []).map((p) => Math.round((p.result?.confidence || 0) * 100)),
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14,165,233,0.08)',
      fill: true, tension: 0.4,
      pointBackgroundColor: '#0ea5e9',
      pointBorderColor: '#060d1f',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  }

  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', callback: (v) => `${v}%`, font: { size: 10 } }, min: 0, max: 100 },
    },
  }
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 14, boxWidth: 12 } } },
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Good {timeOfDay()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Your sleep health overview at a glance.</p>
        </div>
        <Link to="/assessment" className="btn-primary shrink-0">+ New Assessment</Link>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📋" label="Total Assessments" value={stats?.total ?? 0} color="sky" />
        <StatCard icon="🌙" label="Avg Sleep" value={stats?.averages?.sleepDuration ? `${stats.averages.sleepDuration}h` : '—'} sub="hours/night" color="cyan" />
        <StatCard icon="😰" label="Avg Stress" value={stats?.averages?.stressLevel || '—'} sub="out of 10" color="amber" />
        <StatCard icon="🔬" label="Last Result"
          value={stats?.latestPrediction?.result?.disorder ?? '—'}
          sub={stats?.latestPrediction ? new Date(stats.latestPrediction.createdAt).toLocaleDateString() : 'None yet'}
          color="purple"
        />
      </div>

      {/* empty */}
      {!hasData && (
        <div className="glass-card p-16 text-center">
          <span className="text-6xl block mb-5">🌙</span>
          <h2 className="text-xl font-bold text-white mb-2">No assessments yet</h2>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm">
            Take your first AI sleep assessment to unlock your personalised health dashboard.
          </p>
          <Link to="/assessment" className="btn-primary">Start First Assessment</Link>
        </div>
      )}

      {/* charts */}
      {hasData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doughnutData && (
            <div className="glass-card p-6">
              <p className="text-sm font-semibold text-slate-200 mb-0.5">Disorder Distribution</p>
              <p className="text-xs text-slate-500 mb-4">All-time breakdown</p>
              <div className="h-52"><Doughnut data={doughnutData} options={doughnutOpts} /></div>
            </div>
          )}
          <div className="glass-card p-6">
            <p className="text-sm font-semibold text-slate-200 mb-0.5">Confidence Trend</p>
            <p className="text-xs text-slate-500 mb-4">Last 7 assessments</p>
            <div className="h-52"><Line data={trendDataset} options={lineOpts} /></div>
          </div>
        </div>
      )}

      {/* risk distribution — NO nested glass-card */}
      {hasData && stats.riskDistribution?.length > 0 && (
        <div className="glass-card p-6">
          <p className="text-sm font-semibold text-slate-200 mb-4">Risk Level Distribution</p>
          <div className="flex flex-wrap gap-3">
            {['High', 'Medium', 'Low'].map((risk) => {
              const found = stats.riskDistribution.find((r) => r.risk === risk)
              const count = found?.count ?? 0
              const t = RISK_THEME[risk]
              return (
                <div key={risk}
                  className="flex items-center justify-between gap-8 rounded-xl px-6 py-4 flex-1 min-w-[140px]"
                  style={{ background: t.bg, border: `1px solid ${t.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.dot }} />
                    <span className="text-sm font-semibold" style={{ color: t.txt }}>{risk} Risk</span>
                  </div>
                  <span className="text-2xl font-bold text-white">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* latest */}
      {stats?.latestPrediction && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-slate-200">Latest Assessment</p>
            <Link to={`/result/${stats.latestPrediction._id}`}
              className="text-sky-400 text-xs font-medium hover:text-sky-300 transition-colors">
              View full result →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Disorder',   node: <span className="font-bold text-white text-sm">{stats.latestPrediction.result.disorder}</span> },
              { label: 'Risk',       node: <RiskBadge risk={stats.latestPrediction.result.risk} /> },
              { label: 'Confidence', node: <span className="font-mono font-bold text-sky-400 text-lg">{(stats.latestPrediction.result.confidence * 100).toFixed(1)}%</span> },
              { label: 'Date',       node: <span className="text-slate-300 text-sm">{new Date(stats.latestPrediction.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span> },
            ].map(({ label, node }) => (
              <div key={label} className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs text-slate-500 mb-2">{label}</p>
                {node}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
