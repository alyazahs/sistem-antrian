export default function MiniStat({ label, value, icon, tone = "blue" }) {
  const toneMap = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className={`rounded-xl border p-3 shadow-sm ${toneMap[tone] || toneMap.blue}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium opacity-80">{label}</div>
          <div className="mt-1 text-2xl font-semibold leading-none">{value ?? 0}</div>
        </div>
        <i className={`pi ${icon} text-lg opacity-80`} />
      </div>
    </div>
  );
}