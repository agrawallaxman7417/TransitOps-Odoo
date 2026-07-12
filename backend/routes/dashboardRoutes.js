// =====================================================================
// FILE: routes/dashboardRoutes.js
// MODULE: DSB (Dashboard — Screen 1)
// =====================================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/checkRole");
const { getDashboardKPIs } = require("../controllers/dashboardController");

// Dashboard can be viewed by all authenticated roles in the app
router.get("/kpis", verifyToken, requireRole(["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]), getDashboardKPIs);

module.exports = router;
