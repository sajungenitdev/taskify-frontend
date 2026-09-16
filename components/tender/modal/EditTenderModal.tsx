// components/tender/modal/EditTenderModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  tenderApi,
  type Tender,
  type TenderType,
} from "@/lib/api/tender.api";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** The tender being edited. Null hides the modal. */
  tender: Tender | null;
  onUpdated?: () => void;
}

const inputCls =
  "h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10";

const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

interface FormState {
  tenderer: string;
  title: string;
  tenderType: TenderType;
  description: string;
  tenderLink: string;
  recordedBy: string;
  responsiblePerson: string;
  lastDateOfPurchase: string;
  lastDateOfSubmission: string;
  tentativeBudget: string;
  tenderSecurityAmount: string;
  performanceSecurityAmount: string;
  mode: string;
  readiness: string;
  docStatus: string;
  advertisementFile: string;
  advertisementUploadedBy: string;
  note: string;
  eligibility: string;
}

/** ISO → "YYYY-MM-DD" for <input type="date"> */
function toDateInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function fromTender(t: Tender): FormState {
  return {
    tenderer: t.tenderer ?? "",
    title: t.title ?? "",
    tenderType: t.tenderType ?? "eGP",
    description: t.description ?? "",
    tenderLink: t.tenderLink ?? "",
    recordedBy: t.recordedBy ?? "",
    responsiblePerson: t.responsiblePerson ?? "",
    lastDateOfPurchase: toDateInput(t.lastDateOfPurchase),
    lastDateOfSubmission: toDateInput(t.lastDateOfSubmission),
    tentativeBudget: t.tentativeBudget ? String(t.tentativeBudget) : "",
    tenderSecurityAmount: t.tenderSecurityAmount
      ? String(t.tenderSecurityAmount)
      : "",
    performanceSecurityAmount: t.performanceSecurityAmount
      ? String(t.performanceSecurityAmount)
      : "",
    mode: t.mode ?? "Online (eGP)",
    readiness: t.readiness != null ? String(t.readiness) : "0",
    docStatus: t.docStatus ?? "",
    advertisementFile: t.advertisementFile ?? "",
    advertisementUploadedBy: t.advertisementUploadedBy ?? "",
    note: t.note ?? "",
    eligibility: t.eligibility ?? "",
  };
}

