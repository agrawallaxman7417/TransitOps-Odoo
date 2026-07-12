// =====================================================================
// FILE: controllers/analyticsController.js
// MODULE: RPT (Reports & Analytics — Screen 7)
// FUNCTIONS IN THIS FILE:
//   FN-RPT-01  getAnalyticsSummary   - compute general ROI, fuel, cost KPIs
//   FN-RPT-02  getRevenueAndCosts    - monthly revenue/costs and costliest vehicles
// =====================================================================

const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const { FuelLog, Expense } = require("../models/FuelExpense");
const Maintenance = require("../models/Maintenance");

/**
 * FN-RPT-01 — getAnalyticsSummary
 * ------------------------------------------------------------------
 * WHAT IT DOES : Computes four key reports/analytics metrics:
 *                 1. Fuel Efficiency (average km per Liter across completed trips)
 *                 2. Fleet Utilization % (non-retired vehicles currently on trip)
 *                 3. Operational Cost (sum of fuel, tolls, maintenance, misc)
 *                 4. Vehicle ROI % = (Simulated Revenue - Vehicle Expenses) / Acquisition Cost
 * PAGE          : Reports & Analytics (Screen 7)
 * INPUT         : none
 * OUTPUT        : 200 -> { fuelEfficiency, fleetUtilization, operationalCost, vehicleROI }
 * SIDE EFFECTS  : none (read-only)
 * THROWS        : none expected
 * ------------------------------------------------------------------
 */
async function getAnalyticsSummary(req, res, next) {
  try {
    // 1. Fuel Efficiency
    const completedTrips = await Trip.find({ status: "Completed" });
    let totalDistance = 0;
    let totalFuelLiters = 0;
    completedTrips.forEach((t) => {
      if (t.actualDistanceKm) totalDistance += t.actualDistanceKm;
      if (t.fuelConsumedLiters) totalFuelLiters += t.fuelConsumedLiters;
    });
    const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : "0.00"; // km/L

    // 2. Fleet Utilization
    const totalVehicles = await Vehicle.countDocuments({ status: { $ne: "Retired" } });
    const activeVehicles = await Vehicle.countDocuments({ status: "On Trip" });
    const fleetUtilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : "0.0";

    // 3. Operational Costs
    const fuelLogs = await FuelLog.find();
    let totalFuelCost = 0;
    fuelLogs.forEach((f) => (totalFuelCost += f.fuelCost));

    const expenses = await Expense.find();
    let totalOtherCosts = 0;
    expenses.forEach((e) => (totalOtherCosts += e.toll + e.other));

    const maintenances = await Maintenance.find();
    let totalMaintCost = 0;
    maintenances.forEach((m) => (totalMaintCost += m.cost));

    const operationalCost = totalFuelCost + totalOtherCosts + totalMaintCost;

    // 4. Vehicle ROI
    // ROI = (Trip Revenue - Operational Cost) / Acquisition Cost
    // Trip Revenue is simulated at 50 INR per km
    const vehicles = await Vehicle.find({ status: { $ne: "Retired" } });
    let totalAcqCost = 0;
    vehicles.forEach((v) => (totalAcqCost += v.acquisitionCost));

    const tripRevenue = totalDistance * 50;
    const netProfit = tripRevenue - operationalCost;
    const vehicleROI = totalAcqCost > 0 ? ((netProfit / totalAcqCost) * 100).toFixed(1) : "0.0";

    res.status(200).json({
      success: true,
      fuelEfficiency: `${fuelEfficiency} km/L`,
      fleetUtilization: `${fleetUtilization}%`,
      operationalCost,
      vehicleROI: `${vehicleROI}%`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-RPT-02 — getRevenueAndCosts
 * ------------------------------------------------------------------
 * WHAT IT DOES : Prepares chart data:
 *                 - Monthly Revenue: Simulated at 50 INR per km of completed trips
 *                 - Top Costliest Vehicles: Top vehicles sorted by maintenance & fuel expenses
 * PAGE          : Reports & Analytics (Screen 7)
 * INPUT         : none
 * OUTPUT        : 200 -> { monthlyData: [...], costliestVehicles: [...] }
 * SIDE EFFECTS  : none (read-only)
 * THROWS        : none expected
 * ------------------------------------------------------------------
 */
async function getRevenueAndCosts(req, res, next) {
  try {
    const completedTrips = await Trip.find({ status: "Completed" });

    // Group revenue by month
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap = {};
    months.forEach((m) => (monthlyMap[m] = 0));

    completedTrips.forEach((t) => {
      const date = t.createdAt || new Date();
      const monthName = months[date.getMonth()];
      const revenue = (t.actualDistanceKm || 0) * 50;
      monthlyMap[monthName] += revenue;
    });

    const monthlyData = months.map((m) => ({
      month: m,
      revenue: monthlyMap[m],
    }));

    // Find costliest vehicles (fuel + maintenance + tolls)
    const vehicles = await Vehicle.find();
    const vehicleCosts = [];

    for (let vehicle of vehicles) {
      const fuel = await FuelLog.find({ vehicle: vehicle._id });
      const maint = await Maintenance.find({ vehicle: vehicle._id });
      const exp = await Expense.find({ vehicle: vehicle._id });

      let sum = 0;
      fuel.forEach((f) => (sum += f.fuelCost));
      maint.forEach((m) => (sum += m.cost));
      exp.forEach((e) => (sum += e.toll + e.other));

      vehicleCosts.push({
        regNumber: vehicle.regNumber,
        name: vehicle.name,
        operationalCost: sum,
        acquisitionCost: vehicle.acquisitionCost,
      });
    }

    // Sort by operational cost descending
    vehicleCosts.sort((a, b) => b.operationalCost - a.operationalCost);
    const costliestVehicles = vehicleCosts.slice(0, 5);

    res.status(200).json({
      success: true,
      monthlyData,
      costliestVehicles,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalyticsSummary, getRevenueAndCosts };
