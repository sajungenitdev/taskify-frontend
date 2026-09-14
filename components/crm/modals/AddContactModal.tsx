// components/crm/modals/AddContactModal.tsx
"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  UserPlus,
  X,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Tag,
  Share2,
  Users,
  FileText,
} from "lucide-react";
import { contactApi } from "@/lib/api/crm.api";
import toast from "react-hot-toast";
import type { Contact, ContactSource, ContactTag } from "@/types/crm/crm.types";

// ============================================================
// TYPES & DEFINITIONS
// ============================================================

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (contact: Contact) => void;
  initial?: Partial<Contact>;
}

const TAG_OPTIONS: { value: ContactTag; label: string }[] = [
  { value: "hot", label: "Hot Lead" },
  { value: "warm", label: "Warm Lead" },
  { value: "cold", label: "Cold Lead" },
];

const SOURCE_OPTIONS: { value: ContactSource; label: string }[] = [
  { value: "demo_request", label: "Demo Request" },
  { value: "referral", label: "Referral" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "website", label: "Website" },
  { value: "event", label: "Event" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

const FORM_DEFAULTS: Partial<Contact> = {
  name: "",
  company: "",
  jobTitle: "",
  email: "",
  phone: "",
  whatsappNumber: "",
  whatsappOptIn: false,
  tag: "cold",
  source: "other",
  companySize: 0,
  notes: "",
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export const AddContactModal = memo(function AddContactModal({
  open,
  onOpenChange,
  onCreated,
  initial,
}: AddContactModalProps) {
  const [form, setForm] = useState<Partial<Contact>>({ ...FORM_DEFAULTS, ...initial });
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize initial values when the modal opens
  useEffect(() => {
    if (!open) return;
    setForm({ ...FORM_DEFAULTS, ...initial });
  }, [open, initial]);

  // Handle ESC key and scroll locking
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, isSaving, onOpenChange]);

  const updateField = useCallback(<K extends keyof Contact>(key: K, value: Contact[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name?.trim()) {
      toast.error("Contact name is required");
      return;
    }

    setIsSaving(true);
    try {
      const createdContact = await contactApi.create(form);
      toast.success("Contact successfully created");
      onCreated?.(createdContact);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create contact";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => !isSaving && onOpenChange(false)}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <UserPlus className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Add New Contact
                  </h2>
                  <p className="text-xs text-slate-500">
                    Create a new customer account or prospective lead
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <form id="add-contact-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <span>Full Name</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name ?? ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Farhan Chowdhury"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Company</span>
                  </label>
                  <input
                    type="text"
                    value={form.company ?? ""}
                    onChange={(e) => updateField("company", e.target.value)}
                    placeholder="e.g. Apex Holdings Ltd."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={form.jobTitle ?? ""}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    placeholder="e.g. Head of Procurement"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="contact@company.com"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone ?? ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+880 1700 000000"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                {/* WhatsApp Details */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    <span>WhatsApp Number</span>
                  </label>
                  <input
                    type="tel"
                    value={form.whatsappNumber ?? ""}
                    onChange={(e) => updateField("whatsappNumber", e.target.value)}
                    placeholder="Optional"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                {/* WhatsApp Opt-in Checkbox */}
                <div className="flex items-end pb-1.5">
                  <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(form.whatsappOptIn)}
                      onChange={(e) => updateField("whatsappOptIn", e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-slate-900 focus:ring-0 accent-slate-900 cursor-pointer"
                    />
                    <span>Opt-in for WhatsApp communication</span>
                  </label>
                </div>

                {/* Tag Selection */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    <span>Pipeline Tag</span>
                  </label>
                  <select
                    value={form.tag}
                    onChange={(e) => updateField("tag", e.target.value as ContactTag)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  >
                    {TAG_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Selection */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Share2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Acquisition Source</span>
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => updateField("source", e.target.value as ContactSource)}
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  >
                    {SOURCE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Company Employee Size */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>Company Size</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.companySize || ""}
                    onChange={(e) => updateField("companySize", Number(e.target.value))}
                    placeholder="Total headcount (e.g. 50)"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Additional Notes</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes ?? ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Context, background details, preferred meeting schedules..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition resize-none leading-relaxed"
                  />
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="h-9 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-contact-form"
                disabled={isSaving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isSaving ? "Registering..." : "Create Contact"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});