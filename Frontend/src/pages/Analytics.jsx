// =====================================================================
// FILE: pages/Analytics.jsx
// MODULE: RPT-UI (Reports & Analytics — Screen 7)
// FUNCTIONS IN THIS FILE:
//   FN-RPT-UI-01  fetchSummary   - fetch operational summary metrics
//   FN-RPT-UI-02  fetchChartData - fetch monthly revenue and costliest vehicle arrays
// =====================================================================

import { useState, useEffect } from "react";

export default function Analytics({ token }) {
  const [summary, setSummary] = useState({
    fuelEfficiency: "0.00 km/L",
    fleetUtilization: "0.0%",
    operationalCost: 0,
    vehicleROI: "0.0%",
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [costliestVehicles, setCostliestVehicles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
    fetchChartData();
  }, []);

  /**
   * FN-RPT-UI-01 — fetchSummary
   * ------------------------------------------------------------------
   * WHAT IT DOES : Queries `/api/analytics/summary` to populate the 4
   *                 analytical reports summary cards.
   * PAGE          : Reports & Analytics (Screen 7)
   * INPUT         : none
   * OUTPUT        : none (sets `summary` state)
   * SIDE EFFECTS  : none
   * THROWS        : sets `error` state on failure
   * ------------------------------------------------------------------
   */
  async function fetchSummary() {
    setError(null);
    try {
      const res = await fetch("/api/analytics/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setSummary({
        fuelEfficiency: data.fuelEfficiency,
        fleetUtilization: data.fleetUtilization,
        operationalCost: data.operationalCost,
        vehicleROI: data.vehicleROI,
      });
    } catch (err) {
      setError(`[FN-RPT-UI-01] fetchSummary: ${err.message}`);
    }
  }

  /**
   * FN-RPT-UI-02 — fetchChartData
   * ------------------------------------------------------------------
   * WHAT IT DOES : Queries `/api/analytics/charts` to fetch monthly revenue
   *                 arrays and top costliest vehicle breakdowns.
   * PAGE          : Reports & Analytics (Screen 7)
   * INPUT         : none
   * OUTPUT        : none (sets `monthlyData` & `costliestVehicles`)
   * SIDE EFFECTS  : none
   * THROWS        : none expected
   * ------------------------------------------------------------------
   */
  async function fetchChartData() {
    try {
      const res = await fetch("/api/analytics/charts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMonthlyData(data.monthlyData);
        setCostliestVehicles(data.costliestVehicles);
      }
    } catch (err) {
      console.error("[FN-RPT-UI-02] fetchChartData failed:", err);
    }
  }

  // Find max monthly revenue to scale the vertical bars
  const maxRevenue = monthlyData.reduce((max, d) => (d.revenue > max ? d.revenue : max), 1000) || 1000;

  // Find max costliest vehicle cost to scale horizontal bars
  const maxVehicleCost = costliestVehicles.reduce((max, v) => (v.operationalCost > max ? v.operationalCost : max), 1000) || 1000;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Reports & Operational Analytics</h1>
          <p className="page-subtitle">Evaluate fuel metrics, depot ROI calculations, and cost distribution</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { fetchSummary(); fetchChartData(); }}>
          🔄 Refresh
        </button>
      </div>

      {error && <div className="validation-error-box">{error}</div>}

      {/* 4 KPI summary cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--accent-blue)" }}>📊</div>
          <div className="kpi-details">
            <span className="kpi-label">Avg Fuel Efficiency</span>
            <span className="kpi-value">{summary.fuelEfficiency}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Formula: Total Distance / Fuel Liters
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--accent-green)" }}>📈</div>
          <div className="kpi-details">
            <span className="kpi-label">Fleet Deployment Rate</span>
            <span className="kpi-value">{summary.fleetUtilization}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Active Vehicles / Total Fleet
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--accent-red)" }}>💸</div>
          <div className="kpi-details">
            <span className="kpi-label">Operational Costs</span>
            <span className="kpi-value">₹ {summary.operationalCost.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Sum of: Fuel + Maint + Tolls + Misc
            </span>
          </div>
        </div>

        <div className="kpi-card" style={{ border: "1px solid var(--accent-gold)" }}>
          <div className="kpi-icon" style={{ background: "rgba(201, 138, 44, 0.15)", color: "var(--accent-gold)" }}>🏆</div>
          <div className="kpi-details">
            <span className="kpi-label">Estimated Vehicle ROI</span>
            <span className="kpi-value" style={{ color: "var(--accent-gold)" }}>{summary.vehicleROI}</span>
            <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              (Revenue - Op Cost) / Acq Cost
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Monthly Revenue bar chart (Vertical CSS charts) */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Monthly Simulated Revenue</h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>
            Simulated route revenue evaluated at ₹ 50 per kilometer of completed trips
          </p>

          <div className="vertical-chart">
            {monthlyData.map((d) => {
              const heightPercent = (d.revenue / maxRevenue) * 160; // Max height 160px
              return (
                <div key={d.month} className="vertical-chart-bar-container">
                  <div
                    className="vertical-chart-bar"
                    style={{ height: `${heightPercent}px` }}
                  >
                    <div className="vertical-chart-tooltip">
                      ₹ {d.revenue.toLocaleString()}
                    </div>
                  </div>
                  <span className="vertical-chart-label">{d.month}</span>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>
            📅 Chronological Breakdown (Current Fiscal Year)
          </div>
        </div>

        {/* Top Costliest Vehicles (Horizontal CSS bars) */}
        <div className="card">
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Top 5 Costliest Fleet Vehicles</h2>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 20 }}>
            Cumulative operational cost overhead (maintenance, fuel, and tolls)
          </p>

          <div className="chart-container" style={{ padding: "10px 0" }}>
            {costliestVehicles.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: 40 }}>
                No vehicle operational logs found
              </div>
            ) : (
              costliestVehicles.map((v) => {
                const widthPercent = (v.operationalCost / maxVehicleCost) * 100;
                return (
                  <div key={v.regNumber} className="bar-chart-row">
                    <div className="bar-chart-label">
                      <strong style={{ color: "#fff" }}>{v.name}</strong>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {v.regNumber}
                      </div>
                    </div>
                    <div className="bar-chart-track">
                      <div
                        className="bar-chart-fill"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <div className="bar-chart-value" style={{ width: 100 }}>
                      ₹ {v.operationalCost.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: 16, padding: 12, background: "var(--bg-tertiary)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
            ⚠️ <strong>Depot Strategy:</strong> Vehicles with high operational costs and low utilization should be reviewed for retirement or scheduled shop service.
          </div>
        </div>
      </div>
    </div>
  );
}
