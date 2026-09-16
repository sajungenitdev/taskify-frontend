"use client";

import { ReadinessBar } from "./ReadinessBar";

export interface SubmissionRow {
  id: string;
  tenderer: string;
  mode: string;
  submitted: "Submitted" | "Not yet";
  status: string;
  statusColor:
    | "in-progress"    // orange
    | "pending"        // rose
    | "complete"       // emerald
    | "banking";       // amber
  readiness: number;
}

const STATUS_STYLES: Record<SubmissionRow["statusColor"], string> = {
  "in-progress": "text-orange-700",
  pending: "text-rose-700",
  complete: "text-emerald-700",
  banking: "text-amber-700",
};

interface Props {
  rows: SubmissionRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SubmissionTable({ rows, selectedId, onSelect }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Tenderer</th>
              <th className="px-5 py-3">Mode</th>
              <th className="px-5 py-3">Submitted</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Readiness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const selected = selectedId === r.id;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={`cursor-pointer transition-colors ${
                    selected ? "bg-amber-50/60" : "hover:bg-slate-50/70"
                  }`}
                >
                  <td className="px-5 py-3 text-[12px] font-semibold text-slate-800">
                    {r.tenderer}
                  </td>
                  <td className="px-5 py-3 text-[12px] text-slate-600">
                    {r.mode}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[12px] font-semibold ${
                        r.submitted === "Submitted"
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {r.submitted}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[12px] font-semibold ${
                        STATUS_STYLES[r.statusColor]
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <ReadinessBar percent={r.readiness} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}