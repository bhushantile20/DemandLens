import { useLocation } from "react-router-dom";
import { Bell, Search } from "lucide-react";

const routeTitles = {
  "/dashboard":   "Dashboard",
  "/items":       "Inventory",
  "/alerts":      "Reorder Alerts",
  "/data-quality":"Data Quality",
};

export default function Navbar() {
  const { pathname } = useLocation();
  const title = routeTitles[pathname] ?? "Dashboard";

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
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

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
          >
            B
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">Bhushan</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
