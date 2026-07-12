// =====================================================================
// FILE: models/Driver.js
// MODULE: DRV (Drivers & Safety Profiles — Screen 3)
// Mongoose schema only.
// =====================================================================

const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Screen 3 column: "LICENSE NO."
    licenseNumber: { type: String, required: true, unique: true, trim: true },

    // Screen 3 column: "CATEGORY" e.g. LMV, HMV
    licenseCategory: { type: String, required: true, trim: true },

    // Screen 3 column: "EXPIRY" — checked by FN-TRP-03 before dispatch.
    // Shown in red on Screen 3 if in the past.
    licenseExpiry: { type: Date, required: true },

    contact: { type: String, required: true, trim: true },

    // Screen 3 column: "SAFETY" score, 0-100
    safetyScore: { type: Number, default: 100, min: 0, max: 100 },

    // Screen 3 status badge. Auto-transitioned by:
    //   FN-TRP-03 dispatchTrip -> "On Trip"
    //   FN-TRP-04 completeTrip -> "Available"
    //   FN-TRP-05 cancelTrip   -> "Available"
    // "Suspended" and "Off Duty" are set manually (Safety Officer action).
    status: {
      type: String,
      enum: ["Available", "On Trip", "Off Duty", "Suspended"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);
