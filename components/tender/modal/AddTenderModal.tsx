// components/tender/modal/AddTenderModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, X, Save, FileCheck2 } from "lucide-react";
import toast from "react-hot-toast";
import { tenderApi } from "@/lib/api/tender.api";

type TenderType = "eGP" | "RFQ" | "Hardcopy Ref.";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
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
  submissionTime: string;
  tentativeBudget: string;
  scheduleValue: string;
  tenderSecurityAmount: string;
  tenderSecurityValidity: string;
  performanceSecurityValidity: string;
  mode: string;
  participate: string;
  docPurchased: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  note: string;
}

const INITIAL: FormState = {
  tenderer: "",
  title: "",
  tenderType: "eGP",
  description: "",
  tenderLink: "",
  recordedBy: "",
  responsiblePerson: "",
  lastDateOfPurchase: "",
  lastDateOfSubmission: "",
  submissionTime: "",
  tentativeBudget: "",
  scheduleValue: "",
  tenderSecurityAmount: "",
  tenderSecurityValidity: "",
  performanceSecurityValidity: "",
  mode: "Online (eGP)",
  participate: "Yes",
  docPurchased: "Not Yet",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  note: "",
};

export function AddTenderModal({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(INITIAL);
  }, [open]);

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

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSave =
    form.tenderer.trim().length > 0 && form.title.trim().length > 0;

  const buildPayload = (draft: boolean) => {
    let submissionISO: string | undefined;
    if (form.lastDateOfSubmission) {
      const dt = form.submissionTime
        ? new Date(`${form.lastDateOfSubmission} ${form.submissionTime}`)
        : new Date(form.lastDateOfSubmission);
      submissionISO = !isNaN(dt.getTime()) ? dt.toISOString() : undefined;
    }

    return {
      tenderer: form.tenderer.trim(),
      title: form.title.trim(),
      stage: "potential" as const,
      draft,
      tenderType: form.tenderType,
      description: form.description.trim() || undefined,
      tenderLink: form.tenderLink.trim() || undefined,
      recordedBy: form.recordedBy.trim() || undefined,
      responsiblePerson: form.responsiblePerson.trim() || undefined,
      lastDateOfPurchase: form.lastDateOfPurchase
        ? new Date(form.lastDateOfPurchase).toISOString()
        : undefined,
      lastDateOfSubmission: submissionISO,
      tentativeBudget: Number(form.tentativeBudget) || 0,
      tenderSecurityAmount: Number(form.tenderSecurityAmount) || 0,
      tenderSecurityValidity: form.tenderSecurityValidity
        ? new Date(form.tenderSecurityValidity).toISOString()
        : undefined,
      performanceSecurityValidity: form.performanceSecurityValidity
        ? new Date(form.performanceSecurityValidity).toISOString()
        : undefined,
      mode: form.mode,
      note: form.note.trim() || undefined,
    };
  };

  const handleSave = async (options: { draft: boolean; notify: boolean }) => {
    if (!canSave) {
      toast.error("Tender name and title are required");
      return;
    }
    setSaving(true);
    try {
      await tenderApi.create(buildPayload(options.draft));
      if (options.draft) {
        toast.success("Saved as draft — you can complete it later");
      } else if (options.notify) {
        toast.success("Tender saved — notifications sent");
      } else {
        toast.success("Tender added to Potential");
      }
      onCreated?.();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Failed to save tender");
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
              Add Tender to Potential
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Only <strong>Tender Name</strong> and <strong>Title</strong>{" "}
              are required. Fill the rest when it becomes available.
            </p>  
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <Section title="Basic Info">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Tender Name *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Rural Electrification Board"
                  value={form.tenderer ?? ""}
                  onChange={(e) => set("tenderer", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Opportunity Title *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Substation Control Panel Supply"
                  value={form.title ?? ""}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Type</label>
                <select
                  className={inputCls}
                  value={form.tenderType ?? "eGP"}
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
                  placeholder="e.g. Substation Control Panel Supply"
                  value={form.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Notice Link</label>
                <input
                  className={inputCls}
                  placeholder="e.g. eGP.gov.bd/reb/2609-scp"
                  value={form.tenderLink ?? ""}
                  onChange={(e) => set("tenderLink", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Recorded By</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Akramul"
                  value={form.recordedBy ?? ""}
                  onChange={(e) => set("recordedBy", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Responsible Person</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Nahid Hasan"
                  value={form.responsiblePerson ?? ""}
                  onChange={(e) => set("responsiblePerson", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Dates & Value">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Last Date of Purchase</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.lastDateOfPurchase ?? ""}
                  onChange={(e) => set("lastDateOfPurchase", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Last Date of Submission</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.lastDateOfSubmission ?? ""}
                  onChange={(e) =>
                    set("lastDateOfSubmission", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Submission Time</label>
                <input
                  className={inputCls}
                  placeholder="e.g. 3:00 PM"
                  value={form.submissionTime ?? ""}
                  onChange={(e) => set("submissionTime", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Tentative Budget (৳)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 500000"
                  value={form.tentativeBudget ?? ""}
                  onChange={(e) => set("tentativeBudget", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Schedule Value (৳)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 500 (doc fee)"
                  value={form.scheduleValue ?? ""}
                  onChange={(e) => set("scheduleValue", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Security & Submission">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tender Security Amount (৳)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 25000"
                  value={form.tenderSecurityAmount ?? ""}
                  onChange={(e) =>
                    set("tenderSecurityAmount", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Tender Security Validity</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.tenderSecurityValidity ?? ""}
                  onChange={(e) =>
                    set("tenderSecurityValidity", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Performance Security Validity</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.performanceSecurityValidity ?? ""}
                  onChange={(e) =>
                    set("performanceSecurityValidity", e.target.value)
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Mode of Submission</label>
                <select
                  className={inputCls}
                  value={form.mode ?? "Online (eGP)"}
                  onChange={(e) => set("mode", e.target.value)}
                >
                  <option>Online (eGP)</option>
                  <option>Offline</option>
                  <option>Email</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Participate?</label>
                <select
                  className={inputCls}
                  value={form.participate ?? "Yes"}
                  onChange={(e) => set("participate", e.target.value)}
                >
                  <option>Yes</option>
                  <option>No</option>
                  <option>Undecided</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Doc Purchased?</label>
                <select
                  className={inputCls}
                  value={form.docPurchased ?? "Not Yet"}
                  onChange={(e) => set("docPurchased", e.target.value)}
                >
                  <option>Yes</option>
                  <option>Not Yet</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Client Contact">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Contact Name</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Md. Kamal Hossain"
                  value={form.contactName ?? ""}
                  onChange={(e) => set("contactName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  className={inputCls}
                  placeholder="e.g. 01711-000000"
                  value={form.contactPhone ?? ""}
                  onChange={(e) => set("contactPhone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  className={inputCls}
                  placeholder="e.g. procurement@reb.gov.bd"
                  value={form.contactEmail ?? ""}
                  onChange={(e) => set("contactEmail", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input
                  className={inputCls}
                  placeholder="e.g. REB HQ, Dhaka"
                  value={form.contactAddress ?? ""}
                  onChange={(e) => set("contactAddress", e.target.value)}
                />
              </div>
            </div>
          </Section>

          <Section title="Notes">
            <textarea
              rows={3}
              className={`${inputCls} h-auto resize-none py-2`}
              placeholder="General / Manager / MD comments"
              value={form.note ?? ""}
              onChange={(e) => set("note", e.target.value)}
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={() => handleSave({ draft: true, notify: false })}
            disabled={saving || !canSave}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Save className="h-3.5 w-3.5" />
            Save as Draft
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave({ draft: false, notify: true })}
              disabled={saving || !canSave}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save &amp; Notify
            </button>
            <button
              type="button"
              onClick={() => handleSave({ draft: false, notify: false })}
              disabled={saving || !canSave}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <FileCheck2 className="h-3.5 w-3.5" />
              Save Tender
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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