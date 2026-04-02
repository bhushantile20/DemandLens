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
    <div className="container">
      <h1>Item Detail</h1>
      {item && (
        <section>
          <h2>{item.item_name}</h2>
          <div>Category: {item.category}</div>
          <div>Supplier: {item.supplier?.supplier_name}</div>
        </section>
      )}

      <section style={{ height: 320 }}>
        <h3>Consumption & Forecast</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
