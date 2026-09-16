// components/tender/documents/ImportBar.tsx
"use client";

import { ArrowRight, Loader2, X } from "lucide-react";

export interface ImportTarget {
  id: string;
  label: string;
  group: "Potential" | "Submission";
}

interface Props {
  selectedCount: number;
  targets: ImportTarget[];
  value: string | null;
  onChangeTarget: (id: string) => void;
  onImport: () => void;
  onClearSelection?: () => void;
  importing?: boolean;
}

export function ImportBar({
  selectedCount,
  targets,
  value,
  onChangeTarget,
  onImport,
  onClearSelection,
  importing = false,
}: Props) {
  if (selectedCount === 0) return null;

  const potential = targets.filter((t) => t.group === "Potential");
  const submission = targets.filter((t) => t.group === "Submission");
  const hasTargets = targets.length > 0;

  return (
    <div className="sticky bottom-4 z-30 mx-auto flex container flex-wrap items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 shadow-2xl">
      <span className="text-[12px] font-semibold text-white">
        {selectedCount} document{selectedCount === 1 ? "" : "s"} selected
      </span>

      {onClearSelection && (
        <button
          type="button"
          onClick={onClearSelection}
          disabled={importing}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 text-[10px] font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}

      <select
        value={value ?? ""}
        onChange={(e) => onChangeTarget(e.target.value)}
        disabled={importing || !hasTargets}
        className="h-9 min-w-[280px] rounded-lg border border-slate-700 bg-white px-3 text-xs font-medium text-slate-900 focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {hasTargets ? "Import to tender…" : "No tenders available"}
        </option>
        {potential.length > 0 && (
          <optgroup label="Potential">
            {potential.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
        )}
        {submission.length > 0 && (
          <optgroup label="Submission">
            {submission.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <button
        type="button"
        onClick={onImport}
        disabled={!value || importing}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {importing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Importing…
          </>
        ) : (
          <>
            Import Selected
            <ArrowRight className="h-3.5 w-3.5" />
          </>
        )}
      </button>
    </div>
  );
}