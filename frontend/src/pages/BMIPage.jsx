import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'

/* ── BMI category thresholds ─────────────────────────────────────────── */
const CATEGORIES = [
  { max: 16.0, label: 'Severely Underweight', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   tip: 'Seek medical advice immediately. Severe underweight can affect sleep quality, hormone regulation, and overall health.' },
  { max: 18.5, label: 'Underweight',          color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)',  tip: 'You may benefit from a nutritionist consultation. Low body weight can contribute to poor sleep and fatigue.' },
  { max: 25.0, label: 'Normal Weight',        color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   tip: 'Great! Maintaining a healthy weight supports quality sleep and reduces risk of sleep disorders like sleep apnea.' },
  { max: 30.0, label: 'Overweight',           color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  tip: 'Overweight individuals have a higher risk of snoring and sleep apnea. Regular exercise and balanced diet can help.' },
  { max: 35.0, label: 'Obese (Class I)',      color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', tip: 'Obesity significantly increases risk of Sleep Apnea and poor sleep quality. Consult a healthcare provider.' },
  { max: 40.0, label: 'Obese (Class II)',     color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   border: 'rgba(220,38,38,0.25)',   tip: 'Serious health risk. Sleep disorders are common at this BMI. Medical supervision is strongly recommended.' },
  { max: Infinity, label: 'Obese (Class III)', color: '#991b1b', bg: 'rgba(153,27,27,0.1)', border: 'rgba(153,27,27,0.3)',   tip: 'Morbid obesity. High risk of multiple sleep disorders. Immediate medical attention is advised.' },
]

const SLEEP_IMPACT = [
  { icon: '😮‍💨', title: 'Sleep Apnea Risk',     desc: 'Each 10% increase in body weight raises sleep apnea risk by ~32%. Excess fat around the neck narrows the airway.' },
  { icon: '😴', title: 'Sleep Quality',           desc: 'Higher BMI is linked to lighter, more fragmented sleep with fewer restorative deep-sleep stages.' },
  { icon: '🌡️', title: 'Body Temperature',        desc: 'Excess weight raises core temperature, making it harder to fall and stay asleep.' },
  { icon: '🦵', title: 'Restless Legs Syndrome',  desc: 'Obesity is associated with lower dopamine levels, increasing the likelihood of RLS symptoms.' },
]

function getCategory(bmi) {
  return CATEGORIES.find((c) => bmi < c.max) || CATEGORIES[CATEGORIES.length - 1]
}

function getNeedleAngle(bmi) {
  // Map BMI 10–45 to -90° to +90° (semicircle gauge)
  const clamped = Math.min(45, Math.max(10, bmi))
  return -90 + ((clamped - 10) / 35) * 180
}

/* ── Gauge SVG component ─────────────────────────────────────────────── */
function GaugeMeter({ bmi }) {
  const angle = getNeedleAngle(bmi)
  const cx = 120, cy = 110, r = 90
  // needle tip
  const rad = (angle * Math.PI) / 180
  const nx = cx + r * Math.cos(rad)
  const ny = cy + r * Math.sin(rad)

  const arcs = [
    { start: -180, end: -127, color: '#ef4444' },
    { start: -127, end:  -85, color: '#f97316' },
    { start:  -85, end:  -26, color: '#22c55e' },
    { start:  -26, end:   12, color: '#f59e0b' },
    { start:   12, end:   42, color: '#f87171' },
    { start:   42, end:   62, color: '#dc2626' },
    { start:   62, end:   90, color: '#991b1b' },
  ]

  function arcPath(startDeg, endDeg, radius, cx, cy) {
    const s = (startDeg * Math.PI) / 180
    const e = (endDeg   * Math.PI) / 180
    const x1 = cx + radius * Math.cos(s), y1 = cy + radius * Math.sin(s)
    const x2 = cx + radius * Math.cos(e), y2 = cy + radius * Math.sin(e)
    const large = endDeg - startDeg > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  return (
    <svg viewBox="0 0 240 130" className="w-full max-w-xs mx-auto">
      {/* Coloured arc segments */}
      {arcs.map((a, i) => (
        <path key={i} d={arcPath(a.start, a.end, r, cx, cy)}
          fill="none" stroke={a.color} strokeWidth="14" strokeLinecap="butt" />
      ))}
      {/* Track outline */}
      <path d={arcPath(-180, 90, r, cx, cy)}
        fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="16" />
      {/* Re-draw arcs on top */}
      {arcs.map((a, i) => (
        <path key={`f${i}`} d={arcPath(a.start, a.end, r, cx, cy)}
          fill="none" stroke={a.color} strokeWidth="12" strokeLinecap="butt" />
      ))}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
      <circle cx={cx} cy={cy} r="3" fill="#0ea5e9" />
      {/* BMI value label */}
      <text x={cx} y={cy + 28} textAnchor="middle" fill="#ffffff"
        fontFamily="monospace" fontSize="22" fontWeight="bold">
        {bmi.toFixed(1)}
      </text>
      <text x={cx} y={cy + 42} textAnchor="middle" fill="#64748b" fontSize="9">
        BMI
      </text>
    </svg>
  )
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function BMIPage() {
  const [unit, setUnit] = useState('metric')   // 'metric' | 'imperial'
  const [form, setForm] = useState({ height: '', weight: '', heightFt: '', heightIn: '', weightLb: '' })
  const [result, setResult] = useState(null)

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setResult(null)
  }

  const calculate = useCallback(() => {
    let bmi
    if (unit === 'metric') {
      const h = parseFloat(form.height) / 100   // cm → m
      const w = parseFloat(form.weight)
      if (!h || !w || h <= 0 || w <= 0) return
      bmi = w / (h * h)
    } else {
      const inches = parseFloat(form.heightFt) * 12 + parseFloat(form.heightIn || 0)
      const lbs    = parseFloat(form.weightLb)
      if (!inches || !lbs || inches <= 0 || lbs <= 0) return
      bmi = (lbs / (inches * inches)) * 703
    }
    if (isNaN(bmi) || bmi < 5 || bmi > 80) return
    setResult({ bmi, category: getCategory(bmi) })
  }, [form, unit])

  const reset = () => {
    setForm({ height: '', weight: '', heightFt: '', heightIn: '', weightLb: '' })
    setResult(null)
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">BMI Calculator</h1>
          <p className="page-subtitle">Calculate your Body Mass Index — a key factor in sleep disorder assessment.</p>
        </div>
        <Link to="/assessment" className="btn-primary shrink-0">Start Assessment →</Link>
      </div>

      {/* main card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── input panel ── */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-base font-bold text-white">Enter Your Measurements</h2>

          {/* unit toggle */}
          <div className="flex rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {['metric', 'imperial'].map((u) => (
              <button key={u} onClick={() => { setUnit(u); reset() }}
                className="flex-1 py-2.5 text-sm font-semibold transition-all duration-200"
                style={unit === u
                  ? { background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#fff' }
                  : { background: 'transparent', color: '#64748b' }}>
                {u === 'metric' ? '📏 Metric (cm/kg)' : '📐 Imperial (ft/lb)'}
              </button>
            ))}
          </div>

          {/* metric inputs */}
          {unit === 'metric' ? (
            <>
              <div>
                <label className="label">Height (cm)</label>
                <input type="number" name="height" value={form.height} onChange={handle}
                  placeholder="e.g. 170" min="50" max="250" className="input-field" />
              </div>
              <div>
                <label className="label">Weight (kg)</label>
                <input type="number" name="weight" value={form.weight} onChange={handle}
                  placeholder="e.g. 68" min="20" max="300" className="input-field" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">Height</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" name="heightFt" value={form.heightFt} onChange={handle}
                    placeholder="ft" min="1" max="8" className="input-field" />
                  <input type="number" name="heightIn" value={form.heightIn} onChange={handle}
                    placeholder="in" min="0" max="11" className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Weight (lbs)</label>
                <input type="number" name="weightLb" value={form.weightLb} onChange={handle}
                  placeholder="e.g. 150" min="40" max="700" className="input-field" />
              </div>
            </>
          )}

          <button onClick={calculate} className="btn-primary w-full py-3 text-base">
            Calculate BMI
          </button>

          {/* BMI scale legend */}
          <div className="space-y-1.5 pt-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">BMI Scale</p>
            {CATEGORIES.filter((c) => c.max !== Infinity).concat([CATEGORIES[CATEGORIES.length-1]]).map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="text-xs text-slate-400">{c.label}</span>
                <span className="text-xs text-slate-600 ml-auto">
                  {i === 0 ? '< 16' : i === CATEGORIES.length - 1 ? '≥ 40' : `${CATEGORIES[i-1]?.max ?? 16}–${c.max}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── result panel ── */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* gauge */}
              <div className="glass-card p-6"
                style={{ border: `1px solid ${result.category.border}` }}>
                <GaugeMeter bmi={result.bmi} />
                <div className="text-center mt-2">
                  <p className="text-2xl font-bold" style={{ color: result.category.color }}>
                    {result.category.label}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">BMI: {result.bmi.toFixed(2)}</p>
                </div>
              </div>

              {/* tip */}
              <div className="rounded-xl p-4"
                style={{ background: result.category.bg, border: `1px solid ${result.category.border}` }}>
                <p className="text-sm font-semibold mb-1" style={{ color: result.category.color }}>
                  💡 What this means for your sleep
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{result.category.tip}</p>
              </div>

              {/* use BMI in assessment CTA */}
              <div className="glass-card p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Use this BMI in your assessment</p>
                  <p className="text-xs text-slate-400 mt-0.5">Copy your BMI value: <code className="text-sky-400 font-mono">{result.bmi.toFixed(1)}</code></p>
                </div>
                <Link to="/assessment" className="btn-primary text-sm py-2 px-4 shrink-0">
                  Assess Now →
                </Link>
              </div>
            </>
          ) : (
            <div className="glass-card p-12 text-center h-full flex flex-col items-center justify-center min-h-[320px]">
              <span className="text-5xl block mb-4">⚖️</span>
              <p className="text-white font-semibold mb-1">Your result will appear here</p>
              <p className="text-slate-500 text-sm">Enter your height and weight, then click Calculate.</p>
            </div>
          )}
        </div>
      </div>

      {/* BMI & Sleep connection */}
      <div className="glass-card p-6">
        <h2 className="text-base font-bold text-white mb-5">
          How BMI Affects Your Sleep Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SLEEP_IMPACT.map((item) => (
            <div key={item.title} className="rounded-xl p-4"
              style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
              <span className="text-2xl block mb-2">{item.icon}</span>
              <p className="text-sm font-semibold text-white mb-1.5">{item.title}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* disclaimer */}
      <div className="rounded-2xl p-4"
        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
        <p className="text-amber-400 text-xs leading-relaxed">
          ⚠ BMI is a screening tool, not a diagnostic measure. It does not account for muscle mass,
          bone density, or fat distribution. Consult a healthcare provider for a complete health assessment.
        </p>
      </div>
    </div>
  )
}
