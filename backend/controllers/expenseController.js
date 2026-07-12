// =====================================================================
// FILE: controllers/expenseController.js
// MODULE: FUEL (Fuel & Expense Management — Screen 6)
// FUNCTIONS IN THIS FILE:
//   FN-FUEL-01  logFuel             - record a new fuel log entry
//   FN-FUEL-02  addExpense          - record a general operational expense
//   FN-FUEL-03  getOperationalCosts - compute total operational expenses
// =====================================================================

const { FuelLog, Expense } = require("../models/FuelExpense");
const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const AppError = require("../utils/AppError");

/**
 * FN-FUEL-01 — logFuel
 * ------------------------------------------------------------------
 * WHAT IT DOES : Logs a fuel record for a vehicle, linked to an optional trip.
 * PAGE          : Fuel & Expense Management (Screen 6) — "+ LOG FUEL" form
 * INPUT         : req.body = { vehicleId, liters, fuelCost, date, tripId }
 * OUTPUT        : 201 -> { fuelLog }
 * SIDE EFFECTS  : Writes one document to FuelLog collection.
 * THROWS        : 400 [FN-FUEL-01] logFuel: "Missing required fuel log fields"
 *                 404 [FN-FUEL-01] logFuel: "Vehicle not found"
 * ------------------------------------------------------------------
 */
async function logFuel(req, res, next) {
  try {
    const { vehicleId, liters, fuelCost, date, tripId } = req.body;

    if (!vehicleId || liters == null || fuelCost == null || !date) {
      throw new AppError(400, "[FN-FUEL-01] logFuel: Missing required fuel log fields");
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new AppError(404, "[FN-FUEL-01] logFuel: Vehicle not found");

    const fuelLog = await FuelLog.create({
      vehicle: vehicleId,
      trip: tripId || null,
      date,
      liters,
      fuelCost,
    });

    res.status(201).json({ success: true, fuelLog });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-FUEL-02 — addExpense
 * ------------------------------------------------------------------
 * WHAT IT DOES : Logs toll or misc operational costs for a vehicle/trip.
 * PAGE          : Fuel & Expense Management (Screen 6) — "+ ADD EXPENSE" form
 * INPUT         : req.body = { vehicleId, tripId, toll, other, maintenanceLinked }
 * OUTPUT        : 201 -> { expense }
 * SIDE EFFECTS  : Writes one document to Expense collection.
 * THROWS        : 400 [FN-FUEL-02] addExpense: "Missing vehicle ID"
 *                 404 [FN-FUEL-02] addExpense: "Vehicle not found"
 * ------------------------------------------------------------------
 */
async function addExpense(req, res, next) {
  try {
    const { vehicleId, tripId, toll, other, maintenanceLinked } = req.body;

    if (!vehicleId) {
      throw new AppError(400, "[FN-FUEL-02] addExpense: Missing vehicle ID");
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new AppError(404, "[FN-FUEL-02] addExpense: Vehicle not found");

    const expense = await Expense.create({
      vehicle: vehicleId,
      trip: tripId || null,
      toll: toll || 0,
      other: other || 0,
      maintenanceLinked: maintenanceLinked || 0,
    });

    res.status(201).json({ success: true, expense });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-FUEL-03 — getOperationalCosts
 * ------------------------------------------------------------------
 * WHAT IT DOES : Computes total operational costs and lists all logs.
 * PAGE          : Fuel & Expense Management (Screen 6)
 * INPUT         : none
 * OUTPUT        : 200 -> { fuelLogs, expenses, totalFuelCost, totalTolls, totalOther, totalMaintenance, grandTotal }
 * SIDE EFFECTS  : none (read-only)
 * THROWS        : none expected
 * ------------------------------------------------------------------
 */
async function getOperationalCosts(req, res, next) {
  try {
    const fuelLogs = await FuelLog.find()
      .populate("vehicle", "regNumber name")
      .populate("trip", "tripCode")
      .sort({ date: -1 });

    const expenses = await Expense.find()
      .populate("vehicle", "regNumber name")
      .populate("trip", "tripCode")
      .sort({ createdAt: -1 });

    const maintenances = await Maintenance.find();

    let totalFuelCost = 0;
    fuelLogs.forEach((log) => {
      totalFuelCost += log.fuelCost;
    });

    let totalTolls = 0;
    let totalOther = 0;
    let totalMaintLinked = 0;
    expenses.forEach((exp) => {
      totalTolls += exp.toll;
      totalOther += exp.other;
      totalMaintLinked += exp.maintenanceLinked;
    });

    let totalMaintenance = 0;
    maintenances.forEach((m) => {
      totalMaintenance += m.cost;
    });

    const grandTotal = totalFuelCost + totalTolls + totalOther + totalMaintenance;

    res.status(200).json({
      success: true,
      fuelLogs,
      expenses,
      totalFuelCost,
      totalTolls,
      totalOther,
      totalMaintenance,
      grandTotal,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { logFuel, addExpense, getOperationalCosts };
