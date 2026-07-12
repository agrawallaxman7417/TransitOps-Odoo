// =====================================================================
// FILE: models/Vehicle.js
// MODULE: VEH (Vehicle Registry — Screen 2)
// Mongoose schema only — no functions with side effects live here.
// Any DB writes happen in controllers/vehicleController.js.
// =====================================================================

const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    // Screen 2 column: "REG. NO. (UNIQUE)" — rule: must be unique
    regNumber: { type: String, required: true, unique: true, trim: true },

    // Screen 2 column: "NAME/MODEL"
    name: { type: String, required: true, trim: true },

    // Screen 2 column: "TYPE" e.g. Van, Truck, Mini
    type: { type: String, required: true, trim: true },

    // Screen 2 column: "CAPACITY" — max load in kg, used by FN-TRP-01
    // to validate cargo weight against this value
    maxLoadKg: { type: Number, required: true, min: 0 },

    // Screen 2 column: "ODOMETER" — updated by FN-TRP-04 (completeTrip)
    odometer: { type: Number, default: 0, min: 0 },

    // Screen 2 column: "ACQ. COST" — used in FN-RPT ROI calculation
    acquisitionCost: { type: Number, required: true, min: 0 },

    // Screen 2 status badge. Auto-transitioned by:
    //   FN-TRP-03 dispatchTrip     -> "On Trip"
    //   FN-TRP-04 completeTrip     -> "Available"
    //   FN-TRP-05 cancelTrip       -> "Available"
    //   FN-MNT-01 createMaintenance -> "In Shop"
    //   FN-MNT-02 closeMaintenance  -> "Available" (unless Retired)
    status: {
      type: String,
      enum: ["Available", "On Trip", "In Shop", "Retired"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
