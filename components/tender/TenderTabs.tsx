"use client";

export type TenderTab = "potential" | "active" | "submitted" | "lost";

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
];

export function TenderTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200">
      <div className="flex items-center gap-1">
        {TABS.map((t) => {
          const isActive = active === t.id;
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
              <span>{t.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {counts[t.id]}
              </span>
              {isActive && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#a97400]" />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="hidden text-[11px] font-semibold text-[#b8860b] hover:underline sm:block"
      >
        Site Directory
      </button>
    </div>
  );
}