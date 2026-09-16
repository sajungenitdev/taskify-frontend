// app/(dashboard)/tenders/won/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Eye,
    FileText,
    Trophy,
    X,
    ExternalLink,
    Search,
    Download,
    Trash2,
    Copy,
    Check,
    ArrowUpDown,
    Calendar,
    TrendingUp,
    Award,
    Users,
    LayoutGrid,
    Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { tenderApi, type Tender } from "@/lib/api/tender.api";
import { confirmToast } from "@/lib/confirmToast";

/* ============================================================
 * HELPERS
 * ============================================================ */

function fmtDate(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function fmtDateTime(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function budgetLabel(n?: number | null) {
    if (!n) return "—";
    return `৳${n.toLocaleString("en-IN")}`;
}

function fullFileUrl(url: string) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
    const origin = base.replace(/\/api\/v1\/?$/, "");
    return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

function fileSizeLabel(bytes: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---------- Role check ---------- */
function useIsSuperAdmin() {
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    useEffect(() => {
        try {
            const raw =
                localStorage.getItem("user") ||
                sessionStorage.getItem("user") ||
                "{}";
            const u = JSON.parse(raw);
            const role = String(
                u.role || u.roleName || u.roleSlug || "",
            ).toLowerCase();
            setIsSuperAdmin(
                role === "super admin" ||
                role === "superadmin" ||
                role === "super_admin" ||
                role === "super-admin",
            );
        } catch {
            setIsSuperAdmin(false);
        }
    }, []);
    return isSuperAdmin;
}

/* ============================================================
 * PAGE
 * ============================================================ */

type SortKey = "date" | "value" | "tenderer";
type SortDir = "asc" | "desc";

export default function WonTendersPage() {
    const isSuperAdmin = useIsSuperAdmin();

    const [rows, setRows] = useState<Tender[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Tender | null>(null);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    /* Filters */
    const [query, setQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("date");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [yearFilter, setYearFilter] = useState<string>("all");

    /* ---------- Fetch ---------- */
    async function load() {
        setLoading(true);
        try {
            const res = await tenderApi.list({ stage: "won", limit: 200 });
            setRows(res.data);
            setCheckedIds(new Set());
        } catch (e) {
            toast.error((e as Error).message || "Failed to load won tenders");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    /* ---------- Stats ---------- */
    const stats = useMemo(() => {
        const total = rows.length;
        const totalValue = rows.reduce((s, t) => s + (t.bidValue ?? 0), 0);
        const avgBid = total === 0 ? 0 : Math.round(totalValue / total);
        const thisYear = new Date().getFullYear();
        const thisFyCount = rows.filter(
            (t) => new Date(t.updatedAt).getFullYear() === thisYear,
        ).length;
        const thisFyValue = rows
            .filter((t) => new Date(t.updatedAt).getFullYear() === thisYear)
            .reduce((s, t) => s + (t.bidValue ?? 0), 0);
        return { total, totalValue, avgBid, thisFyCount, thisFyValue };
    }, [rows]);

    /* ---------- Available years ---------- */
    const years = useMemo(() => {
        const set = new Set<string>();
        rows.forEach((t) => {
            const y = new Date(t.updatedAt).getFullYear().toString();
            set.add(y);
        });
        return Array.from(set).sort().reverse();
    }, [rows]);

    /* ---------- Filtered + sorted rows ---------- */
    const visibleRows = useMemo(() => {
        let out = rows.slice();

        // Year filter
        if (yearFilter !== "all") {
            out = out.filter(
                (t) => new Date(t.updatedAt).getFullYear().toString() === yearFilter,
            );
        }

        // Search
        const q = query.trim().toLowerCase();
        if (q) {
            out = out.filter(
                (t) =>
                    t.tenderer.toLowerCase().includes(q) ||
                    t.title.toLowerCase().includes(q),
            );
        }

        // Sort
        out.sort((a, b) => {
            let cmp = 0;
            if (sortKey === "date") {
                cmp =
                    new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            } else if (sortKey === "value") {
                cmp = (a.bidValue ?? 0) - (b.bidValue ?? 0);
            } else {
                cmp = a.tenderer.localeCompare(b.tenderer);
            }
            return sortDir === "asc" ? cmp : -cmp;
        });

        return out;
    }, [rows, query, sortKey, sortDir, yearFilter]);

    /* ---------- Selection ---------- */
    const allChecked =
        visibleRows.length > 0 &&
        visibleRows.every((t) => checkedIds.has(t._id));

    function toggleAll() {
        if (allChecked) {
            setCheckedIds(new Set());
        } else {
            setCheckedIds(new Set(visibleRows.map((t) => t._id)));
        }
    }

    function toggleOne(id: string) {
        const next = new Set(checkedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setCheckedIds(next);
    }

    /* ---------- Delete ---------- */
    function handleDelete(tender: Tender) {
        confirmToast({
            title: `Delete ${tender.tenderer}?`,
            description:
                "This will permanently remove the tender and all its document tasks.",
            confirmLabel: "Delete",
            variant: "danger",
            onConfirm: async () => {
                const loadingId = toast.loading("Deleting...");
                try {
                    await tenderApi.remove(tender._id);
                    toast.success("Tender deleted", { id: loadingId });
                    await load();
                } catch (e) {
                    toast.error((e as Error).message || "Delete failed", {
                        id: loadingId,
                    });
                }
            },
        });
    }

    function handleBulkDelete() {
        const ids = Array.from(checkedIds);
        if (ids.length === 0) return;
        confirmToast({
            title: `Delete ${ids.length} tender${ids.length > 1 ? "s" : ""}?`,
            description:
                "This will permanently remove the selected tenders and their document tasks.",
            confirmLabel: "Delete all",
            variant: "danger",
            onConfirm: async () => {
                const loadingId = toast.loading(`Deleting ${ids.length}...`);
                try {
                    await Promise.all(ids.map((id) => tenderApi.remove(id)));
                    toast.success(`${ids.length} deleted`, { id: loadingId });
                    setCheckedIds(new Set());
                    await load();
                } catch (e) {
                    toast.error((e as Error).message || "Bulk delete failed", {
                        id: loadingId,
                    });
                }
            },
        });
    }

    /* ---------- Export ---------- */
    function handleExportCSV() {
        if (visibleRows.length === 0) return;
        const header = [
            "Tenderer",
            "Title",
            "Winning Bid",
            "Tentative Budget",
            "Won On",
            "Type",
            "Responsible",
        ];
        const body = visibleRows.map((t) => [
            t.tenderer,
            t.title,
            t.bidValue ?? 0,
            t.tentativeBudget ?? 0,
            new Date(t.updatedAt).toISOString().slice(0, 10),
            t.tenderType,
            t.responsiblePerson ?? "",
        ]);
        const csv = [header, ...body]
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `won-tenders-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported");
    }

    return (
        <main className="min-h-screen bg-[#faf7f0] pb-16 text-slate-900">
            <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8">
                {/* ================= HEADER ================= */}
                <header className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-100/50 blur-2xl" />
                    <div className="relative flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                                    Tender Dashboard
                                </p>
                                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                                    Won Tenders
                                </h1>
                                <p className="mt-1 max-w-xl text-xs text-slate-500">
                                    Contracts awarded to us. Click a row to open the award
                                    details, sort, filter, or export.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                disabled={visibleRows.length === 0}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </header>

                {/* ================= STATS ================= */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Award className="h-4 w-4" />}
                        label="Total Won"
                        value={String(stats.total)}
                        hint="All time"
                    />
                    <StatCard
                        icon={<TrendingUp className="h-4 w-4" />}
                        label="Total Value"
                        value={budgetLabel(stats.totalValue)}
                        hint="Sum of winning bids"
                        highlight
                    />
                    <StatCard
                        icon={<TrendingUp className="h-4 w-4" />}
                        label="Average Bid"
                        value={stats.total === 0 ? "—" : budgetLabel(stats.avgBid)}
                        hint="Mean winning bid"
                    />
                    <StatCard
                        icon={<Calendar className="h-4 w-4" />}
                        label={`Won in ${new Date().getFullYear()}`}
                        value={String(stats.thisFyCount)}
                        hint={budgetLabel(stats.thisFyValue)}
                    />
                </div>

                {/* ================= TOOLBAR ================= */}
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    {/* Search */}
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search tenderer or title..."
                            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    {/* Year filter */}
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
                    >
                        <option value="all">All years</option>
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
                    >
                        <option value="date">Sort by Won On</option>
                        <option value="value">Sort by Bid Value</option>
                        <option value="tenderer">Sort by Tenderer</option>
                    </select>

                    <button
                        type="button"
                        onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        title="Toggle direction"
                    >
                        <ArrowUpDown className="h-3.5 w-3.5" />
                        {sortDir === "asc" ? "Asc" : "Desc"}
                    </button>

                    {/* Bulk delete — only for super admin */}
                    {isSuperAdmin && checkedIds.size > 0 && (
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete {checkedIds.size}
                        </button>
                    )}
                </div>

                {/* ================= TABLE ================= */}
                {loading ? (
                    <div className="h-[320px] animate-pulse rounded-xl border border-slate-200/80 bg-white" />
                ) : (
                    <WonTable
                        rows={visibleRows}
                        isSuperAdmin={isSuperAdmin}
                        checkedIds={checkedIds}
                        allChecked={allChecked}
                        onToggleAll={toggleAll}
                        onToggleOne={toggleOne}
                        onView={setSelected}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* ================= MODAL ================= */}
            <WonModal
                open={!!selected}
                onOpenChange={(o) => !o && setSelected(null)}
                tender={selected}
            />
        </main>
    );
}

/* ============================================================
 * STAT CARD
 * ============================================================ */

function StatCard({
    icon,
    label,
    value,
    hint,
    highlight,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    hint?: string;
    highlight?: boolean;
}) {
    return (
        <div className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {label}
                </p>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-emerald-50 group-hover:text-emerald-600">
                    {icon}
                </span>
            </div>
            <p
                className={`mt-2 font-mono text-xl font-bold tracking-tight ${highlight ? "text-emerald-700" : "text-slate-900"
                    }`}
            >
                {value}
            </p>
            {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
        </div>
    );
}

/* ============================================================
 * TABLE
 * ============================================================ */

function WonTable({
    rows,
    isSuperAdmin,
    checkedIds,
    allChecked,
    onToggleAll,
    onToggleOne,
    onView,
    onDelete,
}: {
    rows: Tender[];
    isSuperAdmin: boolean;
    checkedIds: Set<string>;
    allChecked: boolean;
    onToggleAll: () => void;
    onToggleOne: (id: string) => void;
    onView: (t: Tender) => void;
    onDelete: (t: Tender) => void;
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {isSuperAdmin && (
                                <th className="w-[40px] px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allChecked}
                                        onChange={onToggleAll}
                                        className="h-3.5 w-3.5 cursor-pointer accent-emerald-600"
                                    />
                                </th>
                            )}
                            <th className="px-5 py-3 w-[22%]">Tenderer</th>
                            <th className="px-5 py-3 w-[34%]">Description</th>
                            <th className="px-5 py-3 w-[16%]">Winning Bid</th>
                            <th className="px-5 py-3 w-[14%]">Won On</th>
                            <th className="w-[10%] px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((t) => {
                            const checked = checkedIds.has(t._id);
                            return (
                                <tr
                                    key={t._id}
                                    onClick={() => onView(t)}
                                    className={`cursor-pointer transition-colors ${checked
                                            ? "bg-emerald-50/60"
                                            : "hover:bg-emerald-50/40"
                                        }`}
                                >
                                    {isSuperAdmin && (
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={() => onToggleOne(t._id)}
                                                className="h-3.5 w-3.5 cursor-pointer accent-emerald-600"
                                            />
                                        </td>
                                    )}
                                    <td className="px-5 py-3 text-[12px] font-semibold text-slate-800">
                                        {t.tenderer}
                                    </td>
                                    <td className="px-5 py-3 text-[12px] text-slate-600">
                                        {t.title}
                                    </td>
                                    <td className="px-5 py-3 font-mono text-[12px] font-semibold text-emerald-700">
                                        {budgetLabel(t.bidValue)}
                                    </td>
                                    <td className="px-5 py-3 text-[12px] text-slate-600">
                                        {fmtDate(t.updatedAt)}
                                    </td>
                                    <td className="px-5 py-3 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onView(t);
                                                }}
                                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                title="View details"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </button>

                                            {isSuperAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(t);
                                                    }}
                                                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={isSuperAdmin ? 6 : 5}
                                    className="px-5 py-20 text-center text-[12px] text-slate-400"
                                >
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                                        <Trophy className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <p className="font-semibold text-slate-600">
                                        No won tenders yet.
                                    </p>
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Move a submitted tender to Won from the Manage page.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

/* ============================================================
 * MODAL
 * ============================================================ */

type ModalTab = "summary" | "participants" | "documents";

function WonModal({
    open,
    onOpenChange,
    tender,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    tender: Tender | null;
}) {
    const [tab, setTab] = useState<ModalTab>("summary");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setTab("summary");
        const onKey = (e: KeyboardEvent) =>
            e.key === "Escape" && onOpenChange(false);
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onOpenChange]);

    if (!open || !tender) return null;

    async function copy(key: string, value: string) {
        try {
            await navigator.clipboard.writeText(value);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        } catch {
            toast.error("Could not copy");
        }
    }

    const TABS: { id: ModalTab; label: string; icon: React.ReactNode }[] = [
        { id: "summary", label: "Summary", icon: <Info className="h-3 w-3" /> },
        {
            id: "participants",
            label: "Participants",
            icon: <Users className="h-3 w-3" />,
        },
        {
            id: "documents",
            label: "Documents",
            icon: <FileText className="h-3 w-3" />,
        },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Header */}
                <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-white px-6 py-4">
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/50 blur-2xl" />
                    <div className="relative flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow">
                                <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                        Won
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400">
                                        {fmtDate(tender.updatedAt)}
                                    </span>
                                </div>
                                <h2 className="mt-1 text-lg font-bold text-slate-900">
                                    {tender.tenderer}
                                </h2>
                                <p className="text-[11px] text-slate-500">{tender.title}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Winning bid hero */}
                    <div className="relative mt-4 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Winning Bid Value
                            </p>
                            <p className="mt-0.5 font-mono text-2xl font-bold text-emerald-700">
                                {budgetLabel(tender.bidValue)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Tentative Budget
                            </p>
                            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-700">
                                {budgetLabel(tender.tentativeBudget)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-100 px-6">
                    {TABS.map((t) => {
                        const active = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`relative inline-flex items-center gap-1.5 px-3 py-3 text-[12px] font-semibold transition-colors ${active
                                        ? "text-slate-900"
                                        : "text-slate-500 hover:text-slate-800"
                                    }`}
                            >
                                {t.icon}
                                {t.label}
                                {active && (
                                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-emerald-600" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {tab === "summary" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <CopyField
                                label="Tenderer"
                                value={tender.tenderer}
                                onCopy={() => copy("tenderer", tender.tenderer)}
                                copied={copiedKey === "tenderer"}
                            />
                            <CopyField
                                label="Tender Type"
                                value={tender.tenderType}
                                onCopy={() => copy("type", tender.tenderType)}
                                copied={copiedKey === "type"}
                            />
                            <CopyField
                                label="Winning Bid"
                                value={budgetLabel(tender.bidValue)}
                                highlight
                                onCopy={() =>
                                    copy("bid", String(tender.bidValue ?? 0))
                                }
                                copied={copiedKey === "bid"}
                            />
                            <CopyField
                                label="Tentative Budget"
                                value={budgetLabel(tender.tentativeBudget)}
                                onCopy={() =>
                                    copy("budget", String(tender.tentativeBudget ?? 0))
                                }
                                copied={copiedKey === "budget"}
                            />
                            <CopyField
                                label="Tender Security"
                                value={budgetLabel(tender.tenderSecurityAmount)}
                                onCopy={() =>
                                    copy(
                                        "ts",
                                        String(tender.tenderSecurityAmount ?? 0),
                                    )
                                }
                                copied={copiedKey === "ts"}
                            />
                            <CopyField
                                label="Performance Security"
                                value={budgetLabel(tender.performanceSecurityAmount)}
                                onCopy={() =>
                                    copy(
                                        "ps",
                                        String(tender.performanceSecurityAmount ?? 0),
                                    )
                                }
                                copied={copiedKey === "ps"}
                            />
                            <CopyField
                                label="Recorded By"
                                value={tender.recordedBy ?? "—"}
                                onCopy={() => copy("rb", tender.recordedBy ?? "")}
                                copied={copiedKey === "rb"}
                            />
                            <CopyField
                                label="Responsible Person"
                                value={tender.responsiblePerson ?? "—"}
                                onCopy={() =>
                                    copy("rp", tender.responsiblePerson ?? "")
                                }
                                copied={copiedKey === "rp"}
                            />
                            <CopyField
                                label="Last Date of Submission"
                                value={fmtDateTime(tender.lastDateOfSubmission)}
                                onCopy={() =>
                                    copy("ld", tender.lastDateOfSubmission ?? "")
                                }
                                copied={copiedKey === "ld"}
                            />
                            <CopyField
                                label="Won On"
                                value={fmtDate(tender.updatedAt)}
                                onCopy={() => copy("won", tender.updatedAt)}
                                copied={copiedKey === "won"}
                            />

                            {tender.tenderLink && (
                                <div className="col-span-1 sm:col-span-2">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Tender Link
                                    </p>
                                    <a
                                        href={
                                            tender.tenderLink.startsWith("http")
                                                ? tender.tenderLink
                                                : `https://${tender.tenderLink}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:underline"
                                    >
                                        {tender.tenderLink}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}

                            {tender.note && (
                                <div className="col-span-1 sm:col-span-2">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Note
                                    </p>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-[12px] leading-relaxed text-slate-700">
                                        {tender.note}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "participants" && (
                        <div>
                            {(!tender.otherParticipants ||
                                tender.otherParticipants.length === 0) && (
                                    <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-[11px] text-slate-400">
                                        No participant data recorded.
                                    </div>
                                )}
                            <ul className="space-y-2">
                                {(tender.otherParticipants ?? []).map((p, i) => (
                                    <li
                                        key={i}
                                        className={`flex items-center justify-between rounded-lg border px-4 py-3 ${p.isUs
                                                ? "border-emerald-300 bg-gradient-to-r from-emerald-50 to-white"
                                                : "border-slate-200 bg-white"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2 text-[12px] font-medium text-slate-800">
                                            <span
                                                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${p.isUs
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {p.bidder.slice(0, 1).toUpperCase()}
                                            </span>
                                            {p.bidder}
                                            {p.isUs && (
                                                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                    US
                                                </span>
                                            )}
                                        </span>
                                        <span className="font-mono text-[12px] font-semibold text-slate-800">
                                            {budgetLabel(p.value)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {tab === "documents" && (
                        <div className="space-y-5">
                            <div>
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Attachments
                                </p>
                                {(!tender.attachments ||
                                    tender.attachments.length === 0) && (
                                        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-[11px] text-slate-400">
                                            No attachments.
                                        </div>
                                    )}
                                <ul className="space-y-1.5">
                                    {(tender.attachments ?? []).map((f, i) => (
                                        <li
                                            key={f._id ?? i}
                                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700"
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                <span className="truncate">{f.name}</span>
                                                {f.size > 0 && (
                                                    <span className="shrink-0 text-[10px] text-slate-400">
                                                        ({fileSizeLabel(f.size)})
                                                    </span>
                                                )}
                                            </span>
                                            {f.url && (
                                                <a
                                                    href={fullFileUrl(f.url)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] font-semibold text-indigo-600 hover:underline"
                                                >
                                                    View
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {tender.checklist && tender.checklist.length > 0 && (
                                <div>
                                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Submission Checklist
                                    </p>
                                    <ul className="space-y-1.5">
                                        {tender.checklist.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                            >
                                                <span
                                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${item.checked
                                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                                            : "border-slate-300 bg-white"
                                                        }`}
                                                >
                                                    {item.checked && (
                                                        <svg
                                                            viewBox="0 0 12 12"
                                                            className="h-2.5 w-2.5 fill-none stroke-current stroke-2"
                                                        >
                                                            <path d="M2 6l3 3 5-6" />
                                                        </svg>
                                                    )}
                                                </span>
                                                <span
                                                    className={`flex-1 text-[11px] ${item.checked
                                                            ? "text-slate-500 line-through"
                                                            : "text-slate-700"
                                                        }`}
                                                >
                                                    {item.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <LayoutGrid className="h-3 w-3" />
                        ID: <span className="font-mono">{tender._id}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ============================================================
 * COPY FIELD
 * ============================================================ */

function CopyField({
    label,
    value,
    onCopy,
    copied,
    highlight,
}: {
    label: string;
    value: string;
    onCopy?: () => void;
    copied?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition hover:border-slate-300">
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                </p>
                <p
                    className={`mt-0.5 truncate font-mono text-[12px] font-semibold ${highlight ? "text-emerald-700" : "text-slate-800"
                        }`}
                >
                    {value}
                </p>
            </div>
            {onCopy && (
                <button
                    type="button"
                    onClick={onCopy}
                    className="ml-2 shrink-0 rounded-md p-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                    title="Copy"
                >
                    {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                        <Copy className="h-3.5 w-3.5" />
                    )}
                </button>
            )}
        </div>
    );
}