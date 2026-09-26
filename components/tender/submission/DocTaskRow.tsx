// components/tender/submission/DocTaskRow.tsx
"use client";

import { FileText, Trash2, Upload, X, Check, Loader2 } from "lucide-react";
import { useRef } from "react";
import type {
  SubmissionDocTask,
  DocTaskStatus,
} from "@/lib/api/tender.api";

/** Alias for the canonical status union in tender.api.ts */
export type DocStatus = DocTaskStatus;

/** Extends the API shape (SubmissionDocTask) with component-only fields. */
export interface DocTask extends SubmissionDocTask {
  isDraft?: boolean;
  /** A file queued for upload — only set in draft state */
  pendingFile?: File | null;
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
  onUploadFile?: (file: File) => void;
}

export function DocTaskRow({
  task,
  onChange,
  onSave,
  onCancel,
  onRemove,
  onUploadFile,
}: Props) {
  if (task.isDraft) {
    return (
      <DraftRow
        task={task}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
        onRemove={onRemove}
      />
    );
  }

  /* ---------- Static one-line row ---------- */
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
      {/* Icon */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400">
        <FileText className="h-3.5 w-3.5" />
      </span>

      {/* Title */}
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-800">
        {task.title || "Untitled task"}
      </span>

      {/* Owner */}
      <span className="w-[130px] shrink-0 truncate text-[11px] text-slate-500">
        {task.owner || "—"}
      </span>

      {/* File name */}
      <span className="w-[160px] shrink-0 truncate font-mono text-[10px] text-slate-400">
        {task.fileName || "—"}
      </span>

      {/* Status pill */}
      <span
        className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-[10px] font-bold ${STATUS_BADGE[task.status]
          }`}
      >
        {task.status === "Done" && <Check className="h-3 w-3" />}
        {task.status === "In Progress" && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        {task.status}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {task.status === "Done" && task.fileUrl && (
          <a
            href={task.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
          >
            View
          </a>
        )}
        {task.status === "In Progress" && (
          <label className="inline-flex h-7 cursor-pointer items-center rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50">
            Replace
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && onUploadFile) onUploadFile(f);
              }}
            />
          </label>
        )}
        {task.status === "Pending" && (
          <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-[#a97400] px-2.5 text-[10px] font-semibold text-white hover:bg-[#8f6100]">
            + Upload
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && onUploadFile) onUploadFile(f);
              }}
            />
          </label>
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

/* ============================================================
 * Draft row — single-line, no status dropdown
 * ============================================================ */
function DraftRow({
  task,
  onChange,
  onSave,
  onCancel,
  onRemove,
}: {
  task: DocTask;
  onChange?: (patch: Partial<DocTask>) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onRemove?: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFile = task.pendingFile ?? null;

  // Status is auto-derived from file state — no manual dropdown
  const computedStatus: DocStatus = pendingFile
    ? "In Progress"
    : task.fileUrl
      ? "Done"
      : "Pending";

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
      {/* Icon */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-amber-300 bg-amber-50 text-amber-600">
        <FileText className="h-3.5 w-3.5" />
      </span>

      {/* Title */}
      <input
        type="text"
        placeholder="Document type, title (e.g. Commercial Documents)"
        value={task.title}
        onChange={(e) => onChange?.({ title: e.target.value })}
        className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-[12px] font-medium text-slate-800 placeholder:text-slate-400 hover:border-slate-200 focus:border-[#a97400] focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-200"
      />

      {/* Owner (auto-filled from logged-in user; still editable) */}
      <input
        type="text"
        placeholder="Owner"
        value={task.owner}
        onChange={(e) => onChange?.({ owner: e.target.value })}
        className="w-[130px] shrink-0 rounded-md border border-transparent bg-transparent px-2 py-1 text-[11px] text-slate-600 placeholder:text-slate-400 hover:border-slate-200 focus:border-[#a97400] focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-200"
      />

      {/* File picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          onChange?.({ pendingFile: f ?? null });
        }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex h-7 w-[160px] shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        title={pendingFile ? pendingFile.name : "Choose a file"}
      >
        {pendingFile ? (
          <FileText className="h-3 w-3 shrink-0 text-amber-600" />
        ) : (
          <Upload className="h-3 w-3 shrink-0 text-slate-400" />
        )}
        <span className="truncate">
          {pendingFile ? pendingFile.name : "Choose a file"}
        </span>
        {pendingFile && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange?.({ pendingFile: null });
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange?.({ pendingFile: null });
                if (fileInputRef.current)
                  fileInputRef.current.value = "";
              }
            }}
            className="ml-auto rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Remove file"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Auto-computed status pill */}
      <span
        className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-[10px] font-bold ${STATUS_BADGE[computedStatus]
          }`}
      >
        {computedStatus === "Done" && <Check className="h-3 w-3" />}
        {computedStatus === "In Progress" && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        {computedStatus}
      </span>

      {/* Actions */}
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