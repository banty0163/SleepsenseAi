const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },

    // ── Input features ────────────────────────────────────────────────────────
    inputData: {
      age:                 { type: Number, required: true },
      gender:              { type: String, required: true },
      sleepDuration:       { type: Number, required: true },
      stressLevel:         { type: Number, required: true },
      bmi:                 { type: Number, required: true },
      heartRate:           { type: Number, required: true },
      physicalActivity:    { type: Number, required: true },
      snoringFrequency:    { type: Number, required: true },
      daytimeSleepiness:   { type: Number, required: true },
      sleepInterruptions:  { type: Number, required: true },
    },

    // ── AI prediction output ──────────────────────────────────────────────────
    result: {
      disorder:         { type: String, required: true },
      risk:             { type: String, enum: ["Low", "Medium", "High"], required: true },
      confidence:       { type: Number, required: true, min: 0, max: 1 },
      recommendations:  [{ type: String }],
      allProbabilities: { type: Map, of: Number },
      analyzedAt:       { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

// Index for efficient user history queries
predictionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Prediction", predictionSchema);
