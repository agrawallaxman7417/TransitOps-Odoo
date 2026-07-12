// =====================================================================
// FILE: controllers/maintenanceController.js
// MODULE: MNT (Maintenance — Screen 5)
// FUNCTIONS IN THIS FILE:
//   FN-MNT-01  createMaintenance - log a new service record
//   FN-MNT-02  closeMaintenance  - mark service complete
//   FN-MNT-03  listMaintenance   - fetch service log table
// =====================================================================

const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");
const AppError = require("../utils/AppError");

/**
 * FN-MNT-01 — createMaintenance
 * ------------------------------------------------------------------
 * WHAT IT DOES : Logs a new service record and immediately pulls the
 *                 vehicle out of the dispatch pool by setting it to
 *                 "In Shop". Matches Screen 5's diagram:
 *                 "Available --(creating active record)--> In Shop"
 * PAGE          : Maintenance (Screen 5) — "LOG SERVICE RECORD" form
 * INPUT         : req.body = { vehicleId, serviceType, cost, date }
 * OUTPUT        : 201 -> { maintenance, vehicle }
 * SIDE EFFECTS  : Vehicle.status -> "In Shop"
 *                 (this vehicle disappears from Trip Dispatcher's
 *                 vehicle dropdown on Screen 4 as a result)
 * THROWS        : 404 [FN-MNT-01] createMaintenance: "Vehicle not found"
 *                 400 [FN-MNT-01] createMaintenance: "Missing required maintenance fields"
 *                 400 [FN-MNT-01] createMaintenance: "Vehicle already has an active maintenance record"
 * ------------------------------------------------------------------
 */
async function createMaintenance(req, res, next) {
  try {
    const { vehicleId, serviceType, cost, date } = req.body;

    if (!vehicleId || !serviceType || cost == null || !date) {
      throw new AppError(400, "[FN-MNT-01] createMaintenance: Missing required maintenance fields");
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new AppError(404, "[FN-MNT-01] createMaintenance: Vehicle not found");

    const existingActive = await Maintenance.findOne({ vehicle: vehicleId, status: "Active" });
    if (existingActive) {
      throw new AppError(400, "[FN-MNT-01] createMaintenance: Vehicle already has an active maintenance record");
    }

    const maintenance = await Maintenance.create({
      vehicle: vehicleId,
      serviceType,
      cost,
      date,
      status: "Active",
    });

    vehicle.status = "In Shop";
    await vehicle.save();

    res.status(201).json({ success: true, maintenance, vehicle });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-MNT-02 — closeMaintenance
 * ------------------------------------------------------------------
 * WHAT IT DOES : Marks a service record Completed and restores the
 *                 vehicle to "Available" — UNLESS the vehicle has since
 *                 been marked Retired, in which case it stays Retired.
 *                 Matches Screen 5 diagram:
 *                 "In Shop --(closing record, back to Available)--> Available"
 * PAGE          : Maintenance (Screen 5)
 * INPUT         : req.params.maintenanceId (string)
 * OUTPUT        : 200 -> { maintenance, vehicle }
 * SIDE EFFECTS  : Vehicle.status -> "Available" (unless already "Retired")
 * THROWS        : 404 [FN-MNT-02] closeMaintenance: "Maintenance record not found"
 *                 400 [FN-MNT-02] closeMaintenance: "Maintenance record is already Completed"
 * ------------------------------------------------------------------
 */
async function closeMaintenance(req, res, next) {
  try {
    const { maintenanceId } = req.params;

    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance) throw new AppError(404, "[FN-MNT-02] closeMaintenance: Maintenance record not found");

    if (maintenance.status === "Completed") {
      throw new AppError(400, "[FN-MNT-02] closeMaintenance: Maintenance record is already Completed");
    }

    maintenance.status = "Completed";
    await maintenance.save();

    const vehicle = await Vehicle.findById(maintenance.vehicle);
    if (vehicle && vehicle.status !== "Retired") {
      vehicle.status = "Available";
      await vehicle.save();
    }

    res.status(200).json({ success: true, maintenance, vehicle });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-MNT-03 — listMaintenance
 * ------------------------------------------------------------------
 * WHAT IT DOES : Returns the Service Log table shown on Screen 5.
 * PAGE          : Maintenance (Screen 5)
 * INPUT         : none
 * OUTPUT        : 200 -> { records: [...] } (vehicle populated)
 * SIDE EFFECTS  : none (read-only)
 * THROWS        : none expected
 * ------------------------------------------------------------------
 */
async function listMaintenance(req, res, next) {
  try {
    const records = await Maintenance.find().populate("vehicle", "regNumber name").sort({ createdAt: -1 });
    res.status(200).json({ success: true, records });
  } catch (err) {
    next(err);
  }
}

module.exports = { createMaintenance, closeMaintenance, listMaintenance };
