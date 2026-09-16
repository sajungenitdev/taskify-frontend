"use client";

export interface LostTenderDetail {
  id: string;
  tenderer: string;
  title: string;
  bidValue?: string;
  disqualificationReason?: string;
  lowestCompliantBidder?: string;
  lowestCompliantValue?: string;
}

interface Props {
  data: LostTenderDetail;
}

export function TenderDetailLost({ data }: Props) {
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

      <div className="space-y-0 px-5 py-3">
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