import { useEffect, useState } from "react";
import api from "../services/api";

export default function DataQuality() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    api
      .get("/data-quality/issues/")
      .then((r) => setIssues(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="container">
      <h1>Data Quality Issues</h1>
      <p>
        Rows with missing or invalid items are excluded from forecasting (e.g.
        raw item ids 106, 107).
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Raw Item ID</th>
            <th>Issue</th>
            <th>Description</th>
            <th>Source</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((i) => (
            <tr key={`${i.raw_item_id}-${i.issue_type}`}>
              <td>{i.raw_item_id}</td>
              <td>{i.issue_type}</td>
              <td>{i.description}</td>
              <td>{i.source_table}</td>
              <td>{new Date(i.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
