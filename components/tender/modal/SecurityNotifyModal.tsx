// components/tender/security/SecurityNotifyModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { X, Plus } from "lucide-react";

/* ============================================================
 * Entity → pre-filled finance emails
 * (adjust to match your real data source if you have one)
 * ============================================================ */
const EMAILS_BY_ENTITY: Record<string, string[]> = {
    "NGL-26": ["finance.ngl26@ngenit.com", "sadia.finance@ngenit.com"],
    "NG-26": ["finance.ng26@ngenit.com"],
    JT: ["finance.jt@ngenit.com"],
};

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    entity: string;
    onSend?: (emails: string[]) => Promise<void> | void;
}

export function SecurityNotifyModal({
    open,
    onOpenChange,
    entity,
    onSend,
}: Props) {
    const [emails, setEmails] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Pre-fill emails when the modal opens */
    useEffect(() => {
        if (!open) return;
        setEmails(EMAILS_BY_ENTITY[entity] ?? []);
        setInput("");
        const onKey = (e: KeyboardEvent) =>
            e.key === "Escape" && onOpenChange(false);
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, entity, onOpenChange]);

    if (!open) return null;

    const removeEmail = (e: string) =>
        setEmails((prev) => prev.filter((x) => x !== e));

    const addEmail = () => {
        const v = input.trim();
        if (!v) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return;
        if (emails.includes(v)) {
            setInput("");
            return;
        }
        setEmails((prev) => [...prev, v]);
        setInput("");
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
        if (emails.length === 0) return;
        setSending(true);
        try {
            await onSend?.(emails);
            onOpenChange(false);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh]">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-[580px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
                {/* Close button */}
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                    aria-label="Close"
                >
                    <X className="h-3.5 w-3.5" />
                </button>

                {/* Body */}
                <div className="px-6 pb-6 pt-6">
                    {/* Title */}
                    <h2 className="text-[20px] font-bold tracking-tight text-slate-900">
                        Notify Finance — {entity}
                    </h2>
                    <p className="mt-1 text-[12px] text-slate-500">
                        Recipients below are pre-filled for this entity — add more if
                        needed, then send.
                    </p>

                    {/* Email chips */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {emails.map((e) => (
                            <span
                                key={e}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#f4ead6] px-3 py-1.5 text-[12px] font-medium text-[#8a6a2b]"
                            >
                                {e}
                                <button
                                    type="button"
                                    onClick={() => removeEmail(e)}
                                    className="flex h-4 w-4 items-center justify-center rounded-full text-[#8a6a2b]/70 transition hover:bg-[#8a6a2b]/10 hover:text-[#8a6a2b]"
                                    aria-label={`Remove ${e}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Input + Add */}
                    <div className="mt-3 flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Add another email address..."
                            className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={addEmail}
                            disabled={!input.trim()}
                            className="inline-flex h-10 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                        </button>
                    </div>

                    {/* Send */}
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || emails.length === 0}
                        className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#b8860b] px-5 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#a17409] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {sending ? "Sending…" : "Send Notification"}
                    </button>
                </div>
            </div>
        </div>
    );
}