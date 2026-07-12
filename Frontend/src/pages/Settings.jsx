// =====================================================================
// FILE: pages/Settings.jsx
// MODULE: CFG-UI (Settings & RBAC — Screen 8)
// FUNCTIONS IN THIS FILE:
//   FN-CFG-UI-01  fetchSettings - get general depot details
//   FN-CFG-UI-02  handleSave    - save general depot details
// =====================================================================

import { useState, useEffect } from "react";

export default function Settings({ token, user }) {
  const [form, setForm] = useState({
    depotName: "",
    currency: "",
    distanceUnit: "",
  });
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isFleetManager = user.role === "Fleet Manager";

  useEffect(() => {
    fetchSettings();
  }, []);

  /**
   * FN-CFG-UI-01 — fetchSettings
   * ------------------------------------------------------------------
   * WHAT IT DOES : Queries GET `/api/settings` to populate current depot
   *                 configurations.
   * PAGE          : Settings (Screen 8)
   * INPUT         : none
   * OUTPUT        : none (sets `form` state)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` state on failure
   * ------------------------------------------------------------------
   */
  async function fetchSettings() {
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setForm({
        depotName: data.settings.depotName || "",
        currency: data.settings.currency || "",
        distanceUnit: data.settings.distanceUnit || "",
      });
    } catch (err) {
      setError(`[FN-CFG-UI-01] fetchSettings: ${err.message}`);
    }
  }

  /**
   * FN-CFG-UI-02 — handleSave
   * ------------------------------------------------------------------
   * WHAT IT DOES : Validates and POSTs configurations to `/api/settings`.
   * PAGE          : Settings (Screen 8) — "Save changes" button
   * INPUT         : none (reads `form` state)
   * OUTPUT        : none (displays success message)
   * SIDE EFFECTS  : Updates Settings collection in database.
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSuccessMsg("Depot configurations saved successfully!");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  }

  const rbacMatrix = [
    { role: "Fleet Manager", fleet: "✓", drivers: "✓", trips: "—", fuel: "—", analytics: "✓" },
    { role: "Dispatcher", fleet: "view", drivers: "—", trips: "✓", fuel: "—", analytics: "—" },
    { role: "Safety Officer", fleet: "—", drivers: "✓", trips: "view", fuel: "—", analytics: "—" },
    { role: "Financial Analyst", fleet: "view", drivers: "—", trips: "—", fuel: "✓", analytics: "✓" },
  ];

  return (
    <div className="animate-fade-in">
      <div>
        <h1 className="page-title">Depot Settings & Access Control</h1>
        <p className="page-subtitle">Configure operational units and view role-based authorization scopes</p>
      </div>

      {error && <div className="validation-error-box">{error}</div>}
      {successMsg && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid var(--accent-green)",
            color: "var(--accent-green)",
            padding: 12,
            borderRadius: 8,
            fontSize: 14,
            marginBottom: 20,
            fontWeight: 600,
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      <div className="grid-2">
        {/* General Settings Card */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>General Settings</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Depot Name</label>
              <input
                type="text"
                className="form-control"
                value={form.depotName}
                onChange={(e) => setForm({ ...form, depotName: e.target.value })}
                placeholder="e.g. Gandhinagar Depot GJ4"
                disabled={!isFleetManager}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Currency Unit</label>
              <input
                type="text"
                className="form-control"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="e.g. INR (Rs)"
                disabled={!isFleetManager}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Distance Measurement Unit</label>
              <input
                type="text"
                className="form-control"
                value={form.distanceUnit}
                onChange={(e) => setForm({ ...form, distanceUnit: e.target.value })}
                placeholder="e.g. Kilometers"
                disabled={!isFleetManager}
                required
              />
            </div>

            {isFleetManager ? (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 20, background: "var(--accent-blue)", color: "#fff" }}
              >
                💾 Save depot settings
              </button>
            ) : (
              <div style={{ marginTop: 20, padding: 12, background: "var(--bg-tertiary)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                🔒 Scoped to <strong>Fleet Manager</strong> only. Read-only access enabled.
              </div>
            )}
          </form>
        </div>

        {/* RBAC Matrix Card */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Role-Based Access (RBAC) Control Matrix</h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16 }}>
            Scope access to fleet modules based on primary security classification.
          </p>

          <table className="settings-matrix-table">
            <thead>
              <tr>
                <th>ROLE</th>
                <th>FLEET</th>
                <th>DRIVERS</th>
                <th>TRIPS</th>
                <th>FUEL/EXP</th>
                <th>ANALYTICS</th>
              </tr>
            </thead>
            <tbody>
              {rbacMatrix.map((row) => (
                <tr key={row.role} style={{ fontWeight: user.role === row.role ? "bold" : "normal" }}>
                  <td style={{ color: user.role === row.role ? "var(--accent-gold)" : "#fff" }}>
                    {row.role} {user.role === row.role && " (You)"}
                  </td>
                  <td>
                    <span className={row.fleet === "✓" ? "matrix-check" : row.fleet === "view" ? "matrix-view" : "matrix-none"}>
                      {row.fleet}
                    </span>
                  </td>
                  <td>
                    <span className={row.drivers === "✓" ? "matrix-check" : row.drivers === "view" ? "matrix-view" : "matrix-none"}>
                      {row.drivers}
                    </span>
                  </td>
                  <td>
                    <span className={row.trips === "✓" ? "matrix-check" : row.trips === "view" ? "matrix-view" : "matrix-none"}>
                      {row.trips}
                    </span>
                  </td>
                  <td>
                    <span className={row.fuel === "✓" ? "matrix-check" : row.fuel === "view" ? "matrix-view" : "matrix-none"}>
                      {row.fuel}
                    </span>
                  </td>
                  <td>
                    <span className={row.analytics === "✓" ? "matrix-check" : row.analytics === "view" ? "matrix-view" : "matrix-none"}>
                      {row.analytics}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 24, padding: 12, background: "var(--bg-tertiary)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
            ℹ️ Access matrix legends:
            <br />• <strong>✓</strong> : Full CRUD (Create, Read, Update, Delete) write permission.
            <br />• <strong>view</strong> : Read-only visibility.
            <br />• <strong>—</strong> : Forbidden path / route guards block access.
          </div>
        </div>
      </div>
    </div>
  );
}
