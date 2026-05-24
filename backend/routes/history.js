const express     = require("express");
const mongoose    = require("mongoose");
const { protect } = require("../middleware/auth");
const Prediction  = require("../models/Prediction");

const router = express.Router();

/** Convert a Mongoose Map (or plain object) to a regular JS object */
function mapToObj(val) {
  if (!val) return {};
  if (val instanceof Map) return Object.fromEntries(val);
  if (typeof val.toObject === "function") return val.toObject();
  return val;
}

/** Safely convert a prediction Mongoose doc to plain JSON */
function serialize(doc) {
  const obj = doc.toObject({ virtuals: false });
  if (obj.result && obj.result.allProbabilities) {
    obj.result.allProbabilities = mapToObj(obj.result.allProbabilities);
  }
  return obj;
}

// GET /api/history — paginated list
router.get("/", protect, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      Prediction.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Prediction.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      predictions: docs.map(serialize),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/history/:id — single record
router.get("/:id", protect, async (req, res, next) => {
  try {
    const doc = await Prediction.findOne({
      _id:    req.params.id,
      userId: req.user._id,
    });
    if (!doc) return res.status(404).json({ error: "Prediction not found." });
    res.json({ prediction: serialize(doc) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/history/:id
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const deleted = await Prediction.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user._id,
    });
    if (!deleted) return res.status(404).json({ error: "Record not found." });
    res.json({ message: "Deleted successfully." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
