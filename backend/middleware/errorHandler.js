// =====================================================================
// FILE: middleware/errorHandler.js
// MODULE: CORE
// FUNCTIONS IN THIS FILE:
//   FN-CORE-01  errorHandler - final Express error middleware
// =====================================================================

/**
 * FN-CORE-01 — errorHandler
 * ------------------------------------------------------------------
 * WHAT IT DOES : Catches every error thrown/passed via next(err) in the
 *                 whole app and formats it into one consistent JSON
 *                 shape so the frontend always knows where to look.
 * PAGE          : N/A — affects the error display on EVERY screen
 * INPUT         : err (Error or AppError), req, res, next (Express std)
 * OUTPUT        : res.json({ success:false, error: "[FN-xx] ..." })
 * SIDE EFFECTS  : Logs full stack to server console for debugging.
 * THROWS        : n/a (this is the catch-all, nothing should escape it)
 * ------------------------------------------------------------------
 *
 * NOTE: Mount this LAST in server.js, after all routes:
 *   app.use(errorHandler);
 */
function errorHandler(err, req, res, next) {
  // Log full detail server-side (never sent to client) for debugging
  console.error(`[${new Date().toISOString()}] ERROR on ${req.method} ${req.originalUrl}`);
  console.error(err.stack || err);

  const statusCode = err.statusCode || 500;

  // If it's not one of our tagged AppErrors, wrap it so the client still
  // gets a consistent shape — but flag it as UNTAGGED so you know in the
  // logs that some function forgot to use AppError / the [FN-xx] format.
  const message = err.isAppError
    ? err.message
    : `[FN-UNKNOWN] Unhandled: ${err.message || "Something went wrong"}`;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = errorHandler;
