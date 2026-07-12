// =====================================================================
// FILE: routes/vehicleRoutes.js
// MODULE: VEH (Vehicle Registry — Screen 2)
// =====================================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/checkRole");
const { createVehicle, listVehicles, retireVehicle } = require("../controllers/vehicleController");

// Screen 8 RBAC matrix:
// Fleet Manager has full (✓) access. Dispatcher and Financial Analyst have read-only (view) access.
router.get("/", verifyToken, requireRole(["Fleet Manager", "Dispatcher", "Financial Analyst"]), listVehicles);
router.post("/", verifyToken, requireRole(["Fleet Manager"]), createVehicle);
router.post("/:vehicleId/retire", verifyToken, requireRole(["Fleet Manager"]), retireVehicle);

module.exports = router;
