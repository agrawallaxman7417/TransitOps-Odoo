import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VehicleRegistry from "./pages/VehicleRegistry";
import DriversSafety from "./pages/DriversSafety";
import TripDispatcher from "./pages/TripDispatcher";
import Maintenance from "./pages/Maintenance";
import FuelExpenses from "./pages/FuelExpenses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Load user session on boot
  useEffect(() => {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  function handleLoginSuccess(loggedInUser) {
    const savedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    setToken(savedToken);
    setUser(loggedInUser);
    setActiveTab("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setActiveTab("dashboard");
  }

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // RBAC checks for sidebar menu display
  const isFleetManager = user.role === "Fleet Manager";
  const isDispatcher = user.role === "Dispatcher";
  const isSafetyOfficer = user.role === "Safety Officer";
  const isFinancialAnalyst = user.role === "Financial Analyst";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", show: true },
    {
      id: "fleet",
      label: "Fleet",
      icon: "🚚",
      show: isFleetManager || isDispatcher || isFinancialAnalyst,
    },
    { id: "drivers", label: "Drivers", icon: "👤", show: isSafetyOfficer || isFleetManager },
    { id: "trips", label: "Trips", icon: "🗺️", show: isDispatcher || isSafetyOfficer },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: "🔧",
      show: isFleetManager || isDispatcher || isFinancialAnalyst,
    },
    { id: "expenses", label: "Fuel & Expenses", icon: "💰", show: isFinancialAnalyst },
    { id: "analytics", label: "Analytics", icon: "📈", show: isFinancialAnalyst || isFleetManager },
    { id: "settings", label: "Settings", icon: "⚙️", show: true },
  ];

  // Auto-switch to first available tab if current is hidden
  const currentTabAllowed = menuItems.find((item) => item.id === activeTab && item.show);
  if (!currentTabAllowed) {
    const firstAllowed = menuItems.find((item) => item.show);
    if (firstAllowed) {
      setActiveTab(firstAllowed.id);
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-square">T</div>
          <span className="logo-text">TransitOps</span>
        </div>
        <ul className="sidebar-menu">
          {menuItems
            .filter((item) => item.show)
            .map((item) => (
              <li key={item.id} className="sidebar-item">
                <button
                  className={`sidebar-link w-100 ${activeTab === item.id ? "active" : ""}`}
                  style={{
                    background: "none",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                  }}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span style={{ marginRight: 10 }}>{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
        </ul>
        <div className="sidebar-footer">
          <div className="user-avatar">{user.name ? user.name[0] : "U"}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-red)",
              cursor: "pointer",
              marginLeft: "auto",
              fontSize: 18,
            }}
            title="Log Out"
          >
            🔌
          </button>
        </div>
      </aside>

      {/* Main app container */}
      <main className="main-content">
        <header className="header">
          <div className="header-search">
            <span>🔍</span>
            <input type="text" placeholder="Search operational records..." readOnly />
          </div>
          <div className="header-actions">
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              📍 Depot: <strong>Gandhinagar Depot GJ4</strong>
            </span>
            <span
              className="badge badge-purple"
              style={{ padding: "6px 12px", borderRadius: 6, fontWeight: 600 }}
            >
              🔑 {user.role} mode
            </span>
          </div>
        </header>

        <div className="page-body">
          {activeTab === "dashboard" && <Dashboard token={token} user={user} />}
          {activeTab === "fleet" && <VehicleRegistry token={token} user={user} />}
          {activeTab === "drivers" && <DriversSafety token={token} user={user} />}
          {activeTab === "trips" && <TripDispatcher token={token} user={user} />}
          {activeTab === "maintenance" && <Maintenance token={token} user={user} />}
          {activeTab === "expenses" && <FuelExpenses token={token} user={user} />}
          {activeTab === "analytics" && <Analytics token={token} user={user} />}
          {activeTab === "settings" && <Settings token={token} user={user} />}
        </div>
      </main>
    </div>
  );
}
