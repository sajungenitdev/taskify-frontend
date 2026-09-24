// components/tender/submission/SubmissionTable.tsx
"use client";

import { Trash2, Eye } from "lucide-react";
import { ReadinessBar } from "./ReadinessBar";

export interface SubmissionRow {
  id: string;
  tenderer: string;
  mode: string;
  submitted: "Submitted" | "Not yet";
  status: string;
  statusColor:
    | "in-progress"
    | "pending"
    | "complete"
    | "banking";
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
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export function SubmissionTable({
  rows,
  selectedId,
  onSelect,
  onDelete,
  onView,
}: Props) {
  const hasActions = Boolean(onDelete || onView);

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
              {hasActions && (
                <th className="w-[90px] px-5 py-3 text-right">Actions</th>
              )}
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

                  {hasActions && (
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">

                        {onDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(r.id);
                            }}
                            className="rounded-md cursor-pointer p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5 + (hasActions ? 1 : 0)}
                  className="px-5 py-10 text-center text-[12px] text-slate-400"
                >
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}