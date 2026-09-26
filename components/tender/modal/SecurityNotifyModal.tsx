// components/tender/modal/SecurityNotifyModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    Users,
    Building2,
    Check,
    Search,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import api from "@/lib/axios";

/* ============================================================
 * Entity → default pre-filled finance emails
 * ============================================================ */
const DEFAULT_EMAILS_BY_ENTITY: Record<string, string[]> = {
    "NGL-26": ["finance.ngl26@ngenit.com", "sadia.finance@ngenit.com"],
    "NG-26": ["finance.ng26@ngenit.com"],
    JT: ["finance.jt@ngenit.com"],
};

export type NotifyModalVariant = "security" | "submission";
type RecipientMode = "users" | "manual";

interface UserLite {
    _id: string;
    fullName: string;
    email: string;
    department?:
        | { _id: string; name: string; code?: string }
        | string
        | null;
    departmentId?:
        | { _id: string; name: string; code?: string }
        | string
        | null;
    isActive?: boolean;
}

interface DepartmentLite {
    _id: string;
    name: string;
    code?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;

    /** Shown in the header subtitle and info text */
    entity: string;

    /** "security" or "submission" — only affects default copy */
    variant?: NotifyModalVariant;

    /** Optional: override the default emails. */
    defaultEmails?: string[];

    /** Optional: custom header title. */
    title?: string;

    /** Optional: custom header subtitle. */
    subtitle?: string;

    /** Called with the emails + optional note — must return a promise */
    onSend?: (emails: string[], note?: string) => Promise<void> | void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Pull a department id string out of a user record no matter how it's shaped */
function deptIdOf(u: UserLite): string {
    const d: any = u.department ?? u.departmentId ?? null;
    if (!d) return "";
    if (typeof d === "string") return d;
    return d._id || "";
}

/* Pull a department display name */
function deptNameOf(u: UserLite): string {
    const d: any = u.department ?? u.departmentId ?? null;
    if (!d) return "";
    if (typeof d === "string") return "";
    return d.name || "";
}

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
    /* ---------- Recipient state ---------- */
    const [mode, setMode] = useState<RecipientMode>("users");
    const [emails, setEmails] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [note, setNote] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prefersReducedMotion = useReducedMotion();

