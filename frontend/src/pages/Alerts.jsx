import { useEffect, useState } from "react";
import { BellRing, ArrowUpDown } from "lucide-react";
import api from "../services/api";
import AlertCard from "../components/AlertCard";

export default function Alerts() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/alerts/reorder/")
      .then((r) => setRecs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 leading-none">
            Reorder Alerts
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            AI-generated reorder recommendations based on demand forecasts.
          </p>
        </div>
        <button className="border border-gray-300 rounded-lg px-6 py-3 flex items-center justify-center hover:scale-105 transition text-slate-600 font-semibold bg-white shadow-sm h-[48px]">
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Sort
        </button>
      </div>

      {/* Card list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
          <BellRing className="w-4 h-4 text-red-500" />
          <h3 className="text-base font-semibold text-slate-800">
            All Reorder Alerts
          </h3>
          <span className="ml-1 bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-0.5 rounded-full">
            {recs.length}
          </span>
        </div>

        {/* Rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
            ))
          ) : recs.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-400 text-sm">
              🎉 No reorder alerts at this time.
            </div>
          ) : (
            recs.map((r) => <AlertCard key={r.item_id} item={r} />)
          )}
        </div>
      </div>
    </div>
  );
}
