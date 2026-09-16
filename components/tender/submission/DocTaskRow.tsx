"use client";

import { FileText, Trash2 } from "lucide-react";

export type DocStatus = "Done" | "In Progress" | "Pending";

export interface DocTask {
  id: string;
  title: string;
  owner: string;
  fileName: string;
  status: DocStatus;
  /** true if this row is a new entry not yet persisted */
  isDraft?: boolean;
}

const STATUS_BADGE: Record<DocStatus, string> = {
  Done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "In Progress": "border-orange-200 bg-orange-50 text-orange-700",
  Pending: "border-rose-200 bg-rose-50 text-rose-700",
};

interface Props {
  task: DocTask;
  onChange?: (patch: Partial<DocTask>) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
}

export function DocTaskRow({
  task,
  onChange,
  onSave,
  onCancel,
  onRemove,
}: Props) {
  /* ---------- Draft (editable) row ---------- */
  if (task.isDraft) {
    return (
      <div className="flex flex-col gap-2 border-b border-slate-100 py-3.5 last:border-0 sm:flex-row sm:items-center sm:gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed border-amber-300 bg-amber-50 text-amber-600">
          <FileText className="h-3.5 w-3.5" />
        </span>

        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="text"
            placeholder="Task title (e.g. Commercial Documents)"
            value={task.title}
            onChange={(e) => onChange?.({ title: e.target.value })}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:border-slate-900 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Owner (e.g. Finance — Reza)"
            value={task.owner}
            onChange={(e) => onChange?.({ owner: e.target.value })}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:border-slate-900 focus:outline-none"
          />
          <select
            value={task.status}
            onChange={(e) =>
              onChange?.({ status: e.target.value as DocStatus })
            }
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:border-slate-900 focus:outline-none"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        <div className="flex shrink-0 items-center gap-1">
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
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove"
            className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Static row (unchanged from before) ---------- */
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3.5 last:border-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400">
          <FileText className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-slate-800">
            {task.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {task.owner}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
            {task.fileName}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[task.status]}`}
        >
          {task.status}
        </span>

        {task.status === "Done" && (
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            View
          </button>
        )}
        {task.status === "In Progress" && (
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            Replace
          </button>
        )}
        {task.status === "Pending" && (
          <button
            type="button"
            className="inline-flex h-7 items-center gap-1 rounded-md bg-[#a97400] px-2.5 text-[10px] font-semibold text-white hover:bg-[#8f6100]"
          >
            + Upload
          </button>
        )}

        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove task"
          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}