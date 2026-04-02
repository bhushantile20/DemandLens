import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    api
      .get("/dashboard/summary")
      .then((res) => setSummary(res.data))
      .catch(() => {});
    api
      .get("/alerts/reorder/")
      .then((res) => setAlerts(res.data.slice(0, 5)))
      .catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>Dashboard Overview</h1>
      <div className="kpis">
        <div className="card">
          <div className="label">Total Items</div>
          <div className="value">{summary ? summary.total_items : "-"}</div>
        </div>
        <div className="card">
          <div className="label">Low Stock</div>
          <div className="value">{summary ? summary.low_stock_count : "-"}</div>
        </div>
        <div className="card">
          <div className="label">Reorder Now</div>
          <div className="value">
            {summary ? summary.reorder_now_count : "-"}
          </div>
        </div>
        <div className="card">
          <div className="label">Data Issues</div>
          <div className="value">{summary ? summary.issue_count : "-"}</div>
        </div>
      </div>

      <section>
        <h2>Top Reorder Alerts</h2>
        <ul>
          {alerts.map((a) => (
            <li key={a.item_id}>
              {a.item_name}: {a.suggested_reorder_qty} ({a.explanation})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
