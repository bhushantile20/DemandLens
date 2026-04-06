import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, BrainCircuit, BarChart3, ShieldCheck, ActivitySquare,
  ArrowRight, Database, AlertTriangle, Target, TrendingUp,
  CheckCircle2, Menu, X,
} from "lucide-react";
import {
  Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

// ── Static Data ──────────────────────────────────────────────────────────────
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
  { icon: BrainCircuit, text: "Hybrid ML forecasts combining ARIMA, Random Forest, and LSTM models" },
  { icon: ActivitySquare, text: "Dynamic reorder recommendations based on predicted demand" },
  { icon: BarChart3, text: "Real-time dashboards with consumption and trend analysis" },
];

const KPI_CARDS = [
  { label: "Active Inventory", value: "1,248", icon: Database, color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
  { label: "Below Threshold", value: "12", icon: AlertTriangle, color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  { label: "Forecast Accuracy", value: "94.2%", icon: Target, color: "#A78BFA", bg: "rgba(167,139,250,0.15)" },
  { label: "AI Reorder Qty", value: "86u", icon: TrendingUp, color: "#10B981", bg: "rgba(16,185,129,0.15)" },
];

const FEATURE_CARDS = [
  { icon: BrainCircuit, color: "#3B82F6", bg: "rgba(59,130,246,0.12)", label: "ARIMA · RF · LSTM", sub: "Multi-model ensemble" },
  { icon: ShieldCheck, color: "#A78BFA", bg: "rgba(167,139,250,0.12)", label: "Walk-Forward Valid.", sub: "No data leakage" },
  { icon: CheckCircle2, color: "#10B981", bg: "rgba(16,185,129,0.12)", label: "Smart Reorder", sub: "Safety stock aware" },
];

const STATS = [
  { val: "94.2%", label: "Accuracy", sub: "On demand patterns" },
  { val: "~40%", label: "Cost Saved", sub: "Overstock reduction" },
  { val: "Real-time", label: "Alerts", sub: "Risk signals" },
];

// ── Animation Variants ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
});

const floatBlob = (duration = 8, yOffset = 20) => ({
  animate: {
    y: [0, -yOffset, 0, yOffset, 0],
    scale: [1, 1.05, 1, 0.97, 1],
    transition: { duration, repeat: Infinity, ease: "easeInOut" },
  },
});

