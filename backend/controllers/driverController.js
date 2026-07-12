// =====================================================================
// FILE: controllers/driverController.js
// MODULE: DRV (Drivers & Safety Profiles — Screen 3)
// FUNCTIONS IN THIS FILE:
//   FN-DRV-01  createDriver         - create a new driver profile
//   FN-DRV-02  listDrivers          - list drivers with filters and search
//   FN-DRV-03  toggleDriverStatus   - toggle or update driver status manually
// =====================================================================

const Driver = require("../models/Driver");
const AppError = require("../utils/AppError");

/**
 * FN-DRV-01 — createDriver
 * ------------------------------------------------------------------
 * WHAT IT DOES : Registers a new driver. Ensures licenseNumber is unique
 *                 server-side. Initial status defaults to Available.
 * PAGE          : Drivers & Safety Profiles (Screen 3) — "+ ADD DRIVER" form
 * INPUT         : req.body = { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore }
 * OUTPUT        : 201 -> { driver }
 * SIDE EFFECTS  : Writes one document to Driver collection.
 * THROWS        : 400 [FN-DRV-01] createDriver: "Missing required driver fields"
 *                 400 [FN-DRV-01] createDriver: "License number '<licenseNumber>' already registered"
 * ------------------------------------------------------------------
 */
async function createDriver(req, res, next) {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore } = req.body;

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiry || !contact) {
      throw new AppError(400, "[FN-DRV-01] createDriver: Missing required driver fields");
    }

    const trimmedLic = licenseNumber.trim();
    const existing = await Driver.findOne({ licenseNumber: { $regex: new RegExp(`^${trimmedLic}$`, "i") } });
    if (existing) {
      throw new AppError(400, `[FN-DRV-01] createDriver: License number '${trimmedLic}' already registered`);
    }

    const driver = await Driver.create({
      name,
      licenseNumber: trimmedLic,
      licenseCategory,
      licenseExpiry,
      contact,
      safetyScore: safetyScore != null ? safetyScore : 100,
      status: "Available",
    });

    res.status(201).json({ success: true, driver });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-DRV-02 — listDrivers
 * ------------------------------------------------------------------
 * WHAT IT DOES : Returns list of all drivers, optionally searched by name.
 * PAGE          : Drivers & Safety Profiles (Screen 3), Dashboard (Screen 1)
 * INPUT         : req.query = { search, status }
 * OUTPUT        : 200 -> { drivers: [...] }
 * SIDE EFFECTS  : none (read-only)
 * THROWS        : none expected
 * ------------------------------------------------------------------
 */
async function listDrivers(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, drivers });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-DRV-03 — toggleDriverStatus
 * ------------------------------------------------------------------
 * WHAT IT DOES : Allows manual status adjustment for driver (Available, Off Duty, Suspended).
 *                 Blocks manual change if driver is currently "On Trip".
 * PAGE          : Drivers & Safety Profiles (Screen 3) — Status toggle buttons
 * INPUT         : req.params.driverId (string), req.body = { status }
 * OUTPUT        : 200 -> { driver }
 * SIDE EFFECTS  : Writes update to Driver collection.
 * THROWS        : 404 [FN-DRV-03] toggleDriverStatus: "Driver not found"
 *                 400 [FN-DRV-03] toggleDriverStatus: "Cannot manually change status while driver is On Trip"
 *                 400 [FN-DRV-03] toggleDriverStatus: "Invalid status value"
 * ------------------------------------------------------------------
 */
async function toggleDriverStatus(req, res, next) {
  try {
    const { driverId } = req.params;
    const { status } = req.body;

    const allowed = ["Available", "Off Duty", "Suspended"];
    if (!status || !allowed.includes(status)) {
      throw new AppError(400, "[FN-DRV-03] toggleDriverStatus: Invalid status value");
    }

    const driver = await Driver.findById(driverId);
    if (!driver) throw new AppError(404, "[FN-DRV-03] toggleDriverStatus: Driver not found");

    if (driver.status === "On Trip") {
      throw new AppError(
        400,
        "[FN-DRV-03] toggleDriverStatus: Cannot manually change status while driver is On Trip"
      );
    }

    driver.status = status;
    await driver.save();

    res.status(200).json({ success: true, driver });
  } catch (err) {
    next(err);
  }
}

module.exports = { createDriver, listDrivers, toggleDriverStatus };
