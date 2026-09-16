"use client";

import type { TenderDetailData } from "./TenderDetailReview";

export interface ActiveTenderDetail extends TenderDetailData {
  deadlineDays: number;
  value?: string;
  docStatus: "In Progress" | "Pending" | "Done" | "Reviewing";
  documentTasks: string;
}

interface Props {
  data: ActiveTenderDetail;
}

export function TenderDetailActive({ data }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          {data.tenderer} — {data.title}
        </h2>
        <span
          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            data.docStatus === "Done"
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
      </div>

      <div className="space-y-0 px-5 py-3">
        <Row label="Type" value={data.tenderType} />
        <Row
          label="Deadline"
          value={
            <span
              className={`font-mono text-[12px] font-semibold ${
                data.deadlineDays <= 3
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