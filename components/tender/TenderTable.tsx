"use client";

import { FileText, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  width?: string;
}

interface Row {
  id: string;
  cells: Record<string, ReactNode>;
}

interface Props {
  columns: Column[];
  rows: Row[];
  selectedId?: string | null;
  onRowClick?: (id: string) => void;
  moreCount?: number;
}

export function TenderTable({
  columns,
  rows,
  selectedId,
  onRowClick,
  moreCount = 0,
}: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-5 py-3 ${
                    c.align === "right" ? "text-right" : ""
                  }`}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const selected = selectedId === r.id;
              return (
                <tr
                  key={r.id}
                  onClick={() => onRowClick?.(r.id)}
                  className={`cursor-pointer transition-colors ${
                    selected
                      ? "bg-amber-50/60"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3 align-middle ${
                        c.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {r.cells[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {moreCount > 0 && (
        <button
          type="button"
          className="w-full border-t border-slate-100 px-5 py-2.5 text-left text-[11px] font-semibold text-[#b8860b] hover:bg-slate-50"
        >
          + Show more Tenders ({moreCount})
        </button>
      )}
    </section>
  );
}

/* ---------- Small building blocks used in cells ---------- */

export function TenderTypeBadge({ type }: { type: "eGP" | "RFQ" }) {
  const styles =
    type === "eGP"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${styles}`}
    >
      {type}
    </span>
  );
}

export function DocsStatusBadge({
  status,
}: {
  status: "In Progress" | "Pending" | "Done" | "Reviewing";
}) {
  const map = {
    "In Progress": "border-orange-200 bg-orange-50 text-orange-700",
    Pending: "border-rose-200 bg-rose-50 text-rose-700",
    Done: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Reviewing: "border-amber-200 bg-amber-50 text-amber-700",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${map[status]}`}
    >
      {status}
    </span>
  );
}

export function DeadlineCell({ days }: { days: number }) {
  return (
    <span
      className={`font-mono text-[11px] font-semibold ${
        days <= 3
          ? "text-rose-600"
          : days <= 7
            ? "text-orange-600"
            : "text-slate-700"
      }`}
    >
      {days} days
    </span>
  );
}

export function AttachmentIcon() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400">
      <FileText className="h-3.5 w-3.5" />
    </span>
  );
}

export function LinkIconCell() {
  return (
    <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-400" />
  );
}