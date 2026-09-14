// components/crm/modals/EditDealModal.tsx
"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Building2,
  DollarSign,
  Percent,
  Calendar,
  Sparkles,
  Loader2,
  X,
  Layers,
} from "lucide-react";
import { leadApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { Currency, Lead } from "@/types/crm/crm.types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onUpdated?: (updated: Lead) => void;
}

const STAGES = [
  { value: "lead_in", label: "Lead In" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const CURRENCIES: Currency[] = ["BDT", "USD", "EUR", "GBP", "SAR", "AED", "INR"];

export const EditDealModal = memo(function EditDealModal({
  open,
  onOpenChange,
  lead,
  onUpdated,
}: Props) {
  const [dealName, setDealName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [value, setValue] = useState<number | "">("");
  const [currency, setCurrency] = useState<Currency>("BDT");
  const [stage, setStage] = useState("lead_in");
  const [probability, setProbability] = useState<number>(50);
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [score, setScore] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !lead) return;
    setDealName(lead.dealName || "");
    setCompanyName(lead.companyName || "");
    setValue(lead.value ?? "");
    setCurrency((lead.currency as Currency) || "BDT");
    setStage(lead.stage || "lead_in");
    setProbability(lead.probability ?? (lead.stage === "won" ? 100 : 50));
    setExpectedCloseDate(
      lead.expectedCloseDate
        ? new Date(lead.expectedCloseDate).toISOString().split("T")[0]
        : ""
    );
    setScore(lead.score ?? "");
  }, [open, lead]);

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
    if (!lead) return;
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const updated = await leadApi.update(lead._id, {
        dealName: dealName.trim() || undefined,
        companyName: companyName.trim(),
        value: Number(value) || 0,
        currency,
        stage,
        probability: Number(probability),
        expectedCloseDate: expectedCloseDate || undefined,
        score: score !== "" ? Number(score) : undefined,
      } as Partial<Lead>);

      toast.success("Deal updated successfully");
      onUpdated?.(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update deal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && lead && (
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
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
                  <Briefcase className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Edit Deal Record</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Modify opportunity parameters, valuation, and close probabilities
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form id="edit-deal-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    <span>Deal Name</span>
                  </label>
                  <input
                    type="text"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    placeholder="e.g. Annual Cloud Contract"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Company Name</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                    <span>Deal Valuation</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as Currency)}
                      className="h-9 w-24 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 font-mono text-xs font-bold text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-hidden"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0"
                      className="h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 font-mono text-xs font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <span>Pipeline Stage</span>
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden transition"
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-slate-400" />
                      Win Probability
                    </span>
                    <span className="font-mono text-slate-900 font-bold">{probability}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    <span>Lead Score (0-100)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="50"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 font-mono text-xs font-bold text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Expected Close Date</span>
                  </label>
                  <input
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 font-mono text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
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
                form="edit-deal-form"
                disabled={saving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{saving ? "Updating..." : "Save Changes"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});