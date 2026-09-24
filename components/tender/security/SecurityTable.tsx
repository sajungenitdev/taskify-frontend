// components/tender/security/SecurityTable.tsx
"use client";

import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { EntityBadge, DocsBadge, BellIcon } from "./SecurityBadges";

import type { SecurityType } from "@/lib/api/tender.api";

export type { SecurityType };

import type { SecurityRowUI } from "@/lib/api/mappers";

export type SecurityRow = SecurityRowUI;

interface Props {
  rows: SecurityRow[];
  entities: string[];
  types: SecurityType[];
  onCreate?: (draft: SecurityRow) => void | Promise<void>;
  onUpdate?: (id: string, patch: Partial<SecurityRow>) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onNotify?: (id: string) => void;
  onEdit?: (id: string) => void;
  onSaveEdit?: (id: string, patch: Partial<SecurityRow>) => void | Promise<void>;
  onCancelEdit?: (id: string) => void;

  /* ----- NEW: per-action loading flags -----
   * The parent tracks which action is in flight for which row, and passes
   * those down so each button can disable itself independently.
   */
  savingId?: string | null; // draft save OR edit save
  deletingId?: string | null;
  notifyingId?: string | null;
}

export function SecurityTable({
  rows,
  entities,
  types,
  onCreate,
  onUpdate,
  onDelete,
  onNotify,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  savingId = null,
  deletingId = null,
  notifyingId = null,
}: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3 w-[100px]">Entity</th>
              <th className="px-4 py-3">Client / Description</th>
              <th className="px-4 py-3 w-[180px]">Type</th>
              <th className="px-4 py-3 w-[120px]">Amount</th>
              <th className="px-4 py-3 w-[130px]">Due Date</th>
              <th className="px-4 py-3 w-[120px]">Docs</th>
              <th className="px-4 py-3 w-[160px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              /* ----- Draft row ----- */
              if (r.isDraft) {
                return (
                  <DraftRow
                    key={r.id}
                    row={r}
                    entities={entities}
                    types={types}
                    saving={savingId === r.id}
                    onChange={(patch) => onUpdate?.(r.id, patch)}
                    onSave={() => onCreate?.(r)}
                    onCancel={() => onDelete?.(r.id)}
                  />
                );
              }

              /* ----- Edit row ----- */
              if (r.isEditing) {
                return (
                  <EditRow
                    key={r.id}
                    row={r}
                    entities={entities}
                    types={types}
                    saving={savingId === r.id}
                    onChange={(patch) => onUpdate?.(r.id, patch)}
                    onSave={() => onSaveEdit?.(r.id, r)}
                    onCancel={() => onCancelEdit?.(r.id)}
                  />
                );
              }

              /* ----- Static row ----- */
              const isSaving = savingId === r.id;
              const isDeleting = deletingId === r.id;
              const isNotifying = notifyingId === r.id;
              const rowBusy = isSaving || isDeleting || isNotifying;

              return (
                <tr
                  key={r.id}
                  className={`transition-colors ${rowBusy ? "bg-slate-50/60" : "hover:bg-slate-50/60"
                    }`}
                >
                  <td className="px-4 py-3">
                    <EntityBadge entity={r.entity} />
                  </td>
                  <td className="px-4 py-3 text-[12px] font-medium text-slate-700">
                    {r.clientDescription}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">
                    {r.type}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] font-semibold text-slate-800">
                    {r.currency}
                    {r.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">
                    {r.dueDate || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <DocsBadge status={r.docsStatus} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Notify Finance */}
                      <button
                        type="button"
                        onClick={() => onNotify?.(r.id)}
                        disabled={rowBusy}
                        className="rounded-md p-1.5 text-amber-500 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
                        title={isNotifying ? "Sending…" : "Notify Finance"}
                        aria-label="Notify Finance"
                      >
                        {isNotifying ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                        ) : (
                          <BellIcon tone="warn" />
                        )}
                      </button>

                      {/* Edit */}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(r.id)}
                          disabled={rowBusy}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDelete?.(r.id)}
                        disabled={rowBusy}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                        title={isDeleting ? "Deleting…" : "Delete"}
                        aria-label="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
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

