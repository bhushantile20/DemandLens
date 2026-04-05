import { useNavigate } from "react-router-dom";
import {
  Zap, BrainCircuit, BarChart3, ShieldCheck, ActivitySquare,
  ArrowRight, Database, AlertTriangle, Target, TrendingUp,
  CheckCircle2, ChevronRight
} from "lucide-react";
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { day: "Mon", actual: 42, forecast: 45 },
  { day: "Tue", actual: 38, forecast: 42 },
  { day: "Wed", actual: 55, forecast: 52 },
  { day: "Thu", actual: 61, forecast: 58 },
  { day: "Fri", actual: 47, forecast: 51 },
  { day: "Sat", actual: 35, forecast: 38 },
  { day: "Sun", actual: 28, forecast: 32 },
];

const PERKS = [
  { icon: BrainCircuit, text: "Hybrid ML forecasts combining statistical and deep learning models" },
  { icon: ActivitySquare, text: "Dynamic reorder recommendations based on predicted demand and stock levels" },
  { icon: BarChart3, text: "Visual dashboards with real-time consumption and trend analysis" },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "linear-gradient(145deg, #0B1220 0%, #0f1f3d 55%, #1a1040 100%)",
        position: "relative",
      }}
    >
      {/* Ambient blobs */}
      <div style={{ position: "absolute", top: -100, right: 80, width: 500, height: 500, background: "rgba(59,130,246,0.13)", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: -120, left: -60, width: 450, height: 450, background: "rgba(139,92,246,0.12)", borderRadius: "50%", filter: "blur(90px)", pointerEvents: "none", zIndex: 0 }} />

      {/* ══════════════════════════════
          NAVBAR
      ══════════════════════════════ */}
      <nav
        className="relative z-10 flex items-center justify-between shrink-0"
        style={{ height: 64, padding: "0 3rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B82F6, #7C3AED)", boxShadow: "0 0 20px rgba(59,130,246,0.35)" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Demand<span className="text-blue-400">Lens</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "#64748B" }}>
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">Architecture</a>
          <a href="#" className="hover:text-white transition-colors">Demo</a>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-sm font-bold text-white rounded-xl px-5 py-2.5 transition-all hover:opacity-90"
          style={{ background: "#2563EB", boxShadow: "0 0 20px rgba(37,99,235,0.35)" }}
        >
          Login <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* ══════════════════════════════
          MAIN: LEFT HERO + RIGHT CARD
      ══════════════════════════════ */}
      <div className="relative z-10 flex-1 flex items-stretch overflow-hidden">

        {/* ── LEFT: Hero Text ── */}
        <div
          className="flex flex-col justify-between py-10"
          style={{ width: "46%", padding: "2.5rem 3rem", flexShrink: 0 }}
        >
          {/* Top block */}
          <div className="flex flex-col gap-7">
            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 w-fit text-xs font-semibold px-3.5 py-1.5 rounded-full"
              style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60A5FA" }}
            >
              Enterprise-grade Forecasting Engine
            </span>

            {/* Headline */}
            <div>
              <h1 className="font-extrabold text-white leading-snug tracking-tight" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3rem)" }}>
                Predict. Reorder.{" "}
                <span style={{ background: "linear-gradient(90deg, #60A5FA, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Optimize.
                </span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "#64748B", maxWidth: 380 }}>
                DemandLens transforms raw inventory data into intelligent demand forecasts using a hybrid AI engine combining ARIMA, Random Forest, and LSTM models.
              </p>
            </div>

            {/* Perks */}
            <div className="flex flex-col gap-3.5">
              {PERKS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "#CBD5E1" }}>{text}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-sm font-bold text-white rounded-2xl px-7 py-3.5 transition-all hover:scale-105"
                style={{ background: "#2563EB", boxShadow: "0 0 30px rgba(37,99,235,0.4)" }}
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <button
                className="flex items-center gap-2 text-sm font-bold rounded-2xl px-7 py-3.5 transition-all hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8" }}
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="flex items-center gap-10 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {[
              { val: "94.2%", label: "Accuracy", sub: "On recent demand patterns" },
              { val: "~40%", label: "Cost Saved", sub: "Overstock & stockout reduction" },
              { val: "Real-time", label: "Alerts", sub: "Instant inventory risk signals" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-lg font-bold text-white">{s.val}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{s.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#334155" }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Floating White Dashboard Card ── */}
        <div className="flex-1 flex items-center justify-center py-6 pr-8 pl-4">
          <div
            className="w-full rounded-2xl flex flex-col gap-3 p-5"
            style={{
              background: "#ffffff",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)",
              maxHeight: "calc(100vh - 112px)",
              overflowY: "auto"
            }}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">Inventory Dashboard</h2>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#2563EB" }}>Live AI Preview</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">No data leakage • Real-world walk-forward validation</p>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                System Optimal
              </span>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Active Inventory", value: "1,248", icon: Database, color: "#3B82F6", bg: "#EFF6FF" },
                { label: "Below Safety Threshold", value: "12", icon: AlertTriangle, color: "#EF4444", bg: "#FEF2F2" },
                { label: "Forecast Accuracy (MAPE)", value: "94.2%", icon: Target, color: "#8B5CF6", bg: "#F5F3FF" },
                { label: "AI Suggested Reorder", value: "86u", icon: TrendingUp, color: "#10B981", bg: "#F0FDF4" },
              ].map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className="p-3 rounded-xl border border-slate-100 bg-slate-50 hover:shadow-sm transition-all flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: k.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: k.color }} />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">{k.label}</p>
                      <p className="text-base font-extrabold text-slate-900 tracking-tight">{k.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-slate-700">7-Day Demand Forecast</p>
                  <p className="text-[9px] text-slate-400 font-medium mt-0.5">Ensemble prediction across ARIMA, RF & LSTM</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Historical
                  </span>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" /> AI Forecast
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={chartData} margin={{ top: 2, right: 5, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94A3B8", fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94A3B8", fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 10, fontWeight: 600 }} />
                  <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fill="url(#gA)" dot={{ r: 2.5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 1.5 }} />
                  <Area type="monotone" dataKey="forecast" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 4" fill="url(#gF)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Mini feature cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: BrainCircuit, color: "#3B82F6", bg: "#EFF6FF", label: "ARIMA · RF · LSTM", sub: "Multi-model ensemble" },
                { icon: ShieldCheck, color: "#8B5CF6", bg: "#F5F3FF", label: "Walk-Forward Valid.", sub: "No data leakage" },
                { icon: CheckCircle2, color: "#10B981", bg: "#F0FDF4", label: "Smart Reorder", sub: "Safety stock aware" },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2 hover:shadow-sm transition-all">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: f.bg }}>
                      <Icon className="w-3 h-3" style={{ color: f.color }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-800 leading-tight">{f.label}</p>
                      <p className="text-[9px] text-slate-400">{f.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
