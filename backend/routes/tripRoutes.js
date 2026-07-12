// =====================================================================
// FILE: routes/tripRoutes.js
// MODULE: TRP (Trip Dispatcher — Screen 4)
// Maps HTTP endpoints to the FN-TRP-xx controller functions.
// Keep this file dumb — no logic here, just routing + role guard.
// =====================================================================

const express = require("express");
const router = express.Router();
const {
  createTrip,
  listTrips,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require("../controllers/tripController");

// Screen 8 RBAC matrix: Dispatcher has full (✓) access to Trips
router.post("/", createTrip); // FN-TRP-01
router.get("/", listTrips); // FN-TRP-02
router.post("/:tripId/dispatch", dispatchTrip); // FN-TRP-03
router.post("/:tripId/complete", completeTrip); // FN-TRP-04
router.post("/:tripId/cancel", cancelTrip); // FN-TRP-05

module.exports = router;
