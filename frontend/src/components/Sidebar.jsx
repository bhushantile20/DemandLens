import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  BellRing,
  ShieldCheck,
  Zap,
  LogOut,
} from "lucide-react";

const navItems = [
  { to: "/dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { to: "/items",        label: "Inventory",       icon: Package },
  { to: "/alerts",       label: "Reorder Alerts",  icon: BellRing },
  { to: "/data-quality", label: "Data Quality",    icon: ShieldCheck },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#0B1220] shrink-0">
      {/* ── Brand ── */}
      <div className="px-5 pt-7 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-none tracking-tight">
              Inventory<span className="text-blue-400">AI</span>
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">Demand Dashboard</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-col gap-1 px-3 pt-5 flex-1">
        <p className="text-[9px] uppercase tracking-widest text-slate-600 px-2 mb-2 font-bold">
          Main Menu
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              ].join(" ")
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Footer: logout ── */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl w-full text-sm font-medium text-slate-500 hover:bg-white/5 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
        <p className="text-[10px] text-slate-700 text-center mt-3">
          DemandLens © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
