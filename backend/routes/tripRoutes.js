// =====================================================================
// FILE: routes/tripRoutes.js
// MODULE: TRP (Trip Dispatcher — Screen 4)
// Maps HTTP endpoints to the FN-TRP-xx controller functions.
// Keep this file dumb — no logic here, just routing + role guard.
// =====================================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/checkRole");
const {
  createTrip,
  listTrips,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require("../controllers/tripController");

// Screen 8 RBAC matrix: 
// Dispatcher has full (✓) access. Safety Officer has read-only (view) access to live board.
router.get("/", verifyToken, requireRole(["Dispatcher", "Safety Officer"]), listTrips); // FN-TRP-02
router.post("/", verifyToken, requireRole(["Dispatcher"]), createTrip); // FN-TRP-01
router.post("/:tripId/dispatch", verifyToken, requireRole(["Dispatcher"]), dispatchTrip); // FN-TRP-03
router.post("/:tripId/complete", verifyToken, requireRole(["Dispatcher"]), completeTrip); // FN-TRP-04
router.post("/:tripId/cancel", verifyToken, requireRole(["Dispatcher"]), cancelTrip); // FN-TRP-05

module.exports = router;
