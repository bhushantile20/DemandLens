const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-500",   text: "text-blue-600",   badge: "bg-blue-100 text-blue-700" },
  amber:  { bg: "bg-amber-50",  icon: "bg-amber-500",  text: "text-amber-600",  badge: "bg-amber-100 text-amber-700" },
  red:    { bg: "bg-red-50",    icon: "bg-red-500",    text: "text-red-600",    badge: "bg-red-100 text-red-700" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-500", text: "text-purple-600", badge: "bg-purple-100 text-purple-700" },
  green:  { bg: "bg-green-50",  icon: "bg-green-500",  text: "text-green-600",  badge: "bg-green-100 text-green-700" },
};

export default function StatCard({ label, value, icon: Icon, color = "blue", trend, trendLabel }) {
  const c = colorMap[color] ?? colorMap.blue;

  return (
    <div className="p-6 rounded-xl shadow-sm bg-white border border-slate-100 flex flex-col gap-3 justify-between h-full hover:shadow-md transition-shadow duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1 truncate">
            {label}
          </p>
          <p className="text-3xl font-extrabold text-slate-800 leading-none truncate">
            {value ?? (
              <span className="animate-pulse text-slate-300">—</span>
            )}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center shrink-0 shadow-sm ml-3`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Bottom trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-auto">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge} shrink-0`}>
            {trend > 0 ? `+${trend}` : trend}%
          </span>
          <span className="text-sm text-slate-500 truncate">{trendLabel ?? "vs last week"}</span>
        </div>
      )}
    </div>
  );
}
