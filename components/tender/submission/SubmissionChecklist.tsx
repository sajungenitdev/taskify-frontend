// components/tender/submission/SubmissionChecklist.tsx
"use client";

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  isCustom?: boolean;
}

interface Props {
  items: ChecklistItem[];
  onToggle?: (id: string, checked: boolean) => void;
}

export function SubmissionChecklist({ items, onToggle }: Props) {
  const done = items.filter((i) => i.checked).length;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Submission Checklist
        </p>
        <span className="text-[10px] font-semibold text-slate-400">
          {done}/{items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
          No checklist items yet.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={item.checked}
                  onChange={(e) => onToggle?.(item.id, e.target.checked)}
                  disabled={!onToggle}
                />
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${item.checked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300 bg-white"
                    }`}
                >
                  {item.checked && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2.5 w-2.5 fill-none stroke-current stroke-2"
                    >
                      <path d="M2 6l3 3 5-6" />
                    </svg>
                  )}
                </span>
                <span
                  className={`flex-1 text-[11px] ${item.checked
                      ? "text-slate-500 line-through"
                      : "text-slate-700"
                    }`}
                >
                  {item.label}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}