const express = require("express");
const tf = require("@tensorflow/tfjs-node");
const router = express.Router();

const Prediction = require("../models/Prediction");

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "predict" });
});

router.get("/ready", (req, res) => {
  const model = req.app.locals.model;
  if (!model) return res.status(503).json({ ready: false });
  res.json({ ready: true });
});

// ✅ PREDICT REAL + GUARDAR EN MONGO
router.post("/predict", async (req, res) => {
  try {
    const model = req.app.locals.model;
    if (!model) {
      return res
        .status(503)
        .json({ ready: false, message: "Model is not loaded" });
    }

    const { features, meta } = req.body;

    // 1) Validaciones
    if (!Array.isArray(features)) {
      return res.status(400).json({ message: "features must be an array" });
    }

    if (features.length !== 7) {
      return res.status(400).json({ message: "features must have length 7" });
    }

    for (const v of features) {
      if (typeof v !== "number" || !Number.isFinite(v)) {
        return res
          .status(400)
          .json({ message: "features must contain only finite numbers" });
      }
    }

    if (meta && meta.featureCount !== undefined && meta.featureCount !== 7) {
      return res.status(400).json({ message: "meta.featureCount must be 7" });
    }

    const t0 = Date.now();

    // 2) Tensor [1,7]
    const input = tf.tensor2d([features], [1, 7], "float32");

    // 3) Predicción
    const output = model.predict(input);
    const predArray = await output.data();
    const prediction = predArray[0];

    // 4) Limpiar tensores
    input.dispose();
    output.dispose();

    const latencyMs = Date.now() - t0;

    // 5) Guardar en Mongo
    const doc = await Prediction.create({
      dataId: meta?.dataId ?? null,
      features,
      prediction,
      latencyMs,
      meta: meta ?? {}
    });

    // 6) Responder (con predictionId)
    return res.status(201).json({
      predictionId: doc._id,
      prediction: doc.prediction,
      timestamp: doc.createdAt,
      latencyMs: doc.latencyMs
    });
  } catch (err) {
    console.error("Error en /predict:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
