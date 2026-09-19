// components/tender/TenderDetailSubmitted.tsx
"use client";

import { FileText, ClipboardList } from "lucide-react";

export interface SubmittedTenderDetail {
  id: string;
  tenderer: string;
  title: string;
  bidValue: string;
  tenderSecurity?: string;
  performanceSecurity?: string;
  documentsSubmitted: { name: string; url?: string }[];
  otherParticipants: { bidder: string; value: string; isUs?: boolean }[];
  checklist?: {
    id: string;
    label: string;
    checked: boolean;
    isCustom?: boolean;
  }[];
}

interface Props {
  data: SubmittedTenderDetail;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
}

function fullFileUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export function TenderDetailSubmitted({
  data,
  onMarkWon,
  onMarkLost,
}: Props) {
  const checklist = data.checklist ?? [];

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          {data.tenderer} — {data.title}
        </h2>
        {(onMarkWon || onMarkLost) && (
          <div className="flex items-center gap-2">
            {onMarkWon && (
              <button
                type="button"
                onClick={onMarkWon}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                ✓ Mark as Won
              </button>
            )}
            {onMarkLost && (
              <button
                type="button"
                onClick={onMarkLost}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
              >
                ✗ Mark as Lost
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6 p-5">
          {/* Bid Summary */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Bid Summary
            </p>
            <div className="space-y-0">
              <Row label="Our Bid Value" value={data.bidValue} />
              {data.tenderSecurity && (
                <Row label="Tender Security" value={data.tenderSecurity} />
              )}
              {data.performanceSecurity && (
                <Row
                  label="Performance Security"
                  value={data.performanceSecurity}
                />
              )}
            </div>
          </div>

          {/* Other Participants */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Other Participants
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-2">Bidder</th>
                  <th className="py-2 text-right">Bid Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.otherParticipants.map((p, i) => (
                  <tr key={`${p.bidder}-${i}`}>
                    <td
                      className={`py-3 text-[11px] ${p.isUs
                          ? "font-bold text-[#a97400]"
                          : "font-medium text-slate-700"
                        }`}
                    >
                      {p.bidder}
                    </td>
                    <td
                      className={`py-3 text-right font-mono text-[11px] ${p.isUs
                          ? "font-bold text-[#a97400]"
                          : "font-semibold text-slate-800"
                        }`}
                    >
                      {p.value}
                    </td>
                  </tr>
                ))}
                {data.otherParticipants.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="py-6 text-center text-[11px] text-slate-400"
                    >
                      No participant data recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column — dividers on the left/top */}
        <div className="space-y-6 border-t border-slate-100 p-5 lg:border-l lg:border-t-0">
          {/* Documents Submitted */}
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Documents Submitted
            </p>
            <ul className="space-y-1.5">
              {data.documentsSubmitted.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-medium text-slate-700">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{f.name}</span>
                  </span>
                  {f.url ? (
                    <a
                      href={fullFileUrl(f.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[10px] font-semibold text-indigo-600 hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="shrink-0 cursor-not-allowed text-[10px] font-semibold text-slate-300"
                    >
                      View
                    </button>
                  )}
                </li>
              ))}
              {data.documentsSubmitted.length === 0 && (
                <li className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] text-slate-400">
                  No documents submitted.
                </li>
              )}
            </ul>
          </div>

          {/* Checklist */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <ClipboardList className="h-3 w-3" />
              Submission Checklist
            </p>
            {checklist.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-400">
                No checklist items.
              </div>
            ) : (
              <ul>
                {checklist.map((item, idx) => {
                  // Pill text + color: prefer the value/tone from the API,
                  // fall back to checked-based labels.
                  const value =
                    (item as any).value ??
                    (item.checked ? "Done" : "Pending");
                  const tone: "neutral" | "progress" | "warn" =
                    (item as any).tone ??
                    (item.checked ? "progress" : "warn");

                  const toneStyles = {
                    neutral: "border-slate-200 bg-slate-100 text-slate-600",
                    progress: "border-orange-200 bg-orange-50 text-orange-700",
                    warn: "border-rose-200 bg-rose-50 text-rose-700",
                  } as const;

                  return (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between py-3 ${idx < checklist.length - 1
                          ? "border-b border-slate-100"
                          : ""
                        }`}
                    >
                      <span className="text-[12px] font-medium text-slate-700">
                        {item.label}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] font-semibold ${toneStyles[tone]}`}
                      >
                        {value}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
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
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-[11px] font-medium text-slate-500">
        {label}
      </span>
      <span className="font-mono text-[12px] font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}