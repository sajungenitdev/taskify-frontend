// components/tender/submission/SubmissionChecklist.tsx
"use client";

export interface ChecklistItem {
  id: string;
  label: string;
  /** Display text inside the pill — e.g. "N/A", "In progress", "6 days remaining" */
  value?: string;
  /** Pill color */
  tone?: "neutral" | "progress" | "warn";
  /* These are optional — used by the Manage page's editable checklist */
  checked?: boolean;
  isCustom?: boolean;
}

interface Props {
  items: ChecklistItem[];
  onToggle?: (id: string, checked: boolean) => void;
}

const TONE_STYLES: Record<"neutral" | "progress" | "warn", string> = {
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
  progress: "border-orange-200 bg-orange-50 text-orange-700",
  warn: "border-rose-200 bg-rose-50 text-rose-700",
};

export function SubmissionChecklist({ items }: Props) {
  /* No onToggle here — the submission page renders this read-only.
   * Checked state is computed on the backend from doc-task statuses
   * and the deadline, so it doesn't need to be toggled by the user. */

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Submission Checklist
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
          No checklist items yet.
        </div>
      ) : (
        <ul>
          {items.map((item, idx) => {
            const value = item.value ?? (item.checked ? "Done" : "Pending");
            const tone: "neutral" | "progress" | "warn" =
              item.tone ??
              (item.checked ? "progress" : "warn");

            return (
              <li
                key={item.id}
                className={`flex items-center justify-between py-3 ${idx < items.length - 1 ? "border-b border-slate-100" : ""
                  }`}
              >
                <span className="text-[12px] font-medium text-slate-700">
                  {item.label}
                </span>
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-semibold ${TONE_STYLES[tone]}`}
                >
                  {value}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}