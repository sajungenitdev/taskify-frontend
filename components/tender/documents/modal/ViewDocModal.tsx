// components/tender/documents/modals/ViewDocModal.tsx
"use client";

import { useEffect } from "react";
import { X, FileText, Download, ExternalLink } from "lucide-react";
import { StatusPill } from "../StatusPill";
import type { CompanyDoc } from "../DocCard";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  doc: CompanyDoc | null;
}

export function ViewDocModal({ open, onOpenChange, doc }: Props) {
  // Esc close + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open || !doc) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {doc.title}
              </h2>
              {doc.reference && (
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                  {doc.reference}
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
          </div>

          {/* Preview area — placeholder for a real PDF/image viewer */}
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              Document preview
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Wire an <code className="font-mono">{"<iframe>"}</code> or PDF
              viewer here when the file URL is available.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              // TODO: open in new tab
              console.log("open in new tab:", doc.title);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in New Tab
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: trigger download
              console.log("download:", doc.title);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-[11px] font-semibold text-white hover:bg-[#8f6100]"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}