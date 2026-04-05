import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, ChevronRight, SlidersHorizontal } from "lucide-react";
import api from "../services/api";

// ─── Status pill config (4-way) ───────────────────────────────────────────────
const STATUS_CFG = {
  normal:    { label: "Normal",    color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", dot: "#22c55e" },
  low:       { label: "Low Stock", color: "#b45309", bg: "#fef9c3", border: "#fde047", dot: "#eab308" },
  critical:  { label: "Critical",  color: "#dc2626", bg: "#fee2e2", border: "#fca5a5", dot: "#ef4444" },
  overstock: { label: "Overstock", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", dot: "#8b5cf6" },
};

// ─── Days-left badge colors ───────────────────────────────────────────────────
const daysColor = (d) => {
  if (d == null)  return "#94a3b8";
  if (d < 7)      return "#ef4444";
  if (d < 14)     return "#f59e0b";
  return "#10b981";
};

// ─── Stock ratio bar ─────────────────────────────────────────────────────────
const StockRatioBar = ({ ratio }) => {
  if (ratio == null) return <span style={{ color: "#94a3b8" }}>—</span>;
  const clamped = Math.min(ratio / 5, 1); // 5× = full bar
  const color   = ratio < 0.5 ? "#ef4444" : ratio < 1 ? "#f59e0b" : ratio > 3 ? "#8b5cf6" : "#10b981";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
      <div style={{ width: 56, height: 5, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${clamped * 100}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {ratio.toFixed(1)}×
      </span>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ItemsList() {
  const navigate = useNavigate();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filters, setFilters] = useState({ category: "", supplier: "", status: "" });
  const [sortCfg, setSortCfg] = useState({ key: "item_name", dir: "asc" });

  useEffect(() => {
    setLoading(true);
    api.get("/items/")
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derived filter options
  const categories = useMemo(() => [...new Set(items.map(i => i.category).filter(Boolean))].sort(), [items]);
  const suppliers  = useMemo(() => [...new Set(items.map(i => i.supplier?.supplier_name).filter(Boolean))].sort(), [items]);

  // Status counts for summary bar
  const counts = useMemo(() => ({
    normal:    items.filter(i => i.risk_status === "normal").length,
    low:       items.filter(i => i.risk_status === "low").length,
    critical:  items.filter(i => i.risk_status === "critical").length,
    overstock: items.filter(i => i.risk_status === "overstock").length,
  }), [items]);

  // ── helper: extract the sortable value for a given key ──────────────────────
  const getSortVal = (item, key) => {
    if (key === 'supplier')          return item.supplier?.supplier_name?.toLowerCase() ?? '';
    if (key === 'stock_ratio') {
      const qty    = parseFloat(item.stock?.quantity_available ?? 0);
      const reorder = parseFloat(item.stock?.reorder_level ?? 1);
      return reorder > 0 ? qty / reorder : 0;
    }
    if (key === 'days_of_stock_left') {
      const qty   = parseFloat(item.stock?.quantity_available ?? 0);
      const pred  = parseFloat(item.forecast_next_7d ?? 0);
      const daily = pred / 7;
      return daily > 0 ? qty / daily : 9999;
    }
    if (key === 'forecast_next_7d') return parseFloat(item.forecast_next_7d ?? 0);
    const v = item[key] ?? '';
    return typeof v === 'string' ? v.toLowerCase() : v;
  };

  // Filter + search + sort
  const displayed = useMemo(() => {
    let list = items;
    if (search)           list = list.filter(i => i.item_name.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase()) || i.supplier?.supplier_name?.toLowerCase().includes(search.toLowerCase()));
    if (filters.category) list = list.filter(i => i.category === filters.category);
    if (filters.supplier) list = list.filter(i => i.supplier?.supplier_name === filters.supplier);
    if (filters.status)   list = list.filter(i => i.risk_status === filters.status);

    const { key, dir } = sortCfg;
    list = [...list].sort((a, b) => {
      const va = getSortVal(a, key);
      const vb = getSortVal(b, key);
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1  : -1;
      return 0;
    });
    return list;
  }, [items, search, filters, sortCfg]);

  const toggleSort = (key) => setSortCfg(prev =>
    prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
  );

  const SortTh = ({ col, label, right }) => {
    const active = sortCfg.key === col;
    return (
      <th
        onClick={() => toggleSort(col)}
        style={{
          padding: "12px 20px", textAlign: right ? "right" : "left",
          fontWeight: 600, fontSize: 11, color: active ? "#3b82f6" : "#94a3b8",
          textTransform: "uppercase", letterSpacing: "0.05em",
          borderBottom: "1px solid #f1f5f9", cursor: "pointer",
          whiteSpace: "nowrap", userSelect: "none",
        }}
      >
        {label} {active ? (sortCfg.dir === "asc" ? "↑" : "↓") : ""}
      </th>
    );
  };

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100%", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(15,23,42,0.25)" }}>
              <Package style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>Inventory Status</h1>
          </div>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0, paddingLeft: 46 }}>
            {items.length} SKUs tracked · Real-time stock status with AI-powered risk classification
          </p>
        </div>
      </div>

      {/* ══ Status Summary Bar ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilters(f => ({ ...f, status: f.status === key ? "" : key }))}
            style={{
              background: filters.status === key ? cfg.bg : "#fff",
              border: `1px solid ${filters.status === key ? cfg.color : "#e2e8f0"}`,
              borderRadius: 12, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", fontFamily: "'Inter',system-ui",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.15s",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
            <div style={{ textAlign: "left", minWidth: 0 }}>
              <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cfg.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: filters.status === key ? cfg.color : "#0f172a", margin: "2px 0 0", lineHeight: 1 }}>{counts[key]}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ══ Search + Filter Row ══ */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search style={{ width: 14, height: 14, color: "#94a3b8", position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search item, category, supplier…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, color: "#374151", background: "#f8fafc", outline: "none", fontFamily: "'Inter',system-ui", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8" }}>
          <SlidersHorizontal style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Filter</span>
        </div>

        {/* Category */}
        <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#374151", background: "#f8fafc", outline: "none", fontFamily: "'Inter',system-ui", cursor: "pointer" }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Supplier */}
        <select value={filters.supplier} onChange={e => setFilters(f => ({ ...f, supplier: e.target.value }))} style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#374151", background: "#f8fafc", outline: "none", fontFamily: "'Inter',system-ui", cursor: "pointer" }}>
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Clear */}
        {(search || filters.category || filters.supplier || filters.status) && (
          <button onClick={() => { setSearch(""); setFilters({ category: "", supplier: "", status: "" }); }} style={{ padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#64748b", background: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',system-ui" }}>
            Clear All
          </button>
        )}

        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", fontWeight: 500, whiteSpace: "nowrap" }}>
          {displayed.length} of {items.length} items
        </span>
      </div>

      {/* ══ Table ══ */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ width: 24, height: 24, border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Loading inventory…</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <SortTh col="item_name"        label="Item"         />
                  <SortTh col="category"          label="Category"     />
                  <SortTh col="supplier"          label="Supplier"     />
                  <SortTh col="stock_ratio"       label="Stock / Reorder" right />
                  <SortTh col="days_of_stock_left" label="Days Left"   right />
                  <SortTh col="forecast_next_7d"  label="7d Forecast"  right />
                  <th style={{ padding: "12px 20px", textAlign: "center", fontWeight: 600, fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #f1f5f9" }}>Status</th>
                  <th style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }} />
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                      No items match your search or filters.
                    </td>
                  </tr>
                ) : displayed.map((it, i) => {
                  const sc       = STATUS_CFG[it.risk_status] || STATUS_CFG.normal;
                  const dColor   = daysColor(it.days_of_stock_left);
                  const isDanger = it.risk_status === "critical";

                  return (
                    <tr
                      key={it.item_id}
                      style={{ borderBottom: "1px solid #f8fafc", background: isDanger ? "#fff8f8" : i % 2 === 0 ? "#fff" : "#fafbfc", cursor: "pointer", transition: "background 0.12s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f7ff"}
                      onMouseLeave={e => e.currentTarget.style.background = isDanger ? "#fff8f8" : i % 2 === 0 ? "#fff" : "#fafbfc"}
                      onClick={() => navigate(`/items/${it.id}`)}
                    >
                      {/* Item name */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{it.item_name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{it.item_id}</div>
                      </td>

                      {/* Category pill */}
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", fontWeight: 600, padding: "2px 10px", borderRadius: 20, fontSize: 12, whiteSpace: "nowrap" }}>
                          {it.category}
                        </span>
                      </td>

                      {/* Supplier */}
                      <td style={{ padding: "14px 20px", color: "#64748b", fontSize: 13 }}>
                        {it.supplier?.supplier_name || "—"}
                      </td>

                      {/* Stock / Reorder ratio bar */}
                      <td style={{ padding: "14px 20px" }}>
                        <StockRatioBar ratio={it.stock_ratio} />
                        <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "right", marginTop: 2 }}>
                          {it.stock?.quantity_available ?? "—"} / {it.stock?.reorder_level ?? "—"} u
                        </div>
                      </td>

                      {/* Days left */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        {it.days_of_stock_left != null ? (
                          <span style={{ fontWeight: 700, fontSize: 13, color: dColor }}>
                            {it.days_of_stock_left}
                            <span style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8", marginLeft: 2 }}>d</span>
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>

                      {/* 7d forecast */}
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <span style={{ fontWeight: 700, color: "#3b82f6", fontVariantNumeric: "tabular-nums" }}>
                          {it.forecast_next_7d != null ? it.forecast_next_7d.toFixed(1) : "—"}
                        </span>
                        <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 3 }}>u</span>
                      </td>

                      {/* Status pill */}
                      <td style={{ padding: "14px 20px", textAlign: "center" }}>
                        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, fontWeight: 700, padding: "4px 12px", borderRadius: 20, fontSize: 12, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.dot }} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Arrow */}
                      <td style={{ padding: "14px 16px" }}>
                        <ChevronRight style={{ width: 15, height: 15, color: "#cbd5e1" }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend footnote */}
      <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
            <span style={{ fontSize: 11, color: "#64748b" }}><strong style={{ color: cfg.color }}>{cfg.label}</strong></span>
          </div>
        ))}
        <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>Stock Ratio: current stock ÷ reorder level · Click any row to view item detail</span>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
