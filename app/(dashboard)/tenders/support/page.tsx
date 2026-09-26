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
  Paperclip,
  Clock,
  Tag,
  ChevronRight,
  Bell,
  Eye,
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

/* ============================================================
 * Helpers
 * ============================================================ */
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

function previewText(msg: InboxRow["lastMessage"]) {
  const body = (msg.body || "").trim();
  if (body) return body.length > 90 ? body.slice(0, 90) + "…" : body;
  const first = msg.attachments?.[0];
  if (!first) return "(no content)";
  if (first.kind === "image") return "📷 Image";
  if (first.kind === "audio") return "🎤 Voice message";
  if (first.kind === "video") return "🎬 Video";
  return `📎 ${first.name || "Attachment"}`;
}

function attachmentCount(msg: InboxRow["lastMessage"]) {
  return msg.attachments?.length ?? 0;
}

/* ============================================================
 * Module-level cache
 * ============================================================ */
let INBOX_CACHE: { data: InboxRow[]; ts: number } | null = null;
let INBOX_IN_FLIGHT: Promise<InboxRow[]> | null = null;
const STALE_MS = 15_000;

function invalidateInbox() {
  INBOX_CACHE = null;
  INBOX_IN_FLIGHT = null;
}

/* ============================================================
 * Page
 * ============================================================ */
