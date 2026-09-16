"use client";

import { ArrowRight } from "lucide-react";

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
}

export function ImportBar({
  selectedCount,
  targets,
  value,
  onChangeTarget,
  onImport,
}: Props) {
  if (selectedCount === 0) return null;

  // Group by "Potential" / "Submission"
  const potential = targets.filter((t) => t.group === "Potential");
  const submission = targets.filter((t) => t.group === "Submission");

  return (
    <div className="sticky bottom-4 z-30 mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 shadow-2xl">
      <span className="text-[12px] font-semibold text-white">
        {selectedCount} document{selectedCount === 1 ? "" : "s"} selected
      </span>

      <select
        value={value ?? ""}
        onChange={(e) => onChangeTarget(e.target.value)}
        className="h-9 min-w-[280px] rounded-lg border border-slate-700 bg-white px-3 text-xs font-medium text-slate-900 focus:border-slate-500 focus:outline-none"
      >
        <option value="">Import to tender…</option>
        <optgroup label="Potential">
          {potential.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Submission">
          {submission.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </optgroup>
      </select>

      <button
        type="button"
        onClick={onImport}
        disabled={!value}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Import Selected
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}