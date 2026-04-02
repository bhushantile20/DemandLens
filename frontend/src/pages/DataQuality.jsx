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
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 leading-none tracking-tight">
            Data Quality Issues
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Rows with missing or invalid items are excluded from forecasting (e.g. raw item ids 106, 107).
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Raw Item ID</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Issue</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Source</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map((i) => (
                <tr key={`${i.raw_item_id}-${i.issue_type}`} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{i.raw_item_id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-amber-600 bg-amber-50/50">{i.issue_type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{i.description}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono text-xs">{i.source_table}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 text-right">{new Date(i.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {issues.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-400 text-sm">
                    🎉 Excellent! No data quality issues detected.
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
