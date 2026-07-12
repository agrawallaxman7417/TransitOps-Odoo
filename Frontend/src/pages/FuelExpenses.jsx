// =====================================================================
// FILE: pages/FuelExpenses.jsx
// MODULE: FUEL-UI (Fuel & Expenses — Screen 6)
// FUNCTIONS IN THIS FILE:
//   FN-FUEL-UI-01  fetchExpenseData  - load fuel logs and expenses
//   FN-FUEL-UI-02  fetchDropdowns    - load vehicles and trips for dropdown selection
//   FN-FUEL-UI-03  handleLogFuel     - POST fuel log entry
//   FN-FUEL-UI-04  handleAddExpense  - POST other expense entry
// =====================================================================

import { useState, useEffect } from "react";

export default function FuelExpenses({ token }) {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  // Totals
  const [totals, setTotals] = useState({
    fuel: 0,
    tolls: 0,
    other: 0,
    maintenance: 0,
    grandTotal: 0,
  });

  const [error, setError] = useState(null);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [fuelForm, setFuelForm] = useState({
    vehicleId: "",
    liters: "",
    fuelCost: "",
    date: "",
    tripId: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    vehicleId: "",
    tripId: "",
    toll: "",
    other: "",
    maintenanceLinked: "",
  });

  useEffect(() => {
    fetchExpenseData();
    fetchDropdowns();
  }, []);

  /**
   * FN-FUEL-UI-01 — fetchExpenseData
   * ------------------------------------------------------------------
   * WHAT IT DOES : Queries GET `/api/expenses` to load fuel records, other
   *                 expenses, and calculates financial summary totals.
   * PAGE          : Fuel & Expense Management (Screen 6)
   * INPUT         : none
   * OUTPUT        : none (sets `fuelLogs`, `expenses`, and `totals`)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` state on API failure
   * ------------------------------------------------------------------
   */
  async function fetchExpenseData() {
    setError(null);
    try {
      const res = await fetch("/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFuelLogs(data.fuelLogs);
      setExpenses(data.expenses);
      setTotals({
        fuel: data.totalFuelCost,
        tolls: data.totalTolls,
        other: data.totalOther,
        maintenance: data.totalMaintenance,
        grandTotal: data.grandTotal,
      });
    } catch (err) {
      setError(`[FN-FUEL-UI-01] fetchExpenseData: ${err.message}`);
    }
  }

  /**
   * FN-FUEL-UI-02 — fetchDropdowns
   * ------------------------------------------------------------------
   * WHAT IT DOES : Queries `/api/vehicles` and `/api/trips` to populate
   *                 selection options in log modals.
   * PAGE          : Fuel & Expense Management (Screen 6)
   * INPUT         : none
   * OUTPUT        : none (sets `vehicles` and `trips` state)
   * SIDE EFFECTS  : none
   * THROWS        : none expected
   * ------------------------------------------------------------------
   */
  async function fetchDropdowns() {
    try {
      const vRes = await fetch("/api/vehicles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vData = await vRes.json();
      if (vData.success) setVehicles(vData.vehicles);

      // Fetch all trips for expense linking
      const tRes = await fetch("/api/trips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tData = await tRes.json();
      if (tData.success) setTrips(tData.trips);
    } catch (err) {
      console.error("[FN-FUEL-UI-02] fetchDropdowns failed:", err);
    }
  }

  /**
   * FN-FUEL-UI-03 — handleLogFuel
   * ------------------------------------------------------------------
   * WHAT IT DOES : Posts a fuel record to POST `/api/expenses/fuel`.
   * PAGE          : Fuel & Expense Management (Screen 6) — "+ LOG FUEL" form
   * INPUT         : none (reads `fuelForm` state)
   * OUTPUT        : none (refreshes expenses data)
   * SIDE EFFECTS  : Writes FuelLog document.
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function handleLogFuel(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/expenses/fuel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fuelForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setFuelForm({ vehicleId: "", liters: "", fuelCost: "", date: "", tripId: "" });
      setShowFuelModal(false);
      fetchExpenseData();
    } catch (err) {
      setError(err.message);
    }
  }

  /**
   * FN-FUEL-UI-04 — handleAddExpense
   * ------------------------------------------------------------------
   * WHAT IT DOES : Posts toll/misc record to POST `/api/expenses/expense`.
   * PAGE          : Fuel & Expense Management (Screen 6) — "+ ADD EXPENSE" form
   * INPUT         : none (reads `expenseForm` state)
   * OUTPUT        : none (refreshes expenses data)
   * SIDE EFFECTS  : Writes Expense document.
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function handleAddExpense(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/expenses/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(expenseForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setExpenseForm({ vehicleId: "", tripId: "", toll: "", other: "", maintenanceLinked: "" });
      setShowExpenseModal(false);
      fetchExpenseData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Fuel & Expense Management</h1>
          <p className="page-subtitle">Log diesel charges, tolls, other expenditures, and monitor operational costs</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setShowFuelModal(true)}>
            ⛽ Log Fuel Consumption
          </button>
          <button className="btn btn-secondary" onClick={() => setShowExpenseModal(true)}>
            💸 Log Other Expense
          </button>
        </div>
      </div>

      {error && <div className="validation-error-box">{error}</div>}

      <div className="grid-2">
        {/* Table 1: Fuel Logs */}
        <div className="card">
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>⛽ Vehicle Fuel Log</h2>
          <div className="table-container" style={{ marginTop: 0, border: "none", boxShadow: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Trip Code</th>
                  <th>Fuel Date</th>
                  <th>Fuel Liters</th>
                  <th>Fuel Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20 }}>
                      No fuel logs recorded
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((f) => (
                    <tr key={f._id}>
                      <td style={{ fontWeight: 600 }}>{f.vehicle?.name || "N/A"}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent-gold)" }}>
                        {f.trip?.tripCode || "—"}
                      </td>
                      <td>{new Date(f.date).toLocaleDateString()}</td>
                      <td>{f.liters} L</td>
                      <td style={{ fontWeight: 600 }}>₹ {f.fuelCost.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Other Expenses */}
        <div className="card">
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>💸 Toll & Other Expenditures</h2>
          <div className="table-container" style={{ marginTop: 0, border: "none", boxShadow: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Trip Code</th>
                  <th>Toll</th>
                  <th>Maint (Linked)</th>
                  <th>Misc/Other</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20 }}>
                      No general expenses recorded
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => {
                    const total = (e.toll || 0) + (e.other || 0) + (e.maintenanceLinked || 0);
                    return (
                      <tr key={e._id}>
                        <td style={{ fontWeight: 600 }}>{e.vehicle?.name || "N/A"}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent-gold)" }}>
                          {e.trip?.tripCode || "—"}
                        </td>
                        <td>₹ {e.toll}</td>
                        <td style={{ color: "var(--accent-yellow)" }}>₹ {e.maintenanceLinked}</td>
                        <td>₹ {e.other}</td>
                        <td style={{ fontWeight: 700 }}>₹ {total.toLocaleString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Auto-computed Total Operational Cost Footer */}
      <footer
        className="card"
        style={{
          marginTop: 30,
          background: "var(--bg-tertiary)",
          border: "1px solid var(--accent-gold)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 1 }}>
            Total Operational Breakdown
          </span>
          <div style={{ display: "flex", gap: 24, marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <span>Fuel: <strong>₹ {totals.fuel.toLocaleString()}</strong></span>
            <span>Tolls: <strong>₹ {totals.tolls.toLocaleString()}</strong></span>
            <span>Maintenance: <strong>₹ {totals.maintenance.toLocaleString()}</strong></span>
            <span>Misc: <strong>₹ {totals.other.toLocaleString()}</strong></span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>GRAND TOTAL OPERATIONAL COST</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-gold)" }}>
            ₹ {totals.grandTotal.toLocaleString()}
          </div>
        </div>
      </footer>

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h2 style={{ marginBottom: 20, fontSize: 20 }}>⛽ Log Vehicle Fuel Consumed</h2>
            <form onSubmit={handleLogFuel}>
              <div className="form-group">
                <label className="form-label">SELECT VEHICLE</label>
                <select
                  className="form-control"
                  value={fuelForm.vehicleId}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.regNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">LINK TO TRIP (OPTIONAL)</label>
                <select
                  className="form-control"
                  value={fuelForm.tripId}
                  onChange={(e) => setFuelForm({ ...fuelForm, tripId: e.target.value })}
                >
                  <option value="">-- None --</option>
                  {trips.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.tripCode} ({t.source} ➔ {t.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">FUEL CONSUMED (LITERS)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 35"
                  value={fuelForm.liters}
                  onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">TOTAL FUEL COST (INR)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 3500"
                  value={fuelForm.fuelCost}
                  onChange={(e) => setFuelForm({ ...fuelForm, fuelCost: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">DATE LOGGED</label>
                <input
                  type="date"
                  className="form-control"
                  value={fuelForm.date}
                  onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFuelModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Fuel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Other Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h2 style={{ marginBottom: 20, fontSize: 20 }}>💸 Log General Operational Expense</h2>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">SELECT VEHICLE</label>
                <select
                  className="form-control"
                  value={expenseForm.vehicleId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.regNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">LINK TO TRIP (OPTIONAL)</label>
                <select
                  className="form-control"
                  value={expenseForm.tripId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, tripId: e.target.value })}
                >
                  <option value="">-- None --</option>
                  {trips.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.tripCode} ({t.source} ➔ {t.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">TOLL TAX CHARGES (INR)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 240"
                  value={expenseForm.toll}
                  onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">LINKED MAINTENANCE COST OVERHEAD (INR)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 4500"
                  value={expenseForm.maintenanceLinked}
                  onChange={(e) => setExpenseForm({ ...expenseForm, maintenanceLinked: e.target.value })}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label className="form-label">MISC / OTHER EXPENSES (INR)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 150"
                  value={expenseForm.other}
                  onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })}
                  min="0"
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
