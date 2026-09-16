"use client";

import { EntityBadge, DocsBadge, BellIcon } from "./SecurityBadges";

export type SecurityType =
  | "Tender Security"
  | "Performance Security"
  | "Bank Guarantee";

export interface SecurityRow {
  id: string;
  entity: string;
  clientDescription: string;
  type: SecurityType;
  amount: number;
  currency: string;         // "৳"
  dueDate: string;          // "20 Oct 2026" or "" for drafts
  docsStatus: "Attached" | "Missing";
  /** true when this row is a draft being edited in the table footer */
  isDraft?: boolean;
}

interface Props {
  rows: SecurityRow[];
  entities: string[];
  types: SecurityType[];
  onCreate?: (draft: SecurityRow) => void | Promise<void>;
  onUpdate?: (id: string, patch: Partial<SecurityRow>) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}

export function SecurityTable({
  rows,
  entities,
  types,
  onCreate,
  onUpdate,
  onDelete,
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
              <th className="px-4 py-3 w-[60px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) =>
              r.isDraft ? (
                <DraftRow
                  key={r.id}
                  row={r}
                  entities={entities}
                  types={types}
                  onChange={(patch) => onUpdate?.(r.id, patch)}
                  onSave={() => onCreate?.(r)}
                  onCancel={() => onDelete?.(r.id)}
                />
              ) : (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/60"
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
                  <td className="px-4 py-3 text-right">
                    <BellIcon tone="warn" />
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============================================================================
 * Inline draft row (bottom of table) — edit + save + cancel
 * ========================================================================== */
function DraftRow({
  row,
  entities,
  types,
  onChange,
  onSave,
  onCancel,
}: {
  row: SecurityRow;
  entities: string[];
  types: SecurityType[];
  onChange: (patch: Partial<SecurityRow>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const cellInput =
    "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:border-slate-900 focus:outline-none";

  return (
    <tr className="bg-amber-50/40">
      {/* Entity */}
      <td className="px-4 py-3">
        <select
          className={cellInput}
          value={row.entity}
          onChange={(e) => onChange({ entity: e.target.value })}
        >
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </td>

      {/* Description */}
      <td className="px-4 py-3">
        <input
          className={cellInput}
          placeholder="New client / description"
          value={row.clientDescription}
          onChange={(e) => onChange({ clientDescription: e.target.value })}
        />
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <select
          className={cellInput}
          value={row.type}
          onChange={(e) =>
            onChange({ type: e.target.value as SecurityType })
          }
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </td>

      {/* Amount */}
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
          />
        </div>
      </td>

      {/* Due Date */}
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
        />
      </td>

      {/* Docs status (read-only "Missing" pill until saved) */}
      <td className="px-4 py-3">
        <DocsBadge status="Missing" />
      </td>

      {/* Save / Cancel */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-7 items-center rounded-md bg-[#a97400] px-2.5 text-[10px] font-semibold text-white hover:bg-[#8f6100]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}