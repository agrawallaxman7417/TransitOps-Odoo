// =====================================================================
// FILE: server.js
// MODULE: CORE
// Entry point — wires DB connection, routes, and the central error
// handler together. Add new route files here as you build more screens.
// =====================================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");
const errorHandler = require("./middleware/errorHandler"); // FN-CORE-01

const app = express();
app.use(cors());
app.use(express.json());

// --- Screen 0: Authentication (no verifyToken needed on these) ---
app.use("/api/auth", authRoutes);

// --- Screen 4: Trip Dispatcher ---
// TODO: add verifyToken + requireRole(["Dispatcher"]) once frontend
// is passing the JWT on every request (see middleware/checkRole.js)
app.use("/api/trips", tripRoutes);

// Central error handler — MUST be last, after all routes.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/transitops";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("[FN-CORE] MongoDB connected");
    app.listen(PORT, () => console.log(`[FN-CORE] Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("[FN-CORE] MongoDB connection failed:", err.message);
  });
