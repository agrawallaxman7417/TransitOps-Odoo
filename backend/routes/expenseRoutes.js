// =====================================================================
// FILE: routes/expenseRoutes.js
// MODULE: FUEL (Fuel & Expense Management — Screen 6)
// =====================================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/checkRole");
const { logFuel, addExpense, getOperationalCosts } = require("../controllers/expenseController");

// Screen 8 RBAC matrix:
// Financial Analyst has full (✓) access. Others have no access to Fuel & Expenses.
router.get("/", verifyToken, requireRole(["Financial Analyst"]), getOperationalCosts);
router.post("/fuel", verifyToken, requireRole(["Financial Analyst"]), logFuel);
router.post("/expense", verifyToken, requireRole(["Financial Analyst"]), addExpense);

module.exports = router;
