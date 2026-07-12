// =====================================================================
// FILE: routes/analyticsRoutes.js
// MODULE: RPT (Reports & Analytics — Screen 7)
// =====================================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/checkRole");
const { getAnalyticsSummary, getRevenueAndCosts } = require("../controllers/analyticsController");

// Screen 8 RBAC matrix:
// Financial Analyst and Fleet Manager have read/view access to Reports & Analytics.
router.get("/summary", verifyToken, requireRole(["Financial Analyst", "Fleet Manager"]), getAnalyticsSummary);
router.get("/charts", verifyToken, requireRole(["Financial Analyst", "Fleet Manager"]), getRevenueAndCosts);

module.exports = router;
