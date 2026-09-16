"use client";

interface Props {
  percent: number;
  width?: number;   // px width of the bar (default 90)
  showLabel?: boolean;
}

export function ReadinessBar({
  percent,
  width = 90,
  showLabel = true,
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent));

  // color by percentage
  const fillColor =
    clamped >= 90
      ? "bg-emerald-600"
      : clamped >= 60
        ? "bg-orange-700"
        : clamped >= 30
          ? "bg-orange-500"
          : "bg-rose-600";

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-200"
        style={{ width }}
      >
        <div
          className={`h-full rounded-full ${fillColor} transition-all`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-[11px] font-semibold text-slate-700">
          {clamped}%
        </span>
      )}
    </div>
  );
}