import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Legend, ReferenceArea,
} from "recharts";
import { ArrowLeft, TrendingUp, Package, AlertTriangle, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  normal:    { label: "Normal",    color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", icon: CheckCircle },
  low:       { label: "Low Stock", color: "#b45309", bg: "#fef9c3", border: "#fde047", icon: AlertTriangle },
  critical:  { label: "Critical",  color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", icon: AlertCircle },
  overstock: { label: "Overstock", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: Package },
};

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const hasActual = payload.some(p => p.dataKey === "actual" && p.value != null);
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 170, fontFamily: "'Inter',system-ui" }}>
      <p style={{ fontWeight: 700, color: "#0f172a", margin: "0 0 6px", fontSize: 12 }}>{label}</p>
      {!hasActual && <p style={{ fontSize: 10, color: "#6366f1", margin: "0 0 6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>⚡ AI Forecast Zone</p>}
      {payload.map((p, i) => p.value != null && (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            {p.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{Number(p.value).toFixed(1)} u</span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color, bg, border }) => (
  <div style={{ background: "#fff", border: `1px solid ${border || "#e2e8f0"}`, borderRadius: 13, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    <p style={{ fontSize: 24, fontWeight: 800, color: color || "#0f172a", margin: "0 0 2px", lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{sub}</p>}
  </div>
);

const fmtDate = (iso) => { const d = new Date(iso); return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`; };

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [raw, setRaw]         = useState(null);   // /items/:id/
  const [forecast, setForecast] = useState({ history: [], forecast: [] });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/items/${id}/`),
      api.get(`/items/${id}/forecast/?days=30`),
    ])
      .then(([itemRes, fRes]) => { setRaw(itemRes.data); setForecast(fRes.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // ── Build chart data ──────────────────────────────────────────────────────
  const { chartData, todayMarker, forecastRows, modelSums, forecastZone } = (() => {
    // Aggregate history by date
    const histMap = {};
    (forecast.history || []).forEach(h => {
      const d = h.date;
      if (!histMap[d]) histMap[d] = { date: d, actual: 0 };
      histMap[d].actual += parseFloat(h.quantity_used);
    });

    // Map forecast by model
    const fMap = {};
    const sums = { arima: 0, rf: 0, lstm: 0 };
    (forecast.forecast || []).forEach(f => {
      const d   = f.forecast_date;
      const val = parseFloat(f.predicted_demand);
      if (!fMap[d]) fMap[d] = { date: d };
      if (f.model_name === "arima")                  { fMap[d].arima  = val; sums.arima  += val; }
      if (f.model_name === "random_forest")          { fMap[d].rf   = val; sums.rf   += val; }
      if (f.model_name === "lstm")                   { fMap[d].lstm = val; sums.lstm += val; }
    });

    const histArr     = Object.values(histMap).sort((a, b) => a.date.localeCompare(b.date));
    const forecastArr = Object.values(fMap).sort((a, b) => a.date.localeCompare(b.date));
    const rows        = forecastArr.map(r => ({ ...r }));

    return {
      chartData:    [...histArr, ...forecastArr],
      todayMarker:  histArr.length > 0 ? histArr[histArr.length - 1].date : null,
      forecastRows: rows,
      modelSums:    sums,
      forecastZone: forecastArr.length > 0
        ? { start: forecastArr[0].date, end: forecastArr[forecastArr.length - 1].date }
        : { start: null, end: null },
    };
  })();

  if (loading) return (
    <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, fontFamily: "'Inter',system-ui" }}>
      <RefreshCw style={{ width: 26, height: 26, color: "#3b82f6", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Loading item data…</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!raw) return <div style={{ padding: 24, color: "#64748b" }}>Item not found.</div>;

  const sc       = STATUS[raw.risk_status] || STATUS.normal;
  const StatusIcon = sc.icon;
  const stockQty = parseFloat(raw.stock?.quantity_available ?? 0);
  const reorderLvl = parseFloat(raw.stock?.reorder_level ?? 0);
  const avgModels = [modelSums.arima, modelSums.rf, modelSums.lstm].filter(v => v > 0);
  const avgForecast = avgModels.length > 0 ? (avgModels.reduce((a, b) => a + b, 0) / avgModels.length) : 0;

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100%", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <button
            onClick={() => navigate("/items")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#64748b", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter',system-ui", padding: "0 0 8px", marginBottom: 2 }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to Inventory
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", flexShrink: 0 }}>
              <Package style={{ width: 19, height: 19, color: "#fff" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>{raw.item_name}</h1>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{raw.item_id} · {raw.category} · {raw.supplier?.supplier_name}</p>
            </div>
            {/* Status pill */}
            <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 700, padding: "5px 14px", borderRadius: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <StatusIcon style={{ width: 13, height: 13 }} />
              {sc.label}
            </span>
          </div>
        </div>

        {/* ── View Full Forecast CTA ── */}
        <button
          onClick={() => navigate(`/forecasting?item=${id}`)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", border: "none", color: "#fff", borderRadius: 11, padding: "12px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(59,130,246,0.4)", fontFamily: "'Inter',system-ui", transition: "all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.55)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(59,130,246,0.4)"}
        >
          <TrendingUp style={{ width: 16, height: 16 }} />
          View Full AI Forecast
        </button>
      </div>

      {/* ══ ROW 1: KPI Cards ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 20 }}>
        <KpiCard
          label="Current Stock"
          value={stockQty.toFixed(0)}
          sub={`${raw.unit || "units"} on hand`}
          color="#0f172a"
          border="#e2e8f0"
        />
        <KpiCard
          label="Reorder Level"
          value={reorderLvl.toFixed(0)}
          sub={`trigger point`}
          color={stockQty < reorderLvl ? "#dc2626" : "#64748b"}
          border={stockQty < reorderLvl ? "#fca5a5" : "#e2e8f0"}
        />
        <KpiCard
          label="Stock Ratio"
          value={raw.stock_ratio != null ? `${raw.stock_ratio}×` : "—"}
          sub={raw.stock_ratio >= 3 ? "⚠ Possible overstock" : raw.stock_ratio < 1 ? "⚠ Below reorder" : "Healthy ratio"}
          color={raw.stock_ratio >= 3 ? "#7c3aed" : raw.stock_ratio < 1 ? "#dc2626" : "#10b981"}
          border={raw.stock_ratio >= 3 ? "#ddd6fe" : raw.stock_ratio < 1 ? "#fca5a5" : "#bbf7d0"}
        />
        <KpiCard
          label="Days of Stock"
          value={raw.days_of_stock_left != null ? `${raw.days_of_stock_left}d` : "—"}
          sub={raw.days_of_stock_left < 7 ? "🔴 Urgent reorder" : raw.days_of_stock_left < 14 ? "🟡 Order soon" : "✅ Adequate"}
          color={raw.days_of_stock_left < 7 ? "#dc2626" : raw.days_of_stock_left < 14 ? "#b45309" : "#10b981"}
          border={raw.days_of_stock_left < 7 ? "#fca5a5" : raw.days_of_stock_left < 14 ? "#fde047" : "#bbf7d0"}
        />
        <KpiCard
          label="7d AI Forecast"
          value={avgForecast > 0 ? avgForecast.toFixed(0) : "—"}
          sub="avg across 3 models"
          color="#3b82f6"
          border="#bfdbfe"
        />
        <KpiCard
          label="Cost / Unit"
          value={raw.cost_per_unit != null ? `₹${parseFloat(raw.cost_per_unit).toFixed(2)}` : "—"}
          sub={raw.cost_per_unit && `≈ ₹${(parseFloat(raw.cost_per_unit) * stockQty).toFixed(0)} total value`}
          color="#f59e0b"
          border="#fde68a"
        />
      </div>

      {/* ══ ROW 2: Chart ══ */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 24, marginBottom: 20 }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>30-Day Consumption History + 7-Day AI Forecast</h2>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>
            🔵 Shaded area = actual daily consumption &nbsp;·&nbsp; Dashed lines = 3 AI model predictions &nbsp;·&nbsp; Vertical line = Today
          </p>
        </div>

        {chartData.length === 0 ? (
          <div style={{ height: 340, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
            <TrendingUp style={{ width: 32, height: 32, color: "#e2e8f0" }} />
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>No history or forecast data yet. Run forecasts first.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="gradActualDetail" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false} tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "'Inter',system-ui" }}
                tickFormatter={t => fmtDate(t)}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                width={32}
                domain={["auto", "auto"]}
                label={{ value: "Units", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10, dx: -4 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#64748b", paddingTop: 16 }} />

              {/* ── Forecast Zone Shading (Module 3) ── */}
              {forecastZone.start && forecastZone.end && (
                <ReferenceArea
                  x1={forecastZone.start}
                  x2={forecastZone.end}
                  fill="#8b5cf6"
                  fillOpacity={0.06}
                  stroke="#8b5cf6"
                  strokeOpacity={0.2}
                  strokeWidth={1}
                  label={{ value: 'AI Forecast Zone', position: 'insideTopLeft', fill: '#8b5cf6', fontSize: 10, fontWeight: 600 }}
                />
              )}

              {/* Today reference line */}
              {todayMarker && (
                <ReferenceLine
                  x={todayMarker}
                  stroke="#475569" strokeDasharray="6 4" strokeWidth={1.5}
                  label={{ value: "Today →", position: "insideTopLeft", fill: "#475569", fontSize: 10, fontWeight: 700, dy: -6 }}
                />
              )}

              {/* Reorder level reference line */}
              {reorderLvl > 0 && (
                <ReferenceLine
                  y={reorderLvl}
                  stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1}
                  label={{ value: `Reorder: ${reorderLvl}`, position: "right", fill: "#ef4444", fontSize: 10 }}
                />
              )}

              {/* Historical consumption — filled area */}
              <Area
                type="monotone" dataKey="actual"
                name="Actual Consumption"
                stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#gradActualDetail)"
                dot={false} connectNulls
                activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
              />

              {/* ARIMA forecast */}
              <Line type="monotone" dataKey="arima" name="ARIMA (Statistical)"    stroke="#3b82f6" strokeWidth={2} strokeDasharray="7 4" dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
              {/* Random Forest */}
              <Line type="monotone" dataKey="rf"   name="Random Forest (ML)"   stroke="#8b5cf6" strokeWidth={2} strokeDasharray="7 4" dot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
              {/* LSTM */}
              <Line type="monotone" dataKey="lstm" name="LSTM (Deep Learning)" stroke="#10b981" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {/* Chart insight bar */}
        {forecastRows.length > 0 && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #f1f5f9", display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>ARIMA 7d Total</span>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6", margin: "2px 0 0" }}>{modelSums.arima.toFixed(1)} u</p>
            </div>
            <div>
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Random Forest 7d Total</span>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#8b5cf6", margin: "2px 0 0" }}>{modelSums.rf.toFixed(1)} u</p>
            </div>
            <div>
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>LSTM 7d Total</span>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#10b981", margin: "2px 0 0" }}>{modelSums.lstm.toFixed(1)} u</p>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Average (all models)</span>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "2px 0 0" }}>{avgForecast.toFixed(1)} u</p>
            </div>
          </div>
        )}
      </div>

      {/* ══ ROW 3: 7-Day Forecast Table + Stock Advisory ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>

        {/* Forecast table */}
        {forecastRows.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>7-Day Daily Forecast Breakdown</h3>
              <p style={{ fontSize: 11, color: "#94a3b8", margin: "3px 0 0" }}>AI model predictions per day — use the average to plan procurement</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Date", "ETS", "Random Forest", "LSTM", "Avg"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: i > 0 ? "right" : "left", fontWeight: 600, fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f1f5f9" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecastRows.map((row, i) => {
                  const vals = [row.ets, row.rf, row.lstm].filter(v => v != null);
                  const avg  = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                  return (
                    <tr key={row.date} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafbfc"}
                    >
                      <td style={{ padding: "11px 16px", color: "#374151", fontWeight: 600 }}>{fmtDate(row.date)}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#3b82f6", fontWeight: 600 }}>{row.ets  != null ? Number(row.ets ).toFixed(1) : "—"}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#8b5cf6", fontWeight: 600 }}>{row.rf   != null ? Number(row.rf  ).toFixed(1) : "—"}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#10b981", fontWeight: 600 }}>{row.lstm != null ? Number(row.lstm).toFixed(1) : "—"}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right" }}>
                        {avg != null ? <span style={{ background: "#f0f9ff", color: "#0369a1", fontWeight: 700, padding: "2px 8px", borderRadius: 20, fontSize: 11, border: "1px solid #bae6fd" }}>{avg.toFixed(1)}u</span> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Stock Advisory Card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0 }}>📋 Stock Advisory</h3>

          {/* Stock vs Forecast comparison */}
          <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: sc.color, fontWeight: 700, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Status: {sc.label}</p>
            <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>
              {raw.risk_status === "critical" && `⚠ Stock critically low. Reorder immediately. Only ${raw.days_of_stock_left ?? "?"} days remaining.`}
              {raw.risk_status === "low" && `Stock running low. Consider ordering within the next few days.`}
              {raw.risk_status === "overstock" && `Stock is ${raw.stock_ratio?.toFixed(1)}× above reorder level. No replenishment needed for a while.`}
              {raw.risk_status === "normal" && `Stock levels are healthy. Continue monitoring.`}
            </p>
          </div>

          {/* Forecast vs Stock comparison */}
          {avgForecast > 0 && stockQty > 0 && (
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: 11, color: "#64748b", fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Supply vs Demand (7 Days)</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Current Stock</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{stockQty.toFixed(0)} u</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>7d AI Forecast Demand</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>{avgForecast.toFixed(0)} u</span>
              </div>
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min((avgForecast / stockQty) * 100, 100)}%`, background: avgForecast > stockQty ? "#ef4444" : "#10b981", borderRadius: 99, transition: "width 0.6s" }} />
              </div>
              <p style={{ fontSize: 11, color: avgForecast > stockQty ? "#dc2626" : "#16a34a", fontWeight: 700, margin: "6px 0 0" }}>
                {avgForecast > stockQty ? `⚠ Forecast demand exceeds stock by ${(avgForecast - stockQty).toFixed(0)} units` : `✅ Stock covers ${(stockQty / (avgForecast / 7)).toFixed(0)} more days at current demand`}
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => navigate(`/forecasting?item=${id}`)}
            style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", border: "none", color: "#fff", borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(59,130,246,0.35)", fontFamily: "'Inter',system-ui" }}
          >
            <TrendingUp style={{ width: 15, height: 15 }} />
            Open Full Forecast Dashboard
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
