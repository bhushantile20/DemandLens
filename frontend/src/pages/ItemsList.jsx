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
    <div className="container">
      <h1>Inventory</h1>

      <div className="filters">
        <label>
          Category
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Supplier
          <select
            value={filters.supplier}
            onChange={(e) =>
              setFilters({ ...filters, supplier: e.target.value })
            }
          >
            <option value="">All</option>
            {suppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All</option>
            <option value="safe">Safe</option>
            <option value="watch">Watch</option>
            <option value="reorder_now">Reorder Now</option>
          </select>
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Supplier</th>
            <th>Stock</th>
            <th>Reorder Level</th>
            <th>Pred. 7d</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((it) => (
            <tr key={it.item_id}>
              <td>{it.item_name}</td>
              <td>{it.category}</td>
              <td>{it.supplier?.supplier_name}</td>
              <td>{it.stock?.quantity_available ?? "-"}</td>
              <td>{it.stock?.reorder_level ?? "-"}</td>
              <td>{it.forecast_next_7d ?? 0}</td>
              <td>{it.risk_status ?? "safe"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
