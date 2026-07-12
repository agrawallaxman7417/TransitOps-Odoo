// =====================================================================
// FILE: controllers/tripController.js
// MODULE: TRP (Trip Dispatcher — Screen 4)
// This is the highest-risk file in the whole app. Every business rule
// from the problem statement's "Mandatory Business Rules" section lives
// here. If a demo breaks, check this file first.
//
// FUNCTIONS IN THIS FILE:
//   FN-TRP-01  createTrip     - create a new Draft trip
//   FN-TRP-02  listTrips      - fetch trips for Dashboard / Live Board
//   FN-TRP-03  dispatchTrip   - Draft -> Dispatched (the risky one)
//   FN-TRP-04  completeTrip   - Dispatched -> Completed
//   FN-TRP-05  cancelTrip     - Dispatched -> Cancelled
// =====================================================================

const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const { FuelLog, Expense } = require("../models/FuelExpense");
const AppError = require("../utils/AppError");

/**
 * FN-TRP-01 — createTrip
 * ------------------------------------------------------------------
 * WHAT IT DOES : Creates a new trip in "Draft" status. Does NOT touch
 *                 vehicle/driver status yet — that only happens on
 *                 dispatch (FN-TRP-03).
 * PAGE          : Trip Dispatcher (Screen 4) — "CREATE TRIP" form
 * INPUT         : req.body = { source, destination, vehicleId, driverId,
 *                               cargoWeightKg, plannedDistanceKm }
 * OUTPUT        : 201 -> { trip }
 * SIDE EFFECTS  : Writes one new document to Trip collection.
 * THROWS        : 400 [FN-TRP-01] createTrip: "Missing required trip fields"
 * ------------------------------------------------------------------
 */
