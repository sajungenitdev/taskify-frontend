// app/(dashboard)/settings/audit-logs/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Activity,
    Search,
    RefreshCw,
    Download,
    User,
    Shield,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Eye,
    Globe,
    Smartphone,
    Laptop,
    Monitor,
    Tablet,
    Info,
    FileText,
    Settings,
    Users,
    Key,
    Lock,
    Unlock,
    Mail,
    Bell,
    MessageSquare,
    Plus,
    Edit,
    Trash2,
    Copy,
    ArrowLeft,
    ArrowRight,
    ChevronsLeft,
    ChevronsRight,
    LogOut,
    Upload,
    Archive,
    UserX,
    UserMinus,
    AlertTriangle,
    AlertOctagon,
    CheckSquare,
    FolderKanban,
    Share2,
    Move,
    X,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { apiService } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================
interface AuditLog {
    _id: string;
    action: string;
    resource: string;
    resourceId?: string;
    userId: string;
    user: {
        id?: string;
        name: string;
        email: string;
        avatar?: string;
        role: string;
    };
    ip: string;
    userAgent: string;
    device?: string;
    location?: string;
    details: Record<string, any>;
    status: "success" | "failed" | "warning" | "info";
    severity: "low" | "medium" | "high" | "critical";
    createdAt: string;
    metadata?: {
        browser?: string;
        os?: string;
        platform?: string;
    };
}

interface AuditLogStats {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    success: number;
    failed: number;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
    login: User,
    logout: LogOut,
    create: Plus,
    update: Edit,
    delete: Trash2,
    view: Eye,
    export: Download,
    import: Upload,
    share: Share2,
    copy: Copy,
    move: Move,
    archive: Archive,
    restore: RefreshCw,
    approve: CheckCircle,
    reject: XCircle,
    lock: Lock,
    unlock: Unlock,
    assign: Users,
    unassign: UserX,
    invite: Mail,
    remove: UserMinus,
    enable: CheckCircle,
    disable: XCircle,
    reset: RefreshCw,
    change: Edit,
};

const SEVERITY_CONFIG = {
    low: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Info },
    medium: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertCircle },
    high: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: AlertTriangle },
    critical: { color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: AlertOctagon },
};

const STATUS_CONFIG = {
    success: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
    failed: { color: "text-rose-700", bg: "bg-rose-50 border-rose-200", icon: XCircle },
    warning: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertTriangle },
    info: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Info },
};

const RESOURCE_ICONS: Record<string, React.ElementType> = {
    user: User,
    users: Users,
    role: Shield,
    roles: Shield,
    permission: Key,
    permissions: Key,
    task: CheckSquare,
    tasks: CheckSquare,
    project: FolderKanban,
    projects: FolderKanban,
    team: Users,
    teams: Users,
    setting: Settings,
    settings: Settings,
    audit: Activity,
    logs: Activity,
    api: Key,
    keys: Key,
    report: FileText,
    reports: FileText,
    notification: Bell,
    notifications: Bell,
    message: MessageSquare,
    messages: MessageSquare,
};

