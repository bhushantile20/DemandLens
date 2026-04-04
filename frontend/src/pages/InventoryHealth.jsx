import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ShieldCheck, RefreshCw, AlertTriangle, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { getInventoryHealth } from '../services/api';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  safe:      { label: 'Safe',      color: '#10b981', bg: '#dcfce7', border: '#bbf7d0', text: '#16a34a', icon: CheckCircle },
  watch:     { label: 'Watch',     color: '#f59e0b', bg: '#fef9c3', border: '#fde047', text: '#a16207', icon: AlertTriangle },
  critical:  { label: 'Critical',  color: '#ef4444', bg: '#fee2e2', border: '#fca5a5', text: '#dc2626', icon: AlertCircle },
  overstock: { label: 'Overstock', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', text: '#7c3aed', icon: Package },
};

// ─── Custom Donut Center Label ────────────────────────────────────────────────
const DonutCenter = ({ viewBox, score, total }) => {
  const { cx, cy } = viewBox;
  return (
    <>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#0f172a" fontSize={32} fontWeight={800} fontFamily="'Inter',system-ui">
        {score}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize={12} fontFamily="'Inter',system-ui">
        Health Score
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#94a3b8" fontSize={11} fontFamily="'Inter',system-ui">
        {total} total items
      </text>
    </>
  );
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────
const HealthTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = d._total > 0 ? Math.round((d.value / d._total) * 100) : 0;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 6px 24px rgba(0,0,0,0.1)', fontFamily: "'Inter',system-ui" }}>
      <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 3px', fontSize: 13 }}>{d.name}</p>
      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
        <strong style={{ color: d.color }}>{d.value}</strong> items · {pct}% of inventory
      </p>
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, total, cfg }) => {
  const Icon = cfg.icon;
  const pct  = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ background: '#fff', border: `1px solid ${cfg.border}`, borderRadius: 14, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 22, height: 22, color: cfg.color }} />
      </div>
      <div>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', margin: '3px 0 0', lineHeight: 1 }}>
          {value}
          <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', marginLeft: 6 }}>{pct}%</span>
        </p>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryHealth() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');   // 'all' | 'safe' | 'watch' | 'critical' | 'overstock'

  useEffect(() => {
    setLoading(true);
    getInventoryHealth()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: "'Inter',system-ui" }}>
      <RefreshCw style={{ width: 28, height: 28, color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Analysing inventory health…</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const breakdown     = (data?.breakdown || []).map(b => ({ ...b, _total: data.total }));
  const activeBuckets = breakdown.filter(b => b.value > 0);
  const items         = data?.items || [];
  const filteredItems = filter === 'all' ? items : items.filter(i => i.status === filter);

  const scoreColor =
    data?.health_score >= 80 ? '#10b981' :
    data?.health_score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100%', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
            <ShieldCheck style={{ width: 18, height: 18, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Stock Health Distribution</h1>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0, paddingLeft: 46 }}>
          Real-time classification of every inventory item · Safe · Watch · Critical · Overstock
        </p>
      </div>

      {/* ══ ROW 1: 4 KPI Stat Cards ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="Safe"      value={data?.safe      || 0} total={data?.total || 1} cfg={STATUS.safe} />
        <StatCard label="Watch"     value={data?.watch     || 0} total={data?.total || 1} cfg={STATUS.watch} />
        <StatCard label="Critical"  value={data?.critical  || 0} total={data?.total || 1} cfg={STATUS.critical} />
        <StatCard label="Overstock" value={data?.overstock || 0} total={data?.total || 1} cfg={STATUS.overstock} />
      </div>

      {/* ══ ROW 2: Donut Chart (1/3) + Per-Item Table (2/3) ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>

        {/* ── Donut Chart ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', alignSelf: 'flex-start' }}>Health Distribution</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px', alignSelf: 'flex-start' }}>
            Donut size = proportion of total items
          </p>

          {/* Donut */}
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={activeBuckets}
                cx="50%" cy="50%"
                innerRadius={72} outerRadius={108}
                dataKey="value"
                paddingAngle={3}
                startAngle={90} endAngle={-270}
              >
                {activeBuckets.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<HealthTooltip />} />
              {data && (
                <text
                  x="50%" y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontFamily: "'Inter',system-ui" }}
                >
                  <tspan x="50%" dy="-12" fontSize="30" fontWeight="800" fill={scoreColor}>{data.health_score}%</tspan>
                  <tspan x="50%" dy="22"  fontSize="12" fill="#64748b">Health Score</tspan>
                  <tspan x="50%" dy="18"  fontSize="11" fill="#94a3b8">{data.total} items</tspan>
                </text>
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {breakdown.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{b.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{b.value}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    ({data?.total > 0 ? Math.round((b.value / data.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Score interpretation */}
          <div style={{ marginTop: 20, width: '100%', padding: '12px 14px', background: scoreColor + '12', borderRadius: 10, border: `1px solid ${scoreColor}30` }}>
            <p style={{ fontSize: 11, color: scoreColor, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {data?.health_score >= 80 ? '✅ System Healthy' : data?.health_score >= 50 ? '⚠️ Needs Attention' : '🚨 Action Required'}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
              {data?.safe} of {data?.total} items are in a safe state
            </p>
          </div>
        </div>

        {/* ── Per-Item Status Table ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Table header + filter */}
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Item Status Details</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                Showing {filteredItems.length} of {items.length} items · Sorted by priority
              </p>
            </div>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', 'critical', 'watch', 'overstock', 'safe'].map(f => {
                const cfg = f === 'all' ? { color: '#0f172a', bg: '#f1f5f9', border: '#e2e8f0', label: 'All' } : { ...STATUS[f], label: STATUS[f].label };
                const active = filter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, border: `1px solid ${active ? cfg.color : '#e2e8f0'}`,
                      background: active ? cfg.bg : '#fff', color: active ? cfg.color : '#64748b',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',system-ui",
                      transition: 'all 0.15s',
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table body */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: '#f8fafc' }}>
                  {['Item', 'Category', 'Current Stock', 'Reorder Level', 'Days Left', 'Status'].map((h, i) => (
                    <th key={h} style={{
                      padding: '11px 20px',
                      textAlign: i >= 2 && i <= 4 ? 'right' : i === 5 ? 'center' : 'left',
                      fontWeight: 600, fontSize: 11, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      No items match this filter.
                    </td>
                  </tr>
                ) : filteredItems.map((item, i) => {
                  const s = STATUS[item.status] || STATUS.safe;
                  const stockRatio = item.reorder_level > 0 ? (item.current_stock / item.reorder_level).toFixed(1) : '—';
                  return (
                    <tr
                      key={i}
                      style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                    >
                      <td style={{ padding: '13px 20px', color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.name}</td>
                      <td style={{ padding: '13px 20px', color: '#64748b' }}>{item.category}</td>
                      <td style={{ padding: '13px 20px', textAlign: 'right', color: '#374151', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {item.current_stock.toFixed(0)}
                        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 3 }}>u</span>
                      </td>
                      <td style={{ padding: '13px 20px', textAlign: 'right', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                        {item.reorder_level.toFixed(0)}
                        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 3 }}>u</span>
                        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>({stockRatio}×)</span>
                      </td>
                      <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                        {item.days_left != null ? (
                          <span style={{
                            color: item.days_left < 7 ? '#ef4444' : item.days_left < 14 ? '#f59e0b' : '#10b981',
                            fontWeight: 700,
                          }}>
                            {item.days_left}d
                          </span>
                        ) : <span style={{ color: '#94a3b8' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 20px', textAlign: 'center' }}>
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
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