// ── Custom Dark Tooltip ───────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,23,42,0.92)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "8px 12px", backdropFilter: "blur(12px)",
    }}>
      <p style={{ color: "#94A3B8", fontSize: 10, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.stroke, fontSize: 12, fontWeight: 700, margin: "2px 0" }}>
          {p.name === "actual" ? "Historical" : "AI Forecast"}: <span style={{ color: "#fff" }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Glassmorphic Card Shell ───────────────────────────────────────────────────
const GlassCard = ({ children, className = "", style = {} }) => (
  <div
    className={`rounded-2xl ${className}`}
    style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      ...style,
    }}
  >
    {children}
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "linear-gradient(145deg, #080d1a 0%, #0c1730 45%, #120d2e 100%)",
        position: "relative",
      }}
    >
      {/* ── Animated Ambient Blobs ── */}
      <motion.div {...floatBlob(9, 25)} style={{
        position: "absolute", top: -100, right: -40,
        width: 420, height: 420,
        background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none", zIndex: 0,
      }} />
      <motion.div {...floatBlob(12, 30)} style={{
        position: "absolute", bottom: -120, left: -60,
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none", zIndex: 0,
      }} />
      <motion.div {...floatBlob(10, 15)} style={{
        position: "absolute", top: "50%", left: "30%",
        width: 250, height: 250,
        background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
        borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
      }} />

      {/* ══════════════════════════════
          NAVBAR
      ══════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 flex items-center justify-between shrink-0 px-5 sm:px-8 lg:px-12"
        style={{
          height: 64,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(8,13,26,0.6)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3B82F6, #7C3AED)", boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Demand<span className="text-blue-400">Lens</span>
          </span>
        </div>

        {/* Desktop Nav Right */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ color: "#94A3B8" }}
          >
            Sign in
          </button>
          <motion.button
            onClick={() => navigate("/login")}
            whileHover={{ scale: 1.03, boxShadow: "0 0 24px rgba(37,99,235,0.55)" }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 text-sm font-bold text-white rounded-xl px-5 py-2.5"
            style={{ background: "#2563EB", boxShadow: "0 0 16px rgba(37,99,235,0.3)" }}
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="sm:hidden p-2 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      </motion.nav>

      {/* ── Mobile Dropdown Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative z-20 overflow-hidden px-5 py-4 flex flex-col gap-3"
            style={{
              background: "rgba(8,13,26,0.95)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <button
              onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
              className="text-sm font-semibold py-2.5 rounded-xl text-center transition-all"
              style={{ color: "#94A3B8", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              Sign In
            </button>
            <button
              onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
              className="text-sm font-bold text-white py-3 rounded-xl text-center"
              style={{ background: "linear-gradient(135deg, #2563EB, #4F46E5)", boxShadow: "0 0 20px rgba(37,99,235,0.35)" }}
            >
              Get Started →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════
          MAIN CONTENT
      ══════════════════════════════ */}
      <div className="relative z-10 flex-1">
        <div className="container mx-auto px-5 sm:px-8 lg:px-12 py-10 lg:py-0 lg:h-[calc(100vh-64px)] lg:flex lg:items-center">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 w-full">

            {/* ── LEFT: Hero Text ──────────────────────────────────── */}
            <div className="flex flex-col gap-6 sm:gap-7 w-full lg:w-[46%]">

              {/* Badge */}
              <motion.div {...fadeUp(0)}>
                <span
                  className="inline-flex items-center gap-2 w-fit text-xs font-semibold px-3.5 py-1.5 rounded-full"
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: "#60A5FA" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                  Enterprise-grade Forecasting Engine
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div {...fadeUp(0.1)}>
                <h1
                  className="font-extrabold text-white leading-tight tracking-tight"
                  style={{ fontSize: "clamp(2rem, 6vw, 3.2rem)" }}
                >
                  Predict. Reorder.{" "}
                  <span style={{
                    background: "linear-gradient(90deg, #60A5FA 0%, #A78BFA 60%, #818CF8 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  }}>
                    Optimize.
                  </span>
                </h1>
                <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: "#64748B", maxWidth: 420 }}>
                  DemandLens transforms raw inventory data into intelligent demand forecasts using a hybrid AI engine combining ARIMA, Random Forest, and LSTM models.
                </p>
              </motion.div>

              {/* Perks — hidden on mobile to keep hero clean */}
              <motion.div {...fadeUp(0.2)} className="hidden sm:flex flex-col gap-3.5">
                {PERKS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                      <Icon className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "#CBD5E1" }}>{text}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div {...fadeUp(0.3)} className="flex items-center gap-3 flex-wrap">
                <motion.button
                  onClick={() => navigate("/login")}
                  whileHover={{ scale: 1.02, boxShadow: "0px 0px 28px rgba(37,99,235,0.6)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 text-sm font-bold text-white rounded-2xl px-6 sm:px-8 py-3 sm:py-3.5 transition-all"
                  style={{ background: "linear-gradient(135deg, #2563EB, #4F46E5)", boxShadow: "0 0 24px rgba(37,99,235,0.35)" }}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ background: "rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/login")}
                  className="text-sm font-bold rounded-2xl px-6 sm:px-8 py-3 sm:py-3.5 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94A3B8" }}
                >
                  Sign In
                </motion.button>
              </motion.div>

              {/* Stats Row — scrollable on very narrow screens */}
              <motion.div
                {...fadeUp(0.4)}
                className="flex gap-6 sm:gap-10 pt-5 overflow-x-auto pb-1"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)", scrollbarWidth: "none" }}
              >
                {STATS.map((s) => (
                  <div key={s.label} className="shrink-0">
                    <p className="text-lg sm:text-xl font-extrabold text-white tracking-tight">{s.val}</p>
                    <p className="text-[11px] mt-0.5 font-semibold" style={{ color: "#3B82F6" }}>{s.label}</p>
                    <p className="text-[10px] mt-0.5 whitespace-nowrap" style={{ color: "#334155" }}>{s.sub}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── RIGHT: Glassmorphic Dashboard Card ─────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="w-full lg:w-[50%]"
            >
              <GlassCard
                className="w-full flex flex-col gap-3 p-4 sm:p-5"
                style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)" }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-bold text-white tracking-tight">Inventory Dashboard</h2>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(59,130,246,0.2)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.25)" }}
                      >
                        Live AI Preview
                      </span>
                    </div>
                    <p className="text-[10px] font-medium mt-0.5 hidden sm:block" style={{ color: "rgba(255,255,255,0.35)" }}>
                      No data leakage · Walk-forward validation
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#34D399", border: "1px solid rgba(16,185,129,0.25)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    System Optimal
                  </span>
                </div>

                {/* KPI Grid — 2 cols on mobile, 4 on desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {KPI_CARDS.map((k) => {
                    const Icon = k.icon;
                    return (
                      <motion.div
                        key={k.label}
                        whileHover={{ scale: 1.03, background: "rgba(255,255,255,0.08)" }}
                        className="p-2.5 sm:p-3 rounded-xl flex items-center gap-2 cursor-default"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: k.bg }}>
                          <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: k.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider leading-tight truncate"
                            style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</p>
                          <p className="text-sm sm:text-base font-extrabold text-white tracking-tight">{k.value}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Chart */}
                <div
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <p className="text-xs font-bold text-white">7-Day Demand Forecast</p>
                      <p className="text-[9px] font-medium mt-0.5 hidden sm:block"
                        style={{ color: "rgba(255,255,255,0.35)" }}>
                        ARIMA · RF · LSTM Ensemble
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase"
                        style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Historical
                      </span>
                      <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase"
                        style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" /> Forecast
                      </span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={110}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" axisLine={false} tickLine={false}
                        tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)", fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)", fontWeight: 600 }} />
                      <Tooltip content={<DarkTooltip />} />
                      <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3}
                        fill="url(#gA)" filter="url(#glow)"
                        dot={{ r: 3, fill: "#3b82f6", stroke: "rgba(59,130,246,0.4)", strokeWidth: 4 }} />
                      <Area type="monotone" dataKey="forecast" stroke="#a78bfa" strokeWidth={2}
                        strokeDasharray="5 4" fill="url(#gF)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Feature Cards — hidden on very small phones, visible sm+ */}
                <div className="hidden sm:grid grid-cols-3 gap-2">
                  {FEATURE_CARDS.map((f) => {
                    const Icon = f.icon;
                    return (
                      <motion.div
                        key={f.label}
                        whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.08)" }}
                        className="rounded-xl p-2.5 flex items-center gap-2 cursor-default"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: f.bg }}>
                          <Icon className="w-3 h-3" style={{ color: f.color }} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white leading-tight">{f.label}</p>
                          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{f.sub}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mobile-only: perks list inside card (compact) */}
                <div className="sm:hidden flex flex-col gap-2">
                  {PERKS.slice(0, 2).map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
                        <Icon className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <span className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Powered by PyTorch · scikit-learn · statsmodels
                  </p>
                  <div className="flex items-center gap-1">
                    {["#3b82f6", "#a78bfa", "#10b981"].map((c) => (
                      <span key={c} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
