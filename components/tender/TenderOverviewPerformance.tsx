"use client";

export interface MonthPerformance {
  month: string;   // "Jan", "Feb", ...
  won: number;
  lost: number;
}

interface Props {
  data: MonthPerformance[];
  winRate: number;
}

export function TenderOverviewPerformance({ data, winRate }: Props) {
  const max = Math.max(...data.flatMap((d) => [d.won, d.lost]), 1);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Performance (Last 6 Months)
          </h2>
          <p className="text-[11px] text-slate-500">
            Tenders won vs. lost
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Win Rate
          </p>
          <p className="font-mono text-lg font-bold text-emerald-600">
            {winRate}%
          </p>
        </div>
      </header>

      <div className="flex items-end gap-4" style={{ height: 160 }}>
        {data.map((d) => (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t-sm bg-emerald-500"
                style={{ height: `${(d.won / max) * 100}%`, minHeight: d.won ? 4 : 0 }}
                title={`Won: ${d.won}`}
              />
              <div
                className="w-3 rounded-t-sm bg-rose-400"
                style={{ height: `${(d.lost / max) * 100}%`, minHeight: d.lost ? 4 : 0 }}
                title={`Lost: ${d.lost}`}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500">
              {d.month}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3">
        <Legend color="bg-emerald-500" label="Won" />
        <Legend color="bg-rose-400" label="Lost" />
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      {label}
    </span>
  );
}