import { useEffect, useState } from "react";
import api from "../services/api";

export default function ItemsList() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    category: "",
    supplier: "",
    status: "",
  });

  useEffect(() => {
    api
      .get("/items/")
      .then((res) => setItems(res.data))
      .catch(() => {});
  }, []);

  const filtered = items.filter((it) => {
    if (filters.category && it.category !== filters.category) return false;
    if (filters.supplier && it.supplier.supplier_id !== filters.supplier)
      return false;
    if (filters.status && it.risk_status !== filters.status) return false;
    return true;
  });

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(
    Boolean,
  );
  const suppliers = Array.from(
    new Set(items.map((i) => i.supplier?.supplier_id)),
  ).filter(Boolean);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 leading-none tracking-tight">
            Inventory Items
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Manage your catalog, stock levels, and active suppliers.
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row gap-6">
        <label className="flex flex-col gap-2 flex-1">
          <span className="text-sm font-semibold text-slate-700">Category</span>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-2 flex-1">
          <span className="text-sm font-semibold text-slate-700">Supplier</span>
          <select
            value={filters.supplier}
            onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </label>
        <label className="flex flex-col gap-2 flex-1">
          <span className="text-sm font-semibold text-slate-700">Status</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="safe">Safe</option>
            <option value="watch">Watch</option>
            <option value="reorder_now">Reorder Now</option>
          </select>
        </label>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Item</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Supplier</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Reorder Level</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Pred. 7d</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((it) => (
                <tr key={it.item_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{it.item_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{it.category}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{it.supplier?.supplier_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium text-right">{it.stock?.quantity_available ?? "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-medium text-right">{it.stock?.reorder_level ?? "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 font-bold text-right">{it.forecast_next_7d ?? 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      it.risk_status === 'reorder_now' ? 'bg-red-100 text-red-700 border-red-200' :
                      it.risk_status === 'watch' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-green-100 text-green-700 border-green-200'
                    }`}>
                      {it.risk_status === 'reorder_now' ? 'Reorder' : it.risk_status === 'watch' ? 'Watch' : 'Safe'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400 text-sm">
                    No items match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
