import React, { useState, useEffect, useCallback } from 'react';
import {
  getDashboardSummary, getItems, getAlerts, runForecast,
  getItemForecast, getDepartmentConsumption, getAbcRanking, getInventoryHealth
} from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, ComposedChart,
  PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { Activity, Package, AlertTriangle, AlertCircle, RefreshCw, TrendingUp, DollarSign, ShieldCheck } from 'lucide-react';

const DEPT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

// ── Tooltip for Pareto Chart
const ParetoTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ fontWeight: 700, color: '#0f172a', margin: 0, fontSize: 13 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '4px 0 0', fontSize: 12 }}>
            {p.name}: <strong>{typeof p.value === 'number' && p.name.includes('%') ? p.value + '%' : '₹' + p.value?.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Donut Center Label
const DonutLabel = ({ cx, cy, score }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" fill="#0f172a" fontSize={28} fontWeight={800}>{score}%</text>
    <text x={cx} y={cy + 16} textAnchor="middle" fill="#64748b" fontSize={12}>Health Score</text>
  </>
);

export default function Dashboard() {
  const [summary, setSummary]           = useState(null);
  const [items, setItems]               = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [deptData, setDeptData]         = useState([]);
  const [abcData, setAbcData]           = useState([]);
  const [healthData, setHealthData]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [runningForecast, setRunningForecast] = useState(false);

  // Item forecast state
  const [selectedItem, setSelectedItem]         = useState(null);
  const [itemForecastData, setItemForecastData] = useState([]);
  const [forecastLoading, setForecastLoading]   = useState(false);
  const [forecastTodayMark, setForecastTodayMark] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, itemsRes, alertsRes, deptRes, abcRes, healthRes] = await Promise.all([
        getDashboardSummary(),
        getItems(),
        getAlerts(),
        getDepartmentConsumption(),
        getAbcRanking(),
        getInventoryHealth(),
      ]);
      setSummary(sumRes.data);
      setItems(itemsRes.data);
      setAlerts(alertsRes.data);
      setDeptData(deptRes.data);
      setAbcData(abcRes.data.slice(0, 10)); // Top 10 for Pareto
      setHealthData(healthRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-select first item for forecast
  useEffect(() => {
    if (items.length > 0 && !selectedItem) {
      loadItemForecast(items[0]);
    }
  }, [items]);

  const loadItemForecast = async (item) => {
    setSelectedItem(item);
    setForecastLoading(true);
    try {
      const res = await getItemForecast(item.id);

      // ── HISTORY: last 14 days of actual consumption
      const histMap = {};
      res.data.history.slice(-14).forEach(h => {
        if (!histMap[h.date]) histMap[h.date] = { date: h.date, actual: 0 };
        histMap[h.date].actual += parseFloat(h.quantity_used);
      });

      // ── FORECAST: group by date, one key per model
      const forecastMap = {};
      res.data.forecast.forEach(f => {
        const d = f.forecast_date;
        if (!forecastMap[d]) forecastMap[d] = { date: d };
        forecastMap[d][f.model_name] = parseFloat(f.predicted_demand);
      });

      // ── Merge history + forecast into single timeline
      const allDates = [
        ...Object.values(histMap).sort((a, b) => a.date.localeCompare(b.date)),
        ...Object.values(forecastMap).sort((a, b) => a.date.localeCompare(b.date)),
      ];

      setItemForecastData(allDates);
      setForecastTodayMark(Object.keys(histMap).sort().pop()); // last history date = today marker
    } catch (err) {
      console.error(err);
    } finally {
      setForecastLoading(false);
    }
  };

  const handleRunForecast = async () => {
    setRunningForecast(true);
    try {
      await runForecast();
      await fetchAll();
      if (selectedItem) loadItemForecast(selectedItem);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningForecast(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const barData = items.map(item => ({
    name: item.item_name.replace(/^(Premium |Large |Fresh |Organic )/, ''),
    stock: parseFloat(item.stock?.quantity_available || 0),
    reorderLevel: parseFloat(item.stock?.reorder_level || 0)
  }));

  return (
    <div className="p-6 w-full bg-slate-50/60 min-h-full font-sans">

      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Real-time inventory intelligence, demand forecasting & stock analysis.</p>
        </div>
        <button
          onClick={handleRunForecast}
          disabled={runningForecast}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-70 transition-all text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${runningForecast ? 'animate-spin' : ''}`} />
          {runningForecast ? 'Running AI Models...' : 'Run All Forecasts'}
        </button>
      </div>

      {/* ── ROW 1: KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Items', value: summary?.total_items || 0,
            icon: <Package className="w-5 h-5" />, color: 'blue',
            bg: 'bg-blue-50', text: 'text-blue-600', sub: 'Tracked SKUs in system'
          },
          {
            label: 'Inventory Value', value: `₹${((summary?.total_inventory_value || 0) / 1000).toFixed(1)}K`,
            icon: <DollarSign className="w-5 h-5" />, color: 'emerald',
            bg: 'bg-emerald-50', text: 'text-emerald-600', sub: 'Total cost × quantity'
          },
          {
            label: 'Health Score', value: `${healthData?.health_score || 0}%`,
            icon: <ShieldCheck className="w-5 h-5" />, color: 'violet',
            bg: 'bg-violet-50', text: 'text-violet-600', sub: `${healthData?.safe || 0} safe items`
          },
          {
            label: 'Critical Alerts', value: alerts.filter(a => a.suggested_reorder_qty > 0).length,
            icon: <AlertCircle className="w-5 h-5" />, color: 'red',
            bg: 'bg-red-50', text: 'text-red-500', sub: 'Need immediate reorder'
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1 leading-none">{kpi.value}</p>
              <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
            </div>
            <div className={`w-11 h-11 ${kpi.bg} ${kpi.text} rounded-xl flex items-center justify-center shrink-0 ml-4`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2: Health Gauge + AI Forecast ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

        {/* Inventory Health Ring */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Inventory Health</h3>
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={healthData?.breakdown || []}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value" startAngle={90} endAngle={-270}
                >
                  {(healthData?.breakdown || []).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                {healthData && (
                  <DonutLabel cx="50%" cy={90} score={healthData.health_score} />
                )}
                <Tooltip formatter={(v, n) => [v + ' items', n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around mt-2">
            {(healthData?.breakdown || []).map((b, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                <span className="text-xs text-slate-500 font-medium">{b.name}: <strong className="text-slate-700">{b.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Dual-Model Forecast Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-900 text-sm">7-Day Demand Forecast (3 AI Models)</h3>
            </div>
            <select
              value={selectedItem?.id || ''}
              onChange={e => {
                const item = items.find(i => i.id === parseInt(e.target.value));
                if (item) loadItemForecast(item);
              }}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
            >
              {items.map(it => <option key={it.id} value={it.id}>{it.item_name}</option>)}
            </select>
          </div>
          {forecastLoading ? (
            <div className="h-52 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          ) : itemForecastData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={itemForecastData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={t => t.substring(5)} interval="preserveStartEnd" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(v, name) => [v != null ? Number(v).toFixed(1) + ' units' : '—', name]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                {forecastTodayMark && (
                  <ReferenceLine x={forecastTodayMark} stroke="#cbd5e1" strokeDasharray="4 2" label={{ value: 'Today', position: 'insideTopRight', fill: '#94a3b8', fontSize: 10 }} />
                )}
                <Line type="monotone" dataKey="actual" name="Actual Consumption" stroke="#94a3b8" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="arima" name="Stat Model (ARIMA)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                <Line type="monotone" dataKey="random_forest" name="AI Model (RF)" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
                <Line type="monotone" dataKey="lstm" name="Deep Learning (LSTM)" stroke="#10b981" strokeWidth={2.5} strokeDasharray="3 2" dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center flex-col gap-2">
              <RefreshCw className="w-5 h-5 text-slate-300" />
              <p className="text-sm text-slate-400">Click "Run All Forecasts" to generate ML predictions.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Pareto + Department Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">

        {/* ABC Pareto Chart */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">ABC Pareto Analysis</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-4 ml-6">Inventory value ranked by item · Cumulative % line (80/20 rule)</p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={abcData} margin={{ top: 5, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip content={<ParetoTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="value" name="Stock Value (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="cumulative_pct" name="Cumulative %" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Department Consumption Donut */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Consumption by Dept</h3>
          </div>
          {deptData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={deptData} dataKey="total" nameKey="department" cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={3}>
                    {deptData.map((_, i) => (
                      <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v + ' units', n]} contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {deptData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                      <span className="text-xs text-slate-600 font-medium">{d.department}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">{Number(d.total).toFixed(0)} units</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No consumption data available.</div>
          )}
        </div>
      </div>

      {/* ── ROW 4: Stock vs Reorder Level ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Stock vs Reorder Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Current Stock vs Reorder Threshold</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
              <Bar dataKey="stock" name="Actual Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="reorderLevel" name="Safety Threshold" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-slate-900 text-sm">Active Reorder Alerts</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[250px]">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">✅ All systems operating normally.</p>
            ) : (() => {
              // Parse alert level from explanation field, sort by severity
              const enriched = alerts.map(a => {
                const lvl = (a.explanation || '').match(/alert_level=(\w+)/)?.[1] || 'safe';
                return { ...a, _level: lvl };
              }).sort((a, b) => {
                const order = { reorder_now: 0, watch: 1, safe: 2 };
                return (order[a._level] ?? 2) - (order[b._level] ?? 2);
              });

              const levelStyle = {
                reorder_now: { dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border-red-200',   label: 'REORDER NOW' },
                watch:       { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', label: 'WATCH' },
                safe:        { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'SAFE' },
              };

              return enriched.slice(0, 8).map((alert, i) => {
                const style = levelStyle[alert._level] || levelStyle.safe;
                const daysLeft = alert.days_of_stock_left ? parseFloat(alert.days_of_stock_left).toFixed(0) : '—';
                const reorderQty = parseFloat(alert.suggested_reorder_qty || 0);
                return (
                  <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{alert.item_name || 'Unknown'}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {reorderQty > 0
                          ? <>Reorder <span className="font-bold text-slate-700">{reorderQty.toFixed(0)}</span> units · {daysLeft}d stock left</>
                          : <>Stock OK · <span className="font-bold text-slate-700">{daysLeft}d</span> remaining · Pred. {parseFloat(alert.predicted_demand_7d || 0).toFixed(0)} u/7d</>
                        }
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
