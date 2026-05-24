import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const STEPS = [
  { id: 1, title: 'Personal Info',   icon: '👤', fields: ['age', 'gender', 'bmi'] },
  { id: 2, title: 'Sleep Patterns',  icon: '🌙', fields: ['sleepDuration', 'sleepInterruptions', 'daytimeSleepiness'] },
  { id: 3, title: 'Health Metrics',  icon: '❤️', fields: ['heartRate', 'physicalActivity', 'stressLevel'] },
  { id: 4, title: 'Symptoms',        icon: '🔍', fields: ['snoringFrequency'] },
]

const INITIAL = {
  age: '', gender: '0', sleepDuration: '', stressLevel: '5',
  bmi: '', heartRate: '', physicalActivity: '', snoringFrequency: '0',
  daytimeSleepiness: '0', sleepInterruptions: '0',
}

const SliderField = ({ label, name, value, onChange, min, max, step = 1, unit = '', desc = '' }) => (
  <div>
    <div className="flex justify-between items-baseline mb-2">
      <label className="label mb-0">{label}</label>
      <span className="text-sky-400 font-bold text-lg font-mono">{value}{unit}</span>
    </div>
    <input type="range" name={name} value={value} onChange={onChange}
      min={min} max={max} step={step}
      className="w-full h-2 rounded-full appearance-none cursor-pointer
                 bg-white/10 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-500
                 [&::-webkit-slider-thumb]:shadow-lg" />
    <div className="flex justify-between text-xs text-slate-600 mt-1">
      <span>{min}{unit}</span>
      {desc && <span className="text-slate-500">{desc}</span>}
      <span>{max}{unit}</span>
    </div>
  </div>
)

