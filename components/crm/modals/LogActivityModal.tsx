// components/crm/modals/LogActivityModal.tsx
"use client";

import React, { useEffect, useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Loader2,
  X,
  Phone,
  Mail,
  Users,
  CalendarClock,
  StickyNote,
  Clock3,
  FileText,
  AlignLeft,
} from "lucide-react";
import { activityApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { ActivityType, DealActivity } from "@/types/crm/crm.types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string;
  onCreated?: (a: DealActivity) => void;
}

interface TypeOption {
  value: ActivityType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TYPE_OPTIONS: readonly TypeOption[] = [
  { value: "call", label: "Phone Call", icon: Phone },
  { value: "email", label: "Email Sent", icon: Mail },
  { value: "meeting", label: "Meeting Held", icon: Users },
  { value: "follow_up", label: "Follow-up", icon: CalendarClock },
  { value: "note", label: "Quick Note", icon: StickyNote },
];

export const LogActivityModal = memo(function LogActivityModal({
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

  // Reset form inputs upon modal trigger
  useEffect(() => {
    if (!open) return;
    setType("call");
    setSummary("");
    setDetails("");
    setDuration(0);
  }, [open]);

  // Esc key listener and background scroll lock
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onOpenChange(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, saving, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!summary.trim()) {
      toast.error("Activity summary is required");
      return;
    }

    setSaving(true);
    try {
      const created = await activityApi.create(leadId, {
        type,
        summary: summary.trim(),
        details: details.trim() || undefined,
        duration: type === "call" && duration > 0 ? duration : undefined,
      } as Partial<DealActivity>);

      toast.success("Engagement recorded to deal ledger");
      onCreated?.(created);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to record activity";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => !saving && onOpenChange(false)}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
                  <Activity className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Log Client Engagement
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Document outbound touchpoints, meeting notes, and summaries
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <form
              id="log-activity-form"
              onSubmit={handleSubmit}
              className="overflow-y-auto p-6 space-y-4"
            >
              {/* Activity Type Selection Tabs */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Engagement Channel
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {TYPE_OPTIONS.map((opt) => {
                    const isSelected = type === opt.value;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${isSelected
                            ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                            : "border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-white"
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-[11px] whitespace-nowrap">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Heading */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <AlignLeft className="h-3.5 w-3.5 text-slate-400" />
                  <span>Activity Summary</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Conducted contract review call with CFO"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>

              {/* Call Duration (Conditional) */}
              {type === "call" && (
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Clock3 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Call Duration (minutes)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={duration || ""}
                    onChange={(e) => setDuration(Math.max(0, Number(e.target.value)))}
                    placeholder="15"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>
              )}

              {/* Detailed Observations */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Engagement Notes & Follow-up Items</span>
                </label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Discussion highlights, customer objections, next planned actions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition resize-none leading-relaxed"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="log-activity-form"
                disabled={saving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{saving ? "Logging..." : "Log Engagement"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});