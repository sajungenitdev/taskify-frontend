// components/tender/chat/TenderChatWizard.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    MessageSquare,
    X,
    Minimize2,
    Maximize2,
    Send,
    Paperclip,
    Loader2,
    Image as ImageIcon,
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

/* ---------- Resolve backend-relative /uploads/... URLs ---------- */
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
}

const MGMT_ROLES = [
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
    "project_manager",
];

/**
 * Two messages are "the same" if sender + body + timestamp are
 * within 2 seconds. Swallows the socket echo of your own message
 * before its POST response replaces the optimistic bubble.
 */
function looksLikeDuplicate(a: ChatMessage, b: ChatMessage) {
    if (a._id === b._id) return true;
    if (a.sender !== b.sender) return false;
    if ((a.body || "").trim() !== (b.body || "").trim()) return false;
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (isNaN(ta) || isNaN(tb)) return false;
    return Math.abs(ta - tb) < 2000;
}

export default function TenderChatWizard({
    tenderId,
    tenderTitle,
    open: openProp,
    onOpenChange,
}: Props) {
    const { user } = useAuth();
    const socketCtx = useSocket();
    const socket = (socketCtx as any)?.socket ?? socketCtx;

    const isControlled = openProp !== undefined;
    const [openState, setOpenState] = useState(false);
    const open = isControlled ? (openProp as boolean) : openState;
    const setOpen = useCallback(
        (v: boolean) => {
            if (isControlled) onOpenChange?.(v);
            else setOpenState(v);
        },
        [isControlled, onOpenChange],
    );

    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unread, setUnread] = useState(0);
    const [input, setInput] = useState("");
    const [pending, setPending] = useState<ChatAttachment[]>([]);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

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

    /* ---------------- initial fetch ---------------- */
    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const list = await tenderChatApi.list(tenderId);
            setMessages(list);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    }, [tenderId]);

    const fetchUnread = useCallback(async () => {
        try {
            const n = await tenderChatApi.unread(tenderId);
            setUnread(n);
        } catch {
            /* ignore */
        }
    }, [tenderId]);

    useEffect(() => {
        if (!tenderId) return;
        fetchUnread();
        if (open) fetchMessages();
    }, [tenderId, open, fetchMessages, fetchUnread]);

    /* ---------------- REAL-TIME + NOTIFICATIONS ---------------- */
    useTenderChatSocket(socket, tenderId, (incoming) => {
        /* Which side is this message from? */
        const myRole = isMgmt ? "management" : "user";
        const fromOtherSide = incoming.senderRole !== myRole;

        setMessages((prev) => {
            if (prev.some((m) => m._id === incoming._id)) return prev;
            if (prev.some((m) => looksLikeDuplicate(m, incoming))) return prev;
            return [...prev, incoming];
        });

        if (open) setUnread(0);

        /* Desktop notification for messages from the other side */
        if (fromOtherSide) {
            import("@/services/chatNotification.service").then(
                ({ default: CNS }) => {
                    CNS.notifyTenderIfAway({
                        senderName: incoming.senderName || "Support",
                        messageContent: incoming.body || "",
                        tenderTitle: tenderTitle || "Tender",
                        tenderId,
                        messageId: incoming._id,
                    });
                },
            );
        }
    });

    /* ---------------- Notification click → open wizard ---------------- */
    useEffect(() => {
        const onFocus = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.tenderId === tenderId) {
                setOpen(true);
                setMinimized(false);
                setTimeout(() => fetchUnread(), 200);
            }
        };
        window.addEventListener("tender-chat:focus", onFocus);
        return () => window.removeEventListener("tender-chat:focus", onFocus);
    }, [tenderId, setOpen, fetchUnread]);

    /* ---------------- Tab title unread badge ---------------- */
    useEffect(() => {
        if (typeof document === "undefined") return;
        const original = document.title;
        if (unread > 0 && !open) {
            document.title = `(${unread > 9 ? "9+" : unread}) ${original}`;
        }
        return () => {
            document.title = original;
        };
    }, [unread, open]);

    /* ---------------- auto-scroll ---------------- */
    useEffect(() => {
        if (!open || minimized) return;
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, open, minimized]);

    /* ---------------- upload ---------------- */
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

    /* ---------------- paste ---------------- */
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
            toast.success("Pasted — ready to send");
        }
    };

    /* ---------------- send (optimistic + guarded) ---------------- */
    const handleSend = async () => {
        const text = input.trim();
        if (!text && pending.length === 0) return;

        if (sendingRef.current) return;
        sendingRef.current = true;
        setSending(true);

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
                if (prev.some((m) => m._id === msg._id)) {
                    return prev.filter((m) => m._id !== tempId);
                }
                return prev.map((m) => (m._id === tempId ? msg : m));
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

    const removePending = (url: string) =>
        setPending((p) => p.filter((a) => a.url !== url));

    /* ---------------- drag & drop ---------------- */
    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length) await uploadMany(files);
    };

    /* ---------------- close ---------------- */
    const close = () => {
        setOpen(false);
        setTimeout(() => fetchUnread(), 200);
    };

    /* ============================================================
     * Collapsed button
     * ============================================================ */
    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-4 right-24 z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 transition hover:scale-105"
                aria-label="Open tender support chat"
            >
                <MessageSquare className="h-6 w-6" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[10px] font-bold text-white">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>
        );
    }

    /* ============================================================
     * Open panel
     * ============================================================ */
    return (
        <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`fixed bottom-4 right-24 z-[95] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all ${minimized ? "h-14 w-80" : "h-[560px] w-96"
                }`}
        >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#a97400] to-[#8f6100] px-4 py-3 text-white">
                <div className="flex min-w-0 items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">Tender Support</p>
                        <p className="truncate text-[10px] text-white/75">
                            {tenderTitle || "Live chat"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMinimized((v) => !v)}
                        className="rounded p-1 text-white/75 hover:bg-white/10 hover:text-white"
                    >
                        {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                    <button
                        onClick={close}
                        className="rounded p-1 text-white/75 hover:bg-white/10 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {!minimized && (
                <>
                    {/* Messages */}
                    <div
                        ref={scrollRef}
                        className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3"
                    >
                        {loading && (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                            </div>
                        )}

                        {!loading && messages.length === 0 && (
                            <div className="mx-auto mt-8 max-w-[220px] text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                                    <MessageSquare className="h-5 w-5 text-amber-600" />
                                </div>
                                <p className="text-xs font-semibold text-slate-700">
                                    Start the conversation
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Ask about this tender, paste screenshots, or attach files.
                                </p>
                            </div>
                        )}

                        {messages.map((m) => {
                            const mine = isMgmt
                                ? m.senderRole === "management"
                                : m.senderRole === "user";
                            const isMgmtMsg = m.senderRole === "management";
                            const isOptimistic = m._id.startsWith("temp-");

                            return (
                                <div
                                    key={m._id}
                                    className={`flex ${mine ? "justify-end" : "justify-start"} ${isOptimistic ? "opacity-60" : ""
                                        }`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${mine
                                                ? "rounded-br-md bg-[#a97400] text-white"
                                                : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
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
                                            <div className="mb-1.5 space-y-1.5">
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
                                                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${mine
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
                                            <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                                                {m.body}
                                            </p>
                                        )}

                                        <p
                                            className={`mt-1 text-right text-[9px] ${mine ? "text-white/60" : "text-slate-400"
                                                }`}
                                        >
                                            {isOptimistic
                                                ? "sending…"
                                                : new Date(m.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pending attachments */}
                    {pending.length > 0 && (
                        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-3 py-2">
                            {pending.map((a) => (
                                <div
                                    key={a.url}
                                    className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"
                                >
                                    {a.kind === "image" ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={fullFileUrl(a.url)}
                                            alt={a.name}
                                            className="h-8 w-8 rounded object-cover"
                                        />
                                    ) : (
                                        <FileText className="h-4 w-4 text-slate-500" />
                                    )}
                                    <span className="max-w-[120px] truncate text-[11px] text-slate-600">
                                        {a.name}
                                    </span>
                                    <button
                                        onClick={() => removePending(a.url)}
                                        className="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="border-t border-slate-100 bg-white p-3">
                        <div className="flex items-end gap-2">
                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={uploading}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                title="Attach file"
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
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
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
                                placeholder="Type, paste an image, or drop a file…"
                                className="max-h-24 min-h-[36px] flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#a97400] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a97400]/10"
                            />

                            <button
                                onClick={handleSend}
                                disabled={sending || (!input.trim() && pending.length === 0)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#a97400] text-white hover:bg-[#8f6100] disabled:opacity-50"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                            <ImageIcon className="h-3 w-3" />
                            Paste images directly · Enter to send · Shift+Enter for newline
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}