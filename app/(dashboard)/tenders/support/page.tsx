// app/(dashboard)/tenders/support/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Loader2,
    MessageSquare,
    Search,
    ShieldCheck,
    User as UserIcon,
    RefreshCw,
    Inbox,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { tenderChatApi, type InboxRow } from "@/lib/api/tenderChat.api";
import TenderChatWizard from "@/components/tender/chat/TenderChatWizard";
import { useTenderChatSocket } from "@/hooks/tender/useTenderChatSocket";

const MGMT_ROLES = [
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
    "project_manager",
];

function timeAgo(iso: string) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
}

export default function TenderSupportInboxPage() {
    const { user } = useAuth();
    const socketCtx = useSocket();
    const socket = (socketCtx as any)?.socket ?? socketCtx;

    const isMgmt = useMemo(
        () => MGMT_ROLES.includes(user?.role || ""),
        [user?.role],
    );

    const [rows, setRows] = useState<InboxRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "unread">("all");

    const [activeTenderId, setActiveTenderId] = useState<string | null>(null);
    const [activeTenderTitle, setActiveTenderTitle] = useState<string>("");

    const refetchTimer = useRef<NodeJS.Timeout | null>(null);

    /* Ask for notification permission once */
    useEffect(() => {
        import("@/services/chatNotification.service").then(
            ({ default: CNS }) => {
                CNS.requestPermission();
            },
        );
    }, []);

    /* ---------------- fetch inbox ---------------- */
    const fetchInbox = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const data = await tenderChatApi.inbox();
            setRows(data);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    /* ---------------- REAL-TIME + NOTIFICATIONS ---------------- */
    useTenderChatSocket(socket, "inbox", (incoming) => {
        /* Debounced refetch */
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(() => fetchInbox(true), 400);

        /* Desktop notification for the opposite side */
        const myRole = isMgmt ? "management" : "user";
        if (incoming.senderRole !== myRole) {
            import("@/services/chatNotification.service").then(
                ({ default: CNS }) => {
                    CNS.notifyTenderIfAway({
                        senderName: incoming.senderName || "User",
                        messageContent: incoming.body || "",
                        tenderTitle: incoming.senderName,
                        tenderId: incoming.tenderId,
                        messageId: incoming._id,
                    });
                },
            );
        }
    });

    /* ---------------- filter ---------------- */
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((r) => {
            if (filter === "unread" && r.unread === 0) return false;
            if (!q) return true;
            return (
                r.tenderer.toLowerCase().includes(q) ||
                r.title.toLowerCase().includes(q) ||
                (r.owner?.fullName || "").toLowerCase().includes(q)
            );
        });
    }, [rows, query, filter]);

    const totalUnread = useMemo(
        () => rows.reduce((sum, r) => sum + r.unread, 0),
        [rows],
    );

    const openChat = (r: InboxRow) => {
        setActiveTenderId(r.tenderId);
        setActiveTenderTitle(`${r.tenderer} — ${r.title}`);
    };

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                        <Inbox className="h-5 w-5 text-[#a97400]" />
                        Tender Support Inbox
                    </h1>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                        {isMgmt
                            ? "Reply to user questions about tenders in real time."
                            : "Chat with the tender support team about your tenders."}
                        {totalUnread > 0 && (
                            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                {totalUnread} unread
                            </span>
                        )}
                    </p>
                </div>

                <button
                    onClick={() => fetchInbox()}
                    disabled={refreshing}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                >
                    <RefreshCw
                        className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
                    />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by tenderer, title, or owner…"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                </div>

                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    {(["all", "unread"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`h-8 rounded-md px-3 text-[11px] font-semibold transition ${filter === f
                                    ? "bg-[#a97400] text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            {f === "all" ? "All" : "Unread"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Tender
                                </th>
                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Owner
                                </th>
                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Last Message
                                </th>
                                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Activity
                                </th>
                                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-10 text-center text-xs text-slate-400"
                                    >
                                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                                        Loading conversations…
                                    </td>
                                </tr>
                            )}

                            {!loading && visible.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-12 text-center text-xs text-slate-400"
                                    >
                                        <MessageSquare className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                                        {query || filter === "unread"
                                            ? "No conversations match your filters."
                                            : "No conversations yet. Start one from any tender."}
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                visible.map((r) => {
                                    const last = r.lastMessage;
                                    const lastFromMgmt = last.senderRole === "management";
                                    const preview =
                                        last.body?.trim() ||
                                        (last.attachments?.[0]?.kind === "image"
                                            ? "📷 Image"
                                            : "📎 Attachment");

                                    return (
                                        <tr
                                            key={r.tenderId}
                                            className="border-b border-slate-50 hover:bg-amber-50/30"
                                        >
                                            <td className="px-4 py-3 align-top">
                                                <p className="text-[12px] font-semibold text-slate-800">
                                                    {r.tenderer}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    {r.title}
                                                </p>
                                                <span className="mt-1 inline-block rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                                                    {r.stage}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                                                        <span className="text-[10px] font-bold">
                                                            {r.owner?.fullName?.charAt(0)?.toUpperCase() ||
                                                                "?"}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[11px] font-medium text-slate-800">
                                                            {r.owner?.fullName || "—"}
                                                        </p>
                                                        <p className="truncate text-[10px] text-slate-400">
                                                            {r.owner?.email || ""}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="max-w-[280px] px-4 py-3 align-top">
                                                <div className="flex items-center gap-1.5">
                                                    {lastFromMgmt ? (
                                                        <ShieldCheck className="h-3 w-3 text-amber-600" />
                                                    ) : (
                                                        <UserIcon className="h-3 w-3 text-slate-400" />
                                                    )}
                                                    <span
                                                        className={`text-[10px] font-semibold ${lastFromMgmt
                                                                ? "text-amber-700"
                                                                : "text-slate-500"
                                                            }`}
                                                    >
                                                        {lastFromMgmt ? "Support" : last.senderName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        · {timeAgo(last.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 line-clamp-2 truncate text-[11px] text-slate-600">
                                                    {preview}
                                                </p>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <p className="text-[11px] text-slate-500">
                                                    {r.total} message{r.total === 1 ? "" : "s"}
                                                </p>
                                                {r.unread > 0 && (
                                                    <span className="mt-1 inline-block rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                                        {r.unread} unread
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right align-top">
                                                <button
                                                    onClick={() => openChat(r)}
                                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#a97400] px-3 text-[11px] font-semibold text-white shadow-sm hover:bg-[#8f6100]"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    Talk
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Controlled wizard */}
            {activeTenderId && (
                <TenderChatWizard
                    tenderId={activeTenderId}
                    tenderTitle={activeTenderTitle}
                    open={true}
                    onOpenChange={(o) => {
                        if (!o) {
                            setActiveTenderId(null);
                            setActiveTenderTitle("");
                            setRows((prev) =>
                                prev.map((r) =>
                                    r.tenderId === activeTenderId ? { ...r, unread: 0 } : r,
                                ),
                            );
                        }
                    }}
                />
            )}
        </div>
    );
}