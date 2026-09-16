"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
}

const inputCls =
  "h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10";

const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

export function AddTenderModal({ open, onOpenChange, onCreated }: Props) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleSave = async (notify = false) => {
    setSaving(true);
    try {
      // TODO: wire to real API — POST /api/v1/tenders
      // console.log("[AddTenderModal] notify:", notify);
      onCreated?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Add Tender to Potential
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Manually record a tender that wasn&apos;t picked up by the automated
              daily search — matches the fields tracked in the master Tender
              Record sheet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
                  placeholder="e.g. Rural Electrification Board"
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Type</label>
                <select className={inputCls} defaultValue="eGP">
                  <option value="eGP">eGP</option>
                  <option value="RFQ">RFQ</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Description / Item</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Substation Control Panel Supply"
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Notice Link</label>
                <input
                  className={inputCls}
                  placeholder="e.g. eGP.gov.bd/reb/2609-scp"
                />
              </div>
              <div>
                <label className={labelCls}>Recorded By</label>
                <input className={inputCls} placeholder="e.g. Akramul" />
              </div>
              <div>
                <label className={labelCls}>Responsible Person</label>
                <input className={inputCls} placeholder="e.g. Nahid Hasan" />
              </div>
            </div>
          </Section>

          {/* DATES & VALUE */}
          <Section title="Dates & Value">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Last Date of Purchase</label>
                <input type="date" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Date of Submission</label>
                <input type="date" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Submission Time</label>
                <input className={inputCls} placeholder="e.g. 3:00 PM" />
              </div>
              <div>
                <label className={labelCls}>Tentative Budget (৳)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 5,00,000"
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Tender Schedule Value (৳)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 500 (doc fee)"
                />
              </div>
            </div>
          </Section>

          {/* SECURITY & SUBMISSION */}
          <Section title="Security & Submission">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tender Security Amount (৳)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 25,000"
                />
              </div>
              <div>
                <label className={labelCls}>Mode of Submission</label>
                <select className={inputCls} defaultValue="Online (eGP)">
                  <option>Online (eGP)</option>
                  <option>Offline</option>
                  <option>Email</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Participate?</label>
                <select className={inputCls} defaultValue="Yes">
                  <option>Yes</option>
                  <option>No</option>
                  <option>Undecided</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Tender Doc Purchased?</label>
                <select className={inputCls} defaultValue="Not Yet">
                  <option>Yes</option>
                  <option>Not Yet</option>
                </select>
              </div>
            </div>
          </Section>

          {/* CLIENT CONTACT */}
          <Section title="Client Contact (used for automatic Client 360 record capture)">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Contact Name</label>
                <input className={inputCls} placeholder="e.g. Md. Kamal Hossain" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} placeholder="e.g. 01711-000000" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  className={inputCls}
                  placeholder="e.g. procurement@reb.gov.bd"
                />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input className={inputCls} placeholder="e.g. REB HQ, Dhaka" />
              </div>
            </div>
          </Section>

          {/* COMMENTS */}
          <Section title="Comments">
            <textarea
              rows={3}
              className={`${inputCls} h-auto resize-none py-2`}
              placeholder="General / Manager / MD comments"
            />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save &amp; Notify New Tender
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#a97400] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#8f6100] disabled:opacity-60"
          >
            Save Tender
          </button>
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