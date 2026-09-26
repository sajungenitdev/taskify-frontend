"use client";

import type { PipelineSegment } from "@/lib/api/tender.api";

interface Props {
  pipelineMix: PipelineSegment[];
  winRate: number;
  wonValue: string;
  wonValueShort?: string;
  lostCount: number;
}

/* Default legend rows so the layout always renders the expected
 * five stages, even if the backend hasn't returned pipelineMix yet. */
const DEFAULT_PIPELINE: PipelineSegment[] = [
  { label: "Potential", value: 0, color: "#a97400" },
  { label: "Active", value: 0, color: "#1e3a8a" },
  { label: "Submitted", value: 0, color: "#94a3b8" },
  { label: "Won", value: 0, color: "#059669" },
  { label: "Lost", value: 0, color: "#dc2626" },
];

export function TenderOverviewPerformance({
  pipelineMix,
  winRate,
  wonValue,
  wonValueShort,
  lostCount,
}: Props) {
  // Fallback to the default rows so the legend never disappears
  const rows = pipelineMix.length > 0 ? pipelineMix : DEFAULT_PIPELINE;

  const total = rows.reduce((acc, curr) => acc + curr.value, 0);

  const segments = rows.reduce<
    Array<PipelineSegment & { percent: number; offset: number }>
  >((acc, segment) => {
    const percent = total > 0 ? (segment.value / total) * 100 : 0;
    const prev = acc[acc.length - 1];
    const offset = prev ? prev.offset + prev.percent : 0;
    acc.push({ ...segment, percent, offset });
    return acc;
  }, []);

  const safeWonValueShort = wonValueShort || wonValue || "৳0";

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <header className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f]">
          Tender Performance — FY26
        </h2>
      </header>

      {/* Main layout: Donuts (left) | Legend (right) */}
      <div className="flex flex-1 items-start gap-8">
        {/* LEFT: Two Donuts side-by-side */}
        <div className="flex shrink-0 items-start gap-4">
          {/* Pipeline Mix Donut */}
          <div className="flex flex-col items-center">
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="5"
                />
                {total > 0 &&
                  segments.map((segment) => (
                    <circle
                      key={segment.label}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="5"
                      strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                      strokeDashoffset={-segment.offset}
                    />
                  ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-base font-bold leading-none text-slate-900">
                  {total}
                </span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                  Total
                </span>
              </div>
            </div>
            <span className="mt-3 text-[11px] font-medium text-slate-500">
              Pipeline Mix
            </span>
          </div>

          {/* Win Rate Donut */}
          <div className="flex flex-col items-center">
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="5"
                  strokeDasharray={`${winRate} ${100 - winRate}`}
                  strokeDashoffset={0}
                  strokeLinecap="butt"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-base font-bold leading-none text-slate-900">
                  {winRate}%
                </span>
              </div>
            </div>
            <span className="mt-3 text-[11px] font-medium text-slate-500">
              Win Rate
            </span>
          </div>
        </div>

        {/* RIGHT: Legend List */}
        <div className="w-full min-w-0 flex-1 pt-2">
          {rows.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-100 py-3 text-xs last:border-b-0"
            >
              {/* Left: color + label */}
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-700">
                  {item.label}
                </span>
              </div>

              {/* Right: value */}
              <span className="text-right font-mono font-semibold text-slate-900">
                {item.label.toLowerCase() === "won" && item.value > 0 ? (
                  <>
                    {item.value}
                    <span className="mx-2 text-slate-300">·</span>
                    <span>{safeWonValueShort}</span>
                  </>
                ) : (
                  item.value
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}