/* ============================================================================
 * Draft row — inline create
 * ========================================================================== */
function DraftRow({
  row,
  entities,
  types,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  row: SecurityRow;
  entities: string[];
  types: SecurityType[];
  saving: boolean;
  onChange: (patch: Partial<SecurityRow>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const cellInput =
    "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:border-slate-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <tr className="bg-amber-50/40">
      <td className="px-4 py-3">
        <select
          className={cellInput}
          value={row.entity}
          onChange={(e) => onChange({ entity: e.target.value })}
          disabled={saving}
        >
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <input
          className={cellInput}
          placeholder="New client / description"
          value={row.clientDescription}
          onChange={(e) => onChange({ clientDescription: e.target.value })}
          disabled={saving}
        />
      </td>

      <td className="px-4 py-3">
        <select
          className={cellInput}
          value={row.type}
          onChange={(e) =>
            onChange({ type: e.target.value as SecurityType })
          }
          disabled={saving}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500">৳</span>
          <input
            type="number"
            min={0}
            className={`${cellInput} font-mono`}
            value={row.amount || ""}
            onChange={(e) =>
              onChange({ amount: Number(e.target.value) || 0 })
            }
            placeholder="0"
            disabled={saving}
          />
        </div>
      </td>

      <td className="px-4 py-3">
        <input
          type="date"
          className={cellInput}
          onChange={(e) => {
            const v = e.target.value;
            const formatted = v
              ? new Date(v).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              : "";
            onChange({ dueDate: formatted });
          }}
          disabled={saving}
        />
      </td>

      <td className="px-4 py-3">
        <DocsBadge status="Missing" />
      </td>

      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-[#a97400] px-2.5 text-[10px] font-semibold text-white hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ============================================================================
 * Edit row — inline update
 * ========================================================================== */
function EditRow({
  row,
  entities,
  types,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  row: SecurityRow;
  entities: string[];
  types: SecurityType[];
  saving: boolean;
  onChange: (patch: Partial<SecurityRow>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const cellInput =
    "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:border-slate-900 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

  const toDateInputValue = (display: string) => {
    if (!display) return "";
    const d = new Date(display);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <tr className="bg-sky-50/40">
      <td className="px-4 py-3">
        <select
          className={cellInput}
          value={row.entity}
          onChange={(e) => onChange({ entity: e.target.value })}
          disabled={saving}
        >
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <input
          className={cellInput}
          placeholder="Client / description"
          value={row.clientDescription}
          onChange={(e) => onChange({ clientDescription: e.target.value })}
          disabled={saving}
        />
      </td>

      <td className="px-4 py-3">
        <select
          className={cellInput}
          value={row.type}
          onChange={(e) =>
            onChange({ type: e.target.value as SecurityType })
          }
          disabled={saving}
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500">৳</span>
          <input
            type="number"
            min={0}
            className={`${cellInput} font-mono`}
            value={row.amount || ""}
            onChange={(e) =>
              onChange({ amount: Number(e.target.value) || 0 })
            }
            placeholder="0"
            disabled={saving}
          />
        </div>
      </td>

      <td className="px-4 py-3">
        <input
          type="date"
          className={cellInput}
          defaultValue={toDateInputValue(row.dueDate)}
          onChange={(e) => {
            const v = e.target.value;
            const formatted = v
              ? new Date(v).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              : "";
            onChange({ dueDate: formatted });
          }}
          disabled={saving}
        />
      </td>

      <td className="px-4 py-3">
        <select
          className={cellInput}
          value={row.docsStatus}
          onChange={(e) =>
            onChange({
              docsStatus: e.target.value as "Attached" | "Missing",
            })
          }
          disabled={saving}
        >
          <option value="Attached">Attached</option>
          <option value="Missing">Missing</option>
        </select>
      </td>

      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-600 px-2.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            title="Save changes"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            title="Cancel"
          >
            <X className="h-3 w-3" />
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}