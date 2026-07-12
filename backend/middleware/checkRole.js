// =====================================================================
// FILE: middleware/checkRole.js
// MODULE: AUTH (Authentication & RBAC — Screen 0, Screen 8)
// FUNCTIONS IN THIS FILE:
//   FN-AUTH-03  verifyToken  - checks JWT is present & valid, attaches req.user
//   FN-AUTH-04  requireRole  - restricts a route to specific roles
//
// USAGE (in any routes file):
//   const { verifyToken, requireRole } = require("../middleware/checkRole");
//   router.get("/", verifyToken, requireRole(["Fleet Manager"]), listVehicles);
// =====================================================================

const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const JWT_SECRET = process.env.JWT_SECRET || "transitops-hackathon-secret";

/**
 * FN-AUTH-03 — verifyToken
 * ------------------------------------------------------------------
 * WHAT IT DOES : Reads the "Authorization: Bearer <token>" header,
 *                 verifies the JWT, and attaches the decoded payload
 *                 to req.user = { id, role }. Must run before
 *                 requireRole (FN-AUTH-04) on any protected route.
 * PAGE          : Runs on every screen except Screen 0 login/signup itself.
 * INPUT         : req.headers.authorization (string, "Bearer <jwt>")
 * OUTPUT        : none directly — calls next() and sets req.user
 * SIDE EFFECTS  : none
 * THROWS        : 401 [FN-AUTH-03] verifyToken: "No token provided"
 *                 401 [FN-AUTH-03] verifyToken: "Invalid or expired token"
 * ------------------------------------------------------------------
 */
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "[FN-AUTH-03] verifyToken: No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    if (err.isAppError) return next(err);
    next(new AppError(401, "[FN-AUTH-03] verifyToken: Invalid or expired token"));
  }
}

/**
 * FN-AUTH-04 — requireRole
 * ------------------------------------------------------------------
 * WHAT IT DOES : Factory that returns middleware restricting a route
 *                 to a whitelist of roles, per the Screen 8 RBAC matrix
 *                 (e.g. only "Fleet Manager" can register vehicles).
 *                 Must run AFTER verifyToken (FN-AUTH-03) so req.user
 *                 is already set.
 * PAGE          : Enforces Screen 8's permission matrix on every screen.
 * INPUT         : allowedRoles (array of strings, e.g. ["Fleet Manager"])
 * OUTPUT        : an Express middleware function
 * SIDE EFFECTS  : none
 * THROWS        : 403 [FN-AUTH-04] requireRole: "Role '<role>' is not
 *                                                permitted for this action"
 * ------------------------------------------------------------------
 */
function requireRole(allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const attempted = req.user ? req.user.role : "unauthenticated";
      return next(
        new AppError(403, `[FN-AUTH-04] requireRole: Role '${attempted}' is not permitted for this action`)
      );
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
