import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

import { Activity, RefreshCw, TrendingUp, Cpu, Zap, ChevronDown, Gauge } from 'lucide-react';
import { getItems, getItemForecast, runForecast, getTurnoverRate } from '../services/api';

// ─── Speed badge config ───────────────────────────────────────────────────────
const SPEED_STYLE = {
  fast:       { label: 'Fast',       bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
  medium:     { label: 'Medium',     bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' },
  slow:       { label: 'Slow',       bg: '#fef9c3', text: '#a16207', border: '#fde047' },
  non_moving: { label: 'Non Moving', bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
};

// ─── Forecast Tooltip ────────────────────────────────────────────────────────
const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const isForecastZone = payload.every(p => p.dataKey !== 'actual' || p.value == null);
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      minWidth: 190, fontFamily: "'Inter', system-ui",
    }}>
      <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 6px', fontSize: 12 }}>{label}</p>
      {isForecastZone && (
        <p style={{ fontSize: 10, color: '#6366f1', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
          ⚡ AI Forecast Zone
        </p>
      )}
      {payload.map((p, i) => p.value != null && (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginTop: 5 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            {p.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{Number(p.value).toFixed(1)} u</span>
        </div>
      ))}
    </div>
  );
};

// ─── Turnover Tooltip ────────────────────────────────────────────────────────
const TurnoverTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 6px 24px rgba(0,0,0,0.1)',
      fontFamily: "'Inter', system-ui",
    }}>
      <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 3px', fontSize: 13 }}>{d.name}</p>
      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
        <strong style={{ color: d.color }}>{d.value}</strong> items · {d.threshold}
      </p>
    </div>
  );
};