export function EditTenderModal({
  open,
  onOpenChange,
  tender,
  onUpdated,
}: Props) {
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  /* Reset / hydrate every time the modal opens or the target changes */
  useEffect(() => {
    if (open && tender) {
      setForm(fromTender(tender));
    } else {
      setForm(null);
    }
  }, [open, tender]);

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

  if (!open || !tender || !form) return null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const canSave =
    form.tenderer.trim().length > 0 &&
    form.title.trim().length > 0 &&
    !saving;

  const handleSave = async () => {
    if (!canSave) {
      toast.error("Tender name and title are required");
      return;
    }

    setSaving(true);
    try {
      await tenderApi.update(tender._id, {
        tenderer: form.tenderer.trim(),
        title: form.title.trim(),
        tenderType: form.tenderType,
        description: form.description.trim() || "",
        tenderLink: form.tenderLink.trim() || "",
        recordedBy: form.recordedBy.trim() || "",
        responsiblePerson: form.responsiblePerson.trim() || "",
        lastDateOfPurchase: form.lastDateOfPurchase
          ? new Date(form.lastDateOfPurchase).toISOString()
          : null,
        lastDateOfSubmission: form.lastDateOfSubmission
          ? new Date(form.lastDateOfSubmission).toISOString()
          : null,
        tentativeBudget: Number(form.tentativeBudget) || 0,
        tenderSecurityAmount: Number(form.tenderSecurityAmount) || 0,
        performanceSecurityAmount:
          Number(form.performanceSecurityAmount) || 0,
        mode: form.mode,
        readiness: Number(form.readiness) || 0,
        docStatus: form.docStatus,
        advertisementFile: form.advertisementFile.trim() || "",
        advertisementUploadedBy: form.advertisementUploadedBy.trim() || "",
        note: form.note.trim() || "",
        eligibility: form.eligibility.trim() || "",
      } as Partial<Tender>);

      toast.success("Tender updated");
      onUpdated?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to update tender");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !saving && onOpenChange(false)}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Edit Tender — {tender.tenderer}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Update the record. Changes are saved immediately and reflected
              across the pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !saving && onOpenChange(false)}
            disabled={saving}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* BASIC INFO */}
          <Section title="Basic Info">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Tender Name *</label>
                <input
                  className={inputCls}
                  value={form.tenderer}
                  onChange={(e) => set("tenderer", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Opportunity Title *</label>
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Type</label>
                <select
                  className={inputCls}
                  value={form.tenderType}
                  onChange={(e) =>
                    set("tenderType", e.target.value as TenderType)
                  }
                >
                  <option value="eGP">eGP</option>
                  <option value="RFQ">RFQ</option>
                  <option value="Hardcopy Ref.">Hardcopy Ref.</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Description / Item</label>
                <input
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Notice Link</label>
                <input
                  className={inputCls}
                  value={form.tenderLink}
                  onChange={(e) => set("tenderLink", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Recorded By</label>
                <input
                  className={inputCls}
                  value={form.recordedBy}
                  onChange={(e) => set("recordedBy", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Responsible Person</label>
                <input
                  className={inputCls}
                  value={form.responsiblePerson}
                  onChange={(e) => set("responsiblePerson", e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* DATES & VALUE */}
          <Section title="Dates & Value">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Last Date of Purchase</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.lastDateOfPurchase}
                  onChange={(e) =>
                    set("lastDateOfPurchase", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Last Date of Submission</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.lastDateOfSubmission}
                  onChange={(e) =>
                    set("lastDateOfSubmission", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Tentative Budget (৳)</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.tentativeBudget}
                  onChange={(e) =>
                    set("tentativeBudget", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Readiness (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputCls}
                  value={form.readiness}
                  onChange={(e) => set("readiness", e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* SECURITY */}
          <Section title="Security">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  Tender Security Amount (৳)
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.tenderSecurityAmount}
                  onChange={(e) =>
                    set("tenderSecurityAmount", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>
                  Performance Security (৳)
                </label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.performanceSecurityAmount}
                  onChange={(e) =>
                    set("performanceSecurityAmount", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Mode of Submission</label>
                <select
                  className={inputCls}
                  value={form.mode}
                  onChange={(e) => set("mode", e.target.value)}
                >
                  <option>Online (eGP)</option>
                  <option>Offline</option>
                  <option>Email</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Docs Status</label>
                <select
                  className={inputCls}
                  value={form.docStatus}
                  onChange={(e) => set("docStatus", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="Docs pending">Docs pending</option>
                  <option value="Docs in progress">Docs in progress</option>
                  <option value="Complete">Complete</option>
                  <option value="Banking docs pending">
                    Banking docs pending
                  </option>
                </select>
              </div>
            </div>
          </Section>

          {/* ADVERTISEMENT */}
          <Section title="Advertisement">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Advertisement File</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Tender_Notice_BPDB.pdf"
                  value={form.advertisementFile}
                  onChange={(e) =>
                    set("advertisementFile", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Uploaded By</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Akramul · today"
                  value={form.advertisementUploadedBy}
                  onChange={(e) =>
                    set("advertisementUploadedBy", e.target.value)
                  }
                />
              </div>
            </div>
          </Section>

          {/* NOTES */}
          <Section title="Notes">
            <textarea
              rows={3}
              className={`${inputCls} h-auto resize-none py-2`}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="General notes, follow-ups, reminders"
            />
          </Section>

          {/* ELIGIBILITY */}
          <Section title="Eligibility / Important Records">
            <textarea
              rows={3}
              className={`${inputCls} h-auto resize-none py-2`}
              value={form.eligibility}
              onChange={(e) => set("eligibility", e.target.value)}
              placeholder="Requirements, thresholds, references"
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={() => !saving && onOpenChange(false)}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Section wrapper ---------- */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}