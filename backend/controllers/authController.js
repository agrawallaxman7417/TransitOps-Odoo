// =====================================================================
// FILE: controllers/authController.js
// MODULE: AUTH (Authentication & RBAC — Screen 0)
// FUNCTIONS IN THIS FILE:
//   FN-AUTH-01  signup - create a new User account
//   FN-AUTH-02  login  - validate credentials, issue JWT, handle lockout
// =====================================================================

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AppError = require("../utils/AppError");

// How many failed attempts before lockout, and how long the lockout lasts.
// Matches Screen 0 wireframe text: "Account locked after 5 failed attempts"
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// JWT secret — for the hackathon this can live in .env as JWT_SECRET.
// Never hardcode a real secret in committed code outside a demo.
const JWT_SECRET = process.env.JWT_SECRET || "transitops-hackathon-secret";

/**
 * FN-AUTH-01 — signup
 * ------------------------------------------------------------------
 * WHAT IT DOES : Creates a new User account. Hashes the password with
 *                 bcrypt before storing — plaintext password is never
 *                 saved or logged.
 * PAGE          : Authentication (Screen 0) — sign-up variant of the form
 * INPUT         : req.body = { name, email, password, role }
 *                 role must be one of: "Fleet Manager", "Dispatcher",
 *                 "Safety Officer", "Financial Analyst"
 * OUTPUT        : 201 -> { user: { id, name, email, role } }  (no password)
 * SIDE EFFECTS  : Writes one new document to User collection.
 * THROWS        : 400 [FN-AUTH-01] signup: "Missing required signup fields"
 *                 400 [FN-AUTH-01] signup: "Invalid role selected"
 *                 409 [FN-AUTH-01] signup: "Email is already registered"
 * ------------------------------------------------------------------
 */
async function signup(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      throw new AppError(400, "[FN-AUTH-01] signup: Missing required signup fields");
    }

    const validRoles = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];
    if (!validRoles.includes(role)) {
      throw new AppError(400, "[FN-AUTH-01] signup: Invalid role selected");
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError(409, "[FN-AUTH-01] signup: Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
    });

    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * FN-AUTH-02 — login
 * ------------------------------------------------------------------
 * WHAT IT DOES : Validates email+password, issues a JWT on success.
 *                 Tracks failedLoginAttempts on the User document; after
 *                 5 consecutive failures, locks the account for 15 min.
 *                 Matches Screen 0's red error box exactly:
 *                 "Invalid credentials. Account locked after 5 failed attempts."
 * PAGE          : Authentication (Screen 0) — "Sign In" form
 * INPUT         : req.body = { email, password }
 * OUTPUT        : 200 -> { token, user: { id, name, email, role } }
 * SIDE EFFECTS  : Writes to User.failedLoginAttempts / User.lockedUntil
 *                 on every failed attempt; resets them to 0/null on
 *                 successful login.
 * THROWS        : 400 [FN-AUTH-02] login: "Missing email or password"
 *                 401 [FN-AUTH-02] login: "Invalid credentials"
 *                 423 [FN-AUTH-02] login: "Account locked after 5 failed
 *                                          attempts. Try again in N minutes."
 * ------------------------------------------------------------------
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(400, "[FN-AUTH-02] login: Missing email or password");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Same generic "Invalid credentials" message whether the email
    // doesn't exist or the password is wrong — don't leak which one,
    // but DO still count it toward lockout if the user exists.
    if (!user) {
      throw new AppError(401, "[FN-AUTH-02] login: Invalid credentials");
    }

    // --- Check if currently locked out ---
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      throw new AppError(
        423,
        `[FN-AUTH-02] login: Account locked after 5 failed attempts. Try again in ${minutesLeft} minute(s).`
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      // Increment failure count and lock if threshold reached.
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        user.failedLoginAttempts = 0; // reset counter, lockout window takes over
        await user.save();
        throw new AppError(
          423,
          "[FN-AUTH-02] login: Account locked after 5 failed attempts. Try again in 15 minute(s)."
        );
      }

      await user.save();
      throw new AppError(401, "[FN-AUTH-02] login: Invalid credentials");
    }

    // --- Success: reset lockout tracking, issue JWT ---
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };
