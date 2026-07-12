// =====================================================================
// FILE: utils/AppError.js
// MODULE: CORE (used by every controller in the app)
// FUNCTIONS IN THIS FILE:
//   FN-CORE-00  AppError (class) - standard error object for the whole app
// =====================================================================

/**
 * FN-CORE-00 — AppError
 * ------------------------------------------------------------------
 * WHAT IT DOES : Standard error shape used across ALL controllers.
 *                 Every "throw" in this codebase should throw one of
 *                 these, never a raw Error or a raw res.status().send().
 * PAGE          : N/A (backend-only, feeds every screen's error toast)
 * INPUT         : statusCode (number, e.g. 400/404/409)
 *                 message    (string, MUST follow "[FN-xx] context: msg")
 * OUTPUT        : an Error instance with .statusCode and .isAppError=true
 * SIDE EFFECTS  : none
 * THROWS        : n/a (this IS the thing that gets thrown)
 * ------------------------------------------------------------------
 */
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isAppError = true;
  }
}

module.exports = AppError;
