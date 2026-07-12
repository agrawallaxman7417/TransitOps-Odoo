// =====================================================================
// FILE: routes/authRoutes.js
// MODULE: AUTH (Authentication — Screen 0)
// No auth middleware on these two — they're the entry point.
// =====================================================================

const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");

router.post("/signup", signup); // FN-AUTH-01
router.post("/login", login); // FN-AUTH-02

module.exports = router;