// ─── Model Stat Card ─────────────────────────────────────────────────────────
const ModelCard = ({ label, sublabel, icon: Icon, value, color, bg, border }) => (
  <div style={{
    background: '#fff', border: `1px solid ${border}`, borderRadius: 14,
    padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon style={{ width: 22, height: 22, color }} />
    </div>
    <div>
      <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 11, color: '#cbd5e1', margin: '2px 0 5px' }}>{sublabel}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1 }}>
        {Number(value).toFixed(0)}
        <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', marginLeft: 5 }}>units / 7d</span>
      </p>
    </div>
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Forecasting() {
  const [items, setItems]               = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [chartData, setChartData]       = useState([]);
  const [todayMarker, setTodayMarker]   = useState(null);
  const [modelSums, setModelSums]       = useState({ arima: 0, rf: 0, lstm: 0 });
  const [forecastRows, setForecastRows] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [running, setRunning]           = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [turnoverData, setTurnoverData]       = useState(null);
  const [turnoverLoading, setTurnoverLoading] = useState(true);

  const location = useLocation();

  useEffect(() => {
    setItemsLoading(true);
    setTurnoverLoading(true);
    const params   = new URLSearchParams(location.search);
    const targetId = params.get('item') ? parseInt(params.get('item')) : null;

    getItems()
      .then(res => {
        setItems(res.data);
        if (res.data.length > 0) {
          const target = targetId
            ? (res.data.find(i => i.id === targetId) || res.data[0])
            : res.data[0];
          loadForecast(target);
        }
      })
      .catch(console.error)
      .finally(() => setItemsLoading(false));

    getTurnoverRate()
      .then(res => setTurnoverData(res.data))
      .catch(console.error)
      .finally(() => setTurnoverLoading(false));
  }, [location.search]);


  const loadForecast = async (item) => {
    setSelectedItem(item);
    setLoading(true);
    try {
      const res = await getItemForecast(item.id, 30);
      const histMap = {};
      res.data.history.forEach(h => {
        if (!histMap[h.date]) histMap[h.date] = { date: h.date, actual: 0 };
        histMap[h.date].actual += parseFloat(h.quantity_used);
      });
      const forecastMap = {};
      const sums = { arima: 0, rf: 0, lstm: 0 };
      const rows = {};
      res.data.forecast.forEach(f => {
        const d = f.forecast_date, val = parseFloat(f.predicted_demand);
        if (!forecastMap[d]) forecastMap[d] = { date: d };
        if (!rows[d]) rows[d] = { date: d };
        if (f.model_name === 'arima') { forecastMap[d].arima  = val; rows[d].arima  = val; sums.arima  += val; }
        if (f.model_name === 'random_forest')          { forecastMap[d].rf   = val; rows[d].rf   = val; sums.rf   += val; }
        if (f.model_name === 'lstm')                   { forecastMap[d].lstm = val; rows[d].lstm = val; sums.lstm += val; }
      });
      const histArr     = Object.values(histMap).sort((a, b) => a.date.localeCompare(b.date));
      const forecastArr = Object.values(forecastMap).sort((a, b) => a.date.localeCompare(b.date));
      setModelSums(sums);
      setForecastRows(Object.values(rows).sort((a, b) => a.date.localeCompare(b.date)));
      setTodayMarker(histArr.length > 0 ? histArr[histArr.length - 1].date : null);
      setChartData([...histArr, ...forecastArr]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRunForecast = async () => {
    setRunning(true);
    try {
      await runForecast();
      if (selectedItem) await loadForecast(selectedItem);
      const tr = await getTurnoverRate();
      setTurnoverData(tr.data);
    } catch (err) { console.error(err); }
    finally { setRunning(false); }
  };

  const fmtDate = iso => {
    const d = new Date(iso);
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  const totalItems = turnoverData?.buckets?.reduce((s, b) => s + b.value, 0) || 1;
  const activeBuckets = turnoverData?.buckets?.filter(b => b.value > 0) || [];

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <TrendingUp style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Demand Forecasting</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, paddingLeft: 46 }}>
            AI-powered predictions · 30-day history + 7-day outlook · Item turnover intelligence
          </p>
        </div>
        <button
          id="run-forecast-btn"
          onClick={handleRunForecast}
          disabled={running}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: running ? 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            border: 'none', color: '#fff', borderRadius: 10, padding: '11px 22px',
            fontWeight: 600, fontSize: 13, cursor: running ? 'not-allowed' : 'pointer',
            boxShadow: running ? 'none' : '0 4px 14px rgba(59,130,246,0.35)',
            fontFamily: "'Inter', system-ui", transition: 'all 0.2s',
          }}
        >
          <RefreshCw style={{ width: 15, height: 15, animation: running ? 'spin 0.8s linear infinite' : 'none' }} />
          {running ? 'Running AI Models…' : 'Run All Forecasts'}
        </button>
      </div>

      {/* ══ ROW 1: Model Summary Cards ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <ModelCard label="ARIMA · Statistical"    sublabel="Autoregressive Model"   icon={Activity} value={modelSums.arima}  color="#3b82f6" bg="#eff6ff" border="#bfdbfe" />
        <ModelCard label="Random Forest · ML"   sublabel="Ensemble Decision Trees" icon={Cpu}      value={modelSums.rf}   color="#8b5cf6" bg="#f5f3ff" border="#ddd6fe" />
        <ModelCard label="LSTM · Deep Learning" sublabel="Neural Network Model"    icon={Zap}      value={modelSums.lstm} color="#10b981" bg="#f0fdf4" border="#bbf7d0" />
      </div>

      {/* ══ ROW 2: Forecast Chart (2/3) + 7-Day Table (1/3) ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* ── Forecast Chart ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Historical Consumption + AI Forecast</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>Shaded area = actual · Dashed lines = 3 AI model projections</p>
            </div>
            {/* Item selector */}
            <div style={{ position: 'relative' }}>
              <select
                id="item-forecast-selector"
                value={selectedItem?.id || ''}
                disabled={itemsLoading}
                onChange={e => { const item = items.find(i => i.id === parseInt(e.target.value)); if (item) loadForecast(item); }}
                style={{ appearance: 'none', WebkitAppearance: 'none', fontSize: 13, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#374151', borderRadius: 9, padding: '9px 34px 9px 14px', outline: 'none', fontFamily: "'Inter',system-ui", fontWeight: 500, cursor: 'pointer', minWidth: 190 }}
              >
                {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
              </select>
              <ChevronDown style={{ width: 13, height: 13, color: '#94a3b8', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
              <RefreshCw style={{ width: 26, height: 26, color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Loading forecast data…</p>
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
              <RefreshCw style={{ width: 32, height: 32, color: '#e2e8f0' }} />
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, textAlign: 'center' }}>No data yet — click <strong>Run All Forecasts</strong> to generate predictions.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={t => fmtDate(t)} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} width={34} />
                <Tooltip content={<ForecastTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#64748b', paddingTop: 14 }} />
                {todayMarker && (
                  <ReferenceLine x={todayMarker} stroke="#94a3b8" strokeDasharray="5 3" strokeWidth={1.2}
                    label={{ value: 'Today', position: 'insideTopRight', fill: '#94a3b8', fontSize: 10 }} />
                )}
                <Area type="monotone" dataKey="actual" name="Actual Consumption" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradActual)" dot={false} connectNulls activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="arima"  name="ARIMA (Statistical)"    stroke="#3b82f6" strokeWidth={2} strokeDasharray="7 4" dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                <Line type="monotone" dataKey="rf"   name="Random Forest (ML)"   stroke="#8b5cf6" strokeWidth={2} strokeDasharray="7 4" dot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                <Line type="monotone" dataKey="lstm" name="LSTM (Deep Learning)" stroke="#10b981" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── 7-Day Forecast Table ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity style={{ width: 15, height: 15, color: '#64748b' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>7-Day Forecast</h3>
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>{selectedItem?.item_name || '—'}</p>
          </div>

          {forecastRows.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 20 }}>Run forecasts to see predictions</p>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Date', 'ARIMA', 'RF', 'LSTM', 'Avg'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Date' ? 'left' : 'right', fontWeight: 600, fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forecastRows.map((row, i) => {
                    const vals = [row.arima, row.rf, row.lstm].filter(v => v != null);
                    const avg  = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                    return (
                      <tr key={row.date} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                      >
                        <td style={{ padding: '11px 12px', color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtDate(row.date)}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', color: '#3b82f6', fontWeight: 600 }}>{row.arima  != null ? Number(row.arima ).toFixed(1) : '—'}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>{row.rf   != null ? Number(row.rf  ).toFixed(1) : '—'}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{row.lstm != null ? Number(row.lstm).toFixed(1) : '—'}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                          {avg != null ? (
                            <span style={{ background: '#f0f9ff', color: '#0369a1', fontWeight: 700, padding: '2px 7px', borderRadius: 20, fontSize: 11, border: '1px solid #bae6fd', whiteSpace: 'nowrap' }}>
                              {Number(avg).toFixed(1)}u
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Color key */}
              <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[['ARIMA', '#3b82f6'], ['RF', '#8b5cf6'], ['LSTM', '#10b981']].map(([n, c]) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{n} model</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 3: Turnover Rate Pie (1/3) + Item Speed Table (2/3) ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>

        {/* ── Turnover Rate Pie ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Gauge style={{ width: 16, height: 16, color: '#64748b' }} />
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Turnover Rate</h2>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px' }}>Item movement speed · Last 30 days</p>

          {turnoverLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
              <RefreshCw style={{ width: 22, height: 22, color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : turnoverData ? (
            <>
              {/* Pie chart */}
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={activeBuckets}
                    cx="50%" cy="50%"
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                    label={({ name, value }) => `${name.split(' ')[0]}: ${value}`}
                    labelLine={true}
                  >
                    {activeBuckets.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<TurnoverTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {turnoverData.buckets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{b.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{b.value}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>({totalItems > 0 ? Math.round((b.value / totalItems) * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Thresholds */}
              <div style={{ marginTop: 18, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thresholds</p>
                {turnoverData.buckets.map((b, i) => (
                  <p key={i} style={{ fontSize: 11, color: '#64748b', margin: i === 0 ? 0 : '5px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                    <strong style={{ color: '#374151' }}>{b.name}:</strong>&nbsp;{b.threshold}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>No data available.</p>
            </div>
          )}
        </div>

        {/* ── Item Speed Classification Table ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Gauge style={{ width: 15, height: 15, color: '#64748b' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Item Speed Classification</h3>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>All items ranked by avg daily consumption over last 30 days</p>
          </div>

          {turnoverLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <RefreshCw style={{ width: 22, height: 22, color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Item', 'Category', 'Avg / Day', 'Speed'].map((h, i) => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: i >= 3 ? 'right' : 'left', fontWeight: 600, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(turnoverData?.items || []).map((item, i) => {
                    const s = SPEED_STYLE[item.speed] || SPEED_STYLE.non_moving;
                    return (
                      <tr key={i}
                        style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                      >
                        <td style={{ padding: '13px 20px', color: '#94a3b8', fontWeight: 700, fontSize: 12 }}>{i + 1}</td>
                        <td style={{ padding: '13px 20px', color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.name}</td>
                        <td style={{ padding: '13px 20px', color: '#64748b' }}>{item.category}</td>
                        <td style={{ padding: '13px 20px', textAlign: 'right', color: '#374151', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {item.avg_daily.toFixed(2)}
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 3 }}>u/d</span>
                        </td>
                        <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                          <span style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontWeight: 700, padding: '3px 10px', borderRadius: 20, fontSize: 12, whiteSpace: 'nowrap' }}>
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
