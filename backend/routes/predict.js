const express    = require("express");
const axios      = require("axios");
const { body, validationResult } = require("express-validator");
const { protect }    = require("../middleware/auth");
const Prediction     = require("../models/Prediction");

const router = express.Router();
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

router.post(
  "/predict",
  protect,
  [
    body("age").isInt({ min: 5, max: 100 }).withMessage("Age must be 5–100"),
    body("gender").isIn([0, 1]).withMessage("Gender must be 0 or 1"),
    body("sleep_duration").isFloat({ min: 0, max: 24 }),
    body("stress_level").isInt({ min: 1, max: 10 }),
    body("bmi").isFloat({ min: 10, max: 60 }),
    body("heart_rate").isInt({ min: 30, max: 200 }),
    body("physical_activity").isInt({ min: 0, max: 180 }),
    body("snoring_frequency").isInt({ min: 0, max: 10 }),
    body("daytime_sleepiness").isInt({ min: 0, max: 10 }),
    body("sleep_interruptions").isInt({ min: 0, max: 10 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const {
        age, gender, sleep_duration, stress_level,
        bmi, heart_rate, physical_activity,
        snoring_frequency, daytime_sleepiness, sleep_interruptions,
      } = req.body;

      // call FastAPI
      let aiResult;
      try {
        const { data } = await axios.post(`${AI_URL}/predict`, {
          age, gender, sleep_duration, stress_level, bmi,
          heart_rate, physical_activity, snoring_frequency,
          daytime_sleepiness, sleep_interruptions,
        }, { timeout: 10000 });
        aiResult = data;
      } catch (aiErr) {
        console.error("AI service error:", aiErr.message);
        return res.status(503).json({
          error: "AI service unavailable. Make sure FastAPI is running on port 8000.",
        });
      }

      // Store allProbabilities as a plain object (not a Mongoose Map)
      // so downstream serialisation is trivial.
      const allProbsPlain = aiResult.all_probabilities
        ? { ...aiResult.all_probabilities }
        : {};

      const prediction = await Prediction.create({
        userId: req.user._id,
        inputData: {
          age,
          gender:              gender === 0 ? "female" : "male",
          sleepDuration:       sleep_duration,
          stressLevel:         stress_level,
          bmi,
          heartRate:           heart_rate,
          physicalActivity:    physical_activity,
          snoringFrequency:    snoring_frequency,
          daytimeSleepiness:   daytime_sleepiness,
          sleepInterruptions:  sleep_interruptions,
        },
        result: {
          disorder:         aiResult.disorder,
          risk:             aiResult.risk,
          confidence:       aiResult.confidence,
          recommendations:  aiResult.recommendations,
          allProbabilities: allProbsPlain,
          analyzedAt:       new Date(aiResult.analyzed_at),
        },
      });

      res.status(201).json({
        predictionId:     prediction._id,
        disorder:         aiResult.disorder,
        risk:             aiResult.risk,
        confidence:       aiResult.confidence,
        recommendations:  aiResult.recommendations,
        allProbabilities: allProbsPlain,
        analyzedAt:       aiResult.analyzed_at,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