    /* ---------- User + department data (only fetched when open) ---------- */
    const [users, setUsers] = useState<UserLite[]>([]);
    const [departments, setDepartments] = useState<DepartmentLite[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState<string>("");
    const [showUserPicker, setShowUserPicker] = useState(false);

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

    /* ---------- Reset state + load users/departments when opened ---------- */
    useEffect(() => {
        if (!open) return;

        const seed =
            defaultEmails ?? DEFAULT_EMAILS_BY_ENTITY[entity] ?? [];

        setEmails(seed);
        setInput("");
        setNote("");
        setSending(false);
        setError(null);
        setUserSearch("");
        setDeptFilter("");
        setShowUserPicker(false);
        setMode("users");

        /* Fetch users + departments (parallel) */
        let cancelled = false;
        (async () => {
            setLoadingUsers(true);
            try {
                const [uRes, dRes] = await Promise.all([
                    api.get("/users"),
                    api.get("/departments"),
                ]);
                if (cancelled) return;
                if (uRes.data?.success) {
                    setUsers(uRes.data.data || []);
                }
                if (dRes.data?.success) {
                    setDepartments(dRes.data.data || []);
                }
            } catch (err) {
                console.warn(
                    "[NotifyModal] failed to load users/departments",
                    err,
                );
            } finally {
                if (!cancelled) setLoadingUsers(false);
            }
        })();

        const onKey = (e: KeyboardEvent) =>
            e.key === "Escape" && onOpenChange(false);
        window.addEventListener("keydown", onKey);

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            cancelled = true;
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, entity, defaultEmails, onOpenChange]);

    /* ---------- Derived: filtered user list ---------- */
    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        return users.filter((u) => {
            if (u.isActive === false) return false;

            // Department filter
            if (deptFilter) {
                if (deptIdOf(u) !== deptFilter) return false;
            }

            if (!q) return true;
            return (
                u.fullName?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q)
            );
        });
    }, [users, userSearch, deptFilter]);

    /* ---------- Derived: departments that actually have users ---------- */
    const departmentOptions = useMemo(() => {
        // Fall back to the global list if /departments isn't populated
        if (departments.length > 0) return departments;

        // Derive from users
        const map = new Map<string, DepartmentLite>();
        for (const u of users) {
            const id = deptIdOf(u);
            if (!id) continue;
            if (!map.has(id)) {
                map.set(id, {
                    _id: id,
                    name: deptNameOf(u) || "Department",
                });
            }
        }
        return Array.from(map.values());
    }, [departments, users]);

    if (!open) return null;

    /* ---------- Handlers ---------- */
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

    const toggleUserEmail = (email: string) => {
        setEmails((prev) =>
            prev.includes(email)
                ? prev.filter((e) => e !== email)
                : [...prev, email],
        );
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
                                    : "Pick users or enter addresses manually, then send the notice."}
                            </p>

                            {/* ============ Mode toggle ============ */}
                            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                {(
                                    [
                                        {
                                            id: "users",
                                            label: "Pick Users",
                                            icon: Users,
                                        },
                                        {
                                            id: "manual",
                                            label: "Enter Emails",
                                            icon: Mail,
                                        },
                                    ] as const
                                ).map((m) => {
                                    const active = mode === m.id;
                                    const Icon = m.icon;
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => {
                                                setMode(m.id);
                                                setError(null);
                                            }}
                                            disabled={sending}
                                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-semibold transition ${
                                                active
                                                    ? "bg-[#a97400] text-white shadow-sm"
                                                    : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {m.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* ============ Recipients card ============ */}
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
                                        {mode === "users"
                                            ? "No recipients yet — pick a user below."
                                            : "No recipients yet. Add one below."}
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

                                {/* ============ Mode: manual email entry ============ */}
                                {mode === "manual" && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={input}
                                                onChange={(e) => {
                                                    setInput(
                                                        e.target.value,
                                                    );
                                                    if (error)
                                                        setError(null);
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
                                )}

                                {/* ============ Mode: user picker ============ */}
                                {mode === "users" && (
                                    <div className="mt-3 space-y-2.5">
                                        {/* Filters */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="relative flex-1 min-w-[180px]">
                                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={userSearch}
                                                    onChange={(e) =>
                                                        setUserSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Search users by name or email…"
                                                    disabled={sending}
                                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12.5px] text-slate-800 placeholder:text-slate-400 transition focus:border-[#a97400] focus:outline-none focus:ring-2 focus:ring-amber-300/40 disabled:opacity-60"
                                                />
                                            </div>

                                            <div className="relative min-w-[170px]">
                                                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                <select
                                                    value={deptFilter}
                                                    onChange={(e) =>
                                                        setDeptFilter(
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={sending}
                                                    className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-7 text-[12px] font-medium text-slate-700 transition focus:border-[#a97400] focus:outline-none focus:ring-2 focus:ring-amber-300/40 disabled:opacity-60"
                                                >
                                                    <option value="">
                                                        All departments
                                                    </option>
                                                    {departmentOptions.map(
                                                        (d) => (
                                                            <option
                                                                key={d._id}
                                                                value={d._id}
                                                            >
                                                                {d.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        {/* User list */}
                                        <div className="max-h-[220px] overflow-y-auto rounded-lg border border-slate-200 bg-white">
                                            {loadingUsers ? (
                                                <div className="flex items-center justify-center gap-2 p-6 text-slate-400">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    <span className="text-[11.5px]">
                                                        Loading users…
                                                    </span>
                                                </div>
                                            ) : filteredUsers.length === 0 ? (
                                                <div className="p-6 text-center text-[11.5px] text-slate-400">
                                                    No users match the current
                                                    filter.
                                                </div>
                                            ) : (
                                                <ul className="divide-y divide-slate-100">
                                                    {filteredUsers.map(
                                                        (u) => {
                                                            const checked =
                                                                emails.includes(
                                                                    u.email,
                                                                );
                                                            return (
                                                                <li
                                                                    key={
                                                                        u._id
                                                                    }
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            toggleUserEmail(
                                                                                u.email,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            sending
                                                                        }
                                                                        className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 disabled:opacity-60 ${
                                                                            checked
                                                                                ? "bg-amber-50/50"
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        <div className="flex min-w-0 items-center gap-2.5">
                                                                            <div
                                                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10.5px] font-bold ${
                                                                                    checked
                                                                                        ? "bg-[#a97400] text-white"
                                                                                        : "bg-slate-100 text-slate-600"
                                                                                }`}
                                                                            >
                                                                                {u.fullName
                                                                                    ?.charAt(
                                                                                        0,
                                                                                    )
                                                                                    .toUpperCase()}
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="truncate text-[12px] font-semibold text-slate-800">
                                                                                    {
                                                                                        u.fullName
                                                                                    }
                                                                                </p>
                                                                                <p className="truncate text-[10.5px] text-slate-500">
                                                                                    {
                                                                                        u.email
                                                                                    }
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex shrink-0 items-center gap-2">
                                                                            {deptNameOf(
                                                                                u,
                                                                            ) && (
                                                                                <span className="hidden rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 sm:inline-block">
                                                                                    {deptNameOf(
                                                                                        u,
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                            <span
                                                                                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                                                                    checked
                                                                                        ? "border-[#a97400] bg-[#a97400] text-white"
                                                                                        : "border-slate-300 bg-white text-transparent"
                                                                                }`}
                                                                            >
                                                                                <Check className="h-3 w-3" />
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                </li>
                                                            );
                                                        },
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ============ Note ============ */}
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

                            {/* ============ Error ============ */}
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

                            {/* ============ Info pill ============ */}
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