// =====================================================================
// FILE: models/Trip.js
// MODULE: TRP (Trip Dispatcher — Screen 4)
// This is the most important entity in the app — the state machine
// (Draft -> Dispatched -> Completed / Cancelled) lives in the
// controller (tripController.js), NOT here. This file is schema only.
// =====================================================================

const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    // Human-readable trip code shown on Screen 4 Live Board, e.g. "TR001"
    // Generated in FN-TRP-01 createTrip.
    tripCode: { type: String, required: true, unique: true },

    source: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },

    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },

    // Validated against vehicle.maxLoadKg in FN-TRP-03 dispatchTrip
    cargoWeightKg: { type: Number, required: true, min: 0 },

    plannedDistanceKm: { type: Number, required: true, min: 0 },

    // Filled in by FN-TRP-04 completeTrip
    actualDistanceKm: { type: Number, default: null },
    fuelConsumedLiters: { type: Number, default: null },

    // Trip lifecycle shown as the stepper on Screen 4.
    // Transitions ONLY happen through:
    //   FN-TRP-01 createTrip    -> "Draft"
    //   FN-TRP-03 dispatchTrip  -> "Dispatched"
    //   FN-TRP-04 completeTrip  -> "Completed"
    //   FN-TRP-05 cancelTrip    -> "Cancelled"
    // Never set trip.status directly anywhere else — always go through
    // the controller functions above so vehicle/driver stay in sync.
    status: {
      type: String,
      enum: ["Draft", "Dispatched", "Completed", "Cancelled"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trip", tripSchema);
