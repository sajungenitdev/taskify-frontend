// components/tender/TenderDetailReview.tsx
"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  FileText,
  Upload,
  MessageCircle,
  Trash2,
  Plus,
} from "lucide-react";
import type { TenderAttachment } from "@/lib/api/tender.api";
import TenderChatWizard from "@/components/tender/chat/TenderChatWizard";

export interface TenderDetailData {
  id: string;
  tenderer: string;
  title: string;
  advertisementFile?: string;
  advertisementUrl?: string;
  advertisementUploadedBy?: string;
  advertisementUploadedAt?: string;
  tenderLink?: string;
  recordedBy: string;
  tenderType: "eGP" | "RFQ" | "Hardcopy Ref." | string;
  responsiblePerson: string;
  lastDateOfPurchase?: string;
  lastDateOfSubmission?: string;
  note?: string;
  attachments?: TenderAttachment[];
  eligibility?: string;
}

interface Props {
  data: TenderDetailData;
  onReplaceAd?: () => void;
  onUploadAd?: () => void;
  onApprove?: () => void;
  onCheckEligibility?: () => void;
  onDiscuss?: () => void;
  onOpenChecklist?: () => void;
  onUploadAttachment?: (file: File) => Promise<void>;
  onDeleteAttachment?: (attachmentId: string) => Promise<void>;
  onUploadAdvertisement?: (file: File) => Promise<void>;
  onDeleteAdvertisement?: () => Promise<void>;
  showApprovalButtons?: boolean;
}

/* ---------- Helpers ---------- */

function fullFileUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
  const origin = base.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function fileSizeLabel(bytes: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- Component ---------- */

export function TenderDetailReview({
  data,
  onReplaceAd,
  onUploadAd,
  onApprove,
  onCheckEligibility,
  onDiscuss,
  onOpenChecklist,
  onUploadAttachment,
  onDeleteAttachment,
  onUploadAdvertisement,
  onDeleteAdvertisement,
  showApprovalButtons = true,
}: Props) {
  const hasAd = Boolean(data.advertisementFile);

  const [attachments, setAttachments] = useState<TenderAttachment[]>(
    data.attachments ?? [],
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  // ----- Advertisement state -----
  const [pendingAd, setPendingAd] = useState<File | null>(null);
  const [uploadingAd, setUploadingAd] = useState(false);
  const [adInputKey, setAdInputKey] = useState(0);

  // ----- Chat wizard state (internal) -----
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setAttachments(data.attachments ?? []);
    setPendingFile(null);
    setFileInputKey((k) => k + 1);
    setPendingAd(null);
    setAdInputKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.id]);

  const handleUpload = async () => {
    if (!pendingFile || !onUploadAttachment) return;
    setSaving(true);
    try {
      await onUploadAttachment(pendingFile);
      setPendingFile(null);
      setFileInputKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (attachmentId: string) => {
    const previous = attachments;
    setAttachments((prev) => prev.filter((a) => a._id !== attachmentId));
    try {
      await onDeleteAttachment?.(attachmentId);
    } catch {
      setAttachments(previous);
    }
  };

  // ----- Advertisement handlers -----
  const handleAdUpload = async () => {
    if (!pendingAd || !onUploadAdvertisement) return;
    setUploadingAd(true);
    try {
      await onUploadAdvertisement(pendingAd);
      setPendingAd(null);
      setAdInputKey((k) => k + 1);
    } finally {
      setUploadingAd(false);
    }
  };

  // ----- Discuss -----
  const handleDiscuss = () => {
    if (onDiscuss) onDiscuss();
    setChatOpen(true);
  };

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        {/* ---------- Header ---------- */}
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
                onClick={handleDiscuss}
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

        {/* ---------- Body ---------- */}
        <div className="grid grid-cols-1 items-stretch gap-8 p-5 lg:grid-cols-2">
          {/* ---------- Left column ---------- */}
          <div className="flex h-full flex-col gap-4">
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
                  <div className="flex items-center gap-2">
                    {data.advertisementUrl && (
                      <a
                        href={fullFileUrl(data.advertisementUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        View
                      </a>
                    )}
                    <label
                      className={`cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 ${uploadingAd ? "pointer-events-none opacity-60" : ""
                        }`}
                    >
                      {uploadingAd ? "Uploading…" : "Replace"}
                      <input
                        key={adInputKey}
                        type="file"
                        className="hidden"
                        disabled={uploadingAd}
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setPendingAd(f);
                          if (onUploadAdvertisement) {
                            setUploadingAd(true);
                            try {
                              await onUploadAdvertisement(f);
                              setPendingAd(null);
                              setAdInputKey((k) => k + 1);
                            } finally {
                              setUploadingAd(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <FileText className="h-4 w-4" />
                    <div>
                      <p className="text-xs font-medium text-slate-600">
                        {pendingAd
                          ? pendingAd.name
                          : "No advertisement image uploaded"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {pendingAd
                          ? "Click Upload to save"
                          : "RFQ received directly by email"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 ${uploadingAd ? "pointer-events-none opacity-60" : ""
                        }`}
                    >
                      <Upload className="h-3 w-3" />
                      Choose
                      <input
                        key={adInputKey}
                        type="file"
                        className="hidden"
                        disabled={uploadingAd}
                        onChange={(e) =>
                          setPendingAd(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleAdUpload}
                      disabled={uploadingAd || !pendingAd}
                      className="inline-flex h-7 items-center gap-1 rounded-md bg-[#a97400] px-2.5 text-[10px] font-semibold text-white hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Upload className="h-3 w-3" />
                      {uploadingAd ? "Uploading…" : "Upload"}
                    </button>
                  </div>
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

            {/* Note — pinned to the bottom of the left column */}
            <div className="mt-auto pt-2">
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

          {/* ---------- Right column — File Attachments ---------- */}
          <div className="flex h-full flex-col gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                File Attachments
              </p>

              <ul className="space-y-1.5">
                {attachments.map((f) => (
                  <li
                    key={f._id}
                    className="group flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-medium text-slate-700">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{f.name}</span>
                      {f.size > 0 && (
                        <span className="shrink-0 text-[10px] text-slate-400">
                          ({fileSizeLabel(f.size)})
                        </span>
                      )}
                    </span>

                    <div className="flex shrink-0 items-center gap-2">
                      {f.url && (
                        <a
                          href={fullFileUrl(f.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-indigo-600 hover:underline"
                        >
                          View
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(f._id)}
                        className="rounded-md p-1 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                        title="Remove"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}

                {attachments.length === 0 && (
                  <li
                    key="empty-attachments"
                    className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] text-slate-400"
                  >
                    No attachments yet.
                  </li>
                )}
              </ul>

              <div className="mt-3 flex items-center gap-2">
                <label
                  className={`flex h-9 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 transition hover:bg-slate-50 ${saving ? "pointer-events-none opacity-60" : ""
                    }`}
                >
                  <Upload className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-slate-500">
                    {pendingFile
                      ? pendingFile.name
                      : "Choose a file to upload…"}
                  </span>
                  <input
                    key={fileInputKey}
                    type="file"
                    className="hidden"
                    disabled={saving}
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setPendingFile(f);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={saving || !pendingFile}
                  className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#a97400] px-3 text-[11px] font-semibold text-white transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  {saving ? "Uploading…" : "Upload"}
                </button>
              </div>

              <p className="mt-1.5 text-[10px] text-slate-400">
                PDF, images, Word, Excel, archives up to 25 MB.
              </p>
            </div>

            {/* Eligibility — pinned to the bottom of the right column */}
            <div className="mt-auto">
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

      {/* ---------- Live chat wizard (opens from Discuss) ---------- */}
      {chatOpen && (
        <TenderChatWizard
          tenderId={data.id}
          tenderTitle={`${data.tenderer} — ${data.title}`}
          open={true}
          onOpenChange={(o) => setChatOpen(o)}
        />
      )}
    </>
  );
}

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