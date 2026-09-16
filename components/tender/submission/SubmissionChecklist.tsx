"use client";

export interface ChecklistItem {
  id: string;
  label: string;
  value: string;
  tone: "neutral" | "progress" | "warn";
}

const TONE_STYLES: Record<ChecklistItem["tone"], string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  progress: "border-orange-200 bg-orange-50 text-orange-700",
  warn: "border-rose-200 bg-rose-50 text-rose-700",
};

interface Props {
  items: ChecklistItem[];
}

export function SubmissionChecklist({ items }: Props) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Submission Checklist
      </p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0"
          >
            <span className="text-[12px] font-medium text-slate-700">
              {item.label}
            </span>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${TONE_STYLES[item.tone]}`}
            >
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}