// components/tender/chat/TenderChatWizard.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    MessageSquare,
    X,
    Minimize2,
    Send,
    Paperclip,
    Loader2,
    FileText,
    ShieldCheck,
    User as UserIcon,
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
    tenderId: string;
    tenderTitle?: string;
    open?: boolean;
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
    open = true,
    onOpenChange,
    onDismiss,
}: Props) {
    const { user } = useAuth();
    const socketCtx = useSocket();
    const socket = (socketCtx as any)?.socket ?? socketCtx;

    const [messages, setMessages] = useState<ChatMessage[]>(
        () => cachedMessages(tenderId) ?? [],
    );
    const [unread, setUnread] = useState<number>(
        () => cachedUnread(tenderId) ?? 0,
    );
    const [input, setInput] = useState("");
    const [pending, setPending] = useState<ChatAttachment[]>([]);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(
        () => cachedMessages(tenderId) === null,
    );
    const [isHovered, setIsHovered] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const sendingRef = useRef(false);

    useEffect(() => {
        sendingRef.current = sending;
    }, [sending]);

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
        if (!tenderId) return;
        refresh(false);
    }, [tenderId, open, refresh]);

    useTenderChatSocket(socket, tenderId, (incoming) => {
        const myRole = isMgmt ? "management" : "user";
        const fromOtherSide = incoming.senderRole !== myRole;

        setMessages((prev) => {
            if (prev.some((m) => m._id === incoming._id)) return prev;
            const next = [...prev, incoming];
            MSG_CACHE.set(tenderId, { data: next, ts: Date.now() });
            return next;
        });

        if (open) {
            setUnread(0);
        } else if (fromOtherSide) {
            setUnread((prev) => prev + 1);
        }
    });

    useEffect(() => {
        if (!open) return;
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, open]);

    const uploadOne = async (file: File) => {
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

    /* ============================================================
     * COLLAPSED BUBBLE
     * Renders when `open === false`. Stays fixed at bottom-right.
     * ============================================================ */
    if (!open) {
        return (
            <div className="fixed bottom-6 right-6 z-[99999]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    className="relative"
                >
                    {unread > 0 && (
                        <span className="pointer-events-none absolute inset-0 rounded-full bg-amber-500 opacity-40 animate-ping" />
                    )}

                    <button
                        type="button"
                        onClick={() => {
                            onOpenChange?.(true);
                            setUnread(0);
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-gradient-to-tr from-[#8f6100] to-[#b37c03] text-white shadow-2xl transition hover:scale-105 active:scale-95"
                        aria-label="Open chat"
                    >
                        <MessageSquare className="h-6 w-6" />

                        {unread > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow ring-2 ring-white">
                                {unread > 9 ? "9+" : unread}
                            </span>
                        )}
                    </button>

                    {/* Small X to dismiss bubble entirely */}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDismiss?.();
                        }}
                        className="absolute -left-1 -top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow transition hover:bg-rose-50 hover:text-rose-600"
                        title="Close chat completely"
                        aria-label="Close chat"
                    >
                        <X size={11} />
                    </button>

                    {/* Hover tooltip */}
                    {isHovered && (
                        <div className="pointer-events-none absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs text-white shadow-xl backdrop-blur-sm">
                            <span className="flex items-center gap-1.5 font-medium">
                                <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                                {tenderTitle
                                    ? tenderTitle.length > 24
                                        ? `${tenderTitle.slice(0, 24)}…`
                                        : tenderTitle
                                    : "Support Chat"}
                            </span>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    /* ============================================================
     * EXPANDED PANEL
     * Renders when `open === true`.
     * ============================================================ */
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-6 right-6 z-[99999] flex h-[560px] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#a97400] to-[#8f6100] px-4 py-3 text-white">
                <div className="flex min-w-0 items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">Tender Support</p>
                        <p className="truncate text-[10px] text-white/80">
                            {tenderTitle || "Live chat"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onOpenChange?.(false)}
                        className="cursor-pointer rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                        title="Minimize to floating bubble"
                        aria-label="Minimize"
                    >
                        <Minimize2 size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenChange?.(false)}
                        className="cursor-pointer rounded p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
                        title="Minimize to floating bubble"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Messages Body */}
            <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3"
            >
                {loading && messages.length === 0 && (
                    <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                )}

                {!loading && messages.length === 0 && (
                    <div className="mx-auto mt-12 max-w-[220px] text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                            <MessageSquare className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">
                            Start the conversation
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                            Ask questions, share details, or send attachments.
                        </p>
                    </div>
                )}

                {messages.map((m) => {
                    const mine = isMgmt
                        ? m.senderRole === "management"
                        : m.senderRole === "user";
                    const isMgmtMsg = m.senderRole === "management";

                    return (
                        <div
                            key={m._id}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${mine
                                    ? "rounded-br-sm bg-[#a97400] text-white"
                                    : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                                    }`}
                            >
                                {!mine && (
                                    <div className="mb-1 flex items-center gap-1.5">
                                        {isMgmtMsg ? (
                                            <ShieldCheck className="h-3 w-3 text-amber-600" />
                                        ) : (
                                            <UserIcon className="h-3 w-3 text-slate-400" />
                                        )}
                                        <span
                                            className={`text-[10px] font-semibold ${isMgmtMsg ? "text-amber-700" : "text-slate-500"
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
                                                    className="block overflow-hidden rounded-lg border border-black/10"
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
                                                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${mine
                                                        ? "bg-white/15 text-white"
                                                        : "bg-slate-100 text-slate-700"
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

                                <p
                                    className={`mt-1 text-right text-[9px] ${mine ? "text-white/70" : "text-slate-400"
                                        }`}
                                >
                                    {new Date(m.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Attachments Preview */}
            {pending.length > 0 && (
                <div className="flex shrink-0 flex-wrap gap-2 border-t border-slate-100 bg-white px-3 py-2">
                    {pending.map((a) => (
                        <div
                            key={a.url}
                            className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"
                        >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span className="max-w-[120px] truncate text-[11px] text-slate-600">
                                {a.name}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setPending((p) => p.filter((x) => x.url !== a.url))
                                }
                                className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-rose-600"
                                aria-label="Remove"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="shrink-0 border-t border-slate-100 bg-white p-3">
                <div className="flex items-end gap-2">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        aria-label="Attach file"
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Paperclip className="h-4 w-4" />
                        )}
                    </button>
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
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        rows={1}
                        placeholder="Type a message…"
                        className="max-h-24 min-h-[36px] flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#a97400] focus:bg-white focus:outline-none"
                    />

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || (!input.trim() && pending.length === 0)}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#a97400] text-white transition hover:bg-[#8f6100] disabled:opacity-50"
                        aria-label="Send"
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}