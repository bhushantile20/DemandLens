import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function ItemDetail() {
  const { id } = useParams();
  const [data, setData] = useState({ history: [], forecast: [] });
  const [item, setItem] = useState(null);

  useEffect(() => {
    api
      .get(`/items/${id}/`)
      .then((res) => setItem(res.data))
      .catch(() => {});
    api
      .get(`/items/${id}/forecast/`)
      .then((res) => setData(res.data))
      .catch(() => {});
  }, [id]);

  const chartData = [
    ...data.history.map((h) => ({
      date: h.date,
      value: parseFloat(h.quantity_used),
    })),
    ...data.forecast.map((f) => ({
      date: f.forecast_date,
      value: parseFloat(f.predicted_demand),
      forecast: true,
    })),
  ];

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 leading-none tracking-tight">
            Item Details
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            View history and demand forecast for this specific item.
          </p>
        </div>
      </div>

      {item && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">{item.item_name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Category</p>
              <p className="text-lg font-semibold text-slate-800">{item.category}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Supplier</p>
              <p className="text-lg font-semibold text-slate-800">{item.supplier?.supplier_name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Current Stock</p>
              <p className="text-lg font-semibold text-slate-800">{item.stock?.quantity_available ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                item.risk_status === 'reorder_now' ? 'bg-red-100 text-red-700 border-red-200' :
                item.risk_status === 'watch' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                'bg-green-100 text-green-700 border-green-200'
              }`}>
                {item.risk_status === 'reorder_now' ? 'Reorder' : item.risk_status === 'watch' ? 'Watch' : 'Safe'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
        <h3 className="text-base font-semibold text-slate-800">Consumption & Forecast</h3>
        <div style={{ height: 320 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} stroke="#94a3b8" />
              <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
