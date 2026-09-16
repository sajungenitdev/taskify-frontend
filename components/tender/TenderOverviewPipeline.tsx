"use client";

import { ArrowRight } from "lucide-react";

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  color: string;         // tailwind bg color class, e.g. "bg-slate-500"
  hint?: string;
}

interface Props {
  stages: PipelineStage[];
}

export function TenderOverviewPipeline({ stages }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-slate-900">
          Tender Lifecycle Pipeline
        </h2>
        <p className="text-[11px] text-slate-500">
          Current snapshot across all stages
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex min-w-[120px] flex-col rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.color}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {s.label}
                </span>
              </div>
              <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                {s.count}
              </p>
              {s.hint && (
                <p className="text-[10px] text-slate-500">{s.hint}</p>
              )}
            </div>
            {i < stages.length - 1 && (
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}