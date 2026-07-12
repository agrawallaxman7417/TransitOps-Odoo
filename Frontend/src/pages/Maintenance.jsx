// =====================================================================
// FILE: pages/Maintenance.jsx
// MODULE: MNT-UI (Maintenance — Screen 5)
// FUNCTIONS IN THIS FILE:
//   FN-MNT-UI-01  fetchMaintenanceData - fetch all service log entries
//   FN-MNT-UI-02  fetchVehicles        - fetch available vehicles for dropdown
//   FN-MNT-UI-03  handleCreateRecord   - log a new service record
//   FN-MNT-UI-04  handleCloseRecord    - mark service as Completed
// =====================================================================

import { useState, useEffect } from "react";

export default function Maintenance({ token, user }) {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);

  // Form State
  const [form, setForm] = useState({
    vehicleId: "",
    serviceType: "",
    cost: "",
    date: "",
  });

  const isFleetManager = user.role === "Fleet Manager";

  useEffect(() => {
    fetchMaintenanceData();
    fetchVehicles();
  }, []);

  /**
   * FN-MNT-UI-01 — fetchMaintenanceData
   * ------------------------------------------------------------------
   * WHAT IT DOES : Queries GET `/api/maintenance` to populate the
   *                 service log table on the right.
   * PAGE          : Maintenance (Screen 5)
   * INPUT         : none
   * OUTPUT        : none (sets `records` state)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function fetchMaintenanceData() {
    setError(null);
    try {
      const res = await fetch("/api/maintenance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setRecords(data.records);
    } catch (err) {
      setError(`[FN-MNT-UI-01] fetchMaintenanceData: ${err.message}`);
    }
  }

  /**
   * FN-MNT-UI-02 — fetchVehicles
   * ------------------------------------------------------------------
   * WHAT IT DOES : Fetches vehicles to populate the dropdown. Show all
   *                 available vehicles since they are eligible for shop.
   * PAGE          : Maintenance (Screen 5)
   * INPUT         : none
   * OUTPUT        : none (sets `vehicles` state)
   * SIDE EFFECTS  : none
   * THROWS        : none expected
   * ------------------------------------------------------------------
   */
  async function fetchVehicles() {
    try {
      const res = await fetch("/api/vehicles?status=Available", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVehicles(data.vehicles);
    } catch (err) {
      console.error("[FN-MNT-UI-02] fetchVehicles failed:", err);
    }
  }

  /**
   * FN-MNT-UI-03 — handleCreateRecord
   * ------------------------------------------------------------------
   * WHAT IT DOES : Posts service record to `/api/maintenance` and pulls
   *                 the vehicle out of availability pool (Vehicle.status -> In Shop).
   * PAGE          : Maintenance (Screen 5) — "LOG SERVICE RECORD" form
   * INPUT         : none (reads `form` state)
   * OUTPUT        : none (refreshes record logs & vehicle list)
   * SIDE EFFECTS  : Creates Maintenance record and updates Vehicle status to "In Shop".
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function handleCreateRecord(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setForm({ vehicleId: "", serviceType: "", cost: "", date: "" });
      fetchMaintenanceData();
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * FN-MNT-UI-04 — handleCloseRecord
   * ------------------------------------------------------------------
   * WHAT IT DOES : Closes service record via POST `/api/maintenance/:id/close`
   *                 restoring the vehicle status back to "Available".
   * PAGE          : Maintenance (Screen 5) — "Complete" table action
   * INPUT         : recordId (string)
   * OUTPUT        : none
   * SIDE EFFECTS  : Sets Maintenance status to Completed and Vehicle status to Available.
   * THROWS        : sets `error` on failure
   * ------------------------------------------------------------------
   */
  async function handleCloseRecord(recordId) {
    setError(null);
    try {
      const res = await fetch(`/api/maintenance/${recordId}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      fetchMaintenanceData();
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Fleet Maintenance & Service</h1>
          <p className="page-subtitle">Schedule repairs, track active shop times, and monitor service costs</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { fetchMaintenanceData(); fetchVehicles(); }}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="validation-error-box">{error}</div>}

      {/* Split Layout: Log form (left) + Table list (right) */}
      <div className="service-split">
        {/* Log service record form */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Log Service Record</h2>
          {!isFleetManager ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              🔒 Scoped to <strong>Fleet Manager</strong> role only. Read-only access enabled.
            </div>
          ) : (
            <form onSubmit={handleCreateRecord}>
              <div className="form-group">
                <label className="form-label">SELECT VEHICLE</label>
                <select
                  className="form-control"
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Available --</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.regNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">SERVICE REPAIR TYPE</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Brake Replacement, Oil Change"
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SERVICE COST (INR)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 7500"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SERVICE DATE</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary w-100" style={{ width: "100%", marginTop: 12 }}>
                🔧 Pull Vehicle into Shop
              </button>

              {/* Visual state transition arrows legend */}
              <div className="transition-arrow-container">
                <span style={{ color: "var(--accent-green)" }}>Available</span>
                <span>➔</span>
                <span style={{ color: "var(--accent-red)", fontWeight: 700 }}>In Shop</span>
              </div>
            </form>
          )}
        </div>

        {/* Maintenance records table log */}
        <div className="card" style={{ overflow: "hidden" }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Depot Service Logs</h2>

          <div className="table-container" style={{ marginTop: 0, border: "none", boxShadow: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service Type</th>
                  <th>Service Cost</th>
                  <th>Log Date</th>
                  <th>Status</th>
                  {isFleetManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20 }}>
                      No maintenance events logged in depot
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span>{r.vehicle?.name}</span>
                          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                            {r.vehicle?.regNumber}
                          </span>
                        </div>
                      </td>
                      <td>{r.serviceType}</td>
                      <td style={{ fontWeight: 600 }}>₹ {r.cost.toLocaleString()}</td>
                      <td>{new Date(r.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${r.status === "Completed" ? "badge-success" : "badge-warning"}`}>
                          {r.status === "Completed" ? "Completed" : "In Shop"}
                        </span>
                      </td>
                      {isFleetManager && (
                        <td>
                          {r.status === "Active" ? (
                            <button
                              className="btn btn-primary"
                              style={{ padding: "4px 8px", fontSize: 11, background: "var(--accent-green)", color: "#111" }}
                              onClick={() => handleCloseRecord(r._id)}
                            >
                              Close Job
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Job completed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
