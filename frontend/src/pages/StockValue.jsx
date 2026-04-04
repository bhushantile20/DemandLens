import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { DollarSign, RefreshCw, BarChart2, Tag, TrendingUp, Package } from 'lucide-react';
import { getStockValueByCategory } from '../services/api';

// ─── Category color palette ───────────────────────────────────────────────────
const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#ef4444', '#f97316', '#06b6d4', '#84cc16',
];
const colorCache = {};
const getCatColor = (cat) => {
  if (!colorCache[cat]) {
    const idx = Object.keys(colorCache).length % PALETTE.length;
    colorCache[cat] = PALETTE[idx];
  }
  return colorCache[cat];
};

// ─── Currency formatter ───────────────────────────────────────────────────────
const fmtCurrency = (v, short = false) => {
  if (v == null) return '—';
  if (short) {
    if (v >= 1_00_000)  return `₹${(v / 1_00_000).toFixed(1)}L`;
    if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)}K`;
    return `₹${v.toFixed(0)}`;
  }
  return `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

// ─── Bar Chart Custom Tooltip ────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '14px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      fontFamily: "'Inter',system-ui", minWidth: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: getCatColor(d.category), flexShrink: 0 }} />
        <p style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: 14 }}>{d.category}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Total Value</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{fmtCurrency(d.value)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Share</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: getCatColor(d.category) }}>{d.pct}%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Items</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{d.item_count}</span>
        </div>
      </div>
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, color, bg, border }) => (
  <div style={{
    background: '#fff', border: `1px solid ${border}`, borderRadius: 14,
    padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon style={{ width: 22, height: 22, color }} />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px', lineHeight: 1, whiteSpace: 'nowrap' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</p>}
    </div>
  </div>
);

// ─── Custom Y-Axis Tick ──────────────────────────────────────────────────────
const YAxisTick = ({ x, y, payload }) => (
  <text x={x} y={y} textAnchor="end" dominantBaseline="middle" fill="#94a3b8" fontSize={10} fontFamily="'Inter',system-ui">
    {fmtCurrency(payload.value, true)}
  </text>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function StockValue() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActive] = useState(null);   // bar click filter
  const [sortBy, setSortBy]         = useState('value'); // 'value' | 'pct' | 'qty' | 'cost'

  const load = useCallback(() => {
    setLoading(true);
    getStockValueByCategory()
      .then(res => {
        // Pre-compute colors deterministically
        (res.data.categories || []).forEach(c => getCatColor(c.category));
        setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: "'Inter',system-ui" }}>
      <RefreshCw style={{ width: 28, height: 28, color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Calculating inventory value…</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const categories  = data?.categories  || [];
  const items       = data?.items       || [];
  const grandTotal  = data?.grand_total || 0;

  // Filter items by clicked category
  const displayItems = activeCategory
    ? items.filter(i => i.category === activeCategory)
    : items;

  // Sort items
  const sortedItems = [...displayItems].sort((a, b) => {
    if (sortBy === 'value') return b.total_value - a.total_value;
    if (sortBy === 'qty')   return b.quantity    - a.quantity;
    if (sortBy === 'cost')  return b.cost_per_unit - a.cost_per_unit;
    if (sortBy === 'pct')   return b.pct - a.pct;
    return 0;
  });

  const avgItemValue = items.length > 0 ? grandTotal / items.length : 0;

  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100%', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>
              <DollarSign style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Stock Value by Category</h1>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, paddingLeft: 46 }}>
            Financial impact of inventory · Value = cost per unit × quantity available
          </p>
        </div>
        {activeCategory && (
          <button onClick={() => setActive(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: "'Inter',system-ui" }}>
            <Tag style={{ width: 13, height: 13 }} />
            Filtering: {activeCategory} · Click to clear
          </button>
        )}
      </div>

      {/* ══ ROW 1: KPI Cards ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <KpiCard label="Total Inventory Value" value={fmtCurrency(grandTotal, true)} sub={fmtCurrency(grandTotal)} icon={DollarSign} color="#3b82f6" bg="#eff6ff" border="#bfdbfe" />
        <KpiCard label="Top Category" value={data?.top_category || '—'} sub={`${data?.top_category_pct || 0}% of total value`} icon={TrendingUp} color="#10b981" bg="#f0fdf4" border="#bbf7d0" />
        <KpiCard label="Categories Tracked" value={data?.total_categories || 0} sub={`across all items`} icon={BarChart2} color="#8b5cf6" bg="#f5f3ff" border="#ddd6fe" />
        <KpiCard label="Avg Value / Item" value={fmtCurrency(avgItemValue, true)} sub={`${data?.total_items || 0} SKUs tracked`} icon={Package} color="#f59e0b" bg="#fffbeb" border="#fde68a" />
      </div>

      {/* ══ ROW 2: Bar Chart (2/3) + Category Breakdown List (1/3) ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* ── Bar Chart ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Inventory Value by Category</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
              Click a bar to filter the item table below · Y-axis = Total stock value (₹)
            </p>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={categories}
              margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
              barCategoryGap="30%"
              onClick={(e) => {
                if (e?.activePayload?.[0]) {
                  const cat = e.activePayload[0].payload.category;
                  setActive(prev => prev === cat ? null : cat);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                {categories.map((cat, i) => (
                  <linearGradient key={cat.category} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={getCatColor(cat.category)} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={getCatColor(cat.category)} stopOpacity={0.65} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontFamily: "'Inter',system-ui", fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={<YAxisTick />}
                width={60}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
              <Bar dataKey="value" name="Stock Value" radius={[8, 8, 0, 0]} maxBarSize={80}>
                {categories.map((cat, i) => (
                  <Cell
                    key={cat.category}
                    fill={`url(#grad-${i})`}
                    opacity={activeCategory && activeCategory !== cat.category ? 0.35 : 1}
                    stroke={activeCategory === cat.category ? getCatColor(cat.category) : 'none'}
                    strokeWidth={activeCategory === cat.category ? 2 : 0}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={v => fmtCurrency(v, true)}
                  style={{ fill: '#64748b', fontSize: 11, fontFamily: "'Inter',system-ui", fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Category Breakdown List ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Category Breakdown</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px' }}>Ranked by total stock value</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {categories.map((cat, i) => {
              const color = getCatColor(cat.category);
              const isActive = activeCategory === cat.category;
              return (
                <div
                  key={cat.category}
                  onClick={() => setActive(prev => prev === cat.category ? null : cat.category)}
                  style={{
                    cursor: 'pointer', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${isActive ? color : '#f1f5f9'}`,
                    background: isActive ? color + '0d' : '#fafbfc',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => !isActive && (e.currentTarget.style.background = '#f0f7ff')}
                  onMouseLeave={e => !isActive && (e.currentTarget.style.background = '#fafbfc')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{cat.category}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{cat.item_count} items</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${cat.pct}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{fmtCurrency(cat.value, true)}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{cat.pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ ROW 3: Per-Item Detail Table ══ */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart2 style={{ width: 15, height: 15, color: '#64748b' }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Item Value Breakdown
                {activeCategory && (
                  <span style={{ fontSize: 12, fontWeight: 500, color: getCatColor(activeCategory), marginLeft: 8 }}>
                    — {activeCategory}
                  </span>
                )}
              </h3>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
              {sortedItems.length} items · Showing all {activeCategory ? `in ${activeCategory}` : 'categories'}
            </p>
          </div>

          {/* Sort selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Sort by:</span>
            {[['value', 'Total Value'], ['pct', '% Share'], ['qty', 'Quantity'], ['cost', 'Unit Cost']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                style={{
                  padding: '4px 10px', borderRadius: 8,
                  border: `1px solid ${sortBy === key ? '#3b82f6' : '#e2e8f0'}`,
                  background: sortBy === key ? '#eff6ff' : '#fff',
                  color: sortBy === key ? '#1d4ed8' : '#64748b',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Inter',system-ui", transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['#', 'Item Name', 'Category', 'Qty Available', 'Cost / Unit', 'Total Value', '% of Total'].map((h, i) => (
                  <th key={h} style={{
                    padding: '12px 20px',
                    textAlign: i >= 3 ? 'right' : 'left',
                    fontWeight: 600, fontSize: 11, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, i) => {
                const color = getCatColor(item.category);
                return (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafbfc', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f7ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbfc'}
                  >
                    <td style={{ padding: '13px 20px', color: '#94a3b8', fontWeight: 700, fontSize: 12 }}>{item.rank}</td>
                    <td style={{ padding: '13px 20px', color: '#0f172a', fontWeight: 700 }}>{item.name}</td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ background: color + '15', color, border: `1px solid ${color}30`, fontWeight: 600, padding: '2px 10px', borderRadius: 20, fontSize: 12, whiteSpace: 'nowrap' }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', color: '#374151', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {item.quantity.toLocaleString('en-IN')}<span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 3 }}>{item.unit}</span>
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtCurrency(item.cost_per_unit)}
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right', color: '#0f172a', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtCurrency(item.total_value)}
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                        <div style={{ width: 60, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(item.pct * 4, 100)}%`, background: color, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{item.pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer total */}
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={3} style={{ padding: '13px 20px', fontWeight: 700, color: '#374151', fontSize: 13 }}>
                  Total ({items.length} items)
                </td>
                <td style={{ padding: '13px 20px', textAlign: 'right', color: '#374151', fontWeight: 700 }}>—</td>
                <td style={{ padding: '13px 20px', textAlign: 'right', color: '#374151', fontWeight: 700 }}>—</td>
                <td style={{ padding: '13px 20px', textAlign: 'right', color: '#0f172a', fontWeight: 800, fontSize: 14 }}>
                  {fmtCurrency(grandTotal)}
                </td>
                <td style={{ padding: '13px 20px', textAlign: 'right', color: '#64748b', fontWeight: 700 }}>100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
