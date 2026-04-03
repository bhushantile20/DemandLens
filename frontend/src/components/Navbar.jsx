import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Settings, LogOut, ChevronDown, User } from "lucide-react";
import { useUser } from "../context/UserContext";

const routeTitles = {
  "/dashboard":   "Dashboard",
  "/items":       "Inventory",
  "/alerts":      "Reorder Alerts",
  "/data-quality":"Data Quality",
  "/settings":    "Settings",
};

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const title = routeTitles[pathname] ?? "Dashboard";

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm" style={{ position: "relative", zIndex: 50 }}>
      {/* Left – breadcrumb + title */}
      <div>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
          InventoryAI
        </p>
        <h1 className="text-sm font-bold text-slate-800 leading-none mt-0.5">
          {title}
        </h1>
      </div>

      {/* Right – actions + user */}
      <div className="flex items-center gap-3">
        {/* Search pill */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 text-slate-400 text-xs px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
          <Search className="w-3.5 h-3.5" />
          <span>Search…</span>
          <kbd className="ml-2 bg-white border border-slate-200 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </div>

        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition border border-slate-200">
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* ── Avatar + dropdown ── */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            id="profile-menu-btn"
            onClick={() => setOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 8px 4px 4px",
              borderRadius: "12px",
              border: "1px solid transparent",
              background: "transparent",
              cursor: "pointer",
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              if (!open) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
              }
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: "13px",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
              }}
            >
              {initials}
            </div>

            {/* Name + role */}
            <div style={{ display: "none", textAlign: "left" }} className="md-show">
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", lineHeight: 1.2 }}>
                {user.name}
              </p>
              <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                {user.role}
              </p>
            </div>

            <ChevronDown
              style={{
                width: "14px",
                height: "14px",
                color: "#94a3b8",
                transition: "transform 0.2s",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {/* ── Dropdown panel ── */}
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: "220px",
              background: "#fff",
              borderRadius: "14px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              transformOrigin: "top right",
              transition: "opacity 0.15s, transform 0.15s",
              opacity: open ? 1 : 0,
              transform: open ? "scale(1) translateY(0)" : "scale(0.96) translateY(-6px)",
              pointerEvents: open ? "auto" : "none",
              zIndex: 999,
            }}
          >
            {/* User header inside dropdown */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "14px",
                    boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
                  }}
                >
                  {initials}
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    {user.name}
                  </p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: 0, marginTop: "2px" }}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: "6px" }}>
              <DropdownItem
                icon={<Settings style={{ width: "15px", height: "15px" }} />}
                label="Settings"
                onClick={() => { setOpen(false); navigate("/settings"); }}
              />
              <DropdownItem
                icon={<LogOut style={{ width: "15px", height: "15px" }} />}
                label="Logout"
                danger
                onClick={() => { setOpen(false); logout(); }}
              />
            </div>
          </div>
        </div>
        {/* show name on md+ */}
        <style>{`
          @media (min-width: 768px) { .md-show { display: block !important; } }
        `}</style>
      </div>
    </header>
  );
}

function DropdownItem({ icon, label, onClick, danger }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      id={`dropdown-${label.toLowerCase()}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "9px 12px",
        borderRadius: "8px",
        border: "none",
        background: hovered
          ? danger ? "#fff1f2" : "#f1f5f9"
          : "transparent",
        color: danger
          ? hovered ? "#e11d48" : "#f43f5e"
          : hovered ? "#1e293b" : "#475569",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.12s, color 0.12s",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
