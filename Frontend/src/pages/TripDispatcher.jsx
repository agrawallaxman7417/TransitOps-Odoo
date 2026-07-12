// =====================================================================
// FILE: pages/TripDispatcher.jsx
// MODULE: TRP-UI (Trip Dispatcher — Screen 4)
// FUNCTIONS IN THIS FILE:
//   FN-TRP-UI-01  fetchTrips      - load Live Board data
//   FN-TRP-UI-02  fetchResources  - load available vehicles and drivers
//   FN-TRP-UI-03  handleCreate    - submit "CREATE TRIP" form
//   FN-TRP-UI-04  handleDispatch  - dispatch a Draft trip
//   FN-TRP-UI-05  handleCancel    - cancel a Dispatched trip
//   FN-TRP-UI-06  handleComplete  - complete a Dispatched trip with final specs
// =====================================================================

import { useState, useEffect } from "react";

export default function TripDispatcher({ token, user }) {
  const [trips, setTrips] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);

  // Active form state
  const [form, setForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    plannedDistanceKm: "",
  });

  // Trip Completion inline form state
  const [completingTripId, setCompletingTripId] = useState(null);
  const [completionForm, setCompletionForm] = useState({
    actualDistanceKm: "",
    fuelConsumedLiters: "",
    fuelCost: "",
  });

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [error, setError] = useState(null);

  // RBAC checks
  const isDispatcher = user.role === "Dispatcher";

  useEffect(() => {
    fetchTrips();
    fetchResources();
  }, []);

  /**
   * FN-TRP-UI-01 — fetchTrips
   * ------------------------------------------------------------------
   * WHAT IT DOES : Loads all trips from the backend to populate the
   *                 "LIVE BOARD" list on the right side of Screen 4.
   * PAGE          : Trip Dispatcher (Screen 4)
   * INPUT         : none
   * OUTPUT        : none (sets local state `trips`)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` state with standard error format
   * ------------------------------------------------------------------
   */
  async function fetchTrips() {
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setTrips(data.trips);
      if (data.trips.length > 0 && !selectedTrip) {
        setSelectedTrip(data.trips[0]);
      }
    } catch (err) {
      setError(`[FN-TRP-UI-01] fetchTrips: ${err.message}`);
    }
  }

  /**
   * FN-TRP-UI-02 — fetchResources
   * ------------------------------------------------------------------
   * WHAT IT DOES : Queries `/api/vehicles?status=Available` and
   *                 `/api/drivers?status=Available` to populate the
   *                 dropdown listings for the Create form.
   * PAGE          : Trip Dispatcher (Screen 4)
   * INPUT         : none
   * OUTPUT        : none (sets `availableVehicles` & `availableDrivers`)
   * SIDE EFFECTS  : none
   * THROWS        : none expected
   * ------------------------------------------------------------------
   */
  async function fetchResources() {
    try {
      // Vehicles dropdown filter Available
      const vRes = await fetch("/api/vehicles?status=Available", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vData = await vRes.json();
      if (vData.success) setAvailableVehicles(vData.vehicles);

      // Drivers dropdown filter Available
      const dRes = await fetch("/api/drivers?status=Available", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dData = await dRes.json();
      if (dData.success) setAvailableDrivers(dData.drivers);
    } catch (err) {
      console.error("[FN-TRP-UI-02] fetchResources failed:", err);
    }
  }

  /**
   * FN-TRP-UI-03 — handleCreate
   * ------------------------------------------------------------------
   * WHAT IT DOES : Submits the "CREATE TRIP" form -> POST /api/trips.
   *                 On success, clears the form and refreshes the
   *                 Live Board (FN-TRP-UI-01) and available resources.
   * PAGE          : Trip Dispatcher (Screen 4) — "CREATE TRIP" form
   * INPUT         : none (reads from `form` state)
   * OUTPUT        : none (updates `trips`, clears `form`)
   * SIDE EFFECTS  : Creates a Trip document on the backend (FN-TRP-01)
   * THROWS        : sets `error` with the exact backend-returned message
   * ------------------------------------------------------------------
   */
  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/trips", {
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
        source: "",
        destination: "",
        vehicleId: "",
        driverId: "",
        cargoWeightKg: "",
        plannedDistanceKm: "",
      });
      fetchTrips();
      fetchResources();
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * FN-TRP-UI-04 — handleDispatch
   * ------------------------------------------------------------------
   * WHAT IT DOES : Calls POST /api/trips/:id/dispatch. Restores vehicle &
   *                 driver dropdown availability on success.
   * PAGE          : Trip Dispatcher (Screen 4) — "Dispatch" button
   * INPUT         : tripId (string)
   * OUTPUT        : none
   * SIDE EFFECTS  : Backend flips vehicle & driver to "On Trip" (FN-TRP-03)
   * THROWS        : sets `error` with standard format from backend
   * ------------------------------------------------------------------
   */
  async function handleDispatch(tripId) {
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/dispatch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      fetchTrips();
      fetchResources();
      if (selectedTrip && selectedTrip._id === tripId) {
        setSelectedTrip({ ...selectedTrip, status: "Dispatched" });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * FN-TRP-UI-05 — handleCancel
   * ------------------------------------------------------------------
   * WHAT IT DOES : Calls POST /api/trips/:id/cancel for a Dispatched trip.
   * PAGE          : Trip Dispatcher (Screen 4) — "Cancel" button
   * INPUT         : tripId (string)
   * OUTPUT        : none
   * SIDE EFFECTS  : Backend restores vehicle & driver to "Available" (FN-TRP-05)
   * THROWS        : sets `error` with standard format from backend
   * ------------------------------------------------------------------
   */
  async function handleCancel(tripId) {
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      fetchTrips();
      fetchResources();
      if (selectedTrip && selectedTrip._id === tripId) {
        setSelectedTrip({ ...selectedTrip, status: "Cancelled" });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * FN-TRP-UI-06 — handleComplete
   * ------------------------------------------------------------------
   * WHAT IT DOES : Posts trip completion metrics (distance, liters, cost)
   *                 to `/api/trips/:tripId/complete`. Refreshes page.
   * PAGE          : Trip Dispatcher (Screen 4)
   * INPUT         : e (form event), tripId (string)
   * OUTPUT        : none
   * SIDE EFFECTS  : Restores vehicle/driver to Available. Generates Fuel Log.
   * THROWS        : sets `error` with standard format from backend
   * ------------------------------------------------------------------
   */
  async function handleComplete(e, tripId) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(completionForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setCompletingTripId(null);
      setCompletionForm({ actualDistanceKm: "", fuelConsumedLiters: "", fuelCost: "" });
      fetchTrips();
      fetchResources();
      if (selectedTrip && selectedTrip._id === tripId) {
        setSelectedTrip({ ...selectedTrip, status: "Completed" });
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // --- Live Validation Checking ---
  let capacityError = null;
  if (form.vehicleId && form.cargoWeightKg) {
    const selectedVehicle = availableVehicles.find((v) => v._id === form.vehicleId);
    if (selectedVehicle && Number(form.cargoWeightKg) > selectedVehicle.maxLoadKg) {
      capacityError = `[FN-TRP-03] dispatchTrip: Cargo weight (${form.cargoWeightKg}kg) exceeds vehicle capacity (${selectedVehicle.maxLoadKg}kg)`;
    }
  }

  const isFormValid =
    form.source &&
    form.destination &&
    form.vehicleId &&
    form.driverId &&
    form.cargoWeightKg &&
    form.plannedDistanceKm &&
    !capacityError;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Trip Dispatcher</h1>
          <p className="page-subtitle">Schedule, assign, validate, and track trip deployment</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { fetchTrips(); fetchResources(); }}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="validation-error-box">{error}</div>}

      {/* Stepper (Screen 4) */}
      <div className="stepper-container">
        <div className={`step-node ${selectedTrip?.status === "Draft" ? "active" : selectedTrip?.status === "Dispatched" || selectedTrip?.status === "Completed" ? "completed" : ""}`}>
          <div className="step-circle">1</div>
          <span className="step-label">Draft</span>
        </div>
        <div className={`step-line ${selectedTrip?.status === "Dispatched" || selectedTrip?.status === "Completed" ? "filled" : ""}`} />

        <div className={`step-node ${selectedTrip?.status === "Dispatched" ? "active" : selectedTrip?.status === "Completed" ? "completed" : ""}`}>
          <div className="step-circle">2</div>
          <span className="step-label">Dispatched</span>
        </div>
        <div className={`step-line ${selectedTrip?.status === "Completed" ? "filled" : ""}`} />

        <div className={`step-node ${selectedTrip?.status === "Completed" ? "activecompleted" : selectedTrip?.status === "Completed" ? "completed" : ""}`}>
          <div className="step-circle" style={{ background: selectedTrip?.status === "Completed" ? "var(--accent-green)" : "" }}>3</div>
          <span className="step-label" style={{ color: selectedTrip?.status === "Completed" ? "#fff" : "" }}>Completed</span>
        </div>

        <div className={`step-line ${selectedTrip?.status === "Cancelled" ? "filled" : ""}`} style={{ background: selectedTrip?.status === "Cancelled" ? "var(--accent-red)" : "" }} />
        <div className={`step-node ${selectedTrip?.status === "Cancelled" ? "active" : ""}`}>
          <div className="step-circle" style={{ background: selectedTrip?.status === "Cancelled" ? "var(--accent-red)" : "", borderColor: selectedTrip?.status === "Cancelled" ? "var(--accent-red)" : "", color: selectedTrip?.status === "Cancelled" ? "#fff" : "" }}>X</div>
          <span className="step-label" style={{ color: selectedTrip?.status === "Cancelled" ? "#fff" : "" }}>Cancelled</span>
        </div>
      </div>

      <div className="grid-2">
        {/* Create Trip Form */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Schedule Dispatch Route</h2>
          {!isDispatcher ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              🔒 Scoped to <strong>Dispatcher</strong> role only. Read-only access enabled.
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              <div className="grid-2" style={{ gap: 16, gridTemplateColumns: "1fr 1fr", marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label">SOURCE LOCATION</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Surat Port"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">DESTINATION LOCATION</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Depot Warehouse"
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ASSIGN VEHICLE (AVAILABLE ONLY)</label>
                <select
                  className="form-control"
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  required
                >
                  <option value="">-- Select Available Vehicle --</option>
                  {availableVehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.regNumber}) - Max {v.maxLoadKg} kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ASSIGN DRIVER (AVAILABLE ONLY)</label>
                <select
                  className="form-control"
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                  required
                >
                  <option value="">-- Select Available Driver --</option>
                  {availableDrivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} (Lic: {d.licenseCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2" style={{ gap: 16, gridTemplateColumns: "1fr 1fr", marginBottom: 0 }}>
                <div className="form-group">
                  <label className="form-label">CARGO WEIGHT (KG)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 800"
                    value={form.cargoWeightKg}
                    onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PLANNED DISTANCE (KM)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 150"
                    value={form.plannedDistanceKm}
                    onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>

              {/* Live capacity validation warning box */}
              {capacityError && (
                <div className="validation-error-box" style={{ marginTop: 8 }}>
                  <span>⚠️</span>
                  <div>{capacityError}</div>
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary w-100 ${!isFormValid ? "btn-disabled" : ""}`}
                style={{ width: "100%", marginTop: 20 }}
                disabled={!isFormValid}
              >
                📝 Save Trip Route as Draft
              </button>
            </form>
          )}
        </div>

        {/* Live Board / Active Trips list */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Live Dispatch Board</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto" }}>
            {trips.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: 40 }}>
                No active routes logged on board
              </div>
            ) : (
              trips.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTrip(t)}
                  className="card"
                  style={{
                    background: selectedTrip?._id === t._id ? "var(--bg-tertiary)" : "rgba(255,255,255,0.01)",
                    border: selectedTrip?._id === t._id ? "1px solid var(--accent-gold)" : "1px solid var(--border-color)",
                    padding: 16,
                    cursor: "pointer",
                    transition: "var(--transition-smooth)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>
                      {t.tripCode}
                    </span>
                    <span
                      className={`badge ${
                        t.status === "Completed"
                          ? "badge-success"
                          : t.status === "Dispatched"
                          ? "badge-blue"
                          : t.status === "Cancelled"
                          ? "badge-danger"
                          : "badge-warning"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, marginBottom: 8 }}>
                    <strong>{t.source}</strong> ➔ <strong>{t.destination}</strong>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", gap: 16 }}>
                    <span>🚚 {t.vehicle?.name || "N/A"}</span>
                    <span>👤 {t.driver?.name || "N/A"}</span>
                    <span>⚖️ {t.cargoWeightKg} kg</span>
                  </div>

                  {/* Actions for Dispatcher */}
                  {isDispatcher && selectedTrip?._id === t._id && (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 14,
                        paddingTop: 10,
                        borderTop: "1px dashed var(--border-color)",
                      }}
                      onClick={(e) => e.stopPropagation()} // Prevent card selection toggle
                    >
                      {t.status === "Draft" && (
                        <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleDispatch(t._id)}>
                          🚀 Dispatch
                        </button>
                      )}

                      {t.status === "Dispatched" && completingTripId !== t._id && (
                        <>
                          <button
                            className="btn btn-primary"
                            style={{ padding: "6px 12px", fontSize: 12, background: "var(--accent-green)", color: "#111" }}
                            onClick={() => setCompletingTripId(t._id)}
                          >
                            ✔️ Complete
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={() => handleCancel(t._id)}
                          >
                            🛑 Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Trip Completion Form */}
                  {completingTripId === t._id && (
                    <form
                      onSubmit={(e) => handleComplete(e, t._id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop: "1px dashed var(--border-color)",
                      }}
                    >
                      <h4 style={{ fontSize: 13, marginBottom: 10, color: "var(--accent-green)" }}>🏁 Close Dispatch Record</h4>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>ACTUAL DISTANCE TRAVELED (KM)</label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "6px 10px", fontSize: 12 }}
                          placeholder="e.g. 148"
                          value={completionForm.actualDistanceKm}
                          onChange={(e) => setCompletionForm({ ...completionForm, actualDistanceKm: e.target.value })}
                          required
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>FUEL CONSUMED (LITERS)</label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "6px 10px", fontSize: 12 }}
                          placeholder="e.g. 24"
                          value={completionForm.fuelConsumedLiters}
                          onChange={(e) => setCompletionForm({ ...completionForm, fuelConsumedLiters: e.target.value })}
                          required
                          min="0"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 10 }}>FUEL COST (INR, OPTIONAL)</label>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: "6px 10px", fontSize: 12 }}
                          placeholder="e.g. 2400"
                          value={completionForm.fuelCost}
                          onChange={(e) => setCompletionForm({ ...completionForm, fuelCost: e.target.value })}
                          min="0"
                        />
                      </div>

                      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12, background: "var(--accent-green)", color: "#111" }}>
                          Save Specs
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setCompletingTripId(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="screen-footnote">
        ⚠️ Flow Reference: On Complete: odometer ➔ fuel log ➔ expenses ➔ vehicle & driver available.
      </div>
    </div>
  );
}
