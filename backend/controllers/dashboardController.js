// =====================================================================
// FILE: controllers/dashboardController.js
// MODULE: DSB (Dashboard — Screen 1)
// FUNCTIONS IN THIS FILE:
//   FN-DSB-01  getDashboardKPIs    - compute dashboard counts and chart stats
// =====================================================================

const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");

/**
 * FN-DSB-01 — getDashboardKPIs
 * ------------------------------------------------------------------
 * WHAT IT DOES : Computes dashboard KPIs: active/available/maintenance vehicles,
 *                 active/pending trips, drivers on duty, and fleet utilization %.
 *                 Also returns the top 5 recent trips and status breakdown counts
 *                 for the vehicle status chart.
 * PAGE          : Dashboard (Screen 1)
 * INPUT         : none
 * OUTPUT        : 200 -> { kpis, recentTrips, statusBreakdown }
 * SIDE EFFECTS  : none (read-only)
 * THROWS        : none expected
 * ------------------------------------------------------------------
 */
async function getDashboardKPIs(req, res, next) {
  try {
    // 1. KPI Counts
    const activeVehicles = await Vehicle.countDocuments({ status: "On Trip" });
    const availableVehicles = await Vehicle.countDocuments({ status: "Available" });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: "In Shop" });
    const retiredVehicles = await Vehicle.countDocuments({ status: "Retired" });

    const activeTrips = await Trip.countDocuments({ status: "Dispatched" });
    const pendingTrips = await Trip.countDocuments({ status: "Draft" });
    
    // Drivers on duty = Available + On Trip (not Suspended or Off Duty)
    const driversOnDuty = await Driver.countDocuments({ status: { $in: ["Available", "On Trip"] } });

    // Fleet utilization % = Active Vehicles / (Active + Available + In Shop)
    const activePool = activeVehicles + availableVehicles + maintenanceVehicles;
    const fleetUtilization = activePool > 0 ? ((activeVehicles / activePool) * 100).toFixed(1) : "0.0";

    const kpis = {
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization: `${fleetUtilization}%`,
    };

    // 2. Recent Trips
    const recentTrips = await Trip.find()
      .populate("vehicle", "regNumber name maxLoadKg status")
      .populate("driver", "name status")
      .sort({ createdAt: -1 })
      .limit(6);

    // 3. Status Breakdown for chart
    const statusBreakdown = {
      Available: availableVehicles,
      "On Trip": activeVehicles,
      "In Shop": maintenanceVehicles,
      Retired: retiredVehicles,
    };

    res.status(200).json({
      success: true,
      kpis,
      recentTrips,
      statusBreakdown,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardKPIs };
