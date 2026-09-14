// components/crm/modals/LogActivityModal.tsx
"use client";
import { useEffect, useState } from "react";
import { Activity, Loader2, X } from "lucide-react";
import { activityApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { ActivityType, DealActivity } from "@/types/crm/crm.types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string;
  onCreated?: (a: DealActivity) => void;
}

const TYPES: ActivityType[] = ["call", "email", "meeting", "follow_up", "note"];

const inputCls =
  "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-sm transition placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 dark:border-gray-700 dark:bg-[#0b1a30] dark:text-gray-100";
const labelCls =
  "mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300";

export function LogActivityModal({
  open,
  onOpenChange,
  leadId,
  onCreated,
}: Props) {
  const [type, setType] = useState<ActivityType>("call");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [duration, setDuration] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Reset form every time the modal opens
  useEffect(() => {
    if (!open) return;
    setType("call");
    setSummary("");
    setDetails("");
    setDuration(0);
  }, [open]);

  // Esc closes + lock body scroll
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

  const submit = async () => {
    if (!summary.trim()) return toast.error("Summary is required");
    setSaving(true);
    try {
      const created = await activityApi.create(leadId, {
        type,
        summary,
        details,
        duration,
      } as Partial<DealActivity>);
      toast.success("Activity logged");
      onCreated?.(created);
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#0d1b33]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-sm">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Log Activity
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Record a call, email, meeting, or note
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className={labelCls}>Type</label>
            <select
              className={inputCls}
              value={type}
              onChange={(e) => setType(e.target.value as ActivityType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Summary *</label>
            <input
              type="text"
              className={inputCls}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Called to discuss pricing"
            />
          </div>

          <div>
            <label className={labelCls}>Details</label>
            <textarea
              rows={3}
              className={`${inputCls} h-auto py-2`}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What was discussed, outcome, next steps..."
            />
          </div>

          {type === "call" && (
            <div>
              <label className={labelCls}>Duration (minutes)</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-5 py-3 dark:border-gray-800 dark:bg-black/10">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Logging..." : "Log Activity"}
          </button>
        </div>
      </div>
    </div>
  );
}