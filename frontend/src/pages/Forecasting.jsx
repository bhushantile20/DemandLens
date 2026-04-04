import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Legend,
} from 'recharts';
import { Activity, RefreshCw, TrendingUp, Cpu, Zap, ChevronDown } from 'lucide-react';
import { getItems, getItemForecast, runForecast } from '../services/api';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const isForecastZone = payload.every(p => p.dataKey !== 'actual' || p.value == null);
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      minWidth: 180, fontFamily: "'Inter', system-ui",
    }}>
      <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 6px', fontSize: 12 }}>{label}</p>
      {isForecastZone && (
        <p style={{
          fontSize: 10, color: '#6366f1', margin: '0 0 8px',
          textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em',
        }}>⚡ AI Forecast Zone</p>
      )}
      {payload.map((p, i) => p.value != null && (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 5 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'inline-block' }} />
            {p.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>
            {Number(p.value).toFixed(1)} u
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Model stat card ─────────────────────────────────────────────────────────
const ModelCard = ({ label, sublabel, icon: Icon, value, color, bg, border }) => (
  <div style={{
    background: '#fff', border: `1px solid ${border}`, borderRadius: 14,
    padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 12, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon style={{ width: 22, height: 22, color }} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        {label}
      </p>
      <p style={{ fontSize: 11, color: '#cbd5e1', margin: '1px 0 4px', whiteSpace: 'nowrap' }}>{sublabel}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>
        {Number(value).toFixed(0)}
        <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', marginLeft: 4 }}>units</span>
      </p>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Forecasting() {
  const [items, setItems]               = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [chartData, setChartData]       = useState([]);
  const [todayMarker, setTodayMarker]   = useState(null);
  const [modelSums, setModelSums]       = useState({ ets: 0, rf: 0, lstm: 0 });
  const [forecastRows, setForecastRows] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [running, setRunning]           = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Load items once
  useEffect(() => {
    setItemsLoading(true);
    getItems()
      .then(res => {
        setItems(res.data);
        if (res.data.length > 0) loadForecast(res.data[0]);
      })
      .catch(console.error)
      .finally(() => setItemsLoading(false));
  }, []);

  const loadForecast = async (item) => {
    setSelectedItem(item);
    setLoading(true);
    try {
      const res = await getItemForecast(item.id, 30);

      // ── History: aggregate qty by date (multiple departments → one point)
      const histMap = {};
      res.data.history.forEach(h => {
        if (!histMap[h.date]) histMap[h.date] = { date: h.date, actual: 0 };
        histMap[h.date].actual += parseFloat(h.quantity_used);
      });

      // ── Forecast: one row per date, one key per model
      const forecastMap = {};
      const sums = { ets: 0, rf: 0, lstm: 0 };
      const rows = {};
      res.data.forecast.forEach(f => {
        const d = f.forecast_date;
        const val = parseFloat(f.predicted_demand);
        if (!forecastMap[d]) forecastMap[d] = { date: d };
        if (!rows[d]) rows[d] = { date: d };
        if (f.model_name === 'exponential_smoothing') { forecastMap[d].ets = val; rows[d].ets = val; sums.ets += val; }
        if (f.model_name === 'random_forest')          { forecastMap[d].rf  = val; rows[d].rf  = val; sums.rf  += val; }
        if (f.model_name === 'lstm')                   { forecastMap[d].lstm = val; rows[d].lstm = val; sums.lstm += val; }
      });

      const histArr     = Object.values(histMap).sort((a, b) => a.date.localeCompare(b.date));
      const forecastArr = Object.values(forecastMap).sort((a, b) => a.date.localeCompare(b.date));

      setModelSums(sums);
      setForecastRows(Object.values(rows).sort((a, b) => a.date.localeCompare(b.date)));
      setTodayMarker(histArr.length > 0 ? histArr[histArr.length - 1].date : null);
      setChartData([...histArr, ...forecastArr]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunForecast = async () => {
    setRunning(true);
    try {
      await runForecast();
      if (selectedItem) await loadForecast(selectedItem);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}>
              <TrendingUp style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              Demand Forecasting
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, paddingLeft: 46 }}>
            AI-powered demand predictions using 3 models · 30-day history + 7-day outlook
          </p>
        </div>
        <button
          id="run-forecast-btn"
          onClick={handleRunForecast}
          disabled={running}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: running
              ? 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            border: 'none', color: '#fff', borderRadius: 10, padding: '11px 20px',
            fontWeight: 600, fontSize: 13, cursor: running ? 'not-allowed' : 'pointer',
            boxShadow: running ? 'none' : '0 4px 14px rgba(59,130,246,0.35)',
            fontFamily: "'Inter', system-ui", transition: 'all 0.2s',
          }}
        >
          <RefreshCw style={{ width: 15, height: 15, animation: running ? 'spin 0.8s linear infinite' : 'none' }} />
          {running ? 'Running AI Models…' : 'Run All Forecasts'}
        </button>
      </div>

      {/* ── Model Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <ModelCard
          label="ETS · Statistical"
          sublabel="Exponential Smoothing"
          icon={Activity}
          value={modelSums.ets}
          color="#3b82f6" bg="#eff6ff" border="#bfdbfe"
        />
        <ModelCard
          label="Random Forest · ML"
          sublabel="Ensemble Decision Trees"
          icon={Cpu}
          value={modelSums.rf}
          color="#8b5cf6" bg="#f5f3ff" border="#ddd6fe"
        />
        <ModelCard
          label="LSTM · Deep Learning"
          sublabel="Neural Network Model"
          icon={Zap}
          value={modelSums.lstm}
          color="#10b981" bg="#f0fdf4" border="#bbf7d0"
        />
      </div>

      {/* ── Main Chart Card ── */}
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: 24, marginBottom: 20,
      }}>
        {/* Chart Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Historical Consumption + AI Forecast
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
              Shaded area = actual history · Dashed lines = AI model projections
            </p>
          </div>

          {/* Item selector */}
          <div style={{ position: 'relative' }}>
            <select
              id="item-forecast-selector"
              value={selectedItem?.id || ''}
              disabled={itemsLoading}
              onChange={e => {
                const item = items.find(i => i.id === parseInt(e.target.value));
                if (item) loadForecast(item);
              }}
              style={{
                appearance: 'none', WebkitAppearance: 'none',
                fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0',
                color: '#374151', borderRadius: 9, padding: '9px 36px 9px 14px',
                outline: 'none', fontFamily: "'Inter', system-ui", fontWeight: 500,
                cursor: 'pointer', minWidth: 200,
              }}
            >
              {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
            </select>
            <ChevronDown style={{
              width: 14, height: 14, color: '#94a3b8',
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* Chart body */}
        {loading ? (
          <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <RefreshCw style={{ width: 28, height: 28, color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Loading forecast data…</p>
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
            <RefreshCw style={{ width: 32, height: 32, color: '#e2e8f0' }} />
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>No data yet — click <strong>Run All Forecasts</strong> to generate predictions.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: "'Inter', system-ui" }}
                tickFormatter={t => fmtDate(t)}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false} tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                domain={['auto', 'auto']}
                width={36}
              />
              <Tooltip content={<ForecastTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 14 }}
              />

              {/* Today divider */}
              {todayMarker && (
                <ReferenceLine
                  x={todayMarker}
                  stroke="#94a3b8"
                  strokeDasharray="5 3"
                  strokeWidth={1.2}
                  label={{ value: 'Today', position: 'insideTopRight', fill: '#94a3b8', fontSize: 10, fontFamily: "'Inter', system-ui" }}
                />
              )}

              {/* Actual history — filled area */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Consumption"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#gradActual)"
                dot={false}
                connectNulls
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />

              {/* ETS forecast — dashed blue */}
              <Line
                type="monotone" dataKey="ets"
                name="ETS (Statistical)"
                stroke="#3b82f6" strokeWidth={2}
                strokeDasharray="7 4"
                dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }} connectNulls
              />

              {/* Random Forest — dashed purple */}
              <Line
                type="monotone" dataKey="rf"
                name="Random Forest (ML)"
                stroke="#8b5cf6" strokeWidth={2}
                strokeDasharray="7 4"
                dot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }} connectNulls
              />

              {/* LSTM — dashed emerald */}
              <Line
                type="monotone" dataKey="lstm"
                name="LSTM (Deep Learning)"
                stroke="#10b981" strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }} connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 7-Day Forecast Table ── */}
      {forecastRows.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity style={{ width: 16, height: 16, color: '#64748b' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              7-Day Forecast Breakdown — {selectedItem?.item_name}
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Date', 'ETS (Statistical)', 'Random Forest', 'LSTM (Neural Net)', 'Avg Prediction'].map(h => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: h === 'Date' ? 'left' : 'right',
                      fontWeight: 600, fontSize: 11, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecastRows.map((row, i) => {
                  const vals = [row.ets, row.rf, row.lstm].filter(v => v != null);
                  const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                  return (
                    <tr
                      key={row.date}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        background: i % 2 === 0 ? '#fff' : '#fafbfc',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                    >
                      <td style={{ padding: '13px 20px', color: '#374151', fontWeight: 600 }}>
                        {fmtDate(row.date)}
                      </td>
                      <td style={{ padding: '13px 20px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>
                        {row.ets != null ? Number(row.ets).toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '13px 20px', textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>
                        {row.rf != null ? Number(row.rf).toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '13px 20px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>
                        {row.lstm != null ? Number(row.lstm).toFixed(1) : '—'}
                      </td>
                      <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                        {avg != null ? (
                          <span style={{
                            background: '#f0f9ff', color: '#0369a1', fontWeight: 700,
                            padding: '3px 10px', borderRadius: 20, fontSize: 12,
                            border: '1px solid #bae6fd',
                          }}>
                            {Number(avg).toFixed(1)} u
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Spin keyframe (inline fallback) ── */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
