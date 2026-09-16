"use client";

import { ExternalLink, FileText, Upload, MessageCircle } from "lucide-react";

export interface TenderDetailData {
  id: string;
  tenderer: string;
  title: string;
  advertisementFile?: string;
  advertisementUploadedBy?: string;
  tenderLink?: string;
  recordedBy: string;
  tenderType: "eGP" | "RFQ";
  responsiblePerson: string;
  lastDateOfPurchase?: string;
  lastDateOfSubmission?: string;
  note?: string;
  attachments?: { name: string }[];
  eligibility?: string;
}

interface Props {
  data: TenderDetailData;
  onReplaceAd?: () => void;
  onUploadAd?: () => void;
  onApprove?: () => void;
  onCheckEligibility?: () => void;
  onDiscuss?: () => void;
  showApprovalButtons?: boolean;
}

export function TenderDetailReview({
  data,
  onReplaceAd,
  onUploadAd,
  onApprove,
  onCheckEligibility,
  onDiscuss,
  showApprovalButtons = true,
}: Props) {
  const hasAd = Boolean(data.advertisementFile);

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Tender Review
          </span>
          <h2 className="text-sm font-bold text-slate-900">
            {data.tenderer} — {data.title}
          </h2>
        </div>

        {showApprovalButtons && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDiscuss}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <MessageCircle className="h-3 w-3" />
              Discuss
            </button>
            <button
              type="button"
              onClick={onCheckEligibility}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Check Eligibility →
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#a97400] px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8f6100]"
            >
              Approve for Participation
            </button>
          </div>
        )}
      </div>

      {/* Body — two columns */}
      <div className="grid grid-cols-1 gap-8 p-5 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tender Advertisement
            </p>
            {hasAd ? (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-amber-300 bg-amber-50/40 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {data.advertisementFile}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Uploaded by {data.advertisementUploadedBy ?? "—"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onReplaceAd}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Replace
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5">
                <div className="flex items-center gap-2 text-slate-500">
                  <FileText className="h-4 w-4" />
                  <div>
                    <p className="text-xs font-medium text-slate-600">
                      No advertisement image uploaded
                    </p>
                    <p className="text-[10px] text-slate-400">
                      RFQ received directly by email
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onUploadAd}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Upload className="h-3 w-3" />
                  Upload
                </button>
              </div>
            )}
          </div>

          <Field label="Tender Link">
            {data.tenderLink ? (
              <a
                href={data.tenderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                {data.tenderLink}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-[11px] text-slate-400">
                — (direct RFQ, no portal)
              </span>
            )}
          </Field>

          <Field label="Recorded By">
            <span className="text-[12px] font-medium text-slate-800">
              {data.recordedBy}
            </span>
          </Field>

          <Field label="Tender Type">
            <span className="text-[12px] font-medium text-slate-800">
              {data.tenderType}
            </span>
          </Field>

          <Field label="Responsible Person">
            <span className="text-[12px] font-medium text-slate-800">
              {data.responsiblePerson}
            </span>
          </Field>

          {data.lastDateOfPurchase && (
            <Field label="Last Date of Purchase">
              <span className="text-[12px] font-medium text-slate-800">
                {data.lastDateOfPurchase}
              </span>
            </Field>
          )}

          {data.lastDateOfSubmission && (
            <Field label="Last Date of Submission">
              <span className="text-[12px] font-medium text-slate-800">
                {data.lastDateOfSubmission}
              </span>
            </Field>
          )}

          <div className="pt-2">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Note
            </p>
            <textarea
              readOnly
              value={data.note ?? ""}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-[11px] leading-relaxed text-slate-700"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              File Attachments
            </p>
            <ul className="space-y-1.5">
              {(data.attachments ?? []).map((f, i) => (
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

            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Add attachment (filename)..."
                className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-[11px] placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
              <button
                type="button"
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                + Attach
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Eligibility Criteria / Important Records
            </p>
            <textarea
              readOnly
              value={data.eligibility ?? ""}
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-[11px] leading-relaxed text-slate-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
      {children}
    </div>
  );
}