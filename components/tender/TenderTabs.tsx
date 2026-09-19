// components/tender/TenderTabs.tsx
"use client";

export type TenderTab =
  | "potential"
  | "active"
  | "submitted"
  | "lost"
  | "won"
  | "drafts";

interface Props {
  active: TenderTab;
  counts: Record<TenderTab, number>;
  onChange: (tab: TenderTab) => void;
}

const TABS: { id: TenderTab; label: string }[] = [
  { id: "potential", label: "Potential" },
  { id: "active", label: "Active" },
  { id: "submitted", label: "Submitted" },
  { id: "lost", label: "Lost" },
  { id: "won", label: "Won" },
  { id: "drafts", label: "Drafts" },
];

export function TenderTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-200">
      {TABS.map((t) => {
        const isActive = active === t.id;
        const count = counts[t.id] ?? 0;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-colors ${
              isActive
                ? "text-slate-900"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#a97400]" />
            )}
          </button>
        );
      })}
    </div>
  );
}