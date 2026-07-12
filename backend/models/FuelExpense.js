// =====================================================================
// FILE: models/FuelExpense.js
// MODULE: FUEL (Fuel & Expense Management — Screen 6)
// Two schemas in one file since they're small and always used together.
// =====================================================================

const mongoose = require("mongoose");

// Screen 6 "FUEL LOGS" table
const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    date: { type: Date, required: true },
    liters: { type: Number, required: true, min: 0 },
    fuelCost: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Screen 6 "OTHER EXPENSES (TOLL / MISC)" table
const expenseSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    toll: { type: Number, default: 0, min: 0 },
    other: { type: Number, default: 0, min: 0 },
    // Snapshot of linked maintenance cost, shown in Screen 6 "MAINT. (LINKED)" column
    maintenanceLinked: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = {
  FuelLog: mongoose.model("FuelLog", fuelLogSchema),
  Expense: mongoose.model("Expense", expenseSchema),
};
