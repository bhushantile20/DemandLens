import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Bell,
  TrendingUp,
  Activity,
  DollarSign,
  LogOut,
  Settings,
  Database,
} from "lucide-react";


import { useUser } from "../context/UserContext";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard",     icon: LayoutDashboard, path: "/dashboard" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { name: "Inventory",     icon: Package,         path: "/items" },
      { name: "Reorder Alerts",icon: Bell,            path: "/alerts" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { name: "Demand Forecast", icon: TrendingUp,   path: "/forecasting"  },
      { name: "Stock Health",    icon: Activity,     path: "/health"       },
      { name: "Stock Value",     icon: DollarSign,   path: "/stock-value"  },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Data Management", icon: Database,     path: "/data"         },
    ],
  },
];

const BOTTOM_NAV = [
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const { logout } = useUser();

  return (
    <aside
      style={{
        width: "220px",
        minWidth: "220px",
        background: "linear-gradient(180deg, #0c1220 0%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "2px 0 20px rgba(0,0,0,0.3)",
        position: "relative",
        zIndex: 20,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          height: "60px",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(59,130,246,0.4)",
              flexShrink: 0,
            }}
          >
            <TrendingUp style={{ width: "16px", height: "16px", color: "#fff" }} />
          </div>
          <span
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.3px",
            }}
          >
            Demand<span style={{ color: "#3b82f6" }}>Lens</span>
          </span>
        </div>
      </div>

      {/* ── Nav Groups ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 10px 8px" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: "20px" }}>
            {/* Section label */}
            <p
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "rgba(148,163,184,0.5)",
                textTransform: "uppercase",
                padding: "0 12px",
                marginBottom: "6px",
              }}
            >
              {group.label}
            </p>

            {/* Nav links */}
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  marginBottom: "2px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#fff" : "rgba(148,163,184,0.85)",
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(139,92,246,0.15) 100%)"
                    : "transparent",
                  borderLeft: isActive
                    ? "2px solid #3b82f6"
                    : "2px solid transparent",
                  transition: "all 0.15s ease",
                  position: "relative",
                })}
                onMouseEnter={(e) => {
                  const link = e.currentTarget;
                  // only apply hover if not active
                  if (!link.classList.contains("active")) {
                    link.style.background = "rgba(255,255,255,0.05)";
                    link.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  const link = e.currentTarget;
                  if (!link.getAttribute("aria-current")) {
                    link.style.background = "transparent";
                    link.style.color = "rgba(148,163,184,0.85)";
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: isActive
                          ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                          : "rgba(255,255,255,0.05)",
                        flexShrink: 0,
                        boxShadow: isActive ? "0 2px 8px rgba(59,130,246,0.4)" : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      <item.icon
                        style={{
                          width: "15px",
                          height: "15px",
                          color: isActive ? "#fff" : "rgba(148,163,184,0.7)",
                        }}
                      />
                    </div>
                    <span>{item.name}</span>
                    {/* Active dot */}
                    {isActive && (
                      <div
                        style={{
                          marginLeft: "auto",
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#3b82f6",
                          boxShadow: "0 0 6px #3b82f6",
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* ── Bottom section: Settings + user mini-card + logout ── */}
      <div
        style={{
          padding: "10px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        {/* Settings link */}
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              borderRadius: "8px",
              marginBottom: "8px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: isActive ? 600 : 500,
              color: isActive ? "#fff" : "rgba(148,163,184,0.85)",
              background: isActive
                ? "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(139,92,246,0.15) 100%)"
                : "transparent",
              borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
              transition: "all 0.15s ease",
            })}
          >
            {({ isActive }) => (
              <>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive
                      ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                      : "rgba(255,255,255,0.05)",
                    flexShrink: 0,
                    boxShadow: isActive ? "0 2px 8px rgba(59,130,246,0.4)" : "none",
                  }}
                >
                  <item.icon
                    style={{
                      width: "15px",
                      height: "15px",
                      color: isActive ? "#fff" : "rgba(148,163,184,0.7)",
                    }}
                  />
                </div>
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Logout button */}
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "9px 12px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            color: "rgba(148,163,184,0.7)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(148,163,184,0.7)";
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(239,68,68,0.1)",
              flexShrink: 0,
            }}
          >
            <LogOut style={{ width: "15px", height: "15px", color: "#f87171" }} />
          </div>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
