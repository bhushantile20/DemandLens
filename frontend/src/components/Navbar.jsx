import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Settings, LogOut, ChevronDown, User } from "lucide-react";
import { useUser } from "../context/UserContext";

const routeTitles = {
  "/dashboard":    "Dashboard",
  "/items":        "Inventory",
  "/forecasting":  "Demand Forecasting",
  "/health":       "Stock Health Distribution",
  "/stock-value":  "Stock Value by Category",
  "/alerts":       "Reorder Alerts",
  "/data-quality": "Data Quality",
  "/settings":     "Settings",
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const bellRef = useRef(null);
  
  // Close Bell on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [bellOpen]);

  // Command + K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch alerts
  useEffect(() => {
    import("../services/api").then((m) => {
      m.getAlerts().then((res) => {
        // filter for active alerts
        const active = res.data.filter(a => a.status === 'pending' || a.status === 'watch' || a.risk_status === 'reorder_now');
        setAlerts(res.data);
      }).catch(() => {});
    });
  }, [pathname]);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "AI";

  const criticalAlertsCount = alerts.filter(a => a.suggested_reorder_qty > 0).length;

  const handleSearchNav = (path) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(path);
  };

  return (
    <>
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
        <div 
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-2 bg-slate-100 text-slate-400 text-xs px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
          <Search className="w-3.5 h-3.5" />
          <span>Search…</span>
          <kbd className="ml-2 bg-white border border-slate-200 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
        </div>

        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button 
            onClick={() => setBellOpen(!bellOpen)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition border border-slate-200">
            <Bell className="w-4 h-4 text-slate-500" />
            {criticalAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {bellOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-72 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-slate-200 flex flex-col overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Notifications</span>
                {criticalAlertsCount > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{criticalAlertsCount} New</span>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">You're all caught up!</div>
                ) : (
                  alerts.slice(0, 5).map((alert, i) => (
                    <div key={i} onClick={() => { setBellOpen(false); navigate('/alerts'); }} className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-800">{alert.item_name || 'Unknown Item'}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${alert.status === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {(alert.status || 'watch').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Stock: <strong className="text-slate-700">{Number(alert.current_stock || 0).toFixed(0)}</strong> units · ~{alert.days_of_stock_left ?? '?'} days left
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => { setBellOpen(false); navigate('/alerts'); }}
                className="w-full p-2.5 text-xs text-blue-600 font-semibold hover:bg-blue-50 transition text-center border-t border-slate-100">
                View All Alerts
              </button>
            </div>
          )}
        </div>

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

      {/* Command Palette / Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          
          {/* Search Box */}
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl relative z-10 overflow-hidden border border-slate-200"
               style={{ animation: 'openPalette 0.15s ease-out' }}>
            <div className="flex items-center px-4 border-b border-slate-100">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSearchNav('/items'); 
                }}
                className="w-full bg-transparent border-none py-4 px-3 text-slate-700 focus:outline-none focus:ring-0 text-[15px]" 
                placeholder="Where do you want to go?" 
              />
              <kbd className="hidden sm:inline-flex bg-slate-100 text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-200">ESC</kbd>
            </div>
            
            <div className="px-2 py-2">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-2">Quick Navigation</div>
              <button onClick={() => handleSearchNav('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-blue-600 text-slate-600 text-sm font-medium transition text-left">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md"><User className="w-3.5 h-3.5" /></span>
                Dashboard
              </button>
              <button onClick={() => handleSearchNav('/items')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-blue-600 text-slate-600 text-sm font-medium transition text-left">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md"><Search className="w-3.5 h-3.5" /></span>
                Inventory & Catalog
              </button>
              <button onClick={() => handleSearchNav('/alerts')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-blue-600 text-slate-600 text-sm font-medium transition text-left">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md"><Bell className="w-3.5 h-3.5" /></span>
                Reorder Alerts
              </button>
            </div>
          </div>
          <style>{`
            @keyframes openPalette {
              from { opacity: 0; transform: scale(0.96) translateY(-10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
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
