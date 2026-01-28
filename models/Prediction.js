const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema(
  {
    dataId: { type: String, default: null },
    features: { type: [Number], required: true },
    prediction: { type: Number, required: true },
    latencyMs: { type: Number, default: null },
    meta: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prediction", PredictionSchema);
