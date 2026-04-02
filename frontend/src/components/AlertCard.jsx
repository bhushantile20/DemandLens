import { Package2, Clock, Cpu } from "lucide-react";

function getStatusStyle(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "critical" || s === "reorder")
    return "bg-red-100 text-red-700 border border-red-200";
  if (s === "watch" || s === "low")
    return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-green-100 text-green-700 border border-green-200";
}

function getStatusLabel(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "critical" || s === "reorder") return "Critical";
  if (s === "watch" || s === "low")        return "Watch";
  return "Safe";
}

function getStatusDot(status) {
  const s = (status ?? "").toLowerCase();
  if (s === "critical" || s === "reorder") return "bg-red-500";
  if (s === "watch" || s === "low")        return "bg-amber-500";
  return "bg-green-500";
}

export default function AlertCard({ item }) {
  const {
    item_name,
    current_stock,
    predicted_demand_7d,
    suggested_reorder_qty,
    explanation,
    status,
  } = item;

  const statusLabel = getStatusLabel(status);
  const dot = getStatusDot(status);
  const badge = getStatusStyle(status);

  return (
    <div className="p-6 rounded-xl shadow-sm bg-white border border-slate-100 flex flex-col gap-3 h-full hover:shadow-md transition-all duration-200">
      {/* Top: Name + Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            <Package2 className="w-5 h-5 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-slate-800 truncate" title={item_name ?? "—"}>
              {item_name ?? "—"}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge} shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {statusLabel}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm overflow-hidden text-ellipsis line-clamp-2" title={explanation}>
        {explanation ?? "No explanation provided"}
      </p>

      {/* Bottom: Stats */}
      <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-slate-400" />
            <span>Pred (7d):</span>
          </div>
          <span className="font-bold text-slate-800">{predicted_demand_7d ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Reorder:</span>
          </div>
          <span className="font-bold text-slate-800">{suggested_reorder_qty ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span className="font-semibold text-slate-500">Current Stock:</span>
          <span className="font-bold text-slate-800">{current_stock ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}
