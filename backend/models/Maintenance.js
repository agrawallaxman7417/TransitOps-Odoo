// =====================================================================
// FILE: models/Maintenance.js
// MODULE: MNT (Maintenance — Screen 5)
// =====================================================================

const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },

    // Screen 5 column: "SERVICE" e.g. Oil Change, Engine Repair
    serviceType: { type: String, required: true, trim: true },

    // Screen 5 column: "COST" — feeds FN-FUEL-03 totalOperationalCost
    cost: { type: Number, required: true, min: 0 },

    date: { type: Date, required: true },

    // Screen 5 status badge.
    //   FN-MNT-01 createMaintenance -> "Active"  (also sets vehicle -> In Shop)
    //   FN-MNT-02 closeMaintenance  -> "Completed" (also sets vehicle -> Available)
    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Maintenance", maintenanceSchema);
