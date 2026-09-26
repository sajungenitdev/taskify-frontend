// components/tender/chat/TenderChatWizard.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
    MessageSquare,
    X,
    Minus,
    Send,
    Paperclip,
    Loader2,
    FileText,
    ShieldCheck,
    User as UserIcon,
    Check,
    MoveUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import {
    tenderChatApi,
    type ChatMessage,
    type ChatAttachment,
} from "@/lib/api/tenderChat.api";
import { useTenderChatSocket } from "@/hooks/tender/useTenderChatSocket";
import Link from "next/link";

function fullFileUrl(url: string) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("blob:") || url.startsWith("data:")) return url;
    const base =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
    const origin = base.replace(/\/api\/v1\/?$/, "");
    return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

interface Props {
    tenderId?: string | null;
    tenderTitle?: string;
    open?: boolean;
    globalUnread?: number;
    onOpenChange?: (o: boolean) => void;
    onDismiss?: () => void;
}

const MGMT_ROLES = [
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
    "project_manager",
];

const STALE_MS = 15_000;
const MSG_CACHE = new Map<string, { data: ChatMessage[]; ts: number }>();
const UNREAD_CACHE = new Map<string, { data: number; ts: number }>();
const MSG_IN_FLIGHT = new Map<string, Promise<ChatMessage[]>>();
const UNREAD_IN_FLIGHT = new Map<string, Promise<number>>();

function cachedMessages(id: string) {
    const hit = MSG_CACHE.get(id);
    if (hit && Date.now() - hit.ts < STALE_MS) return hit.data;
    return null;
}

function cachedUnread(id: string) {
    const hit = UNREAD_CACHE.get(id);
    if (hit && Date.now() - hit.ts < STALE_MS) return hit.data;
    return null;
}

async function fetchMessagesOnce(id: string, force = false) {
    if (!force) {
        const c = cachedMessages(id);
        if (c) return c;
        const p = MSG_IN_FLIGHT.get(id);
        if (p) return p;
    }
    const p = tenderChatApi.list(id).then((rows) => {
        MSG_CACHE.set(id, { data: rows, ts: Date.now() });
        MSG_IN_FLIGHT.delete(id);
        return rows;
    });
    MSG_IN_FLIGHT.set(id, p);
    return p;
}

async function fetchUnreadOnce(id: string, force = false) {
    if (!force) {
        const c = cachedUnread(id);
        if (c !== null) return c;
        const p = UNREAD_IN_FLIGHT.get(id);
        if (p) return p;
    }
    const p = tenderChatApi.unread(id).then((n) => {
        UNREAD_CACHE.set(id, { data: n, ts: Date.now() });
        UNREAD_IN_FLIGHT.delete(id);
        return n;
    });
    UNREAD_IN_FLIGHT.set(id, p);
    return p;
}

