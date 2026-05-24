/**
 * SleepSense AI — Professional PDF Report (v4)
 *
 * Design: Clean two-column header card, icon-accented sections,
 * colour-coded risk, visual confidence bar, styled probability bars.
 * All Y coordinates are EXPLICIT — doc.y is never used for layout.
 * Footer is drawn last using page height, preventing extra pages.
 */

const express     = require("express");
const PDFDocument = require("pdfkit");
const { protect } = require("../middleware/auth");
const Prediction  = require("../models/Prediction");

const router = express.Router();

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  bg:        "#060d1f",   // page background
  card:      "#0a1628",   // section header bg
  cardBdr:   "#1e3a5f",   // card border
  accent:    "#0ea5e9",   // sky-blue accent
  accentLt:  "#38bdf8",   // lighter accent
  cyan:      "#06b6d4",
  white:     "#ffffff",
  textDark:  "#1e293b",
  textMid:   "#475569",
  textLight: "#94a3b8",
  rowEven:   "#f0f7ff",   // alternating row tint
  barTrack:  "#dde6f0",
  barFill:   "#0ea5e9",
  barAlt:    "#bae6fd",
  riskLow:   "#16a34a",
  riskMed:   "#d97706",
  riskHigh:  "#dc2626",
  amber:     "#d97706",
  green:     "#16a34a",
};

const RISK_COLOR = { Low: C.riskLow, Medium: C.riskMed, High: C.riskHigh };
const RISK_BG    = {
  Low:    "#dcfce7", Medium: "#fef9c3", High: "#fee2e2",
};

/* ── Page geometry ───────────────────────────────────────────────── */
const PW    = 595.28;    // A4 width
const PH    = 841.89;    // A4 height
const ML    = 40;        // margin left
const MR    = 40;        // margin right
const CW    = PW - ML - MR;
const RH    = 20;        // data row height
const SH    = 26;        // section header height
const LW    = 155;       // label column width
const VX    = ML + LW + 6;

/* ── Low-level draw helpers ──────────────────────────────────────── */

function filled(doc, x, y, w, h, color) {
  doc.rect(x, y, w, h).fill(color);
}

function txt(doc, str, x, y, opts, font, size, color) {
  doc.font(font || "Helvetica")
     .fontSize(size || 9)
     .fillColor(color || C.textDark)
     .text(str, x, y, { lineBreak: false, ...opts });
}

/** Rounded rect (PDFKit has no native border-radius — simulate with rect) */
function roundRect(doc, x, y, w, h, r, fillColor, strokeColor) {
  doc.roundedRect(x, y, w, h, r);
  if (fillColor)   doc.fill(fillColor);
  if (strokeColor) doc.strokeColor(strokeColor).lineWidth(0.5).stroke();
}

/* ── Section header ──────────────────────────────────────────────── */
function secHeader(doc, label, y) {
  filled(doc, ML, y, CW, SH, C.card);
  // left accent stripe
  filled(doc, ML, y, 3, SH, C.accent);
  txt(doc, label, ML + 12, y + (SH - 10) / 2, {}, "Helvetica-Bold", 10, C.accentLt);
  return y + SH;
}

/* ── Data row ────────────────────────────────────────────────────── */
function dataRow(doc, label, value, y, idx, vColor) {
  if (idx % 2 === 0) filled(doc, ML, y, CW, RH, C.rowEven);
  txt(doc, label + ":", ML + 8,  y + (RH - 9) / 2, { width: LW }, "Helvetica-Bold", 9, C.textMid);
  txt(doc, String(value ?? "—"), VX, y + (RH - 9) / 2,
      { width: CW - LW - 14 }, "Helvetica", 9, vColor || C.textDark);
  return y + RH;
}

/* ── Probability bar row ─────────────────────────────────────────── */
function probBar(doc, label, pct, y, idx, isTop) {
  const BAR_X = ML + 160;
  const BAR_W = CW - 160 - 44;
  const BAR_H = 8;
  const BY    = y + (RH - BAR_H) / 2;
  const fillW = Math.max(2, Math.round(BAR_W * pct / 100));

  if (idx % 2 === 0) filled(doc, ML, y, CW, RH, C.rowEven);

  txt(doc, label, ML + 8, y + (RH - 9) / 2,
      { width: 150 }, isTop ? "Helvetica-Bold" : "Helvetica", 9, isTop ? C.accent : C.textDark);

  filled(doc, BAR_X, BY, BAR_W, BAR_H, C.barTrack);
  filled(doc, BAR_X, BY, fillW, BAR_H, isTop ? C.barFill : C.barAlt);

  txt(doc, `${pct.toFixed(1)}%`, BAR_X + BAR_W + 5, y + (RH - 8) / 2,
      {}, isTop ? "Helvetica-Bold" : "Helvetica", 8, C.textDark);

  return y + RH;
}