export default function AuditLogsPage() {
    const { user } = useAuth();

    // Primary Data States
    const [loading, setLoading] = useState<boolean>(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditLogStats | null>(null);

    // Pagination
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(20);
    const [total, setTotal] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(1);

    // Search State
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");

    // UI Modal & Expansion State
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [exporting, setExporting] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Search input debounce handler (300ms)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // ============================================================
    // FETCH AUDIT LOGS
    // ============================================================
    const fetchLogs = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);

        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());

            if (debouncedSearch.trim()) {
                params.append("search", debouncedSearch.trim());
            }

            const response = await apiService.get(`/audit-logs?${params.toString()}`);

            if (response && (response.success === true || response.data !== undefined)) {
                const payload = response.data ?? response;
                const fetchedLogs = payload.logs || payload.data || [];
                const fetchedStats = payload.stats || null;
                const fetchedTotal = payload.pagination?.total || payload.total || fetchedLogs.length;
                const fetchedPages = payload.pagination?.totalPages || Math.ceil(fetchedTotal / limit) || 1;

                setLogs(fetchedLogs);
                if (fetchedStats) setStats(fetchedStats);
                setTotal(fetchedTotal);
                setTotalPages(fetchedPages);
            }
        } catch (error: any) {
            if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
                console.error("Audit fetch error:", error);
                toast.error(error.message || "Failed to load audit records");
            }
        } finally {
            setLoading(false);
        }
    }, [page, limit, debouncedSearch]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // ============================================================
    // DELETE AUDIT LOG HANDLER
    // ============================================================
    const handleDeleteLog = async (logId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this audit log record?")) {
            return;
        }

        try {
            setDeletingId(logId);
            const res = await apiService.delete(`/audit-logs/${logId}`);
            if (res && (res.success === true || res.data !== undefined)) {
                toast.success("Audit log entry deleted");
                setLogs((prev) => prev.filter((item) => item._id !== logId));
                setTotal((prev) => Math.max(0, prev - 1));
            } else {
                throw new Error(res?.message || "Failed to delete log");
            }
        } catch (err: any) {
            console.error("Delete error:", err);
            toast.error(err.message || "Error deleting log");
        } finally {
            setDeletingId(null);
        }
    };

    const toggleRowExpand = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatRelativeTime = (date: string): string => {
        const diff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60));
        if (diff < 1) return "Just now";
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    };

    const getDeviceIcon = (ua?: string): React.ElementType => {
        if (!ua) return Monitor;
        const str = ua.toLowerCase();
        if (str.includes("mobile") || str.includes("android") || str.includes("iphone")) return Smartphone;
        if (str.includes("ipad") || str.includes("tablet")) return Tablet;
        if (str.includes("mac") || str.includes("windows")) return Laptop;
        return Monitor;
    };

    // Export utility
    const handleExport = async () => {
        if (exporting) return;
        try {
            setExporting(true);
            const toastId = toast.loading(`Generating ${exportFormat.toUpperCase()} file...`);

            const params = new URLSearchParams();
            if (debouncedSearch.trim()) {
                params.append("search", debouncedSearch.trim());
            }
            params.append("format", exportFormat);

            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

            const res = await fetch(`${apiUrl}/audit-logs/export?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: exportFormat === "json" ? "application/json" : "text/csv",
                },
            });

            if (!res.ok) throw new Error("Export download failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `audit-export-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.dismiss(toastId);
            toast.success("Logs exported successfully");
        } catch (err: any) {
            toast.error(err.message || "Export error");
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-slate-900 pb-16">
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

                {/* Top Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-sm">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                Real-time chronological events, user access records, and security logs
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-0.5">
                            <select
                                value={exportFormat}
                                onChange={(e) => setExportFormat(e.target.value as "csv" | "json")}
                                className="px-3 py-2 bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                                disabled={exporting}
                            >
                                <option value="csv">CSV</option>
                                <option value="json">JSON</option>
                            </select>
                            <button
                                onClick={handleExport}
                                disabled={exporting || logs.length === 0}
                                className="px-4 py-2 bg-white text-slate-800 hover:bg-slate-100 border-l border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {exporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                Export
                            </button>
                        </div>

                        <button
                            onClick={fetchLogs}
                            disabled={loading}
                            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition shadow-xs cursor-pointer"
                            title="Refresh logs"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-700" : ""}`} />
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                        {[
                            { label: "Total Logs", value: stats.total, color: "text-slate-900" },
                            { label: "Today", value: stats.today, color: "text-slate-900" },
                            { label: "This Week", value: stats.thisWeek, color: "text-slate-900" },
                            { label: "This Month", value: stats.thisMonth, color: "text-slate-900" },
                            { label: "Success", value: stats.success, color: "text-emerald-600" },
                            { label: "Failed", value: stats.failed, color: "text-rose-600" },
                        ].map((st, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{st.label}</span>
                                <span className={`text-2xl font-extrabold mt-2 ${st.color}`}>
                                    {st.value?.toLocaleString() || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search across users, actions, target resources, or IPs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Live Audit Log Ledger */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    {loading && logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-3">
                            <RefreshCw className="w-7 h-7 text-emerald-700 animate-spin" />
                            <p className="text-xs text-slate-400 font-medium">Syncing audit entries...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-24 px-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                                <Activity className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800 mb-1">No Audit Logs Found</h3>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                No system activities matched your search criteria.
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="py-3.5 px-4 w-10 text-center"></th>
                                        <th className="py-3.5 px-4 w-44">Timestamp</th>
                                        <th className="py-3.5 px-4">User</th>
                                        <th className="py-3.5 px-4">Action</th>
                                        <th className="py-3.5 px-4">Target Resource</th>
                                        <th className="py-3.5 px-4 text-center">Status</th>
                                        <th className="py-3.5 px-4">Network Client</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {logs.map((log) => {
                                        const ActionIcon = ACTION_ICONS[log.action?.toLowerCase()] || Activity;
                                        const ResourceIcon = RESOURCE_ICONS[log.resource?.toLowerCase()] || FileText;
                                        const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.low;
                                        const stat = STATUS_CONFIG[log.status] || STATUS_CONFIG.info;
                                        const DeviceIcon = getDeviceIcon(log.userAgent);
                                        const isExpanded = expandedRows.has(log._id);

                                        return (
                                            <React.Fragment key={log._id}>
                                                <tr
                                                    onClick={() => toggleRowExpand(log._id)}
                                                    className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${isExpanded ? "bg-slate-50/60" : ""}`}
                                                >
                                                    {/* Row Expansion Toggle Arrow */}
                                                    <td className="py-3.5 px-2 text-center align-top">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => toggleRowExpand(log._id, e)}
                                                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-slate-600 font-bold" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                                            )}
                                                        </button>
                                                    </td>

                                                    <td className="py-3.5 px-4 align-top">
                                                        <div className="font-semibold text-slate-800">{formatRelativeTime(log.createdAt)}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(log.createdAt)}</div>
                                                    </td>

                                                    <td className="py-3.5 px-4 align-top">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                                                                {log.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                                            </div>
                                                            <div className="truncate max-w-[140px]">
                                                                <div className="font-bold text-slate-900 truncate">{log.user?.name || "System"}</div>
                                                                <div className="text-[10px] text-slate-400 truncate">{log.user?.email || "Internal Service"}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4 align-top">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold capitalize">
                                                            <ActionIcon className="w-3 h-3 text-slate-500" />
                                                            {log.action}
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4 align-top">
                                                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold capitalize">
                                                            <ResourceIcon className="w-3.5 h-3.5 text-slate-400" />
                                                            {log.resource}
                                                        </div>
                                                        {log.resourceId && (
                                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                #{log.resourceId.slice(-8)}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 px-4 text-center align-top">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${stat.bg} ${stat.color}`}>
                                                                <stat.icon className="w-2.5 h-2.5" />
                                                                {log.status?.toUpperCase() || "INFO"}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sev.bg} ${sev.color}`}>
                                                                {log.severity?.toUpperCase() || "LOW"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4 align-top text-slate-600">
                                                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                                            <Globe className="w-3 h-3 text-slate-400" />
                                                            {log.ip || "127.0.0.1"}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                                            <DeviceIcon className="w-3 h-3" />
                                                            <span className="truncate max-w-[120px]">{log.metadata?.browser || log.device || "Browser Client"}</span>
                                                        </div>
                                                    </td>

                                                    {/* ACTION BUTTONS COLUMN */}
                                                    <td className="py-3.5 px-4 text-right align-top" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedLog(log);
                                                                    setShowDetailsModal(true);
                                                                }}
                                                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                                                title="Inspect Record"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteLog(log._id, e)}
                                                                disabled={deletingId === log._id}
                                                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                                                                title="Delete Log Entry"
                                                            >
                                                                {deletingId === log._id ? (
                                                                    <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Collapsible Sub-Row */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/80">
                                                        <td colSpan={8} className="p-4 border-y border-slate-100">
                                                            <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2 shadow-xs">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                                                        Captured Metadata & Context Payload
                                                                    </div>
                                                                    <button
                                                                        onClick={() => toggleRowExpand(log._id)}
                                                                        className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"
                                                                    >
                                                                        <ChevronUp className="w-3.5 h-3.5" /> Collapse
                                                                    </button>
                                                                </div>
                                                                <pre className="p-3 bg-slate-50 border border-slate-200/60 rounded-lg text-[11px] font-mono text-slate-800 overflow-x-auto max-h-60">
                                                                    {JSON.stringify(log.details || {}, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                            <span className="text-xs font-semibold text-slate-500">
                                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} events
                            </span>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={page === 1}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ChevronsLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                </button>

                                <span className="px-3 py-1.5 text-xs font-bold text-slate-800">
                                    Page {page} of {totalPages}
                                </span>

                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setPage(totalPages)}
                                    disabled={page === totalPages}
                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                                >
                                    <ChevronsRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal: Full Log Inspector */}
                {showDetailsModal && selectedLog && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900">Audit Record Inspector</h2>
                                        <p className="text-xs text-slate-400">{selectedLog._id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Actor</span>
                                    <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{selectedLog.user?.name || "System"}</p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Action</span>
                                    <p className="text-xs font-bold text-slate-800 mt-0.5 capitalize">{selectedLog.action}</p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Resource</span>
                                    <p className="text-xs font-bold text-slate-800 mt-0.5 capitalize">{selectedLog.resource}</p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                    <p className="text-xs font-bold text-emerald-600 mt-0.5 uppercase">{selectedLog.status}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Network Client</span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <span className="text-slate-400">IP:</span> <span className="font-mono text-slate-800">{selectedLog.ip}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">OS:</span> <span className="text-slate-800">{selectedLog.metadata?.os || "N/A"}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Browser:</span> <span className="text-slate-800">{selectedLog.metadata?.browser || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="text-[11px] text-slate-500 break-all pt-1 border-t border-slate-200/50">
                                    {selectedLog.userAgent}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Metadata Payload</span>
                                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto max-h-60">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold transition hover:bg-slate-800 cursor-pointer"
                                >
                                    Close Record
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}