export default function TenderSupportInboxPage() {
  const { user } = useAuth();
  const socketCtx = useSocket();
  const socket = (socketCtx as any)?.socket ?? socketCtx;

  const isMgmt = useMemo(
    () => MGMT_ROLES.includes(user?.role || ""),
    [user?.role],
  );

  const canViewSite = useMemo(
    () => !user?.role || user.role !== "employee",
    [user?.role],
  );

  const [rows, setRows] = useState<InboxRow[]>(INBOX_CACHE?.data ?? []);
  const [loading, setLoading] = useState(!INBOX_CACHE);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [activeTenderId, setActiveTenderId] = useState<string | null>(null);
  const [activeTenderTitle, setActiveTenderTitle] = useState<string>("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const refetchTimer = useRef<NodeJS.Timeout | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* Ask for notification permission once */
  useEffect(() => {
    import("@/services/chatNotification.service").then(
      ({ default: CNS }) => {
        CNS.requestPermission();
      },
    );
  }, []);

  /* ---------------- fetch inbox (cache-aware) ---------------- */
  const fetchInbox = useCallback(async (silent = false, force = false) => {
    if (!silent) setRefreshing(true);
    try {
      if (
        !force &&
        INBOX_CACHE &&
        Date.now() - INBOX_CACHE.ts < STALE_MS
      ) {
        if (mounted.current) setRows(INBOX_CACHE.data);
        return;
      }

      if (!force && INBOX_IN_FLIGHT) {
        const data = await INBOX_IN_FLIGHT;
        if (mounted.current) setRows(data);
        return;
      }

      const p = tenderChatApi.inbox();
      if (!force) INBOX_IN_FLIGHT = p;
      const data = await p;
      INBOX_CACHE = { data, ts: Date.now() };
      INBOX_IN_FLIGHT = null;

      if (mounted.current) setRows(data);
    } catch {
      /* silent */
    } finally {
      INBOX_IN_FLIGHT = null;
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchInbox(false, false);
  }, [fetchInbox]);

  /* ---------------- REAL-TIME + NOTIFICATIONS ---------------- */
  useTenderChatSocket(socket, "inbox", (incoming) => {
    const myRole = isMgmt ? "management" : "user";
    const fromOtherSide = incoming.senderRole !== myRole;

    setRows((prev) => {
      const idx = prev.findIndex((r) => r.tenderId === incoming.tenderId);
      if (idx === -1) {
        if (refetchTimer.current) clearTimeout(refetchTimer.current);
        refetchTimer.current = setTimeout(
          () => fetchInbox(true, true),
          400,
        );
        return prev;
      }

      const updated = [...prev];
      const [row] = updated.splice(idx, 1);
      updated.unshift({
        ...row,
        lastMessage: {
          _id: incoming._id,
          senderRole: incoming.senderRole,
          senderName: incoming.senderName,
          body: incoming.body,
          attachments: incoming.attachments || [],
          createdAt: incoming.createdAt,
        },
        total: row.total + 1,
        unread: fromOtherSide ? row.unread + 1 : row.unread,
      });
      return updated;
    });

    invalidateInbox();

    if (fromOtherSide) {
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

  /* ---------------- role-scoped rows ---------------- */
  const scopedRows = useMemo(() => {
    if (isMgmt) return rows;
    const uid =
      (user as any)?.id || (user as any)?._id || null;
    if (!uid) return [];
    return rows.filter((r) => {
      const ownerId =
        (r.owner as any)?.id || (r.owner as any)?._id || null;
      return ownerId === uid;
    });
  }, [rows, isMgmt, user]);

  /* ---------------- filter ---------------- */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedRows.filter((r) => {
      if (filter === "unread" && r.unread === 0) return false;
      if (!q) return true;
      return (
        r.tenderer.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.owner?.fullName || "").toLowerCase().includes(q)
      );
    });
  }, [scopedRows, query, filter]);

  const totalUnread = useMemo(
    () => scopedRows.reduce((sum, r) => sum + r.unread, 0),
    [scopedRows],
  );

  const openChat = (r: InboxRow) => {
    setActiveTenderId(r.tenderId);
    setActiveTenderTitle(`${r.tenderer} — ${r.title}`);
    setWizardOpen(true);
  };

  // If user opens chat via the floating bubble directly without clicking a table row
  const handleWizardOpenChange = (isOpen: boolean) => {
    setWizardOpen(isOpen);
    if (isOpen && !activeTenderId && scopedRows.length > 0) {
      const target = scopedRows.find((r) => r.unread > 0) || scopedRows[0];
      setActiveTenderId(target.tenderId);
      setActiveTenderTitle(`${target.tenderer} — ${target.title}`);
    }

    if (!isOpen && activeTenderId) {
      setRows((prev) =>
        prev.map((r) =>
          r.tenderId === activeTenderId ? { ...r, unread: 0 } : r,
        ),
      );
      invalidateInbox();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
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

        {/* Header actions */}
        <div className="flex items-center gap-2">
          {canViewSite && (
            <a
              href="/tenders/support"
              target="_blank"
              rel="noreferrer"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              title="View site"
              aria-label="View site"
            >
              <Eye className="h-3.5 w-3.5" />
              {totalUnread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white shadow ring-2 ring-white">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </a>
          )}

          <button
            onClick={() => fetchInbox(false, true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
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
              className={`h-8 rounded-md px-3 text-[11px] font-semibold transition ${
                filter === f
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
          <table className="w-full min-w-[820px] border-collapse">
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
                  const lastFromMgmt =
                    last.senderRole === "management";
                  const preview = previewText(last);
                  const files = attachmentCount(last);
                  const hasUnread = r.unread > 0;

                  return (
                    <tr
                      key={r.tenderId}
                      className={`border-b border-slate-50 transition hover:bg-amber-50/30 ${
                        hasUnread ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {/* Tender */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-start gap-2">
                          {hasUnread && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                          )}
                          <div className="min-w-0">
                            <p
                              className={`truncate text-[12px] ${
                                hasUnread
                                  ? "font-bold text-slate-900"
                                  : "font-semibold text-slate-800"
                              }`}
                            >
                              {r.tenderer}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                              {r.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                                <Tag className="h-2.5 w-2.5" />
                                {r.stage}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          {r.owner?.profilePhoto ? (
                            <img
                              src={r.owner.profilePhoto}
                              alt={r.owner.fullName || ""}
                              className="h-7 w-7 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                              <span className="text-[10px] font-bold">
                                {r.owner?.fullName
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
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

                      {/* Last Message */}
                      <td className="max-w-[320px] px-4 py-3 align-top">
                        <div className="flex items-center gap-1.5">
                          {lastFromMgmt ? (
                            <ShieldCheck className="h-3 w-3 text-amber-600" />
                          ) : (
                            <UserIcon className="h-3 w-3 text-slate-400" />
                          )}
                          <span
                            className={`text-[10px] font-semibold ${
                              lastFromMgmt
                                ? "text-amber-700"
                                : "text-slate-500"
                            }`}
                          >
                            {lastFromMgmt
                              ? "Support"
                              : last.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            · {timeAgo(last.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-600">
                          {preview}
                        </p>
                        {files > 0 && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                            <Paperclip className="h-2.5 w-2.5" />
                            {files} attachment
                            {files === 1 ? "" : "s"}
                          </p>
                        )}
                      </td>

                      {/* Activity */}
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1.5">
                          <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                            <MessageSquare className="h-3 w-3" />
                            {r.total} message
                            {r.total === 1 ? "" : "s"}
                          </p>
                          {hasUnread && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                              <Bell className="h-2.5 w-2.5" />
                              {r.unread} new
                            </span>
                          )}
                          {!hasUnread && (
                            <p className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                              <Clock className="h-2.5 w-2.5" />
                              {timeAgo(last.createdAt)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right align-top">
                        <button
                          onClick={() => openChat(r)}
                          className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold shadow-sm transition ${
                            hasUnread
                              ? "bg-[#a97400] text-white hover:bg-[#8f6100]"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          {hasUnread ? "Reply" : "Talk"}
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Always mounted floating widget */}
      <TenderChatWizard
        tenderId={activeTenderId}
        tenderTitle={activeTenderTitle}
        open={wizardOpen}
        globalUnread={totalUnread}
        onOpenChange={handleWizardOpenChange}
        onDismiss={() => {
          setActiveTenderId(null);
          setWizardOpen(false);
        }}
      />
    </div>
  );
}