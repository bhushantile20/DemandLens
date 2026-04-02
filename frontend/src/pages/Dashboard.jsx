import { useEffect, useState } from "react";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import StatCard from "../components/StatCard";
import AlertCard from "../components/AlertCard";

/* ─── tiny skeleton helpers ─────────────────────── */
function Skel({ h = "h-28", extra = "" }) {
  return <div className={`${h} bg-slate-100 rounded-2xl animate-pulse ${extra}`} />;
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  function fetchData() {
    setLoading(true);
    Promise.all([
      api.get("/dashboard/summary").then((r) => setSummary(r.data)).catch(() => {}),
      api.get("/alerts/reorder/").then((r) => setAlerts(r.data.slice(0, 6))).catch(() => {}),
    ]).finally(() => {
      setLoading(false);
      setLastRefresh(new Date());
    });
  }

  useEffect(() => { fetchData(); }, []);

  const stats = [
    { label: "Total Items",  value: summary?.total_items ?? "—",         icon: Package,       color: "blue",   trend: 4,  trendLabel: "new this week" },
    { label: "Low Stock",    value: summary?.low_stock_count ?? "—",     icon: AlertTriangle, color: "amber",  trend: -2, trendLabel: "vs last week" },
    { label: "Reorder Now",  value: summary?.reorder_now_count ?? "—",   icon: ShoppingCart,  color: "red",    trend: 1,  trendLabel: "needs action" },
    { label: "Data Issues",  value: summary?.issue_count ?? "—",         icon: ShieldAlert,   color: "purple", trend: -5, trendLabel: "resolved" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 leading-none tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Real-time inventory health, demand forecasts &amp; reorder signals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Last refreshed badge */}
          <span className="hidden sm:inline-flex text-xs text-slate-400 items-center gap-1">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className="border border-gray-300 rounded-lg px-6 py-3 flex items-center justify-center hover:scale-105 transition text-slate-600 font-semibold bg-white shadow-sm h-[48px]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold px-3 py-2 rounded-xl">
            <TrendingUp className="w-3.5 h-3.5" />
            AI Forecasting Active
          </div>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skel key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      )}

      {/* ── TWO-COLUMN ROW: Alerts + Mini Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Alerts card – 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-base font-semibold text-slate-800">Top Reorder Alerts</h3>
              <span className="ml-1 bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Alert rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 flex-1 bg-slate-50/50">
            {loading ? (
              [...Array(4)].map((_, i) => <Skel key={i} h="h-48" />)
            ) : alerts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                <ShoppingCart className="w-10 h-10 opacity-30" />
                <p className="text-sm">🎉 No reorder alerts right now.</p>
              </div>
            ) : (
              alerts.map((a) => <AlertCard key={a.item_id} item={a} />)
            )}
          </div>
        </div>

        {/* Forecast accuracy card – 1/3 width */}
        <div className="flex flex-col gap-4">
          {/* Accuracy card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">Forecast Accuracy</p>
            <p className="text-4xl font-extrabold">94.2%</p>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-300" />
              <p className="text-xs text-blue-200">+1.3% from last month</p>
            </div>
            {/* Progress bar */}
            <div className="mt-4 bg-white/10 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-white/80" style={{ width: "94.2%" }} />
            </div>
          </div>

          {/* Lead time card */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-200 mb-1">Avg. Lead Time</p>
            <p className="text-4xl font-extrabold">7 days</p>
            <p className="text-xs text-purple-200 mt-2">Across all active suppliers</p>
          </div>

          {/* Cost saved card */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Cost Saved (Est.)</p>
            <p className="text-4xl font-extrabold">₹1.2L</p>
            <div className="flex items-center gap-1.5 mt-2">
              <TrendingDown className="w-3.5 h-3.5 text-green-400" />
              <p className="text-xs text-slate-400">Via optimized reorder timing</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MINI DEMAND CHART ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Demand Forecast (next 7 days)</h3>
            <p className="text-xs text-slate-400 mt-0.5">AI-predicted units needed per day</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full font-semibold">
            <TrendingUp className="w-3 h-3" /> Trending Up
          </span>
        </div>
        {/* Bar chart */}
        <div className="flex items-end gap-3 h-32">
          {[
            { day: "Mon", h: 60 },
            { day: "Tue", h: 75 },
            { day: "Wed", h: 50 },
            { day: "Thu", h: 88 },
            { day: "Fri", h: 65 },
            { day: "Sat", h: 40 },
            { day: "Sun", h: 72 },
          ].map(({ day, h }) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-purple-500 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ height: `${h}%` }}
              />
              <span className="text-[10px] font-medium text-slate-400">{day}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
