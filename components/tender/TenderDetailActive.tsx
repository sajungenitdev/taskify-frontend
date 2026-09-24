// components/tender/TenderDetailActive.tsx
"use client";

import { ClipboardList } from "lucide-react";
import type { TenderDetailData } from "./TenderDetailReview";

export interface ActiveTenderDetail extends TenderDetailData {
  deadlineDays: number;
  value?: string;
  docStatus: "In Progress" | "Pending" | "Done" | "Reviewing";
  documentTasks: string;
  checklist?: { id: string; label: string; checked: boolean; isCustom?: boolean }[];
}

interface Props {
  data: ActiveTenderDetail;
  onSubmit?: () => void;
}

export function TenderDetailActive({ data, onSubmit }: Props) {
  const checklist = data.checklist ?? [];

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          {data.tenderer} — {data.title}
        </h2>
        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${data.docStatus === "Done"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : data.docStatus === "Pending"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : data.docStatus === "Reviewing"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-orange-200 bg-orange-50 text-orange-700"
            }`}
        >
          {data.docStatus}
        </span>
        {onSubmit && (                                  /* ← NEW */
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#a97400] px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8f6100]"
            >
              Go To Submission →
            </button>
          )}
      </div>

      <div className="grid grid-cols-1 gap-8 px-5 py-4 lg:grid-cols-2">
        {/* Left column — details */}
        <div className="space-y-0">
          <Row label="Type" value={data.tenderType} />
          <Row
            label="Deadline"
            value={
              <span
                className={`font-mono text-[12px] font-semibold ${data.deadlineDays <= 3
                  ? "text-rose-600"
                  : data.deadlineDays <= 7
                    ? "text-orange-600"
                    : "text-slate-700"
                  }`}
              >
                {data.deadlineDays} days
              </span>
            }
          />
          {data.value && <Row label="Value" value={data.value} />}
          <Row label="Responsible" value={data.responsiblePerson} />
          <Row label="Document Tasks" value={data.documentTasks} />
        </div>

        {/* Right column — checklist */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <ClipboardList className="h-3 w-3" />
            Submission Checklist
          </p>

          {checklist.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-[11px] text-slate-400">
              No checklist items yet.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                >
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
                    className={`text-[11px] ${item.checked
                      ? "text-slate-500 line-through"
                      : "text-slate-700"
                      }`}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      <span className="text-[12px] font-medium text-slate-800">{value}</span>
    </div>
  );
}