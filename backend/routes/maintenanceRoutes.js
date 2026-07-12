// =====================================================================
// FILE: routes/maintenanceRoutes.js
// MODULE: MNT (Maintenance — Screen 5)
// =====================================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/checkRole");
const { createMaintenance, closeMaintenance, listMaintenance } = require("../controllers/maintenanceController");

// Screen 8 RBAC matrix:
// Maintenance falls under Fleet module. Fleet Manager has full (✓) access. Dispatcher and Financial Analyst have view access.
router.get("/", verifyToken, requireRole(["Fleet Manager", "Dispatcher", "Financial Analyst"]), listMaintenance);
router.post("/", verifyToken, requireRole(["Fleet Manager"]), createMaintenance);
router.post("/:maintenanceId/close", verifyToken, requireRole(["Fleet Manager"]), closeMaintenance);

module.exports = router;
