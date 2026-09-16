"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { CompanyDoc } from "../DocCard";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: CompanyDoc["category"];
  onCreated?: (doc: CompanyDoc) => void;
}

const inputCls =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

export function AddDocModal({
  open,
  onOpenChange,
  category,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [reference, setReference] = useState("");
  const [validity, setValidity] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTitle("");
      setReference("");
      setValidity("");
      setFileName(null);
    }
  }, [open]);

  // Esc + scroll lock
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

  if (!open) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    const newDoc: CompanyDoc = {
      id: `doc-${Date.now()}`,
      category,
      title: title.trim(),
      reference: reference.trim() || undefined,
      validity: validity.trim() || undefined,
      status: "Valid",
      action: "View",
    };
    onCreated?.(newDoc);
    onOpenChange(false);
    // TODO: POST /api/v1/tenders/documents
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Add Legal Doc
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Add a new legal/registration document to the company library.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className={labelCls}>Document Name *</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Fire Safety Certificate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Reference / ID No.</label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. FSC-2026-0091"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Validity</label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Valid until 30 Jun 2028"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Upload File</label>
            <label className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-50">
              <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                Choose File
              </span>
              <span className="truncate text-slate-500">
                {fileName ?? "No file chosen"}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setFileName(f ? f.name : null);
                }}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#a97400] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Document
          </button>
        </div>
      </div>
    </div>
  );
}