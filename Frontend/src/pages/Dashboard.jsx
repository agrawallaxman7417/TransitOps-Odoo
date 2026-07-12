// =====================================================================
// FILE: pages/Dashboard.jsx
// MODULE: DSB-UI (Dashboard — Screen 1)
// FUNCTIONS IN THIS FILE:
//   FN-DSB-UI-01  fetchDashboardData - load KPI and status charts
// =====================================================================

import { useState, useEffect } from "react";

export default function Dashboard({ token }) {
  const [kpis, setKpis] = useState({
    activeVehicles: 0,
    availableVehicles: 0,
    maintenanceVehicles: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    fleetUtilization: "0.0%",
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState({
    Available: 0,
    "On Trip": 0,
    "In Shop": 0,
    Retired: 0,
  });
  const [error, setError] = useState(null);

  // Filter States (UI Only for Hackathon aesthetics)
  const [vehicleType, setVehicleType] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * FN-DSB-UI-01 — fetchDashboardData
   * ------------------------------------------------------------------
   * WHAT IT DOES : Fetches core statistics, recent trips, and status counts
   *                 from the backend `/api/dashboard/kpis` endpoint.
   * PAGE          : Dashboard (Screen 1)
   * INPUT         : none
   * OUTPUT        : none (populates local states)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` with standard format on failure
   * ------------------------------------------------------------------
   */
  async function fetchDashboardData() {
    setError(null);
    try {
      const res = await fetch("/api/dashboard/kpis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setKpis(data.kpis);
      setRecentTrips(data.recentTrips);
      setStatusBreakdown(data.statusBreakdown);
    } catch (err) {
      setError(`[FN-DSB-UI-01] fetchDashboardData: ${err.message}`);
    }
  }

  // Calculate chart metrics
  const totalVehicles = Object.values(statusBreakdown).reduce((a, b) => a + b, 0);
  const getPercentage = (value) => (totalVehicles > 0 ? (value / totalVehicles) * 100 : 0);

  // Local filtering for demonstration
  const filteredTrips = recentTrips.filter((t) => {
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    if (vehicleType !== "All" && t.vehicle?.type !== vehicleType) return false;
    return true;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Fleet Dashboard</h1>
          <p className="page-subtitle">Live fleet status, KPIs, and dispatch tracking</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData}>
          🔄 Refresh Feed
        </button>
      </div>

      {error && <div className="validation-error-box">{error}</div>}

      {/* Top filters */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: 20,
          padding: 16,
          marginBottom: 30,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>VEHICLE TYPE:</span>
          <select
            className="form-control"
            style={{ padding: "6px 12px" }}
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
          >
            <option value="All">All Types</option>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>REGION:</span>
          <select
            className="form-control"
            style={{ padding: "6px 12px" }}
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="All">All Regions (Depot Head)</option>
            <option value="West">West Zone</option>
            <option value="North">North Zone</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--accent-blue)" }}>🔵</div>
          <div className="kpi-details">
            <span className="kpi-label">Active Vehicles</span>
            <span className="kpi-value">{kpis.activeVehicles}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--accent-green)" }}>🟢</div>
          <div className="kpi-details">
            <span className="kpi-label">Available Vehicles</span>
            <span className="kpi-value">{kpis.availableVehicles}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--accent-yellow)" }}>🟡</div>
          <div className="kpi-details">
            <span className="kpi-label">In Maintenance</span>
            <span className="kpi-value">{kpis.maintenanceVehicles}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--accent-gold)" }}>⚡</div>
          <div className="kpi-details">
            <span className="kpi-label">Active Trips</span>
            <span className="kpi-value">{kpis.activeTrips}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--text-secondary)" }}>📋</div>
          <div className="kpi-details">
            <span className="kpi-label">Pending Trips</span>
            <span className="kpi-value">{kpis.pendingTrips}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ color: "var(--accent-purple)" }}>🛡️</div>
          <div className="kpi-details">
            <span className="kpi-label">Utilization Rate</span>
            <span className="kpi-value">{kpis.fleetUtilization}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Trips Table */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Live Board & Recent Trips</h2>
          <div className="table-container" style={{ marginTop: 0, boxShadow: "none", border: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Trip Code</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)", padding: 20 }}>
                      No matching trips found
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map((t) => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 600, color: "var(--accent-gold)", fontFamily: "var(--font-mono)" }}>
                        {t.tripCode}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span>{t.vehicle?.name || "N/A"}</span>
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            {t.vehicle?.regNumber}
                          </span>
                        </div>
                      </td>
                      <td>{t.driver?.name || "Unassigned"}</td>
                      <td style={{ fontSize: 13 }}>
                        {t.source} ➔ {t.destination}
                      </td>
                      <td>
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status horizontal bar chart */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Vehicle Status Breakdown</h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>
            Total Registered Vehicles: <strong>{totalVehicles}</strong> (including Retired)
          </p>

          <div className="chart-container">
            <div className="bar-chart-row">
              <span className="bar-chart-label">🟢 Available</span>
              <div className="bar-chart-track">
                <div className="bar-chart-fill green" style={{ width: `${getPercentage(statusBreakdown.Available)}%` }} />
              </div>
              <span className="bar-chart-value">{statusBreakdown.Available}</span>
            </div>

            <div className="bar-chart-row">
              <span className="bar-chart-label">🔵 On Trip</span>
              <div className="bar-chart-track">
                <div className="bar-chart-fill blue" style={{ width: `${getPercentage(statusBreakdown["On Trip"])}%` }} />
              </div>
              <span className="bar-chart-value">{statusBreakdown["On Trip"]}</span>
            </div>

            <div className="bar-chart-row">
              <span className="bar-chart-label">🟡 In Shop</span>
              <div className="bar-chart-track">
                <div className="bar-chart-fill" style={{ width: `${getPercentage(statusBreakdown["In Shop"])}%` }} />
              </div>
              <span className="bar-chart-value">{statusBreakdown["In Shop"]}</span>
            </div>

            <div className="bar-chart-row">
              <span className="bar-chart-label">🔴 Retired</span>
              <div className="bar-chart-track">
                <div className="bar-chart-fill red" style={{ width: `${getPercentage(statusBreakdown.Retired)}%` }} />
              </div>
              <span className="bar-chart-value">{statusBreakdown.Retired}</span>
            </div>
          </div>

          <div style={{ marginTop: 24, padding: 12, background: "var(--bg-tertiary)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
            💡 <strong>Fleet Utilization %</strong> represents the percentage of non-retired vehicles currently deployed on active dispatch.
          </div>
        </div>
      </div>
    </div>
  );
}