async function createTrip(req, res, next) {
  try {
    const { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm } = req.body;

    if (!source || !destination || !cargoWeightKg || !plannedDistanceKm) {
      throw new AppError(400, "[FN-TRP-01] createTrip: Missing required trip fields");
    }

    // Auto-generate a simple sequential trip code, e.g. TR007
    const count = await Trip.countDocuments();
    const tripCode = `TR${String(count + 1).padStart(3, "0")}`;

    const trip = await Trip.create({
      tripCode,
      source,
      destination,
      vehicle: vehicleId || null,
      driver: driverId || null,
      cargoWeightKg,
      plannedDistanceKm,
      status: "Draft",
    });

    res.status(201).json({ success: true, trip });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-TRP-02 — listTrips
 * ------------------------------------------------------------------
 * WHAT IT DOES : Returns trips, optionally filtered by status. Used to
 *                 populate the Dashboard "RECENT TRIPS" table and the
 *                 Trip Dispatcher "LIVE BOARD".
 * PAGE          : Dashboard (Screen 1), Trip Dispatcher (Screen 4)
 * INPUT         : req.query.status (optional string)
 * OUTPUT        : 200 -> { trips: [...] } (vehicle & driver populated)
 * SIDE EFFECTS  : none (read-only)
 * THROWS        : none expected — DB errors bubble to central handler
 * ------------------------------------------------------------------
 */
async function listTrips(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const trips = await Trip.find(filter)
      .populate("vehicle", "regNumber name maxLoadKg status")
      .populate("driver", "name status licenseExpiry")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, trips });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-TRP-03 — dispatchTrip
 * ------------------------------------------------------------------
 * WHAT IT DOES : Moves a trip Draft -> Dispatched. Runs ALL the
 *                 mandatory business-rule checks before allowing it,
 *                 then flips vehicle & driver to "On Trip" together.
 * PAGE          : Trip Dispatcher (Screen 4) — red validation box +
 *                 "Dispatch" button
 * INPUT         : req.params.tripId (string)
 * OUTPUT        : 200 -> { trip, vehicle, driver } (all updated)
 * SIDE EFFECTS  : Vehicle.status -> "On Trip"
 *                 Driver.status  -> "On Trip"
 *                 (both writes happen only if ALL validations pass —
 *                 no partial updates)
 * THROWS        : 404 [FN-TRP-03] dispatchTrip: "Trip not found"
 *                 400 [FN-TRP-03] dispatchTrip: "Trip is not in Draft status"
 *                 400 [FN-TRP-03] dispatchTrip: "Trip has no vehicle or driver assigned"
 *                 400 [FN-TRP-03] dispatchTrip: "Vehicle is not Available"
 *                 400 [FN-TRP-03] dispatchTrip: "Driver is not Available"
 *                 400 [FN-TRP-03] dispatchTrip: "Driver license has expired"
 *                 400 [FN-TRP-03] dispatchTrip: "Cargo weight (Xkg) exceeds
 *                                                vehicle capacity (Ykg)"
 * ------------------------------------------------------------------
 */
async function dispatchTrip(req, res, next) {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) throw new AppError(404, "[FN-TRP-03] dispatchTrip: Trip not found");

    if (trip.status !== "Draft") {
      throw new AppError(400, "[FN-TRP-03] dispatchTrip: Trip is not in Draft status");
    }

    if (!trip.vehicle || !trip.driver) {
      throw new AppError(400, "[FN-TRP-03] dispatchTrip: Trip has no vehicle or driver assigned");
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    // --- Rule: vehicle must be Available (Retired/In Shop vehicles are
    //     already filtered out of the dropdown on Screen 4, but we
    //     re-validate server-side in case of stale UI state) ---
    if (!vehicle || vehicle.status !== "Available") {
      throw new AppError(400, "[FN-TRP-03] dispatchTrip: Vehicle is not Available");
    }

    // --- Rule: driver must be Available (not On Trip/Off Duty/Suspended) ---
    if (!driver || driver.status !== "Available") {
      throw new AppError(400, "[FN-TRP-03] dispatchTrip: Driver is not Available");
    }

    // --- Rule: driver license must not be expired ---
    if (driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date()) {
      throw new AppError(400, "[FN-TRP-03] dispatchTrip: Driver license has expired");
    }

    // --- Rule: cargo weight must not exceed vehicle max load ---
    // This is the exact error shown in the Screen 4 wireframe's red box.
    if (trip.cargoWeightKg > vehicle.maxLoadKg) {
      throw new AppError(
        400,
        `[FN-TRP-03] dispatchTrip: Cargo weight (${trip.cargoWeightKg}kg) exceeds vehicle capacity (${vehicle.maxLoadKg}kg)`
      );
    }

    // All checks passed — flip everything together.
    trip.status = "Dispatched";
    vehicle.status = "On Trip";
    driver.status = "On Trip";

    await Promise.all([trip.save(), vehicle.save(), driver.save()]);

    res.status(200).json({ success: true, trip, vehicle, driver });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-TRP-04 — completeTrip
 * ------------------------------------------------------------------
 * WHAT IT DOES : Moves a trip Dispatched -> Completed. Captures final
 *                 odometer + fuel consumed, updates vehicle odometer,
 *                 creates a FuelLog entry, and frees up vehicle+driver.
 * PAGE          : Trip Dispatcher (Screen 4) footnote: "On Complete:
 *                 odometer -> fuel log -> expenses -> Vehicle & Driver
 *                 Available"
 * INPUT         : req.params.tripId (string)
 *                 req.body = { actualDistanceKm, fuelConsumedLiters, fuelCost }
 * OUTPUT        : 200 -> { trip, vehicle, driver, fuelLog }
 * SIDE EFFECTS  : Vehicle.status -> "Available", Vehicle.odometer += actualDistanceKm
 *                 Driver.status  -> "Available"
 *                 Creates one FuelLog document
 * THROWS        : 404 [FN-TRP-04] completeTrip: "Trip not found"
 *                 400 [FN-TRP-04] completeTrip: "Trip is not Dispatched"
 *                 400 [FN-TRP-04] completeTrip: "Missing actualDistanceKm or fuelConsumedLiters"
 * ------------------------------------------------------------------
 */
async function completeTrip(req, res, next) {
  try {
    const { tripId } = req.params;
    const { actualDistanceKm, fuelConsumedLiters, fuelCost } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) throw new AppError(404, "[FN-TRP-04] completeTrip: Trip not found");

    if (trip.status !== "Dispatched") {
      throw new AppError(400, "[FN-TRP-04] completeTrip: Trip is not Dispatched");
    }

    if (actualDistanceKm == null || fuelConsumedLiters == null) {
      throw new AppError(400, "[FN-TRP-04] completeTrip: Missing actualDistanceKm or fuelConsumedLiters");
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    trip.status = "Completed";
    trip.actualDistanceKm = actualDistanceKm;
    trip.fuelConsumedLiters = fuelConsumedLiters;

    vehicle.status = "Available";
    vehicle.odometer += actualDistanceKm;

    driver.status = "Available";

    const fuelLog = await FuelLog.create({
      vehicle: vehicle._id,
      trip: trip._id,
      date: new Date(),
      liters: fuelConsumedLiters,
      fuelCost: fuelCost || 0,
    });

    await Promise.all([trip.save(), vehicle.save(), driver.save()]);

    res.status(200).json({ success: true, trip, vehicle, driver, fuelLog });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-TRP-05 — cancelTrip
 * ------------------------------------------------------------------
 * WHAT IT DOES : Cancels a Dispatched trip and restores vehicle+driver
 *                 to Available.
 * PAGE          : Trip Dispatcher (Screen 4) — "Cancel" button
 * INPUT         : req.params.tripId (string)
 * OUTPUT        : 200 -> { trip, vehicle, driver }
 * SIDE EFFECTS  : Vehicle.status -> "Available"
 *                 Driver.status  -> "Available"
 * THROWS        : 404 [FN-TRP-05] cancelTrip: "Trip not found"
 *                 400 [FN-TRP-05] cancelTrip: "Only Dispatched trips can be cancelled"
 * ------------------------------------------------------------------
 */
async function cancelTrip(req, res, next) {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) throw new AppError(404, "[FN-TRP-05] cancelTrip: Trip not found");

    if (trip.status !== "Dispatched") {
      throw new AppError(400, "[FN-TRP-05] cancelTrip: Only Dispatched trips can be cancelled");
    }

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    trip.status = "Cancelled";
    if (vehicle) vehicle.status = "Available";
    if (driver) driver.status = "Available";

    await Promise.all([trip.save(), vehicle?.save(), driver?.save()].filter(Boolean));

    res.status(200).json({ success: true, trip, vehicle, driver });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTrip, listTrips, dispatchTrip, completeTrip, cancelTrip };
