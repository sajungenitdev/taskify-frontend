"use client";

export type DocsTab =
  | "legal"
  | "profiles"
  | "experience"
  | "certificates";

interface Props {
  active: DocsTab;
  counts: Record<DocsTab, number>;
  onChange: (tab: DocsTab) => void;
}

const TABS: { id: DocsTab; label: string }[] = [
  { id: "legal", label: "Legal Docs" },
  { id: "profiles", label: "Company Profiles" },
  { id: "experience", label: "Work Experience" },
  { id: "certificates", label: "Partnership Certificates" },
];

export function DocsTabs({ active, counts, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-slate-200">
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
            {t.label}
            {counts[t.id] > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {counts[t.id]}
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