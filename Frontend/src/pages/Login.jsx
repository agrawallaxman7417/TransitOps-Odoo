// =====================================================================
// FILE: pages/Login.jsx
// MODULE: AUTH-UI (Authentication — Screen 0)
// FUNCTIONS IN THIS FILE:
//   FN-AUTH-UI-01  handleLogin  - submit sign-in form
//   FN-AUTH-UI-02  handleSignup - submit sign-up form (role dropdown)
// =====================================================================

import { useState } from "react";

const API_BASE = "/api/auth";
const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

export default function Login({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Dispatcher",
  });
  const [rememberMe, setRememberMe] = useState(true);

  // Holds the raw "[FN-xx] ..." string from the backend so it displays
  // verbatim in the red error box — matches Screen 0 wireframe exactly:
  // "Invalid credentials. Account locked after 5 failed attempts."
  const [error, setError] = useState(null);

  /**
   * FN-AUTH-UI-01 — handleLogin
   * ------------------------------------------------------------------
   * WHAT IT DOES : Submits the "Sign In" form -> POST /api/auth/login.
   *                 On success, stores the JWT (localStorage if
   *                 "Remember me" is checked, else sessionStorage) and
   *                 calls onLoginSuccess(user) to hand control back to
   *                 the app shell for role-based routing.
   * PAGE          : Authentication (Screen 0) — "Sign In" form
   * INPUT         : none (reads `form.email`, `form.password`)
   * OUTPUT        : none (calls onLoginSuccess prop, or sets `error`)
   * SIDE EFFECTS  : Writes JWT to localStorage/sessionStorage.
   * THROWS        : sets `error` with the exact "[FN-AUTH-02] ..." string
   *                 the backend returns (invalid creds, lockout, etc.)
   * ------------------------------------------------------------------
   */
  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      onLoginSuccess?.(data.user);
    } catch (err) {
      // Displayed as-is — backend already formats it as
      // "[FN-AUTH-02] login: ..." per CODING_STANDARDS.md
      setError(err.message);
    }
  }

  /**
   * FN-AUTH-UI-02 — handleSignup
   * ------------------------------------------------------------------
   * WHAT IT DOES : Submits the sign-up form -> POST /api/auth/signup.
   *                 On success, switches back to login mode so the user
   *                 signs in with their new credentials (no auto-login,
   *                 matches "Signup creates an Employee account only"
   *                 style flow — explicit sign-in step keeps it simple).
   * PAGE          : Authentication (Screen 0) — sign-up variant
   * INPUT         : none (reads `form.name/email/password/role`)
   * OUTPUT        : none (switches `mode` to "login", or sets `error`)
   * SIDE EFFECTS  : Creates a User document on the backend (FN-AUTH-01)
   * THROWS        : sets `error` with the exact "[FN-AUTH-01] ..." string
   *                 the backend returns (duplicate email, bad role, etc.)
   * ------------------------------------------------------------------
   */
  async function handleSignup(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMode("login");
      setForm({ ...form, password: "" });
    } catch (err) {
      setError(err.message);
    }
  }

  const isLogin = mode === "login";

  return (
    <div style={styles.wrapper}>
      {/* Left panel — matches Screen 0's light branding panel */}
      <div style={styles.brandPanel}>
        <div style={styles.logoBox} />
        <h1 style={styles.brandTitle}>TransitOps</h1>
        <p style={styles.brandSubtitle}>Smart Transport Operations Platform</p>

        <div style={{ marginTop: 40 }}>
          <p style={styles.roleListTitle}>One login, four roles:</p>
          <ul style={styles.roleList}>
            {ROLES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <p style={styles.footerNote}>TRANSITOPS © 2026 · RBAC ENABLED</p>
      </div>

      {/* Right panel — form */}
      <div style={styles.formPanel}>
        <h2>{isLogin ? "Sign in to your account" : "Create your account"}</h2>
        <p style={styles.formSubtitle}>
          {isLogin ? "Enter your credentials to continue" : "Employee accounts only — no self-elevated roles"}
        </p>

        <form onSubmit={isLogin ? handleLogin : handleSignup} style={styles.form}>
          {!isLogin && (
            <>
              <label style={styles.label}>NAME</label>
              <input
                style={styles.input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </>
          )}

          <label style={styles.label}>EMAIL</label>
          <input
            style={styles.input}
            type="email"
            placeholder="Raven.k@transitops.in"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label style={styles.label}>PASSWORD</label>
          <input
            style={styles.input}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {!isLogin && (
            <>
              <label style={styles.label}>ROLE (RBAC)</label>
              <select
                style={styles.input}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </>
          )}

          {isLogin && (
            <div style={styles.rememberRow}>
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />{" "}
                Remember me
              </label>
              <a href="#" style={styles.link}>
                Forgot password?
              </a>
            </div>
          )}

          <button type="submit" style={styles.submitBtn}>
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {/* Matches Screen 0's red error box — shows the raw backend
            message verbatim, e.g. lockout text */}
        {error && <div style={styles.errorBox}>{error}</div>}

        <p style={styles.switchModeText}>
          {isLogin ? "New here? " : "Already have an account? "}
          <a
            href="#"
            style={styles.link}
            onClick={(e) => {
              e.preventDefault();
              setError(null);
              setMode(isLogin ? "signup" : "login");
            }}
          >
            {isLogin ? "Create an account" : "Sign in"}
          </a>
        </p>

        <p style={styles.accessNote}>
          Access is scoped by role after login:
          <br />• Fleet Manager → Fleet, Maintenance
          <br />• Dispatcher → Dashboard, Trips
          <br />• Safety Officer → Drivers, Compliance
          <br />• Financial Analyst → Fuel & Expenses, Analytics
        </p>
      </div>
    </div>
  );
}

// Inline styles kept minimal — swap for Tailwind classes if that's
// what the rest of the app uses (matches your MERN boilerplate).
const styles = {
  wrapper: { display: "flex", minHeight: "100vh", background: "#0d0d0d", color: "#eee" },
  brandPanel: { width: 380, background: "#d6d9dc", color: "#111", padding: 40, display: "flex", flexDirection: "column" },
  logoBox: { width: 40, height: 40, background: "#c98a2c", marginBottom: 16 },
  brandTitle: { margin: 0 },
  brandSubtitle: { color: "#555" },
  roleListTitle: { fontWeight: "bold" },
  roleList: { listStyle: "disc", paddingLeft: 20, color: "#333" },
  footerNote: { marginTop: "auto", fontSize: 12, color: "#777" },
  formPanel: { flex: 1, padding: 60, maxWidth: 420 },
  formSubtitle: { color: "#999", marginBottom: 24 },
  form: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 11, color: "#999", marginTop: 12 },
  input: { padding: 10, background: "#1a1a1a", border: "1px solid #333", color: "#eee", borderRadius: 4 },
  rememberRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 13 },
  submitBtn: { marginTop: 20, padding: 12, background: "#c98a2c", border: "none", borderRadius: 4, color: "#111", fontWeight: "bold", cursor: "pointer" },
  errorBox: { marginTop: 16, padding: 12, border: "1px solid #c0392b", color: "#e74c3c", borderRadius: 4, fontSize: 13 },
  switchModeText: { marginTop: 16, fontSize: 13, color: "#999" },
  link: { color: "#5b9bd5" },
  accessNote: { marginTop: 24, fontSize: 11, color: "#666", lineHeight: 1.6 },
};
