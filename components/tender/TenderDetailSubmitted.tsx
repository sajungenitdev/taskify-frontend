"use client";

import { FileText } from "lucide-react";

export interface SubmittedTenderDetail {
  id: string;
  tenderer: string;
  title: string;
  bidValue: string;
  tenderSecurity?: string;
  performanceSecurity?: string;
  documentsSubmitted: { name: string }[];
  otherParticipants: { bidder: string; value: string; isUs?: boolean }[];
}

interface Props {
  data: SubmittedTenderDetail;
}

export function TenderDetailSubmitted({ data }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="border-b border-amber-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          {data.tenderer} — {data.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-8 p-5 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                {data.otherParticipants.map((p) => (
                  <tr key={p.bidder}>
                    <td
                      className={`py-2.5 text-[11px] ${
                        p.isUs
                          ? "font-bold text-[#a97400]"
                          : "font-medium text-slate-700"
                      }`}
                    >
                      {p.bidder}
                    </td>
                    <td
                      className={`py-2.5 text-right font-mono text-[11px] ${
                        p.isUs
                          ? "font-bold text-[#a97400]"
                          : "font-semibold text-slate-800"
                      }`}
                    >
                      {p.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Documents Submitted
          </p>
          <ul className="space-y-1.5">
            {data.documentsSubmitted.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <span className="flex items-center gap-2 truncate text-[11px] font-medium text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  {f.name}
                </span>
                <button
                  type="button"
                  className="text-[10px] font-semibold text-indigo-600 hover:underline"
                >
                  View
                </button>
              </li>
            ))}
          </ul>
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
      <span className="font-mono text-[12px] font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}