// components/tender/modal/SecurityNotifyModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
    X,
    Plus,
    Loader2,
    Bell,
    Mail,
    Send,
    UserCheck,
    AlertCircle,
    ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/* ============================================================
 * Entity → default pre-filled finance emails
 * Used by the Tender Security page bell action.
 * ============================================================ */
const DEFAULT_EMAILS_BY_ENTITY: Record<string, string[]> = {
    "NGL-26": ["finance.ngl26@ngenit.com", "sadia.finance@ngenit.com"],
    "NG-26": ["finance.ng26@ngenit.com"],
    JT: ["finance.jt@ngenit.com"],
};

export type NotifyModalVariant = "security" | "submission";

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;

    /** Shown in the header subtitle and info text */
    entity: string;

    /** "security" or "submission" — only affects default copy */
    variant?: NotifyModalVariant;

    /**
     * Optional: override the default emails.
     * If omitted, the modal falls back to DEFAULT_EMAILS_BY_ENTITY[entity].
     */
    defaultEmails?: string[];

    /** Optional: custom header title. Falls back to variant defaults. */
    title?: string;

    /** Optional: custom header subtitle. Falls back to variant defaults. */
    subtitle?: string;

    /** Called with the emails + optional note — must return a promise */
    onSend?: (emails: string[], note?: string) => Promise<void> | void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SecurityNotifyModal({
    open,
    onOpenChange,
    entity,
    variant = "security",
    defaultEmails,
    title,
    subtitle,
    onSend,
}: Props) {
    const [emails, setEmails] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [note, setNote] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prefersReducedMotion = useReducedMotion();

    /* ---------- Variant-aware copy ---------- */
    const defaultTitle =
        variant === "submission"
            ? "Notify Finance — Submission"
            : "Notify Finance";

    const defaultSubtitle =
        variant === "submission"
            ? `Banking docs pending for ${entity}`
            : entity;

    const finalTitle = title ?? defaultTitle;
    const finalSubtitle = subtitle ?? defaultSubtitle;

    /* ---------- Reset state on open ---------- */
    useEffect(() => {
        if (!open) return;

        const seed =
            defaultEmails ?? DEFAULT_EMAILS_BY_ENTITY[entity] ?? [];

        setEmails(seed);
        setInput("");
        setNote("");
        setSending(false);
        setError(null);

        const onKey = (e: KeyboardEvent) =>
            e.key === "Escape" && onOpenChange(false);
        window.addEventListener("keydown", onKey);

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, entity, defaultEmails, onOpenChange]);

    if (!open) return null;

    const removeEmail = (e: string) =>
        setEmails((prev) => prev.filter((x) => x !== e));

    const addEmail = () => {
        const v = input.trim();
        if (!v) return;
        if (!EMAIL_RE.test(v)) {
            setError("That doesn't look like a valid email address.");
            return;
        }
        if (emails.includes(v)) {
            setInput("");
            setError(null);
            return;
        }
        setEmails((prev) => [...prev, v]);
        setInput("");
        setError(null);
        inputRef.current?.focus();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addEmail();
        }
        if (e.key === "Backspace" && !input && emails.length > 0) {
            setEmails((prev) => prev.slice(0, -1));
        }
    };

    const handleSend = async () => {
        if (emails.length === 0 || sending) return;
        setSending(true);
        setError(null);
        try {
            await onSend?.(emails, note.trim() || undefined);
            onOpenChange(false);
        } catch (err) {
            setError(
                (err as Error)?.message || "Failed to send notification.",
            );
        } finally {
            setSending(false);
        }
    };

    const spring = prefersReducedMotion
        ? { duration: 0.15 }
        : {
              type: "spring" as const,
              stiffness: 380,
              damping: 30,
              mass: 0.9,
          };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[8vh] sm:pt-[10vh]">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => !sending && onOpenChange(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 20 }}
                        transition={spring}
                        className="relative z-10 w-full max-w-[600px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-16px_rgba(15,23,42,0.4)] ring-1 ring-black/5"
                    >
                        {/* ============ HEADER ============ */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-[#a97400] via-[#96660a] to-[#8f6100] px-6 py-4 text-white">
                            <span className="pointer-events-none absolute -top-8 right-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

                            <div className="relative flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                                        {variant === "submission" ? (
                                            <ShieldCheck className="h-4 w-4" />
                                        ) : (
                                            <Bell className="h-4 w-4" />
                                        )}
                                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#8f6100] bg-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-[15px] font-bold leading-tight">
                                            {finalTitle}
                                        </p>
                                        <p className="mt-0.5 truncate text-[11px] text-white/80">
                                            {finalSubtitle}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    disabled={sending}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/85 transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* ============ BODY ============ */}
                        <div className="space-y-5 px-6 pb-6 pt-5">
                            <p className="text-[12px] leading-relaxed text-slate-500">
                                {variant === "submission"
                                    ? "Finance will receive an email about pending banking documents for this tender."
                                    : "Recipients below are pre-filled for this entity. Add or remove addresses, then send the notice."}
                            </p>

                            {/* Recipients card */}
                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                                <div className="mb-2.5 flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Recipients
                                    </p>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/70 px-2 py-0.5 text-[10px] font-bold text-[#8a6a2b]">
                                        <Mail className="h-2.5 w-2.5" />
                                        {emails.length}
                                    </span>
                                </div>

                                {emails.length === 0 ? (
                                    <p className="py-3 text-center text-[11px] text-slate-400">
                                        No recipients yet. Add one below.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                        <AnimatePresence initial={false}>
                                            {emails.map((e) => (
                                                <motion.span
                                                    key={e}
                                                    layout
                                                    initial={{
                                                        opacity: 0,
                                                        scale: 0.9,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        scale: 0.9,
                                                    }}
                                                    transition={{
                                                        duration: 0.15,
                                                    }}
                                                    className="group inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-[#f4ead6] py-1 pl-2.5 pr-1 text-[11.5px] font-medium text-[#8a6a2b]"
                                                >
                                                    <Mail className="h-3 w-3 opacity-70" />
                                                    {e}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeEmail(e)
                                                        }
                                                        disabled={sending}
                                                        className="flex h-4 w-4 items-center justify-center rounded-full text-[#8a6a2b]/60 transition hover:bg-[#8a6a2b]/10 hover:text-[#8a6a2b] disabled:opacity-50"
                                                        aria-label={`Remove ${e}`}
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </button>
                                                </motion.span>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}

                                <div className="mt-3 flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={(e) => {
                                                setInput(e.target.value);
                                                if (error) setError(null);
                                            }}
                                            onKeyDown={onKeyDown}
                                            placeholder="Add another email…"
                                            disabled={sending}
                                            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 transition focus:border-[#a97400] focus:outline-none focus:ring-2 focus:ring-amber-300/40 disabled:cursor-not-allowed disabled:opacity-60"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addEmail}
                                        disabled={!input.trim() || sending}
                                        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Note to Finance
                                    <span className="font-normal normal-case text-slate-400">
                                        (optional)
                                    </span>
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={sending}
                                    rows={3}
                                    maxLength={500}
                                    placeholder={
                                        variant === "submission"
                                            ? "e.g. Please prepare the pay order by Thursday."
                                            : "e.g. Kindly arrange the bank guarantee at the earliest."
                                    }
                                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] leading-relaxed text-slate-800 placeholder:text-slate-400 transition focus:border-[#a97400] focus:outline-none focus:ring-2 focus:ring-amber-300/40 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                                <p className="mt-1 text-right text-[10px] text-slate-400">
                                    {note.length} / 500
                                </p>
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            height: 0,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            height: "auto",
                                        }}
                                        exit={{
                                            opacity: 0,
                                            height: 0,
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2">
                                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                                            <p className="text-[11.5px] leading-relaxed text-rose-800">
                                                {error}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Info pill */}
                            {emails.length > 0 && (
                                <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2">
                                    <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600" />
                                    <p className="text-[11px] leading-relaxed text-sky-800">
                                        {emails.length} recipient
                                        {emails.length === 1 ? "" : "s"} will
                                        receive the{" "}
                                        {variant === "submission"
                                            ? "banking-docs notice for this tender"
                                            : "security notice"}
                                        .
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ============ FOOTER ============ */}
                        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                disabled={sending}
                                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={sending || emails.length === 0}
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-br from-[#a97400] to-[#8f6100] px-4 text-[12px] font-bold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Sending…
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5" />
                                        Send Notification
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default SecurityNotifyModal;