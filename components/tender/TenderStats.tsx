"use client";

interface StatItem {
  label: string;
  value: string;
  hint?: string;
  highlighted?: boolean;
}

interface Props {
  stats: StatItem[];
}

export function TenderStats({ stats }: Props) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {s.label}
          </p>
          <p
            className={`mt-1.5 font-mono text-xl font-bold tracking-tight ${
              s.highlighted
                ? "text-[#a97400]"
                : "text-slate-900"
            }`}
          >
            {s.value}
          </p>
          {s.hint && (
            <p className="mt-0.5 text-[11px] text-slate-500">{s.hint}</p>
          )}
        </div>
      ))}
    </section>
  );
}