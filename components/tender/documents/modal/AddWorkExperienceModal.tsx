// components/tender/documents/modal/AddWorkExperienceModal.tsx
"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Called when user clicks Save — receives the raw form values */
  onSave?: (payload: {
    title: string;
    sector: string;
    subtitle?: string;
    duration?: string;
    volume?: string;
    fileName?: string;
  }) => void;
}

const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10";

const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500";

const SECTORS = [
  "Government",
  "Financial",
  "Power & Energy",
  "Telecom",
  "Education",
  "Healthcare",
];

export function AddWorkExperienceModal({ open, onOpenChange, onSave }: Props) {
  const [clientName, setClientName] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [volume, setVolume] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  /* Reset on open */
  useEffect(() => {
    if (open) {
      setClientName("");
      setSector(SECTORS[0]);
      setDescription("");
      setDuration("");
      setVolume("");
      setFileName(null);
    }
  }, [open]);

  /* Esc + body scroll lock */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const canSave = clientName.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave?.({
      title: clientName.trim(),
      sector,
      subtitle: description.trim() || undefined,
      duration: duration.trim() || undefined,
      volume: volume.trim() || undefined,
      fileName: fileName ?? undefined,
    });
    onOpenChange(false);
  };

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
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Add Work Experience
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Add a new client reference / completed project as a Work
              Experience certificate.
            </p>
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
          {/* Client + Sector side by side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Client / Company Name *</label>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Grameenphone Ltd."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
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

          {/* Product / Work Description — full width */}
          <div>
            <label className={labelCls}>Product / Work Description</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Network Security Appliance Supply"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Duration + Volume side by side */}
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

          {/* Upload Certificate */}
          <div>
            <label className={labelCls}>Upload Certificate</label>
            <label className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 transition hover:bg-slate-50">
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
            disabled={!canSave}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#a97400] px-6 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8f6100] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Work Experience
          </button>
        </div>
      </div>
    </div>
  );
}