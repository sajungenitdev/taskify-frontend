// components/crm/modals/ScheduleFollowUpModal.tsx
"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarClock,
  Calendar,
  Flag,
  FileText,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
} from "lucide-react";
import { leadApi } from "@/lib/api/crm.api";
import { toast } from "react-hot-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  onCreated?: () => void;
}

type Priority = "low" | "medium" | "high" | "urgent";

interface PriorityOption {
  value: Priority;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
}

const PRIORITIES: readonly PriorityOption[] = [
  {
    value: "low",
    label: "Low Priority",
    icon: CheckCircle2,
    badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
  },
  {
    value: "medium",
    label: "Medium Priority",
    icon: Clock,
    badgeClass: "border-sky-200/80 bg-sky-50 text-sky-700",
  },
  {
    value: "high",
    label: "High Priority",
    icon: AlertTriangle,
    badgeClass: "border-amber-200/80 bg-amber-50 text-amber-700",
  },
  {
    value: "urgent",
    label: "Urgent Action",
    icon: Flame,
    badgeClass: "border-rose-200/80 bg-rose-50 text-rose-700",
  },
];

export const ScheduleFollowUpModal = memo(function ScheduleFollowUpModal({
  open,
  onOpenChange,
  leadId,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [saving, setSaving] = useState(false);

  // Set default due date to tomorrow 10:00 AM on modal display
  const resetDefaults = useCallback(() => {
    setTitle("");
    setNotes("");
    setPriority("medium");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDueAt(localIso);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetDefaults();
  }, [open, resetDefaults]);

  // Esc keyboard shortcut and scroll locking
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onOpenChange(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, saving, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dueAt) {
      toast.error("Scheduled date and time are required");
      return;
    }

    setSaving(true);
    try {
      await leadApi.scheduleFollowUp(leadId, {
        title: title.trim() || undefined,
        dueAt,
        notes: notes.trim() || undefined,
        priority,
      });

      toast.success("Follow-up task scheduled");
      onCreated?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to schedule follow-up";
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
                  <CalendarClock className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Schedule Follow-up
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Queue a reminder, call cadence, or check-in task
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <form
              id="schedule-follow-up-form"
              onSubmit={handleSubmit}
              className="overflow-y-auto p-6 space-y-4"
            >
              {/* Task Title */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Task / Activity Title</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow-up phone call regarding proposal feedback"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>

              {/* Target Due Timestamp */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Execution Date & Time</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 font-mono text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                />
              </div>

              {/* Priority Selector Pills */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Flag className="h-3.5 w-3.5 text-slate-400" />
                  <span>Action Priority Level</span>
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRIORITIES.map((opt) => {
                    const isSelected = priority === opt.value;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPriority(opt.value)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${isSelected
                            ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                            : "border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 hover:bg-white"
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-[11px] capitalize">{opt.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Context Notes */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Objective & Talking Points</span>
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key questions to ask, objection management strategies, discount parameters..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition resize-none leading-relaxed"
                />
              </div>
            </form>

            {/* Footer */}
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
                form="schedule-follow-up-form"
                disabled={saving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{saving ? "Scheduling..." : "Schedule Follow-up"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});