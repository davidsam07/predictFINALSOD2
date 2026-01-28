require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const tf = require("@tensorflow/tfjs-node");
const path = require("path");

const predictRoutes = require("./routes/predictRoutes");

const PORT = process.env.PORT || 3002;

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prediction_db";

const app = express();

app.use(express.json());

// (Opcional) Servir carpeta del modelo
const modelDir = path.resolve(__dirname, "model");
app.use("/model", express.static(modelDir));

async function loadModel() {
  try {
    console.log("Cargando modelo TFJS...");
    const model = await tf.loadGraphModel("file://" + __dirname + "/model/model.json");
    app.locals.model = model; // 👈 aquí lo guardamos
    console.log("✅ Modelo cargado correctamente");
  } catch (error) {
    console.error("❌ Error cargando el modelo:", error);
    app.locals.model = null;
  }
}

// Rutas del servicio
app.use("/", predictRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB:", MONGO_URI))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));

app.listen(PORT, async () => {
  console.log(`Predict service running on port ${PORT}`);
  await loadModel();
});
