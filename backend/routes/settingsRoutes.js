// =====================================================================
// FILE: routes/settingsRoutes.js
// MODULE: CFG (Settings & RBAC — Screen 8)
// =====================================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/checkRole");
const { getSettings, saveSettings } = require("../controllers/settingsController");

// Screen 8 RBAC matrix:
// Fleet Manager has full (✓) access. Others (Dispatcher, Safety Officer, Financial Analyst) can view settings.
router.get("/", verifyToken, requireRole(["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]), getSettings);
router.post("/", verifyToken, requireRole(["Fleet Manager"]), saveSettings);

module.exports = router;
