import { useEffect, useState } from "react";
import api from "../services/api";

export default function Alerts() {
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    api
      .get("/alerts/reorder/")
      .then((r) => setRecs(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>Reorder Alerts</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Current Stock</th>
            <th>Pred. Demand</th>
            <th>Suggested Qty</th>
            <th>Explanation</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((r) => (
            <tr key={r.item_id}>
              <td>{r.item_name}</td>
              <td>{r.current_stock}</td>
              <td>{r.predicted_demand_7d}</td>
              <td>{r.suggested_reorder_qty}</td>
              <td>{r.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
