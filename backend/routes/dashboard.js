const express     = require("express");
const { protect } = require("../middleware/auth");
const Prediction  = require("../models/Prediction");

const router = express.Router();

function mapToObj(val) {
  if (!val) return {};
  if (val instanceof Map) return Object.fromEntries(val);
  if (typeof val.toObject === "function") return val.toObject();
  return val;
}

function serializeDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject({ virtuals: false });
  if (obj.result?.allProbabilities) {
    obj.result.allProbabilities = mapToObj(obj.result.allProbabilities);
  }
  return obj;
}

// GET /api/dashboard/stats
router.get("/stats", protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [total, latestDoc, disorderAgg, riskAgg, trendDocs, recentInputs] =
      await Promise.all([
        Prediction.countDocuments({ userId }),
        Prediction.findOne({ userId }).sort({ createdAt: -1 }),
        Prediction.aggregate([
          { $match: { userId } },
          { $group: { _id: "$result.disorder", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Prediction.aggregate([
          { $match: { userId } },
          { $group: { _id: "$result.risk", count: { $sum: 1 } } },
        ]),
        Prediction.find({ userId })
          .sort({ createdAt: -1 })
          .limit(7)
          .select("result.disorder result.risk result.confidence createdAt"),
        Prediction.find({ userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("inputData.sleepDuration inputData.stressLevel"),
      ]);

    const avgSleep = recentInputs.length
      ? recentInputs.reduce((s, p) => s + (p.inputData?.sleepDuration || 0), 0) /
        recentInputs.length
      : 0;
    const avgStress = recentInputs.length
      ? recentInputs.reduce((s, p) => s + (p.inputData?.stressLevel || 0), 0) /
        recentInputs.length
      : 0;

    res.json({
      total,
      latestPrediction: serializeDoc(latestDoc),
      disorderDistribution: disorderAgg.map((d) => ({ disorder: d._id, count: d.count })),
      riskDistribution:     riskAgg.map((r)     => ({ risk: r._id, count: r.count })),
      recentTrend:          trendDocs.map((d) => d.toObject({ virtuals: false })).reverse(),
      averages: {
        sleepDuration: Math.round(avgSleep  * 10) / 10,
        stressLevel:   Math.round(avgStress * 10) / 10,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
