const PALETTE = {
  sky:     { bg: 'rgba(14,165,233,0.1)',  border: 'rgba(14,165,233,0.22)',  val: '#38bdf8' },
  cyan:    { bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.22)',   val: '#22d3ee' },
  emerald: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.22)', val: '#34d399' },
  amber:   { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)', val: '#fbbf24' },
  red:     { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.22)',  val: '#f87171' },
  purple:  { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.22)', val: '#c084fc' },
}

export default function StatCard({ icon, label, value, sub, color = 'sky' }) {
  const p = PALETTE[color] || PALETTE.sky
  return (
    <div style={{ background: p.bg, border: `1px solid ${p.border}` }}
         className="rounded-2xl p-5">
      <div className="mb-3 text-2xl select-none">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold leading-tight break-words" style={{ color: p.val }}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}
