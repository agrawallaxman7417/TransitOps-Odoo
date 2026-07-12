// =====================================================================
// FILE: pages/DriversSafety.jsx
// MODULE: DRV-UI (Drivers & Safety — Screen 3)
// FUNCTIONS IN THIS FILE:
//   FN-DRV-UI-01  fetchDrivers      - load driver list from API
//   FN-DRV-UI-02  handleCreate      - create a new driver profile
//   FN-DRV-UI-03  handleStatusChange- toggle status between Available, Off Duty, Suspended
// =====================================================================

import { useState, useEffect } from "react";

export default function DriversSafety({ token, user }) {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "HMV",
    licenseExpiry: "",
    contact: "",
    safetyScore: 100,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // RBAC checks
  const canModify = user.role === "Safety Officer" || user.role === "Fleet Manager";

  useEffect(() => {
    fetchDrivers();
  }, [searchQuery, filterStatus]);

  /**
   * FN-DRV-UI-01 — fetchDrivers
   * ------------------------------------------------------------------
   * WHAT IT DOES : Fetches drivers from GET `/api/drivers` based on search
   *                 queries and filters.
   * PAGE          : Drivers & Safety Profiles (Screen 3)
   * INPUT         : none (reads filter state)
   * OUTPUT        : none (sets `drivers` state)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` state on API failure
   * ------------------------------------------------------------------
   */
  async function fetchDrivers() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterStatus) params.append("status", filterStatus);

      const res = await fetch(`/api/drivers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setDrivers(data.drivers);
    } catch (err) {
      setError(`[FN-DRV-UI-01] fetchDrivers: ${err.message}`);
    }
  }

  /**
   * FN-DRV-UI-02 — handleCreate
   * ------------------------------------------------------------------
   * WHAT IT DOES : Submits new driver data to POST `/api/drivers`.
   * PAGE          : Drivers & Safety Profiles (Screen 3) — "+ ADD DRIVER" form
   * INPUT         : none (reads `form` state)
   * OUTPUT        : none (refreshes drivers list)
   * SIDE EFFECTS  : Writes new Driver document to MongoDB.
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setForm({
        name: "",
        licenseNumber: "",
        licenseCategory: "HMV",
        licenseExpiry: "",
        contact: "",
        safetyScore: 100,
      });
      setShowAddModal(false);
      fetchDrivers();
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * FN-DRV-UI-03 — handleStatusChange
   * ------------------------------------------------------------------
   * WHAT IT DOES : Sends request to toggle a driver's status to Available,
   *                 Off Duty, or Suspended.
   * PAGE          : Drivers & Safety Profiles (Screen 3)
   * INPUT         : driverId (string), newStatus (string)
   * OUTPUT        : none
   * SIDE EFFECTS  : Updates Driver document status field.
   * THROWS        : sets `error` on failure
   * ------------------------------------------------------------------
   */
  async function handleStatusChange(driverId, newStatus) {
    setError(null);
    try {
      const res = await fetch(`/api/drivers/${driverId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      fetchDrivers();
    } catch (err) {
      setError(err.message);
    }
  }

  const isExpired = (expiryDate) => new Date(expiryDate) < new Date();

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Drivers & Safety Profiles</h1>
          <p className="page-subtitle">Manage driver details, license compliance, and safety scores</p>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ Add Driver
          </button>
        )}
      </div>

      {error && <div className="validation-error-box">{error}</div>}

      {/* Query Filters */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: 20,
          padding: 16,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>SEARCH:</span>
          <input
            type="text"
            className="form-control"
            style={{ width: "100%", padding: "6px 12px" }}
            placeholder="Search Driver Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>STATUS:</span>
          <select
            className="form-control"
            style={{ padding: "6px 12px" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="Off Duty">Off Duty</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>License No</th>
              <th>Category</th>
              <th>License Expiry</th>
              <th>Contact</th>
              <th>Safety Score</th>
              <th>Status</th>
              {canModify && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20 }}>
                  No drivers registered in depot
                </td>
              </tr>
            ) : (
              drivers.map((d) => {
                const expired = isExpired(d.licenseExpiry);
                return (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{d.licenseNumber}</td>
                    <td>
                      <span className="badge badge-blue">{d.licenseCategory}</span>
                    </td>
                    <td style={{ color: expired ? "var(--accent-red)" : "inherit", fontWeight: expired ? 600 : "normal" }}>
                      {new Date(d.licenseExpiry).toLocaleDateString()} {expired && " (EXPIRED)"}
                    </td>
                    <td>{d.contact}</td>
                    <td>
                      <span
                        className={`badge ${
                          d.safetyScore >= 90
                            ? "badge-success"
                            : d.safetyScore >= 70
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        🛡️ {d.safetyScore} pts
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          d.status === "Available"
                            ? "badge-success"
                            : d.status === "On Trip"
                            ? "badge-blue"
                            : d.status === "Off Duty"
                            ? "badge-warning"
                            : "badge-danger"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    {canModify && (
                      <td>
                        {d.status !== "On Trip" ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <select
                              className="form-control"
                              style={{ padding: "4px 8px", fontSize: 11, width: 110 }}
                              value={d.status}
                              onChange={(e) => handleStatusChange(d._id, e.target.value)}
                            >
                              <option value="Available">Available</option>
                              <option value="Off Duty">Off Duty</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                            On active trip
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="screen-footnote">
        ⚠️ Rule Checklist: Drivers with expired licenses or Suspended status cannot be assigned to any trip.
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h2 style={{ marginBottom: 20, fontSize: 20 }}>➕ Register New Driver</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">FULL NAME</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ramesh Patel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">LICENSE NUMBER (UNIQUE)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. DL-GJ01-2026-111"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">LICENSE CLASSIFICATION CATEGORY</label>
                <select
                  className="form-control"
                  value={form.licenseCategory}
                  onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}
                >
                  <option value="LMV">LMV (Light Motor Vehicle)</option>
                  <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">LICENSE EXPIRY DATE</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.licenseExpiry}
                  onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">CONTACT NUMBER</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. +91 98765 43210"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">INITIAL SAFETY SCORE (0-100)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.safetyScore}
                  onChange={(e) => setForm({ ...form, safetyScore: e.target.value })}
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
