// components/tender/TenderDetailLost.tsx
"use client";

import { ClipboardList } from "lucide-react";

export interface LostTenderDetail {
  id: string;
  tenderer: string;
  title: string;
  bidValue?: string;
  disqualificationReason?: string;
  lowestCompliantBidder?: string;
  lowestCompliantValue?: string;
  checklist?: { id: string; label: string; checked: boolean; isCustom?: boolean }[];
}

interface Props {
  data: LostTenderDetail;
}

export function TenderDetailLost({ data }: Props) {
  const checklist = data.checklist ?? [];

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          {data.tenderer} — {data.title}
        </h2>
        {data.disqualificationReason && (
          <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
            Disqualified
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 px-5 py-3 lg:grid-cols-2">
        {/* Left — outcome details */}
        <div className="space-y-0">
          {data.bidValue && <Row label="Our Bid Value" value={data.bidValue} />}
          {data.disqualificationReason && (
            <Row
              label="Disqualification Reason"
              value={
                <span className="text-[11px] text-slate-600">
                  {data.disqualificationReason}
                </span>
              }
            />
          )}
          {data.lowestCompliantBidder && (
            <Row
              label="Lowest Compliant Bid (Winner)"
              value={
                <span>
                  <span className="font-semibold text-slate-800">
                    {data.lowestCompliantBidder}
                  </span>
                  {data.lowestCompliantValue && (
                    <span className="ml-2 font-mono text-[11px] text-[#a97400]">
                      — {data.lowestCompliantValue}
                    </span>
                  )}
                </span>
              }
            />
          )}
        </div>

        {/* Right — checklist */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <ClipboardList className="h-3 w-3" />
            Submission Checklist
          </p>

          {checklist.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
              No checklist items.
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
                        ? "text-slate-500 "
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
      <span className="text-[12px]">{value}</span>
    </div>
  );
}