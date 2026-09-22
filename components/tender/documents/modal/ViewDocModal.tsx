// components/tender/documents/modals/ViewDocModal.tsx
"use client";

import { useEffect, useMemo } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  X,
  Calendar,
  Hash,
  Tag,
  Building2,
  Clock,
  Banknote,
  FileType,
} from "lucide-react";
import { StatusPill } from "../StatusPill";
import type { CompanyDocUI } from "@/lib/api/mappers";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doc: CompanyDocUI | null;
}

/* ---------- Convert "/uploads/..." → "http://localhost:5000/uploads/..." ---------- */
function fullFileUrl(url?: string) {
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

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* Chips order for experience rows: [sector, duration, volume] */
function parseExperienceChips(chips?: string[]) {
  const arr = Array.isArray(chips) ? chips : [];
  return {
    sector: arr[0] || "",
    duration: arr[1] || "",
    volume: arr[2] || "",
  };
}

export function ViewDocModal({ open, onOpenChange, doc }: Props) {
  /* Esc close + body scroll lock */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  const isExperience = doc?.category === "experience";

  const meta = useMemo(() => {
    if (!doc) return { sector: "", duration: "", volume: "" };
    return isExperience
      ? parseExperienceChips(doc.chips)
      : { sector: "", duration: "", volume: "" };
  }, [doc, isExperience]);

  if (!open || !doc) return null;

  const url = fullFileUrl(doc.fileUrl);
  const isPDF = url.toLowerCase().endsWith(".pdf");
  const isImage = url ? /\.(jpg|jpeg|png|webp|gif)$/i.test(url) : false;

  /* Non-experience chips are the free-form tags from AddDocModal */
  const genericChips = !isExperience && doc.chips ? doc.chips : [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* ---------- Header ---------- */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900">
                {doc.title}
              </h2>
              {isExperience && doc.subtitle && (
                <p className="mt-0.5 truncate text-[12px] text-slate-600">
                  {doc.subtitle}
                </p>
              )}
              <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                {doc.fileName ? (
                  <>
                    <span className="truncate">{doc.fileName}</span>
                    {doc.fileSize ? (
                      <span className="shrink-0 text-slate-400">
                        · {fileSizeLabel(doc.fileSize)}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="italic text-slate-400">
                    No file attached
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ---------- Body (scrollable) ---------- */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* -------- Preview -------- */}
          {isPDF && url ? (
            <iframe
              src={url}
              title={doc.title}
              className="h-80 w-full rounded-lg border border-slate-200 bg-slate-50"
            />
          ) : isImage && url ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={doc.title}
                className="max-h-96 w-full rounded object-contain"
              />
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-xs font-medium text-slate-500">
                No preview available
              </p>
              <p className="mt-0.5 max-w-xs text-center text-[11px] text-slate-400">
                {url
                  ? "This file type can't be previewed inline — use Download or Open in New Tab."
                  : "Attach a file from the Add modal to preview it here."}
              </p>
            </div>
          )}

          {/* -------- Details grid -------- */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isExperience ? "Experience Details" : "Document Details"}
            </p>

            {isExperience ? (
              /* ---------- WORK EXPERIENCE ---------- */
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <DetailCard
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Sector"
                  value={meta.sector}
                  tone="amber"
                />
                <DetailCard
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Duration"
                  value={meta.duration}
                  tone="sky"
                />
                <DetailCard
                  icon={<Banknote className="h-3.5 w-3.5" />}
                  label="Volume"
                  value={meta.volume}
                  tone="emerald"
                />
              </div>
            ) : (
              /* ---------- GENERIC DOCS ---------- */
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <DetailCard
                  icon={<Tag className="h-3.5 w-3.5" />}
                  label="Document Type"
                  value={doc.docType || ""}
                  tone="slate"
                />
                <DetailCard
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label="Reference / ID"
                  value={doc.reference || ""}
                  tone="slate"
                  mono
                />
                <DetailCard
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Issued On"
                  value={fmtDate(doc.issuedOn)}
                  tone="slate"
                />
                <DetailCard
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Valid Until"
                  value={fmtDate(doc.validUntil)}
                  tone="slate"
                />
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </p>
                  <div className="mt-1.5">
                    <StatusPill status={doc.status} />
                  </div>
                </div>
                {doc.validity && (
                  <DetailCard
                    icon={<FileType className="h-3.5 w-3.5" />}
                    label="Validity Note"
                    value={doc.validity}
                    tone="slate"
                  />
                )}
              </div>
            )}
          </div>

          {/* -------- Free-form chips (only for non-experience docs) -------- */}
          {genericChips.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {genericChips.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* -------- Status row for experience (kept separate from grid) -------- */}
          {isExperience && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Status
              </p>
              <div className="mt-1.5">
                <StatusPill status={doc.status} />
              </div>
            </div>
          )}
        </div>

        {/* ---------- Footer ---------- */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            disabled={!url}
            onClick={() => url && window.open(url, "_blank")}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in New Tab
          </button>

          {/* <button
            type="button"
            disabled={!url}
            onClick={() => {
              if (!url) return;
              const a = document.createElement("a");
              a.href = url;
              a.download = doc.fileName || doc.title;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button> */}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Small presentational helper
 * ============================================================ */
const TONE_BG: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
};

function DetailCard({
  icon,
  label,
  value,
  tone = "slate",
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  tone?: keyof typeof TONE_BG;
  mono?: boolean;
}) {
  const empty = !value || value === "—";
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-1.5 text-slate-500">
        <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${TONE_BG[tone]}`}>
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p
        className={`mt-1.5 truncate text-[13px] font-semibold ${empty
            ? "italic text-slate-400"
            : mono
              ? "font-mono text-slate-800"
              : "text-slate-800"
          }`}
        title={value || undefined}
      >
        {empty ? "Not set" : value}
      </p>
    </div>
  );
}