export default function AssessmentPage() {
  const navigate = useNavigate()
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState(INITIAL)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const validateStep = () => {
    if (step === 1) {
      if (!form.age || parseInt(form.age) < 5 || parseInt(form.age) > 100)
        return 'Please enter a valid age (5–100).'
      if (!form.bmi || parseFloat(form.bmi) < 10 || parseFloat(form.bmi) > 60)
        return 'Please enter a valid BMI (10–60).'
    }
    if (step === 2) {
      if (!form.sleepDuration || parseFloat(form.sleepDuration) < 0 || parseFloat(form.sleepDuration) > 24)
        return 'Please enter sleep duration (0–24 hours).'
    }
    if (step === 3) {
      if (!form.heartRate || parseInt(form.heartRate) < 30 || parseInt(form.heartRate) > 200)
        return 'Please enter a valid heart rate (30–200 bpm).'
      if (form.physicalActivity === '' || parseInt(form.physicalActivity) < 0)
        return 'Please enter physical activity minutes.'
    }
    return null
  }

  const next = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setStep((s) => s + 1)
    setError('')
  }

  const back = () => { setStep((s) => s - 1); setError('') }

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const payload = {
        age:                 parseInt(form.age),
        gender:              parseInt(form.gender),
        sleep_duration:      parseFloat(form.sleepDuration),
        stress_level:        parseInt(form.stressLevel),
        bmi:                 parseFloat(form.bmi),
        heart_rate:          parseInt(form.heartRate),
        physical_activity:   parseInt(form.physicalActivity),
        snoring_frequency:   parseInt(form.snoringFrequency),
        daytime_sleepiness:  parseInt(form.daytimeSleepiness),
        sleep_interruptions: parseInt(form.sleepInterruptions),
      }
      const { data } = await api.post('/predict', payload)
      navigate(`/result/${data.predictionId}`, { state: { result: data } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Sleep Assessment</h1>
        <p className="page-subtitle">Complete all steps for your AI-powered sleep disorder analysis.</p>
        <p className="text-xs text-amber-400/70 mt-2">⚠ Educational use only. Not a medical diagnosis.</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-all duration-300
                ${step >= s.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : 'bg-white/10 text-slate-500'}`}>
                {step > s.id ? '✓' : s.icon}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? 'text-sky-400' : 'text-slate-600'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Form card */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span>{STEPS[step - 1].icon}</span> {STEPS[step - 1].title}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1 — Personal Info */}
          {step === 1 && (
            <>
              <div>
                <label className="label">Age (years)</label>
                <input type="number" name="age" value={form.age} onChange={handle}
                  placeholder="e.g. 35" min="5" max="100" className="input-field" />
              </div>
              <div>
                <label className="label">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: '0', l: '♀ Female' }, { v: '1', l: '♂ Male' }].map(({ v, l }) => (
                    <button key={v} type="button"
                      onClick={() => setForm((f) => ({ ...f, gender: v }))}
                      className={`py-3 rounded-xl font-medium border transition-all ${
                        form.gender === v
                          ? 'bg-sky-500/20 border-sky-500/50 text-sky-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">BMI — Body Mass Index</label>
                <input type="number" name="bmi" value={form.bmi} onChange={handle}
                  placeholder="e.g. 24.5" min="10" max="60" step="0.1" className="input-field" />
                <p className="text-xs text-slate-600 mt-1">Underweight &lt;18.5 · Normal 18.5–24.9 · Overweight 25–29.9 · Obese ≥30</p>
              </div>
            </>
          )}

          {/* Step 2 — Sleep Patterns */}
          {step === 2 && (
            <>
              <div>
                <label className="label">Average Sleep Duration (hours/night)</label>
                <input type="number" name="sleepDuration" value={form.sleepDuration} onChange={handle}
                  placeholder="e.g. 6.5" min="0" max="24" step="0.5" className="input-field" />
              </div>
              <SliderField label="Sleep Interruptions (times/night)" name="sleepInterruptions"
                value={form.sleepInterruptions} onChange={handle} min={0} max={10}
                desc="how often you wake up" />
              <SliderField label="Daytime Sleepiness" name="daytimeSleepiness"
                value={form.daytimeSleepiness} onChange={handle} min={0} max={10}
                desc="0 = alert, 10 = very sleepy" />
            </>
          )}

          {/* Step 3 — Health Metrics */}
          {step === 3 && (
            <>
              <div>
                <label className="label">Resting Heart Rate (bpm)</label>
                <input type="number" name="heartRate" value={form.heartRate} onChange={handle}
                  placeholder="e.g. 72" min="30" max="200" className="input-field" />
              </div>
              <div>
                <label className="label">Physical Activity (min/day)</label>
                <input type="number" name="physicalActivity" value={form.physicalActivity} onChange={handle}
                  placeholder="e.g. 30" min="0" max="180" className="input-field" />
              </div>
              <SliderField label="Stress Level" name="stressLevel"
                value={form.stressLevel} onChange={handle} min={1} max={10}
                desc="1 = calm, 10 = very stressed" />
            </>
          )}

          {/* Step 4 — Symptoms */}
          {step === 4 && (
            <>
              <SliderField label="Snoring Frequency" name="snoringFrequency"
                value={form.snoringFrequency} onChange={handle} min={0} max={10}
                desc="0 = never, 10 = every night" />

              {/* Summary review */}
              <div className="glass-card p-5 mt-4">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Assessment Summary</h3>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  {[
                    ['Age', `${form.age} yrs`],
                    ['Gender', form.gender === '0' ? 'Female' : 'Male'],
                    ['BMI', form.bmi],
                    ['Sleep Duration', `${form.sleepDuration}h`],
                    ['Heart Rate', `${form.heartRate} bpm`],
                    ['Activity', `${form.physicalActivity} min/d`],
                    ['Stress', `${form.stressLevel}/10`],
                    ['Snoring', `${form.snoringFrequency}/10`],
                    ['Daytime Sleepiness', `${form.daytimeSleepiness}/10`],
                    ['Sleep Interruptions', `${form.sleepInterruptions}/night`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-slate-200 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600">
                By submitting you acknowledge this is for educational purposes only and not a medical diagnosis.
              </p>
            </>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={back} className="btn-secondary flex-1">← Back</button>
          )}
          {step < STEPS.length ? (
            <button onClick={next} className="btn-primary flex-1">Next →</button>
          ) : (
            <button onClick={submit} disabled={loading} className="btn-primary flex-1 py-4 text-base">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing…
                </span>
              ) : '🧠 Run AI Analysis'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