/* ── Horizontal rule ─────────────────────────────────────────────── */
function rule(doc, y, color) {
  doc.moveTo(ML, y).lineTo(PW - MR, y)
     .strokeColor(color || "#e2e8f0").lineWidth(0.5).stroke();
  return y + 8;
}

/* ── Confidence visual bar ───────────────────────────────────────── */
function confidenceBar(doc, pct, x, y, w, h) {
  const fillW = Math.round(w * pct / 100);
  roundRect(doc, x, y, w, h, 3, C.barTrack, null);
  roundRect(doc, x, y, fillW, h, 3, C.barFill, null);
  txt(doc, `${pct.toFixed(1)}%`, x + w + 6, y + (h - 8) / 2,
      {}, "Helvetica-Bold", 9, C.accent);
}

/* ── Map normaliser ──────────────────────────────────────────────── */
function toEntries(raw) {
  if (!raw) return [];
  if (typeof raw.entries === "function") return [...raw.entries()];
  return Object.entries(raw);
}

/* ── Route ───────────────────────────────────────────────────────── */
router.get("/download-report/:predictionId", protect, async (req, res, next) => {
  try {
    const pred = await Prediction.findOne({
      _id: req.params.predictionId, userId: req.user._id,
    });
    if (!pred) return res.status(404).json({ error: "Prediction not found." });

    const { inputData: inp, result: r } = pred;
    const userName  = req.user.name  || "Patient";
    const userEmail = req.user.email || "";

    const probEntries = toEntries(r.allProbabilities).sort((a, b) => b[1] - a[1]);
    const confPct = parseFloat((r.confidence * 100).toFixed(1));

    /* ── Create document ─────────────────────────────────────────── */
    const doc = new PDFDocument({
      margin: 0, size: "A4", autoFirstPage: true,
      info: { Title: "SleepSense AI Report", Author: "SleepSense AI" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition",
      `attachment; filename="SleepSense_Report_${pred._id}.pdf"`);
    doc.pipe(res);

    /* ════════════════════════════════════════════════════════════════
       HEADER  (dark gradient banner)
    ════════════════════════════════════════════════════════════════ */
    const HDR = 100;
    filled(doc, 0, 0, PW, HDR, C.bg);

    // left accent bar
    filled(doc, 0, 0, 5, HDR, C.accent);

    // Logo moon icon (circle + crescent)
    doc.circle(ML + 18, 32, 14).fill(C.card);
    doc.circle(ML + 23, 27, 10).fill(C.bg);

    txt(doc, "SleepSense", ML + 38, 18, {}, "Helvetica-Bold", 24, C.accentLt);
    txt(doc, "AI",          ML + 38 + doc.widthOfString("SleepSense", { fontSize: 24 }) + 4,
        22, {}, "Helvetica-Bold", 18, C.cyan);

    txt(doc, "Sleep Disorder Diagnostic Report",
        ML + 38, 48, {}, "Helvetica", 10, "#94a3b8");
    txt(doc, "For educational purposes only  ·  Not a substitute for medical advice",
        ML + 38, 63, {}, "Helvetica", 7.5, "#4b6080");
    txt(doc, `Generated: ${new Date().toLocaleString("en-US",{
        year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"
      })}`, ML + 38, 75, {}, "Helvetica", 7.5, "#4b6080");

    // Patient chip (right side)
    const chipW = 160, chipH = 36, chipX = PW - MR - chipW, chipY = 32;
    roundRect(doc, chipX, chipY, chipW, chipH, 8, "#0f2040", C.cardBdr);
    txt(doc, "PATIENT", chipX + 10, chipY + 7, {}, "Helvetica-Bold", 6.5, C.accent);
    txt(doc, userName,  chipX + 10, chipY + 18,
        { width: chipW - 20 }, "Helvetica-Bold", 9, C.white);

    // Thin separator line
    filled(doc, 0, HDR, PW, 2, C.accent);

    let y = HDR + 14;

    /* ════════════════════════════════════════════════════════════════
       AI RESULT CARD  (highlighted box at top)
    ════════════════════════════════════════════════════════════════ */
    const riskColor = RISK_COLOR[r.risk] || C.textDark;
    const riskBg    = RISK_BG[r.risk]   || "#f8fafc";

    const CARD_H = 72;
    roundRect(doc, ML, y, CW, CARD_H, 8, "#0d1f35", C.cardBdr);
    filled(doc, ML, y, 4, CARD_H, riskColor);   // left risk stripe

    // Disorder name
    txt(doc, "PREDICTED DISORDER", ML + 14, y + 9, {}, "Helvetica-Bold", 6.5, C.textLight);
    txt(doc, r.disorder || "Unknown", ML + 14, y + 20,
        {}, "Helvetica-Bold", 18, C.accentLt);

    // Risk badge
    const BDGX = ML + 14, BDGY = y + 45;
    const riskLbl = ` ${r.risk} Risk `;
    const riskLblW = doc.font("Helvetica-Bold").fontSize(8).widthOfString(riskLbl) + 10;
    roundRect(doc, BDGX, BDGY - 2, riskLblW, 16, 4, riskBg, null);
    txt(doc, riskLbl, BDGX + 5, BDGY + 1, {}, "Helvetica-Bold", 8, riskColor);

    // Confidence bar
    const CB_X = ML + 160, CB_Y = y + 14, CB_W = CW - 170, CB_H = 14;
    txt(doc, "CONFIDENCE SCORE", CB_X, CB_Y - 10, {}, "Helvetica-Bold", 6.5, C.textLight);
    confidenceBar(doc, confPct, CB_X, CB_Y, CB_W, CB_H);

    // Analysis time
    txt(doc,
      `Analysed: ${new Date(r.analyzedAt).toLocaleString("en-US",{
        month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"
      })}`,
      CB_X, CB_Y + CB_H + 8, {}, "Helvetica", 7.5, C.textMid);

    y += CARD_H + 12;

    /* ════════════════════════════════════════════════════════════════
       TWO-COLUMN LAYOUT  (patient info | sleep data)
    ════════════════════════════════════════════════════════════════ */
    const COL_W2 = (CW - 8) / 2;
    const COL2_X = ML + COL_W2 + 8;

    // Section headers
    const COL_SEC_H = 22;
    // Left: Patient Info
    filled(doc, ML, y, COL_W2, COL_SEC_H, C.card);
    filled(doc, ML, y, 3, COL_SEC_H, C.accent);
    txt(doc, "Patient Information", ML + 10, y + (COL_SEC_H - 9) / 2,
        {}, "Helvetica-Bold", 9, C.accentLt);
    // Right: Sleep Data
    filled(doc, COL2_X, y, COL_W2, COL_SEC_H, C.card);
    filled(doc, COL2_X, y, 3, COL_SEC_H, C.cyan);
    txt(doc, "Sleep Assessment Data", COL2_X + 10, y + (COL_SEC_H - 9) / 2,
        {}, "Helvetica-Bold", 9, "#22d3ee");

    y += COL_SEC_H;

    const patData = [
      ["Name",   userName],
      ["Email",  userEmail],
      ["Age",    `${inp.age} yrs`],
      ["Gender", (inp.gender || "").charAt(0).toUpperCase() + (inp.gender || "").slice(1)],
      ["ID",     pred._id.toString().slice(-10) + "…"],
      ["Date",   new Date(pred.createdAt).toLocaleDateString("en-US",
                   { month: "short", day: "numeric", year: "numeric" })],
    ];
    const sleepData = [
      ["Sleep Duration",    `${inp.sleepDuration} hrs / night`],
      ["Stress Level",      `${inp.stressLevel} / 10`],
      ["BMI",               `${parseFloat(inp.bmi || 0).toFixed(1)}`],
      ["Heart Rate",        `${inp.heartRate} bpm`],
      ["Physical Activity", `${inp.physicalActivity} min/day`],
      ["Snoring",           `${inp.snoringFrequency} / 10`],
      ["Daytime Sleepiness",`${inp.daytimeSleepiness} / 10`],
      ["Sleep Interruptions",`${inp.sleepInterruptions} / night`],
    ];

    const MINI_RH = 17;
    const maxRows = Math.max(patData.length, sleepData.length);
    const startY  = y;

    for (let i = 0; i < maxRows; i++) {
      const rowY = startY + i * MINI_RH;
      // Left column row bg
      if (i % 2 === 0) filled(doc, ML, rowY, COL_W2, MINI_RH, C.rowEven);
      if (patData[i]) {
        txt(doc, patData[i][0] + ":", ML + 6, rowY + (MINI_RH - 8) / 2,
            { width: 55 }, "Helvetica-Bold", 8, C.textMid);
        txt(doc, String(patData[i][1] ?? "—"), ML + 66, rowY + (MINI_RH - 8) / 2,
            { width: COL_W2 - 74 }, "Helvetica", 8, C.textDark);
      }
      // Right column row bg
      if (i % 2 === 0) filled(doc, COL2_X, rowY, COL_W2, MINI_RH, C.rowEven);
      if (sleepData[i]) {
        txt(doc, sleepData[i][0] + ":", COL2_X + 6, rowY + (MINI_RH - 8) / 2,
            { width: 100 }, "Helvetica-Bold", 8, C.textMid);
        txt(doc, String(sleepData[i][1] ?? "—"), COL2_X + 112, rowY + (MINI_RH - 8) / 2,
            { width: COL_W2 - 118 }, "Helvetica", 8, C.textDark);
      }
    }

    y = startY + maxRows * MINI_RH + 12;

    /* ════════════════════════════════════════════════════════════════
       PROBABILITY BREAKDOWN
    ════════════════════════════════════════════════════════════════ */
    if (probEntries.length > 0) {
      y = secHeader(doc, "Disorder Probability Breakdown", y);
      probEntries.forEach(([disorder, prob], i) => {
        y = probBar(doc, disorder, prob * 100, y, i, disorder === r.disorder);
      });
      y += 10;
    }

    /* ════════════════════════════════════════════════════════════════
       HEALTH RECOMMENDATIONS
    ════════════════════════════════════════════════════════════════ */
    if (r.recommendations?.length) {
      y = secHeader(doc, "Health Recommendations", y);

      r.recommendations.forEach((rec, i) => {
        // Estimate height needed for this recommendation
        const estLines = Math.ceil(rec.length / 85) + 1;
        const estH = estLines * 11 + 8;

        if (i % 2 === 0) filled(doc, ML, y, CW, Math.max(RH, estH), C.rowEven);

        // Numbered bullet
        const numCircleX = ML + 10, numCircleY = y + 6;
        doc.circle(numCircleX, numCircleY + 4, 7).fill(C.accent);
        txt(doc, String(i + 1), numCircleX - 2.5, numCircleY,
            {}, "Helvetica-Bold", 8, C.white);

        // Recommendation text — use lineBreak: true here
        doc.font("Helvetica").fontSize(9).fillColor(C.textDark)
           .text(rec, ML + 24, y + 5, { width: CW - 32, lineBreak: true });
        y = doc.y + 6;
      });
      y += 8;
    }

    /* ════════════════════════════════════════════════════════════════
       DISCLAIMER  (before footer, not at hardcoded Y)
    ════════════════════════════════════════════════════════════════ */
    y = rule(doc, y + 4, "#c4d4e8");
    filled(doc, ML, y, CW, 26, "#fefce8");
    doc.rect(ML, y, CW, 26).stroke("#fde68a");
    doc.font("Helvetica").fontSize(7.5).fillColor("#92400e")
       .text(
         "⚠  DISCLAIMER: For EDUCATIONAL PURPOSES ONLY. NOT a medical diagnosis. " +
         "Always consult a qualified healthcare provider for sleep-related concerns.",
         ML + 8, y + 5, { width: CW - 16, lineBreak: true }
       );
    y = doc.y + 14;

    /* ════════════════════════════════════════════════════════════════
       FOOTER  — drawn at bottom of content (not hardcoded Y=818)
    ════════════════════════════════════════════════════════════════ */
    const FTR_H = 28;
    const FTR_Y = Math.min(y + 6, PH - FTR_H);  // never overflow page
    filled(doc, 0, FTR_Y, PW, FTR_H, C.card);
    filled(doc, 0, FTR_Y, PW, 2, C.accent);
    txt(doc, "SleepSense AI Platform  ·  Educational Use Only  ·  Not a Medical Device",
        0, FTR_Y + 10, { width: PW, align: "center" }, "Helvetica", 8, "#4b6080");

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
