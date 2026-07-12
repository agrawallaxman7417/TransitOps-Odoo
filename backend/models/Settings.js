// =====================================================================
// FILE: models/Settings.js
// MODULE: CFG (Settings — Screen 8)
// =====================================================================

const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // Screen 8 fields
    depotName: { type: String, default: "Gandhinagar Depot GJ4", trim: true },
    currency: { type: String, default: "INR (Rs)", trim: true },
    distanceUnit: { type: String, default: "Kilometers", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
