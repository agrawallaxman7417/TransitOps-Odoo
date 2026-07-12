// =====================================================================
// FILE: controllers/vehicleController.js
// MODULE: VEH (Vehicle Registry — Screen 2)
// FUNCTIONS IN THIS FILE:
//   FN-VEH-01  createVehicle     - register a new vehicle
//   FN-VEH-02  listVehicles      - query vehicles with filters and search
//   FN-VEH-03  retireVehicle     - mark a vehicle as Retired
// =====================================================================

const Vehicle = require("../models/Vehicle");
const AppError = require("../utils/AppError");

/**
 * FN-VEH-01 — createVehicle
 * ------------------------------------------------------------------
 * WHAT IT DOES : Registers a new vehicle in the system. Ensures regNumber is
 *                 unique (checked server-side). Sets initial status to Available.
 * PAGE          : Vehicle Registry (Screen 2) — "+ ADD VEHICLE" form
 * INPUT         : req.body = { regNumber, name, type, maxLoadKg, acquisitionCost, odometer }
 * OUTPUT        : 201 -> { vehicle }
 * SIDE EFFECTS  : Writes one document to Vehicle collection.
 * THROWS        : 400 [FN-VEH-01] createVehicle: "Missing required vehicle fields"
 *                 400 [FN-VEH-01] createVehicle: "Registration number '<regNumber>' already registered"
 * ------------------------------------------------------------------
 */
async function createVehicle(req, res, next) {
  try {
    const { regNumber, name, type, maxLoadKg, acquisitionCost, odometer } = req.body;

    if (!regNumber || !name || !type || maxLoadKg == null || acquisitionCost == null) {
      throw new AppError(400, "[FN-VEH-01] createVehicle: Missing required vehicle fields");
    }

    const trimmedReg = regNumber.trim();
    const existing = await Vehicle.findOne({ regNumber: { $regex: new RegExp(`^${trimmedReg}$`, "i") } });
    if (existing) {
      throw new AppError(400, `[FN-VEH-01] createVehicle: Registration number '${trimmedReg}' already registered`);
    }

    const vehicle = await Vehicle.create({
      regNumber: trimmedReg,
      name,
      type,
      maxLoadKg,
      acquisitionCost,
      odometer: odometer || 0,
      status: "Available",
    });

    res.status(201).json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-VEH-02 — listVehicles
 * ------------------------------------------------------------------
 * WHAT IT DOES : Returns the list of vehicles filtered by type and status,
 *                 and optionally searched by registration number.
 * PAGE          : Vehicle Registry (Screen 2), Dashboard (Screen 1)
 * INPUT         : req.query = { type, status, search }
 * OUTPUT        : 200 -> { vehicles: [...] }
 * SIDE EFFECTS  : none (read-only)
 * THROWS        : none expected
 * ------------------------------------------------------------------
 */
async function listVehicles(req, res, next) {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.regNumber = { $regex: req.query.search, $options: "i" };
    }

    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, vehicles });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-VEH-03 — retireVehicle
 * ------------------------------------------------------------------
 * WHAT IT DOES : Sets a vehicle's status to "Retired" so it cannot be
 *                 dispatched or put in shop anymore.
 * PAGE          : Vehicle Registry (Screen 2)
 * INPUT         : req.params.vehicleId (string)
 * OUTPUT        : 200 -> { vehicle }
 * SIDE EFFECTS  : Vehicle.status -> "Retired"
 * THROWS        : 404 [FN-VEH-03] retireVehicle: "Vehicle not found"
 *                 400 [FN-VEH-03] retireVehicle: "Cannot retire a vehicle that is currently On Trip"
 * ------------------------------------------------------------------
 */
async function retireVehicle(req, res, next) {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) throw new AppError(404, "[FN-VEH-03] retireVehicle: Vehicle not found");

    if (vehicle.status === "On Trip") {
      throw new AppError(400, "[FN-VEH-03] retireVehicle: Cannot retire a vehicle that is currently On Trip");
    }

    vehicle.status = "Retired";
    await vehicle.save();

    res.status(200).json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
}

module.exports = { createVehicle, listVehicles, retireVehicle };
