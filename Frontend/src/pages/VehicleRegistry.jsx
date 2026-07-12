// =====================================================================
// FILE: pages/VehicleRegistry.jsx
// MODULE: VEH-UI (Vehicle Registry — Screen 2)
// FUNCTIONS IN THIS FILE:
//   FN-VEH-UI-01  fetchVehicles    - load vehicles from API
//   FN-VEH-UI-02  handleCreate     - submit new vehicle creation
//   FN-VEH-UI-03  handleRetire     - retire an active vehicle
// =====================================================================

import { useState, useEffect } from "react";

export default function VehicleRegistry({ token, user }) {
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    regNumber: "",
    name: "",
    type: "Van",
    maxLoadKg: "",
    acquisitionCost: "",
    odometer: 0,
  });

  // Filter States
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const isFleetManager = user.role === "Fleet Manager";

  useEffect(() => {
    fetchVehicles();
  }, [filterType, filterStatus, searchQuery]);

  /**
   * FN-VEH-UI-01 — fetchVehicles
   * ------------------------------------------------------------------
   * WHAT IT DOES : Queries backend GET `/api/vehicles` with current
   *                 filter parameters to display in the main table.
   * PAGE          : Vehicle Registry (Screen 2)
   * INPUT         : none (reads filter state variables)
   * OUTPUT        : none (sets `vehicles` state)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function fetchVehicles() {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append("type", filterType);
      if (filterStatus) params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/vehicles?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setVehicles(data.vehicles);
    } catch (err) {
      setError(`[FN-VEH-UI-01] fetchVehicles: ${err.message}`);
    }
  }

  /**
   * FN-VEH-UI-02 — handleCreate
   * ------------------------------------------------------------------
   * WHAT IT DOES : Validates and POSTs new vehicle data to `/api/vehicles`.
   *                 On success, updates list, resets form, and closes modal.
   * PAGE          : Vehicle Registry (Screen 2) — "+ ADD VEHICLE" modal
   * INPUT         : none (reads `form` state)
   * OUTPUT        : none (refreshes vehicles list)
   * SIDE EFFECTS  : Creates Vehicle document in database.
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/vehicles", {
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
        regNumber: "",
        name: "",
        type: "Van",
        maxLoadKg: "",
        acquisitionCost: "",
        odometer: 0,
      });
      setShowAddModal(false);
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * FN-VEH-UI-03 — handleRetire
   * ------------------------------------------------------------------
   * WHAT IT DOES : Requests backend to set status of a vehicle to "Retired".
   * PAGE          : Vehicle Registry (Screen 2) — "Retire" table action
   * INPUT         : vehicleId (string)
   * OUTPUT        : none
   * SIDE EFFECTS  : Updates Vehicle document to Retired status.
   * THROWS        : sets `error` on failure
   * ------------------------------------------------------------------
   */
  async function handleRetire(vehicleId) {
    if (!window.confirm("Are you sure you want to retire this vehicle? This action is permanent.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/retire`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Vehicle Registry</h1>
          <p className="page-subtitle">Manage operations vehicles, capacity, and lifecycle</p>
        </div>
        {isFleetManager && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            ➕ Add Vehicle
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
            placeholder="Search Reg No (e.g. GJ01)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>TYPE:</span>
          <select
            className="form-control"
            style={{ padding: "6px 12px" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Mini">Mini</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
          </select>
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
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Name/Model</th>
              <th>Type</th>
              <th>Max Capacity (Kg)</th>
              <th>Odometer (Km)</th>
              <th>Acquisition Cost</th>
              <th>Status</th>
              {isFleetManager && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20 }}>
                  No vehicles found in depot
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v._id}>
                  <td style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--accent-gold)" }}>
                    {v.regNumber}
                  </td>
                  <td>{v.name}</td>
                  <td>
                    <span className="badge badge-purple">{v.type}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{v.maxLoadKg.toLocaleString()} kg</td>
                  <td>{v.odometer.toLocaleString()} km</td>
                  <td>₹ {v.acquisitionCost.toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        v.status === "Available"
                          ? "badge-success"
                          : v.status === "On Trip"
                          ? "badge-blue"
                          : v.status === "In Shop"
                          ? "badge-warning"
                          : "badge-danger"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  {isFleetManager && (
                    <td>
                      {v.status !== "Retired" && v.status !== "On Trip" ? (
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 10px", fontSize: 11 }}
                          onClick={() => handleRetire(v._id)}
                        >
                          Retire
                        </button>
                      ) : v.status === "On Trip" ? (
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                          On active trip
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Retired permanently</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="screen-footnote">
        ⚠️ Rule Checklist: Fleet Manager write access only. Acquired vehicles start as "Available". Only Available vehicles can go to "In Shop" or "On Trip".
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h2 style={{ marginBottom: 20, fontSize: 20 }}>➕ Register New Fleet Vehicle</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">REGISTRATION NO. (UNIQUE)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. GJ01-AB-1234"
                  value={form.regNumber}
                  onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">VEHICLE MODEL NAME</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Tata Ace 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">VEHICLE CLASSIFICATION TYPE</label>
                <select
                  className="form-control"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="Mini">Mini (Max 1 ton)</option>
                  <option value="Van">Van (Max 2 tons)</option>
                  <option value="Truck">Truck (Max 10 tons)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">MAX CARGO LOAD CAPACITY (KG)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 1500"
                  value={form.maxLoadKg}
                  onChange={(e) => setForm({ ...form, maxLoadKg: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">ACQUISITION COST (INR)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 750000"
                  value={form.acquisitionCost}
                  onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">INITIAL ODOMETER (KM)</label>
                <input
                  type="number"
                  className="form-control"
                  value={form.odometer}
                  onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                  min="0"
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
