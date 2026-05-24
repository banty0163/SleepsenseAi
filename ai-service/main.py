"""
SleepSense AI — FastAPI Service (v2)
Enhanced with detailed, actionable health recommendations per disorder.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import joblib
import json
import os
from datetime import datetime

# ── Load model ───────────────────────────────────────────────────────────────
MODEL_PATH = "model/sleep_model.pkl"
SCALER_PATH = "model/scaler.pkl"
META_PATH   = "model/model_meta.json"

if not os.path.exists(MODEL_PATH):
    raise RuntimeError("Model not found — run: python train_model.py")

model  = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
with open(META_PATH) as f:
    meta = json.load(f)

DISORDERS = meta["disorders"]

# ── Risk classification ───────────────────────────────────────────────────────
def classify_risk(confidence: float, disorder_idx: int, inp: dict) -> str:
    if disorder_idx == 0:
        return "Low"
    # Factor in symptom severity
    severity_score = 0
    if inp.get("snoring_frequency", 0) >= 7:      severity_score += 1
    if inp.get("daytime_sleepiness", 0) >= 7:     severity_score += 1
    if inp.get("sleep_interruptions", 0) >= 7:    severity_score += 1
    if inp.get("stress_level", 5) >= 8:           severity_score += 1
    if inp.get("sleep_duration", 7) <= 5:         severity_score += 1

    if confidence >= 0.80 or severity_score >= 3:  return "High"
    if confidence >= 0.55 or severity_score >= 1:  return "Medium"
    return "Low"

# ── Detailed recommendations ──────────────────────────────────────────────────
RECOMMENDATIONS = {
    "None": [
        "✅ Maintain your consistent sleep schedule — go to bed and wake up at the same time every day, even weekends.",
        "🏃 Keep up your regular physical activity (30–60 min/day of moderate exercise); avoid vigorous workouts within 3 hours of bedtime.",
        "🧘 Continue stress management practices — meditation, deep breathing, or journaling before bed can sustain your healthy sleep.",
        "☕ Limit caffeine intake after 2 PM; alcohol may help you fall asleep but disrupts sleep quality in the second half of the night.",
        "📱 Maintain your screen-free wind-down routine — blue light suppresses melatonin production; dim lights 1 hour before bed.",
        "🌡️ Keep your bedroom cool (16–19°C / 61–67°F), dark, and quiet — your body temperature naturally drops during sleep.",
    ],

    "Insomnia": [
        "🧠 CBT-I (Cognitive Behavioural Therapy for Insomnia) is the #1 clinically proven treatment — more effective than sleep medication long-term. Ask your doctor for a referral.",
        "⏰ Practise strict sleep restriction: only go to bed when genuinely sleepy, get up at the same time every morning, and avoid napping — this rebuilds your sleep drive.",
        "🛏️ Use your bed ONLY for sleep (and sex) — no phones, TV, or work in bed. This retrains your brain to associate bed with sleep.",
        "📱 Implement a 60-minute 'digital sunset' before bed — switch devices to night mode or use blue-light blocking glasses from 8 PM.",
        "🌬️ Try 4-7-8 breathing if you can't sleep: inhale 4 sec, hold 7 sec, exhale 8 sec. Repeat 4 times — activates the parasympathetic nervous system.",
        "🌡️ A warm bath or shower 1–2 hours before bed causes a core body temperature drop that triggers sleepiness. Water temp: 40–43°C (104–110°F).",
        "📋 Keep a sleep diary for 2 weeks (bedtime, wake time, quality rating, daytime mood) — this gives your doctor critical data for personalised treatment.",
        "🏥 Consult a sleep specialist if insomnia has lasted more than 3 months — chronic insomnia is a clinical condition, not a personal failing.",
    ],

    "Sleep Apnea": [
        "🏥 URGENT: Book a sleep study (polysomnography) with a sleep specialist — Sleep Apnea is a serious medical condition that increases heart disease and stroke risk.",
        "😷 CPAP (Continuous Positive Airway Pressure) therapy is the gold-standard treatment — 90%+ effective when used consistently every night.",
        "⚖️ Each 10% body weight loss can reduce sleep apnea severity by ~26% — even modest weight loss significantly improves symptoms.",
        "🛌 Sleep on your side (lateral position) — back sleeping worsens apnea by 50–75% as gravity collapses the airway. Use a body pillow or positional shirt.",
        "🍷 Avoid alcohol entirely within 4 hours of bedtime — alcohol relaxes throat muscles and worsens airway collapse dramatically.",
        "🚬 If you smoke, stopping is critical — smoking causes upper airway inflammation and dramatically increases apnea severity.",
        "😤 Ask your dentist about a mandibular advancement device (MAD) — an effective alternative to CPAP for mild-to-moderate sleep apnea.",
        "🫁 Elevate the head of your bed by 10–15 cm (4–6 inches) — even this small elevation can reduce apnea events by reducing neck pressure.",
    ],

    "Narcolepsy": [
        "🏥 See a neurologist specialising in sleep disorders immediately — narcolepsy requires formal diagnosis (sleep latency testing) and is a lifelong condition.",
        "💊 Effective medications exist: modafinil/armodafinil (wakefulness agents), sodium oxybate (Xyrem), and pitolisant — all require a specialist prescription.",
        "⏱️ Schedule 2–3 strategic 15–20 minute naps daily (e.g., 10 AM and 2 PM) — planned naps dramatically reduce uncontrolled sleep attacks.",
        "🚗 Do NOT drive until your symptoms are medically controlled — narcolepsy causes sudden sleep attacks and is a legal driving impairment in most countries.",
        "📋 Inform your employer, school, or university — you have legal rights to workplace/academic accommodations under disability laws.",
        "🍽️ Eat small, low-carbohydrate meals throughout the day — large, high-carb meals trigger post-meal drowsiness that is especially dangerous with narcolepsy.",
        "🌙 Maintain strict, regular sleep-wake times — narcolepsy disrupts the sleep-wake cycle, so consistency is crucial to managing symptoms.",
        "👥 Contact the Narcolepsy Network or local support group — peer support and community resources significantly improve quality of life.",
    ],

    "Restless Legs Syndrome": [
        "🏥 Consult a neurologist — request ferritin and iron studies; RLS is commonly caused by iron deficiency even when haemoglobin is normal (target ferritin > 75 µg/L).",
        "💊 Effective treatments include dopamine agonists (pramipexole, ropinirole), gabapentin/pregabalin, and iron supplementation — all need medical supervision.",
        "🏃 Light-to-moderate aerobic exercise (walking, swimming, cycling) for 30 minutes daily significantly reduces RLS symptoms — but avoid intense exercise close to bedtime.",
        "🌡️ Try temperature contrast therapy: alternate warm compress (3 min) and cool compress (1 min) on your legs before bed — provides temporary but meaningful relief.",
        "🦵 Leg stretching and calf massage for 10–15 minutes before bed (gastrocnemius, hamstring, hip flexor) can reduce symptom frequency.",
        "☕ Eliminate caffeine, nicotine, and alcohol completely — all three are clinically proven to worsen RLS symptoms, especially caffeine.",
        "💊 Check all your medications — antidepressants (SSRIs, TCAs), antihistamines, and antinausea drugs commonly trigger or worsen RLS.",
        "🛁 A warm bath with Epsom salts (magnesium sulfate) 30–60 minutes before bed — magnesium helps relax muscles and may reduce RLS severity.",
    ],
}

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SleepSense AI Service",
    description="ML-powered sleep disorder prediction. Educational use only.",
    version="2.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Schema ────────────────────────────────────────────────────────────────────
class PredictionRequest(BaseModel):
    age:                 int   = Field(..., ge=5,   le=100)
    gender:              int   = Field(..., ge=0,   le=1)
    sleep_duration:      float = Field(..., ge=0.0, le=24.0)
    stress_level:        int   = Field(..., ge=1,   le=10)
    bmi:                 float = Field(..., ge=10.0,le=60.0)
    heart_rate:          int   = Field(..., ge=30,  le=200)
    physical_activity:   int   = Field(..., ge=0,   le=180)
    snoring_frequency:   int   = Field(..., ge=0,   le=10)
    daytime_sleepiness:  int   = Field(..., ge=0,   le=10)
    sleep_interruptions: int   = Field(..., ge=0,   le=10)

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "healthy", "service": "SleepSense AI v2", "timestamp": datetime.utcnow().isoformat()}

@app.get("/model-info")
def model_info():
    return {"model_type": "Ensemble (RandomForest + GradientBoosting)", "disorders": DISORDERS, **meta}

@app.post("/predict")
def predict(req: PredictionRequest):
    try:
        features = np.array([[
            req.age, req.gender, req.sleep_duration, req.stress_level,
            req.bmi, req.heart_rate, req.physical_activity,
            req.snoring_frequency, req.daytime_sleepiness, req.sleep_interruptions,
        ]], dtype=float)

        scaled      = scaler.transform(features)
        idx         = int(model.predict(scaled)[0])
        probs       = model.predict_proba(scaled)[0]
        confidence  = float(round(probs[idx], 4))
        disorder    = DISORDERS[idx]

        inp_dict = {
            "snoring_frequency":   req.snoring_frequency,
            "daytime_sleepiness":  req.daytime_sleepiness,
            "sleep_interruptions": req.sleep_interruptions,
            "stress_level":        req.stress_level,
            "sleep_duration":      req.sleep_duration,
        }
        risk = classify_risk(confidence, idx, inp_dict)

        all_probs = {DISORDERS[i]: round(float(p), 4) for i, p in enumerate(probs)}

        return {
            "disorder":         disorder,
            "risk":             risk,
            "confidence":       confidence,
            "recommendations":  RECOMMENDATIONS.get(disorder, []),
            "all_probabilities": all_probs,
            "analyzed_at":      datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")
