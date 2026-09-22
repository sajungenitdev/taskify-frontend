// components/tender/documents/modals/ViewDocModal.tsx
"use client";

import { useEffect } from "react";
import { Download, ExternalLink, FileText, X } from "lucide-react";
import { StatusPill } from "../StatusPill";
import type { CompanyDocUI } from "@/lib/api/mappers";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doc: CompanyDocUI | null;
}

/* Convert "/uploads/..." → "http://localhost:5000/uploads/..." */
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

  if (!open || !doc) return null;

  const url = fullFileUrl(doc.fileUrl);
  const isPDF = url.toLowerCase().endsWith(".pdf");
  const isImage = url ? /\.(jpg|jpeg|png|webp|gif)$/i.test(url) : false;

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

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900">
                {doc.title}
              </h2>
              {doc.reference && (
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                  {doc.reference}
                </p>
              )}
              {doc.fileName && (
                <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="truncate">{doc.fileName}</span>
                  {doc.fileSize ? (
                    <span className="shrink-0 text-slate-400">
                      ({fileSizeLabel(doc.fileSize)})
                    </span>
                  ) : null}
                </p>
              )}
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

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Metadata row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Status
              </p>
              <div className="mt-1">
                <StatusPill status={doc.status} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Validity
              </p>
              <p className="mt-1 text-[12px] font-medium text-slate-800">
                {doc.validity ?? "—"}
              </p>
            </div>
            {doc.docType && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Type
                </p>
                <p className="mt-1 text-[12px] font-medium text-slate-800">
                  {doc.docType}
                </p>
              </div>
            )}
          </div>

          {/* Preview area */}
          {isPDF && url ? (
            <iframe
              src={url}
              title={doc.title}
              className="h-72 w-full rounded-lg border border-slate-200"
            />
          ) : isImage && url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={doc.title}
              className="h-72 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
            />
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-xs font-medium text-slate-500">
                No preview available
              </p>
              <p className="mt-0.5 max-w-xs text-center text-[11px] text-slate-400">
                {url
                  ? "This file type can't be previewed — use Download or Open in New Tab."
                  : "Attach a file from the Add Document modal to preview it here."}
              </p>
            </div>
          )}

          {doc.subtitle && (
            <p className="text-[11px] text-slate-500">{doc.subtitle}</p>
          )}

          {doc.chips && doc.chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {doc.chips.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            disabled={!url}
            onClick={() => {
              if (url) window.open(url, "_blank");
            }}
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
              a.click();
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[11px] font-semibold text-white hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button> */}
        </div>
      </div>
    </div>
  );
}