export default function TenderChatWizard({
    tenderId,
    tenderTitle,
    open = false,
    globalUnread,
    onOpenChange,
    onDismiss,
}: Props) {
    const { user } = useAuth();
    const socketCtx = useSocket();
    const socket = (socketCtx as any)?.socket ?? socketCtx;

    const prefersReducedMotion = useReducedMotion();

    const [messages, setMessages] = useState<ChatMessage[]>(
        () => (tenderId ? cachedMessages(tenderId) ?? [] : []),
    );
    const [unread, setUnread] = useState<number>(
        () => (tenderId ? cachedUnread(tenderId) ?? 0 : 0),
    );
    const [input, setInput] = useState("");
    const [pending, setPending] = useState<ChatAttachment[]>([]);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(
        () => (tenderId ? cachedMessages(tenderId) === null : false),
    );
    const [isHovered, setIsHovered] = useState(false);
    const [justArrived, setJustArrived] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sendingRef = useRef(false);
    const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
    const MotionLink = motion.create(Link);

    const effectiveUnread =
        typeof globalUnread === "number" ? globalUnread : unread;

    useEffect(() => {
        sendingRef.current = sending;
    }, [sending]);

    useEffect(() => {
        return () => {
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        };
    }, []);

    const isMgmt = useMemo(
        () => MGMT_ROLES.includes(user?.role || ""),
        [user?.role],
    );

    const refresh = useCallback(
        async (force = false) => {
            if (!tenderId) return;
            const hasCache = !!cachedMessages(tenderId);
            if (!hasCache) setLoading(true);

            const [msgsResult, unreadResult] = await Promise.allSettled([
                fetchMessagesOnce(tenderId, force),
                fetchUnreadOnce(tenderId, force),
            ]);

            if (msgsResult.status === "fulfilled") {
                setMessages(msgsResult.value);
            }
            if (unreadResult.status === "fulfilled") {
                setUnread(unreadResult.value);
            }

            setLoading(false);
        },
        [tenderId],
    );

    useEffect(() => {
        if (!tenderId) {
            setMessages([]);
            setUnread(0);
            setLoading(false);
            return;
        }
        refresh(false);
    }, [tenderId, open, refresh]);

    useTenderChatSocket(socket, tenderId || "", (incoming) => {
        if (!tenderId) return;
        const myRole = isMgmt ? "management" : "user";
        const fromOtherSide = incoming.senderRole !== myRole;

        setMessages((prev) => {
            if (prev.some((m) => m._id === incoming._id)) return prev;
            const next = [...prev, incoming];
            MSG_CACHE.set(tenderId, { data: next, ts: Date.now() });
            return next;
        });

        if (fromOtherSide) {
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            setJustArrived(incoming._id);
            flashTimerRef.current = setTimeout(() => setJustArrived(null), 900);
        }

        if (open) {
            setUnread(0);
        } else if (fromOtherSide) {
            setUnread((prev) => prev + 1);
        }
    });

    useEffect(() => {
        if (!open) return;
        requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: prefersReducedMotion ? "auto" : "smooth",
            });
        });
    }, [messages, open, prefersReducedMotion]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
    }, [input]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange?.(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onOpenChange]);

    const uploadOne = async (file: File) => {
        if (!tenderId) return;
        setUploading(true);
        try {
            const att = await tenderChatApi.upload(tenderId, file);
            setPending((p) => [...p, att]);
        } catch (e) {
            toast.error((e as Error).message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const uploadMany = async (files: File[]) => {
        await Promise.all(files.map((f) => uploadOne(f)));
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        if (!tenderId) return;
        const items = Array.from(e.clipboardData?.items || []);
        const imageFiles: File[] = [];
        const otherFiles: File[] = [];

        for (const item of items) {
            if (item.kind !== "file") continue;
            const f = item.getAsFile();
            if (!f) continue;
            if (f.type.startsWith("image/")) imageFiles.push(f);
            else otherFiles.push(f);
        }

        if (imageFiles.length || otherFiles.length) {
            e.preventDefault();
            await uploadMany([...imageFiles, ...otherFiles]);
            toast.success("Pasted attachment");
        }
    };

    const handleSend = async () => {
        if (!tenderId) return;
        const text = input.trim();
        if (!text && pending.length === 0) return;

        if (sendingRef.current) return;
        sendingRef.current = true;
        setSending(true);

        const tempId = `temp-${Date.now()}`;
        const optimistic: ChatMessage = {
            _id: tempId,
            tenderId,
            sender: (user as any)?.id || (user as any)?._id || "",
            senderRole: isMgmt ? "management" : "user",
            senderName: user?.fullName || "You",
            senderPhoto: user?.profilePhoto,
            body: text,
            attachments: pending,
            readByUser: true,
            readByMgmt: false,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimistic]);
        setInput("");
        const sentPending = pending;
        setPending([]);

        try {
            const msg = await tenderChatApi.send(tenderId, {
                body: text,
                attachments: sentPending,
            });

            setMessages((prev) => {
                const next = prev.map((m) => (m._id === tempId ? msg : m));
                MSG_CACHE.set(tenderId, { data: next, ts: Date.now() });
                return next;
            });
        } catch (e) {
            toast.error((e as Error).message || "Send failed");
            setMessages((prev) => prev.filter((m) => m._id !== tempId));
            setInput(text);
            setPending(sentPending);
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    const handleOpen = () => {
        setIsHovered(false);
        onOpenChange?.(true);
        setUnread(0);
    };

    const handleMinimize = () => {
        onOpenChange?.(false);
    };

    // const handleClose = () => {
    //     onOpenChange?.(false);
    //     onDismiss?.();
    // };

    return (
        <>
            <AnimatePresence mode="wait">
                {/* ============================================================
         * FLOATING BUTTON (Minimized State)
         * ============================================================ */}
                {!open ? (
                    <motion.div
                        key="floating-btn"
                        initial={{ opacity: 0, scale: 0.6, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, y: 15 }}
                        transition={{
                            type: prefersReducedMotion ? "tween" : "spring",
                            stiffness: 400,
                            damping: 28,
                            mass: 0.8,
                        }}
                        className="fixed bottom-2 right-3 z-[99999] origin-bottom-right"
                    >
                        <div className="relative">
                            <span className="pointer-events-none absolute -inset-1.5 rounded-full bg-amber-500/25 blur-lg" />

                            {effectiveUnread > 0 && !prefersReducedMotion && (
                                <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-amber-500 opacity-40" />
                            )}

                            <motion.button
                                type="button"
                                onClick={handleOpen}
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                whileHover={prefersReducedMotion ? undefined : { scale: 1.07 }}
                                whileTap={{ scale: 0.94 }}
                                aria-label="Open support chat"
                                className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-gradient-to-tr from-[#8f6100] via-[#a97400] to-[#c98e18] text-white shadow-[0_12px_32px_-6px_rgba(143,97,0,0.55)] transition-shadow hover:shadow-[0_16px_36px_-6px_rgba(143,97,0,0.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60"
                            >
                                <MessageSquare className="h-6 w-6 drop-shadow-sm" />
                                <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/30 via-white/10 to-transparent" />

                                {effectiveUnread > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 22,
                                        }}
                                        className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-white"
                                    >
                                        {effectiveUnread > 9 ? "9+" : effectiveUnread}
                                    </motion.span>
                                )}
                            </motion.button>

                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                        transition={{ duration: 0.14 }}
                                        className="pointer-events-none absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-xl border border-white/10 bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur-md"
                                    >
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                                            {tenderTitle
                                                ? tenderTitle.length > 26
                                                    ? `${tenderTitle.slice(0, 26)}…`
                                                    : tenderTitle
                                                : effectiveUnread > 0
                                                    ? `${effectiveUnread} unread message${effectiveUnread > 1 ? "s" : ""}`
                                                    : "Tender Support"}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    /* ============================================================
                     * EXPANDED CHAT PANEL (Open State)
                     * ============================================================ */
                    <motion.div
                        key="chat-panel"
                        initial={{ opacity: 0, scale: 0.85, y: 25 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{
                            opacity: 0,
                            scale: 0.85,
                            y: 25,
                            transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
                        }}
                        transition={{
                            type: prefersReducedMotion ? "tween" : "spring",
                            stiffness: 380,
                            damping: 30,
                            mass: 0.85,
                        }}
                        className="fixed bottom-6 right-6 z-[99999] flex h-[580px] w-[380px] max-w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#a97400] via-[#96660a] to-[#8f6100] px-4 py-3 text-white">
                            <span className="pointer-events-none absolute -top-8 right-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

                            <div className="relative flex min-w-0 items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#8f6100] bg-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold leading-tight">
                                            Tender Support
                                        </p>
                                        <p className="truncate text-[10px] text-white/80">
                                            {tenderTitle || "Live chat · online"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <MotionLink
                                        href="/tenders/support"
                                        whileTap={{ scale: 0.9 }}
                                        className="cursor-pointer rounded-md p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                        title="Open Support Inbox"
                                        aria-label="Open Support Inbox"
                                    >
                                        <MoveUpRight size={16} />
                                    </MotionLink>
                                    <motion.button
                                        type="button"
                                        onClick={handleMinimize}
                                        whileTap={{ scale: 0.9 }}
                                        className="cursor-pointer rounded-md p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                        title="Minimize chat"
                                        aria-label="Minimize"
                                    >
                                        <Minus size={16} />
                                    </motion.button>
                                    {/* <motion.button
                                        type="button"
                                        onClick={handleClose}
                                        whileTap={{ scale: 0.9 }}
                                        className="cursor-pointer rounded-md p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                        title="Close chat"
                                        aria-label="Close"
                                    >
                                        <X size={16} />
                                    </motion.button> */}
                                </div>
                            </div>
                        </div>

                        {/* Messages Body */}
                        <div
                            ref={scrollRef}
                            className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-50/90 to-slate-100/70 p-3.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
                        >
                            {!tenderId ? (
                                <div className="mx-auto mt-16 max-w-[240px] text-center">
                                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 shadow-inner">
                                        <MessageSquare className="h-6 w-6 text-amber-600" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-700">
                                        Select a Conversation
                                    </p>
                                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                                        Click "Reply" or "Talk" on any tender in the inbox to begin chatting.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {loading && messages.length === 0 && (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                                        </div>
                                    )}

                                    {!loading && messages.length === 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mx-auto mt-14 max-w-[240px] text-center"
                                        >
                                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 shadow-inner">
                                                <MessageSquare className="h-6 w-6 text-amber-600" />
                                            </div>
                                            <p className="text-xs font-semibold text-slate-700">
                                                Start the conversation
                                            </p>
                                            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                                                Ask questions, share details, or upload attachments.
                                            </p>
                                        </motion.div>
                                    )}

                                    <AnimatePresence initial={false}>
                                        {messages.map((m) => {
                                            const mine = isMgmt
                                                ? m.senderRole === "management"
                                                : m.senderRole === "user";
                                            const isMgmtMsg = m.senderRole === "management";
                                            const flash = justArrived === m._id;

                                            return (
                                                <motion.div
                                                    key={m._id}
                                                    layout
                                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.96 }}
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 420,
                                                        damping: 32,
                                                    }}
                                                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`group relative max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm transition-shadow ${mine
                                                                ? "rounded-br-md bg-gradient-to-br from-[#a97400] to-[#8f6100] text-white shadow-[0_4px_16px_-4px_rgba(143,97,0,0.5)]"
                                                                : "rounded-bl-md border border-slate-200/90 bg-white text-slate-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]"
                                                            } ${flash ? "ring-2 ring-amber-400" : ""}`}
                                                    >
                                                        {!mine && (
                                                            <div className="mb-1 flex items-center gap-1.5">
                                                                {isMgmtMsg ? (
                                                                    <ShieldCheck className="h-3 w-3 text-amber-600" />
                                                                ) : (
                                                                    <UserIcon className="h-3 w-3 text-slate-400" />
                                                                )}
                                                                <span
                                                                    className={`text-[10px] font-semibold ${isMgmtMsg
                                                                            ? "text-amber-700"
                                                                            : "text-slate-500"
                                                                        }`}
                                                                >
                                                                    {isMgmtMsg ? "Support" : m.senderName}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {m.attachments?.length > 0 && (
                                                            <div className="mb-2 space-y-1.5">
                                                                {m.attachments.map((a, i) =>
                                                                    a.kind === "image" ? (
                                                                        <a
                                                                            key={i}
                                                                            href={fullFileUrl(a.url)}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="block overflow-hidden rounded-xl border border-black/10 ring-1 ring-black/5 transition-transform hover:scale-[1.01]"
                                                                        >
                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                            <img
                                                                                src={fullFileUrl(a.url)}
                                                                                alt={a.name}
                                                                                className="max-h-48 w-full object-cover"
                                                                                loading="lazy"
                                                                            />
                                                                        </a>
                                                                    ) : (
                                                                        <a
                                                                            key={i}
                                                                            href={fullFileUrl(a.url)}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] transition ${mine
                                                                                    ? "bg-white/15 text-white hover:bg-white/25"
                                                                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                                                }`}
                                                                        >
                                                                            <FileText className="h-3.5 w-3.5 shrink-0" />
                                                                            <span className="truncate">{a.name}</span>
                                                                        </a>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}

                                                        {m.body && (
                                                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                                {m.body}
                                                            </p>
                                                        )}

                                                        <div
                                                            className={`mt-1 flex items-center justify-end gap-1 text-[9px] ${mine ? "text-white/75" : "text-slate-400"
                                                                }`}
                                                        >
                                                            <span>
                                                                {new Date(m.createdAt).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                            {mine && <Check className="h-2.5 w-2.5" />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {sending && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                className="flex justify-end"
                                            >
                                                <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-[#a97400] to-[#8f6100] px-3 py-2 shadow-sm">
                                                    <div className="flex items-center gap-1">
                                                        {[0, 1, 2].map((i) => (
                                                            <motion.span
                                                                key={i}
                                                                className="h-1.5 w-1.5 rounded-full bg-white/90"
                                                                animate={{
                                                                    y: [0, -3, 0],
                                                                    opacity: [0.5, 1, 0.5],
                                                                }}
                                                                transition={{
                                                                    duration: 0.9,
                                                                    repeat: Infinity,
                                                                    delay: i * 0.15,
                                                                    ease: "easeInOut",
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>

                        {/* Attachments Preview Area */}
                        <AnimatePresence>
                            {pending.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="shrink-0 overflow-hidden border-t border-slate-100 bg-white"
                                >
                                    <div className="flex flex-wrap gap-2 px-3 py-2">
                                        {pending.map((a) => (
                                            <motion.div
                                                key={a.url}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 shadow-sm"
                                            >
                                                <FileText className="h-3.5 w-3.5 text-slate-500" />
                                                <span className="max-w-[120px] truncate text-[11px] text-slate-600">
                                                    {a.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setPending((p) =>
                                                            p.filter((x) => x.url !== a.url),
                                                        )
                                                    }
                                                    className="cursor-pointer rounded p-0.5 text-slate-400 transition hover:text-rose-600"
                                                    aria-label="Remove attachment"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Bar */}
                        <div className="shrink-0 border-t border-slate-100 bg-white p-3">
                            <div className="flex items-end gap-2">
                                <motion.button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={uploading || !tenderId}
                                    whileTap={{ scale: 0.94 }}
                                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Attach file"
                                >
                                    {uploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Paperclip className="h-4 w-4" />
                                    )}
                                </motion.button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length) uploadMany(files);
                                        e.target.value = "";
                                    }}
                                />

                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    disabled={!tenderId}
                                    onChange={(e) => setInput(e.target.value)}
                                    onPaste={handlePaste}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                    rows={1}
                                    placeholder={
                                        tenderId
                                            ? "Type a message…"
                                            : "Select a conversation first…"
                                    }
                                    className="max-h-24 min-h-[36px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 transition focus:border-[#a97400] focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                                />

                                <motion.button
                                    type="button"
                                    onClick={handleSend}
                                    disabled={
                                        !tenderId ||
                                        sending ||
                                        (!input.trim() && pending.length === 0)
                                    }
                                    whileTap={{ scale: 0.94 }}
                                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#a97400] to-[#8f6100] text-white shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Send message"
                                >
                                    {sending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}