// components/tender/documents/modals/AddDocModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X, FileText } from "lucide-react";
import type { CompanyDocCategory } from "@/lib/api/tender.api";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: CompanyDocCategory;
  onSubmit: (payload: {
    title: string;
    reference?: string;
    validity?: string;
    file?: File;
    category?: CompanyDocCategory;
    docType?: string;
  }) => Promise<void> | void;
}

const CATEGORIES: { id: CompanyDocCategory; label: string }[] = [
  { id: "legal", label: "Legal Doc" },
  { id: "profiles", label: "Company Profile" },
  { id: "experience", label: "Work Experience" },
  { id: "certificates", label: "Partnership Certificate" },
];

const DOC_TYPES = [
  "Certificate",
  "Registration",
  "License",
  "NOC",
  "Clearance",
  "Insurance",
  "Guarantee",
  "Other",
];

const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

export function AddDocModal({
  open,
  onOpenChange,
  category,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [reference, setReference] = useState("");
  const [validity, setValidity] = useState("");
  const [cat, setCat] = useState<CompanyDocCategory>(category);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setTitle("");
      setReference("");
      setValidity("");
      setCat(category);
      setDocType(DOC_TYPES[0]);
      setFile(null);
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, category]);

  /* Esc close + body scroll lock */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, saving, onOpenChange]);

  if (!open) return null;

  const canSave = title.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        reference: reference.trim() || undefined,
        validity: validity.trim() || undefined,
        category: cat,
        docType,
        file: file ?? undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !saving && onOpenChange(false)}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Add Company Document
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Upload a file and choose its category — it will appear in the
              matching tab.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {/* Category + Type (NEW) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Category *</label>
              <select
                className={inputCls}
                value={cat}
                onChange={(e) =>
                  setCat(e.target.value as CompanyDocCategory)
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Document Type *</label>
              <select
                className={inputCls}
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}>Document Name *</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Fire Safety Certificate"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Reference + validity */}
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

          {/* File upload — real file now */}
          <div>
            <label className={labelCls}>Attach File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f ?? null);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3 text-left transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
                  {file ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-semibold text-slate-700">
                    {file ? file.name : "Choose a file to upload"}
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {file
                      ? `${(file.size / 1024).toFixed(0)} KB · ${file.type || "unknown"}`
                      : "PDF, images, Word — up to 25 MB"}
                  </span>
                </span>
              </span>
              {file && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current)
                      fileInputRef.current.value = "";
                  }}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#a97400] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving..." : "Save Document"}
          </button>
        </div>
      </div>
    </div>
  );
}