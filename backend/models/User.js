// =====================================================================
// FILE: models/User.js
// MODULE: AUTH (Authentication & RBAC — Screen 0, Screen 8)
// Password hashing happens in controllers/authController.js
// (FN-AUTH-01 signup), not here.
// =====================================================================

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },

    // Screen 0 "ROLE (RBAC)" dropdown. Screen 8 RBAC matrix maps each
    // of these to module-level permissions (view / full / none) — that
    // matrix is enforced by middleware/checkRole.js (FN-AUTH-03).
    role: {
      type: String,
      enum: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"],
      required: true,
    },

    // Screen 0 error state: "Account locked after 5 failed attempts"
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
