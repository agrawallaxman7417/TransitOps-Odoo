// =====================================================================
// FILE: routes/driverRoutes.js
// MODULE: DRV (Drivers & Safety Profiles — Screen 3)
// =====================================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/checkRole");
const { createDriver, listDrivers, toggleDriverStatus } = require("../controllers/driverController");

// Screen 8 RBAC matrix:
// Safety Officer and Fleet Manager have full (✓) access to Drivers module.
router.get("/", verifyToken, requireRole(["Safety Officer", "Fleet Manager"]), listDrivers);
router.post("/", verifyToken, requireRole(["Safety Officer", "Fleet Manager"]), createDriver);
router.put("/:driverId/status", verifyToken, requireRole(["Safety Officer", "Fleet Manager"]), toggleDriverStatus);

module.exports = router;
