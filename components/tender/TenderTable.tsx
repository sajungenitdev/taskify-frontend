// components/tender/TenderTable.tsx
"use client";

import {
  ClipboardIcon,
  ExternalLink,
  Pencil,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

/* ============================================================
 * Types
 * ============================================================ */

interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  width?: string;
  /** Enable sorting on this column. Default: true */
  sortable?: boolean;
}

interface Row {
  id: string;
  cells: Record<string, ReactNode>;
  disabled?: boolean;
  /** Raw searchable string(s) — used by the built-in search bar */
  searchText?: string;
  /** Raw sortable value(s) — used by column sorting */
  sortValues?: Record<string, string | number | null | undefined>;
}

interface Props {
  columns: Column[];
  rows: Row[];
  selectedId?: string | null;
  onRowClick?: (id: string) => void;

  /* Actions */
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  showActions?: boolean;

  toolbar?: ReactNode;

  /* ---------- Search + Pagination ---------- */
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  hidePagination?: boolean;

  /* ---------- Page-size selector ---------- */
  pageSizeOptions?: number[];

  /* ---------- Sorting ---------- */
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
}

/* ============================================================
 * Main table
 * ============================================================ */

export function TenderTable({
  columns,
  rows,
  selectedId,
  onRowClick,
  onDelete,
  onEdit,
  onView,
  showActions = false,
  toolbar,

  searchable = false,
  searchPlaceholder = "Search…",
  pageSize,
  hidePagination = false,
  pageSizeOptions = [10, 25, 50, 80, 100],

  defaultSortKey,
  defaultSortDir = "desc",
}: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const initialSize = pageSize ?? pageSizeOptions[0] ?? 10;
  const [size, setSize] = useState<number>(initialSize);

  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);

  /* ---------- Search filter ---------- */
  const filtered = useMemo(() => {
    if (!searchable) return rows;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      if (r.searchText) return r.searchText.toLowerCase().includes(q);
      return Object.values(r.cells)
        .filter((v) => typeof v === "string" || typeof v === "number")
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, query, searchable]);

  /* ---------- Sort ---------- */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a.sortValues?.[sortKey];
      const bv = b.sortValues?.[sortKey];

      const aMissing = av === undefined || av === null || av === "";
      const bMissing = bv === undefined || bv === null || bv === "";
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [query, rows.length, size, sortKey, sortDir]);

  /* ---------- Pagination math ---------- */
  const total = sorted.length;
  const paginate = !hidePagination && size > 0;
  const totalPages = paginate ? Math.max(1, Math.ceil(total / size)) : 1;
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIdx = paginate ? (safePage - 1) * size : 0;
  const endIdx = paginate ? startIdx + size : total;
  const visibleRows = sorted.slice(startIdx, endIdx);

  const hasActions =
    showActions && Boolean(onDelete || onView || onEdit);

  const showToolbar = toolbar || searchable || paginate;
  const showFooter = paginate && total > 0;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* ============ TOOLBAR ============ */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {toolbar ? <div>{toolbar}</div> : null}

            {searchable && (
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[12px] text-slate-800 placeholder:text-slate-400 transition focus:border-[#a97400] focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {paginate && (
            <div className="flex shrink-0 items-center gap-2">
              <label
                htmlFor="tender-page-size"
                className="text-[11px] font-semibold text-slate-500"
              >
                Show
              </label>
              <select
                id="tender-page-size"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-[12px] font-semibold text-slate-700 transition focus:border-[#a97400] focus:outline-none focus:ring-2 focus:ring-amber-300/40"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ============ TABLE ============ */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {columns.map((c) => {
                const sortable = c.sortable !== false;
                const isSorted = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    className={`px-5 py-3 ${c.align === "right" ? "text-right" : ""
                      }`}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(c.key)}
                        className={`inline-flex items-center gap-1 transition hover:text-slate-700 ${c.align === "right" ? "flex-row-reverse" : ""
                          } ${isSorted ? "text-slate-700" : ""}`}
                        title={`Sort by ${c.label}`}
                      >
                        {c.label}
                        {isSorted ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <span>{c.label}</span>
                    )}
                  </th>
                );
              })}

              {hasActions && (
                <th className="w-[110px] px-5 py-3 text-right">Actions</th>
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
                            <ClipboardIcon className="h-3.5 w-3.5" />
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
                  {searchable && query
                    ? `No results for "${query}".`
                    : "No records yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============ PAGINATION FOOTER ============ */}
      {showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 px-5 py-3">
          <p className="text-[11px] text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {startIdx + 1}
            </span>
            –{" "}
            <span className="font-semibold text-slate-700">{endIdx}</span>{" "}
            of <span className="font-semibold text-slate-700">{total}</span>
            {query && searchable && (
              <span className="ml-1 text-slate-400">
                (filtered from {rows.length})
              </span>
            )}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            <div className="hidden items-center gap-0.5 sm:flex">
              {(() => {
                const pages: (number | "…")[] = [];
                const add = (n: number | "…") => pages.push(n);
                const last = totalPages;

                if (last <= 7) {
                  for (let i = 1; i <= last; i++) add(i);
                } else {
                  add(1);
                  if (safePage > 3) add("…");
                  const from = Math.max(2, safePage - 1);
                  const to = Math.min(last - 1, safePage + 1);
                  for (let i = from; i <= to; i++) add(i);
                  if (safePage < last - 2) add("…");
                  add(last);
                }

                return pages.map((p, idx) =>
                  p === "…" ? (
                    <span
                      key={`gap-${idx}`}
                      className="px-1.5 text-[11px] text-slate-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition ${p === safePage
                          ? "bg-[#a97400] text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      {p}
                    </button>
                  ),
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
 * Small building blocks
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

export function DocsStatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    "Docs pending": "border-rose-200 bg-rose-50 text-rose-700",
    "Docs in progress": "border-orange-200 bg-orange-50 text-orange-700",
    Complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Banking docs pending": "border-amber-200 bg-amber-50 text-amber-700",
  };

  const label = status?.trim() || "Docs pending";
  const styles = map[label] ?? "border-slate-200 bg-slate-50 text-slate-600";

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

/* ✅ NEW — Auto-discovered badge for crawler-sourced tenders */
export function AutoDiscoveredBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-[#f4ead6] px-2 py-0.5 text-[10px] font-bold text-[#8a6a2b]"
      title="Automatically discovered by the crawler"
    >
      <span aria-hidden className="text-[11px] leading-none">
        🤖
      </span>
      Auto-discovered
    </span>
  );
}