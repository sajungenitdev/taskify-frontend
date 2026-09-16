// components/tender/TenderTable.tsx
"use client";

import { ExternalLink, Eye, FileText, Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

/* ============================================================
 * Types
 * ============================================================ */

interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  width?: string;
}

interface Row {
  id: string;
  cells: Record<string, ReactNode>;
  /** Optional flag — disables row click and dims the row */
  disabled?: boolean;
}

interface Props {
  columns: Column[];
  rows: Row[];
  selectedId?: string | null;
  onRowClick?: (id: string) => void;
  moreCount?: number;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;   // ← new
  toolbar?: ReactNode;
}

/* ============================================================
 * Main table
 * ============================================================ */

export function TenderTable({
  columns,
  rows,
  selectedId,
  onRowClick,
  moreCount = 0,
  onDelete,
  onEdit,
  onView,
  toolbar,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const collapsedLimit = moreCount > 0 ? rows.length - moreCount : rows.length;
  const visibleRows = expanded ? rows : rows.slice(0, collapsedLimit);
  const hiddenCount = moreCount > 0 && !expanded ? moreCount : 0;

  const hasActions = Boolean(onDelete || onView || onEdit);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {toolbar && (
        <div className="border-b border-slate-100 px-5 py-3">{toolbar}</div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-5 py-3 ${c.align === "right" ? "text-right" : ""
                    }`}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.label}
                </th>
              ))}

              {hasActions && (
                <th className="w-[90px] px-5 py-3 text-right">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((r) => {
              const selected = selectedId === r.id;
              const disabled = !!r.disabled;
              return (
                <tr
                  key={r.id}
                  onClick={() => {
                    if (disabled) return;
                    onRowClick?.(r.id);
                  }}
                  className={`transition-colors ${disabled ? "opacity-60" : "cursor-pointer"
                    } ${selected ? "bg-amber-50/60" : "hover:bg-slate-50/70"
                    }`}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-5 py-3 align-middle ${c.align === "right" ? "text-right" : ""
                        }`}
                    >
                      {r.cells[c.key]}
                    </td>
                  ))}

                  {hasActions && (
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onView(r.id);
                            }}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {onEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(r.id);
                            }}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(r.id);
                            }}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
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

            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-5 py-10 text-center text-[12px] text-slate-400"
                >
                  No records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {moreCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="w-full border-t border-slate-100 px-5 py-2.5 text-left text-[11px] font-semibold text-[#b8860b] hover:bg-slate-50"
        >
          {expanded
            ? "− Show fewer Tenders"
            : `+ Show more Tenders (${hiddenCount})`}
        </button>
      )}
    </section>
  );
}

/* ============================================================
 * Small building blocks used in cells
 * ============================================================ */

export function TenderTypeBadge({
  type,
}: {
  type: "eGP" | "RFQ" | "Hardcopy Ref.";
}) {
  const styles =
    type === "eGP"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : type === "RFQ"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";
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
  status?: string;
}) {
  const map: Record<string, string> = {
    "Docs pending": "border-rose-200 bg-rose-50 text-rose-700",
    "Docs in progress": "border-orange-200 bg-orange-50 text-orange-700",
    Complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Banking docs pending": "border-amber-200 bg-amber-50 text-amber-700",
  };

  const label = status?.trim() || "Docs pending";
  const styles =
    map[label] ?? "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

export function DeadlineCell({ days }: { days: number }) {
  return (
    <span
      className={`font-mono text-[11px] font-semibold ${days <= 3
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


export function LinkIconCell() {
  return <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-400" />;
}