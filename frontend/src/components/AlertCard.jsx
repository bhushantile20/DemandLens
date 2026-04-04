import { Package2, Clock, Cpu, TrendingDown } from "lucide-react";

function getStatusStyle(explanation) {
  const s = (explanation ?? "").toLowerCase();
  if (s.includes("reorder_now")) return "bg-red-100 text-red-700 border border-red-200";
  if (s.includes("watch"))       return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-green-100 text-green-700 border border-green-200";
}

function getStatusLabel(explanation) {
  const s = (explanation ?? "").toLowerCase();
  if (s.includes("reorder_now")) return "Reorder Now";
  if (s.includes("watch"))       return "Watch";
  return "Safe";
}

function getStatusDot(explanation) {
  const s = (explanation ?? "").toLowerCase();
  if (s.includes("reorder_now")) return "bg-red-500";
  if (s.includes("watch"))       return "bg-amber-400";
  return "bg-green-500";
}

export default function AlertCard({ item }) {
  const {
    item_name,
    current_stock,
    reorder_level,
    predicted_demand_7d,
    suggested_reorder_qty,
    days_of_stock_left,
    explanation,
  } = item;

  const isSafe    = (explanation ?? "").toLowerCase().includes("safe");
  const isWatch   = (explanation ?? "").toLowerCase().includes("watch");
  const isCritical = (explanation ?? "").toLowerCase().includes("reorder_now");

  const badge      = getStatusStyle(explanation);
  const statusLabel = getStatusLabel(explanation);
  const dot        = getStatusDot(explanation);

  const reorderDisplay = parseFloat(suggested_reorder_qty) > 0
    ? `${Number(suggested_reorder_qty).toFixed(0)} units`
    : "Not Required";

  const reorderColor = parseFloat(suggested_reorder_qty) > 0
    ? "text-red-600 font-extrabold"
    : "text-green-600 font-bold";

  return (
    <div className={`p-6 rounded-xl shadow-sm bg-white flex flex-col gap-3 h-full hover:shadow-md transition-all duration-200 border-l-4 ${
      isCritical ? 'border-red-400' : isWatch ? 'border-amber-400' : 'border-green-400'
    } border border-slate-100`}>
      {/* Top: Name + Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isCritical ? 'bg-red-50' : isWatch ? 'bg-amber-50' : 'bg-green-50'
          }`}>
            <Package2 className={`w-5 h-5 ${isCritical ? 'text-red-500' : isWatch ? 'text-amber-500' : 'text-green-500'}`} />
          </div>
          <p className="text-base font-bold text-slate-800 truncate" title={item_name ?? "—"}>
            {item_name ?? "—"}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge} shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          {statusLabel}
        </span>
      </div>

      {/* Bottom: Stats */}
      <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-slate-400" />
            <span>AI Pred (7d):</span>
          </div>
          <span className="font-bold text-slate-800">{Number(predicted_demand_7d ?? 0).toFixed(1)} units</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-slate-400" />
            <span>Days of Stock:</span>
          </div>
          <span className={`font-bold ${parseFloat(days_of_stock_left) < 5 ? 'text-red-600' : 'text-slate-800'}`}>
            {days_of_stock_left > 0 ? `~${Number(days_of_stock_left).toFixed(0)} days` : "Stable"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span className="font-semibold text-slate-500">Current Stock:</span>
          <span className="font-bold text-slate-800">{Number(current_stock ?? 0).toFixed(0)} units</span>
        </div>
        <div className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 mt-1 ${
          parseFloat(suggested_reorder_qty) > 0 ? 'bg-red-50' : 'bg-green-50'
        }`}>
          <div className="flex items-center gap-1.5">
            <Clock className={`w-4 h-4 ${parseFloat(suggested_reorder_qty) > 0 ? 'text-red-400' : 'text-green-400'}`} />
            <span className="font-semibold text-slate-600">Reorder Qty:</span>
          </div>
          <span className={reorderColor}>{reorderDisplay}</span>
        </div>
      </div>
    </div>
  );
}
