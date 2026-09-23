// components/tender/documents/modal/AddDocModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { CompanyDocCategory } from "@/lib/api/tender.api";
import type { CompanyDocUI } from "@/lib/api/mappers";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: CompanyDocCategory;
  onSubmit: (payload: {
    title: string;
    description?: string;
    reference?: string;
    validity?: string;
    validityDate?: string;
    issuedOn?: string;
    subtitle?: string;
    chips?: string[];
    file?: File;
    category?: CompanyDocCategory;
    docType?: string;
  }) => Promise<void> | void;
  /** When set, the modal acts as a "renew" editor instead of a create form */
  renewDoc?: CompanyDocUI | null;
}

const SECTORS = [
  "Government",
  "Financial",
  "Power & Energy",
  "Telecom",
  "Education",
  "Healthcare",
];

const CERTIFICATE_TYPES = [
  "Partner Certificate",
  "Reseller Authorization",
  "Distributor Agreement",
];

const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

function toInputDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function headerText(
  category: CompanyDocCategory,
  isRenew: boolean,
  title?: string,
) {
  if (isRenew) {
    return {
      title: `Renew — ${title ?? "Document"}`,
      subtitle: "Upload the new certificate and set its expiry date.",
      button: "Save Renewal",
    };
  }
  switch (category) {
    case "experience":
      return {
        title: "Add Work Experience",
        subtitle:
          "Add a new client reference / completed project as a Work Experience certificate.",
        button: "Save Work Experience",
      };
    case "profiles":
      return {
        title: "Add Company Profile",
        subtitle: "Add a company profile document to the library.",
        button: "Save Profile",
      };
    case "certificates":
      return {
        title: "Add Partnership Certificate",
        subtitle: "Add a partner / reseller certificate to the library.",
        button: "Save Certificate",
      };
    case "legal":
    default:
      return {
        title: "Add Legal Doc",
        subtitle:
          "Add a new legal/registration document to the company library.",
        button: "Save Document",
      };
  }
}

export function AddDocModal({
  open,
  onOpenChange,
  category,
  onSubmit,
  renewDoc,
}: Props) {
  const isRenew = !!renewDoc;

  const [title, setTitle] = useState("");
  const [reference, setReference] = useState("");
  const [validity, setValidity] = useState("");
  const [validityDate, setValidityDate] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [subtitle, setSubtitle] = useState("");
  const [duration, setDuration] = useState("");
  const [volume, setVolume] = useState("");
  const [docType, setDocType] = useState(CERTIFICATE_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isExperience = category === "experience" && !isRenew;
  const isProfile = category === "profiles" && !isRenew;
  const isCertificates = category === "certificates" && !isRenew;

  /* Reset / seed on open */
  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (renewDoc) {
      setTitle(renewDoc.title);
      setReference(renewDoc.reference ?? "");
      setValidity(renewDoc.validity ?? "");
      setValidityDate(toInputDate(renewDoc.validity));
      setIssuedOn(toInputDate(renewDoc.issuedOn));
      setSector(renewDoc.chips?.[0] ?? SECTORS[0]);
      setSubtitle(renewDoc.subtitle ?? "");
      setDuration("");
      setVolume("");
      setDocType(renewDoc.docType || CERTIFICATE_TYPES[0]);
    } else {
      setTitle("");
      setReference("");
      setValidity("");
      setValidityDate("");
      setIssuedOn("");
      setSector(SECTORS[0]);
      setSubtitle("");
      setDuration("");
      setVolume("");
      setDocType(CERTIFICATE_TYPES[0]);
    }
  }, [open, renewDoc]);

  /* Esc + body scroll lock */
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
  const { title: headerTitle, subtitle: headerSub, button: btnLabel } =
    headerText(category, isRenew, renewDoc?.title);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const chips = isExperience
        ? [
          sector,
          duration ? `${duration}+ Yrs` : "",
          volume ? `৳${volume}L+` : "",
        ].filter(Boolean)
        : undefined;

      await onSubmit({
        title: title.trim(),
        description: isProfile ? subtitle.trim() || undefined : undefined,
        reference: reference.trim() || undefined,
        validity: validity.trim() || undefined,
        validityDate: validityDate || undefined,
        issuedOn: issuedOn || undefined,
        subtitle:
          isExperience || isProfile
            ? subtitle.trim() || undefined
            : undefined,
        chips,
        category,
        file: file ?? undefined,
        docType: isCertificates ? docType : undefined,
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
              {headerTitle}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">{headerSub}</p>
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
          {isExperience ? (
            <>
              {/* Client + Sector */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Client / Company Name *</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Grameenphone Ltd."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelCls}>Sector</label>
                  <select
                    className={inputCls}
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product / Work Description */}
              <div>
                <label className={labelCls}>Product / Work Description</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Network Security Appliance Supply"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              {/* Duration + Volume */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Duration (Years)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    placeholder="e.g. 2"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Volume (৳ Lakh)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    placeholder="e.g. 8"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Document name */}
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

              {/* Certificate Type — only for Partnership Certificates */}
              {isCertificates && (
                <div>
                  <label className={labelCls}>Certificate Type *</label>
                  <select
                    className={inputCls}
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    {CERTIFICATE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Shown as the certificate type in the library and tender
                    imports.
                  </p>
                </div>
              )}

              {/* Description — only for Company Profiles */}
              {isProfile && (
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    placeholder="Brief description of your company, services, and capabilities…"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Shown on the profile card and in the tender document
                    library.
                  </p>
                </div>
              )}

              {/* Reference + Valid Until */}
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
                  <label className={labelCls}>Valid Until</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Validity text + Issued On */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Validity (display text)</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Valid until 30 Jun 2028"
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Issued On (optional)</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={issuedOn}
                    onChange={(e) => setIssuedOn(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* File upload */}
          <div>
            <label className={labelCls}>
              {isExperience ? "Upload Certificate" : "Upload File"}
            </label>
            <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:bg-slate-50">
              <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                Choose File
              </span>
              <span className="truncate text-slate-500">
                {file?.name ?? "No file chosen"}
              </span>
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
            </label>
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
            {saving ? "Saving..." : btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}