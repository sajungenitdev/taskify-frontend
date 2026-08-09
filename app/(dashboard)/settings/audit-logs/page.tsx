// app/(dashboard)/settings/audit-logs/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Activity,
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
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
    FilterX,
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
    resourceId: string;
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        role: string;
    };
    ip: string;
    userAgent: string;
    device: string;
    location: string;
    details: Record<string, any>;
    status: "success" | "failed" | "warning" | "info";
    severity: "low" | "medium" | "high" | "critical";
    createdAt: string;
    metadata?: {
        browser: string;
        os: string;
        platform: string;
    };
}

interface AuditLogStats {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    success: number;
    failed: number;
    byAction: Record<string, number>;
    bySeverity: Record<string, number>;
    byResource: Record<string, number>;
}

interface FilterOptions {
    search: string;
    action: string;
    resource: string;
    status: string;
    severity: string;
    userId: string;
    dateFrom: string;
    dateTo: string;
}

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ============================================================
// CONSTANTS & CONFIGURATIONS
// ============================================================
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

const SEVERITY_COLORS = {
    low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const SEVERITY_ICONS = {
    low: Info,
    medium: AlertCircle,
    high: AlertTriangle,
    critical: AlertOctagon,
};

const STATUS_COLORS = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
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

const ACTIONS_LIST = [
    { value: "", label: "All Actions" },
    { value: "login", label: "Login" },
    { value: "logout", label: "Logout" },
    { value: "create", label: "Create" },
    { value: "update", label: "Update" },
    { value: "delete", label: "Delete" },
    { value: "view", label: "View" },
    { value: "export", label: "Export" },
    { value: "import", label: "Import" },
    { value: "approve", label: "Approve" },
    { value: "reject", label: "Reject" },
    { value: "assign", label: "Assign" },
    { value: "invite", label: "Invite" },
    { value: "enable", label: "Enable" },
    { value: "disable", label: "Disable" },
];

const RESOURCES_LIST = [
    { value: "", label: "All Resources" },
    { value: "user", label: "User" },
    { value: "role", label: "Role" },
    { value: "permission", label: "Permission" },
    { value: "task", label: "Task" },
    { value: "project", label: "Project" },
    { value: "team", label: "Team" },
    { value: "setting", label: "Setting" },
    { value: "api", label: "API Key" },
    { value: "report", label: "Report" },
    { value: "notification", label: "Notification" },
];

const STATUS_LIST = [
    { value: "", label: "All Status" },
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
    { value: "warning", label: "Warning" },
    { value: "info", label: "Info" },
];

const SEVERITY_LIST = [
    { value: "", label: "All Severity" },
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
];

const DATE_RANGES = ["today", "week", "month"] as const;
type DateRange = typeof DATE_RANGES[number];

// ============================================================
// STATS ITEMS - Only include numeric fields
// ============================================================
const STATS_ITEMS: Array<{ key: keyof Pick<AuditLogStats, "total" | "today" | "thisWeek" | "thisMonth" | "success" | "failed">; label: string; color: string }> = [
    { key: "total", label: "Total", color: "text-white" },
    { key: "today", label: "Today", color: "text-white" },
    { key: "thisWeek", label: "This Week", color: "text-white" },
    { key: "thisMonth", label: "This Month", color: "text-white" },
    { key: "success", label: "Success", color: "text-green-300" },
    { key: "failed", label: "Failed", color: "text-red-300" },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const AuditLogsPage: React.FC = () => {
    const { user } = useAuth();

    // State
    const [loading, setLoading] = useState<boolean>(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditLogStats | null>(null);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [dateRange, setDateRange] = useState<DateRange>("week");
    const isMounted = useRef(true);

    const [filters, setFilters] = useState<FilterOptions>({
        search: "",
        action: "",
        resource: "",
        status: "",
        severity: "",
        userId: "",
        dateFrom: "",
        dateTo: "",
    });

    // ============================================================
    // FETCH DATA
    // ============================================================
    const fetchLogs = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                search: filters.search,
                action: filters.action,
                resource: filters.resource,
                status: filters.status,
                severity: filters.severity,
                userId: filters.userId,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
            });

            const response = await apiService.get<{
                logs: AuditLog[];
                stats: AuditLogStats;
                pagination: { total: number; totalPages: number };
            }>(`/audit-logs?${params}`);

            if (isMounted.current && response.success) {
                setLogs(response.data?.logs || []);
                setStats(response.data?.stats || null);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data?.pagination?.total || 0,
                    totalPages: response.data?.pagination?.totalPages || 0,
                }));
            }
        } catch (error: any) {
            if (isMounted.current) {
                console.error("Error fetching audit logs:", error);
                toast.error(error.message || "Failed to load audit logs");
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [pagination.page, pagination.limit, filters]);

    useEffect(() => {
        isMounted.current = true;
        fetchLogs();
        return () => {
            isMounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============================================================
    // HANDLERS
    // ============================================================
    const handleFilterChange = <K extends keyof FilterOptions>(
        key: K,
        value: FilterOptions[K]
    ): void => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleDateRangeChange = (range: DateRange): void => {
        setDateRange(range);
        const now = new Date();
        let from = "";
        let to = "";

        switch (range) {
            case "today": {
                const today = new Date(now);
                today.setHours(0, 0, 0, 0);
                from = today.toISOString();
                const end = new Date(now);
                end.setHours(23, 59, 59, 999);
                to = end.toISOString();
                break;
            }
            case "week": {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                from = weekAgo.toISOString();
                to = now.toISOString();
                break;
            }
            case "month": {
                const monthAgo = new Date(now);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                from = monthAgo.toISOString();
                to = now.toISOString();
                break;
            }
            default:
                break;
        }

        setFilters((prev) => ({
            ...prev,
            dateFrom: from,
            dateTo: to,
        }));
    };

    const handleExport = async (): Promise<void> => {
        try {
            const toastId = toast.loading("Exporting audit logs...");
            const response = await apiService.get("/audit-logs/export", {
                params: filters,
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.dismiss(toastId);
            toast.success("Audit logs exported successfully");
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message || "Failed to export logs");
        }
    };

    const handleClearFilters = (): void => {
        setFilters({
            search: "",
            action: "",
            resource: "",
            status: "",
            severity: "",
            userId: "",
            dateFrom: "",
            dateTo: "",
        });
        setDateRange("week");
        handleDateRangeChange("week");
    };

    const toggleRowExpand = (logId: string): void => {
        setExpandedRows((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(logId)) {
                newSet.delete(logId);
            } else {
                newSet.add(logId);
            }
            return newSet;
        });
    };

    const viewLogDetails = (log: AuditLog): void => {
        setSelectedLog(log);
        setShowDetailsModal(true);
    };

    const handlePageChange = (page: number): void => {
        setPagination((prev) => ({ ...prev, page }));
    };

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    const formatDate = (date: string): string => {
        return new Date(date).toLocaleString();
    };

    const formatRelativeTime = (date: string): string => {
        const now = new Date();
        const past = new Date(date);
        const diff = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

        if (diff < 1) return "Just now";
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
        return `${Math.floor(diff / 43200)}mo ago`;
    };

    const getActionIcon = (action: string): React.ElementType => {
        return ACTION_ICONS[action.toLowerCase()] || Activity;
    };

    const getResourceIcon = (resource: string): React.ElementType => {
        return RESOURCE_ICONS[resource.toLowerCase()] || FileText;
    };

    const getSeverityIcon = (severity: string): React.ElementType => {
        return SEVERITY_ICONS[severity as keyof typeof SEVERITY_ICONS] || Info;
    };

    const getDeviceIcon = (userAgent: string): React.ElementType => {
        const ua = userAgent.toLowerCase();
        if (ua.includes("iphone") || ua.includes("android")) {
            return Smartphone;
        }
        if (ua.includes("ipad")) {
            return Tablet;
        }
        if (ua.includes("mac") || ua.includes("windows")) {
            return Laptop;
        }
        return Monitor;
    };

    const getSeverityColor = (severity: string): string => {
        return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || "bg-gray-100 text-gray-700";
    };

    const getStatusColor = (status: string): string => {
        return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-700";
    };

    // ============================================================
    // RENDER LOADING
    // ============================================================
    if (loading && logs.length === 0) {
        return (
            <div className="p-6 container mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN RENDER
    // ============================================================
    return (
        <div className="p-4 md:p-6 container mx-auto">
            {/* Header */}
            <div className="bg-linear-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Audit Logs</h1>
                            <p className="text-indigo-100 text-sm">
                                Track and monitor all system activities and user actions
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/20"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={fetchLogs}
                            className="px-4 py-2 bg-white text-indigo-600 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats - ✅ Fixed TypeScript error */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                        {STATS_ITEMS.map((item) => (
                            <div
                                key={item.key}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-3"
                            >
                                <p className="text-indigo-100 text-xs">{item.label}</p>
                                <p className={`text-xl font-bold ${item.color}`}>
                                    {stats[item.key]}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search logs by user, action, resource..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                        <Filter className="w-4 h-4" />
                        Filters
                        {Object.values(filters).some((v) => v) && (
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                    </button>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        {DATE_RANGES.map((range) => (
                            <button
                                key={range}
                                onClick={() => handleDateRangeChange(range)}
                                className={`px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${dateRange === range
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Action
                            </label>
                            <select
                                value={filters.action}
                                onChange={(e) => handleFilterChange("action", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            >
                                {ACTIONS_LIST.map((action) => (
                                    <option key={action.value} value={action.value}>
                                        {action.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Resource
                            </label>
                            <select
                                value={filters.resource}
                                onChange={(e) => handleFilterChange("resource", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            >
                                {RESOURCES_LIST.map((resource) => (
                                    <option key={resource.value} value={resource.value}>
                                        {resource.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            >
                                {STATUS_LIST.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Severity
                            </label>
                            <select
                                value={filters.severity}
                                onChange={(e) => handleFilterChange("severity", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            >
                                {SEVERITY_LIST.map((severity) => (
                                    <option key={severity.value} value={severity.value}>
                                        {severity.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
                            >
                                <FilterX className="w-4 h-4" />
                                Clear Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <Activity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Audit Logs Found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {filters.search || filters.action || filters.resource || filters.status || filters.severity
                                ? "No logs match your search criteria. Try adjusting your filters."
                                : "System activity and user actions will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            Time
                                        </div>
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Resource
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        IP
                                    </th>
                                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {logs.map((log) => {
                                    const ActionIcon = getActionIcon(log.action);
                                    const ResourceIcon = getResourceIcon(log.resource);
                                    const SeverityIcon = getSeverityIcon(log.severity);
                                    const DeviceIcon = getDeviceIcon(log.userAgent);
                                    const isExpanded = expandedRows.has(log._id);

                                    return (
                                        <React.Fragment key={log._id}>
                                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {formatRelativeTime(log.createdAt)}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(log.createdAt)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                                {log.user.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {log.user.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {log.user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <ActionIcon className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                                                            {log.action}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <ResourceIcon className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                                                            {log.resource}
                                                        </span>
                                                        {log.resourceId && (
                                                            <span className="text-xs text-gray-400 font-mono">
                                                                #{log.resourceId.slice(-6)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                                log.status
                                                            )}`}
                                                        >
                                                            {log.status === "success" ? (
                                                                <CheckCircle className="w-3 h-3" />
                                                            ) : (
                                                                <XCircle className="w-3 h-3" />
                                                            )}
                                                            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                                                log.severity
                                                            )}`}
                                                        >
                                                            <SeverityIcon className="w-3 h-3" />
                                                            {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="w-3 h-3 text-gray-400" />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">{log.ip}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                        <DeviceIcon className="w-3 h-3" />
                                                        <span>{log.metadata?.browser || "Unknown"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => toggleRowExpand(log._id)}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                            title="Toggle details"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => viewLogDetails(log)}
                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                            title="View details"
                                                        >
                                                            <Info className="w-4 h-4 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded Row - ✅ FIXED with proper keys on ALL children */}
                                            {isExpanded && (
                                                <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                    <td colSpan={7} className="py-3 px-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                    Details
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {Object.entries(log.details).map(([key, value]) => (
                                                                        <div key={key} className="flex items-start gap-2">
                                                                            <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                                                                {key}:
                                                                            </span>
                                                                            <span className="text-gray-900 dark:text-white break-all">
                                                                                {typeof value === "object"
                                                                                    ? JSON.stringify(value)
                                                                                    : String(value)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                    Metadata
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    <div key={`${log._id}-user-agent`} className="flex items-start gap-2">
                                                                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                                                            User Agent:
                                                                        </span>
                                                                        <span className="text-gray-900 dark:text-white text-xs">
                                                                            {log.userAgent}
                                                                        </span>
                                                                    </div>
                                                                    <div key={`${log._id}-location`} className="flex items-start gap-2">
                                                                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                                                            Location:
                                                                        </span>
                                                                        <span className="text-gray-900 dark:text-white">
                                                                            {log.location || "Unknown"}
                                                                        </span>
                                                                    </div>
                                                                    <div key={`${log._id}-device`} className="flex items-start gap-2">
                                                                        <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                                                            Device:
                                                                        </span>
                                                                        <span className="text-gray-900 dark:text-white">
                                                                            {log.device || "Unknown"}
                                                                        </span>
                                                                    </div>
                                                                    {log.metadata && (
                                                                        <React.Fragment key={`${log._id}-metadata`}>
                                                                            <div key={`${log._id}-browser`} className="flex items-start gap-2">
                                                                                <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                                                                    Browser:
                                                                                </span>
                                                                                <span className="text-gray-900 dark:text-white">
                                                                                    {log.metadata.browser}
                                                                                </span>
                                                                            </div>
                                                                            <div key={`${log._id}-os`} className="flex items-start gap-2">
                                                                                <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[100px]">
                                                                                    OS:
                                                                                </span>
                                                                                <span className="text-gray-900 dark:text-white">
                                                                                    {log.metadata.os}
                                                                                </span>
                                                                            </div>
                                                                        </React.Fragment>
                                                                    )}
                                                                </div>
                                                            </div>
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

                {/* Pagination */}
                {pagination.totalPages > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
                            entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.page === 1}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Details Modal */}
            {showDetailsModal && selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log Details</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(selectedLog.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* User Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                        {selectedLog.user.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{selectedLog.user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedLog.user.email}</p>
                                    <p className="text-xs text-gray-400">Role: {selectedLog.user.role}</p>
                                </div>
                            </div>

                            {/* Action Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Action</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                        {selectedLog.action}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Resource</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                        {selectedLog.resource}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                            selectedLog.status
                                        )}`}
                                    >
                                        {selectedLog.status === "success" ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : (
                                            <XCircle className="w-3 h-3" />
                                        )}
                                        {selectedLog.status.charAt(0).toUpperCase() + selectedLog.status.slice(1)}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Severity</p>
                                    <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                            selectedLog.severity
                                        )}`}
                                    >
                                        {selectedLog.severity.charAt(0).toUpperCase() + selectedLog.severity.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* IP & Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">IP Address</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedLog.ip}</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedLog.location || "Unknown"}
                                    </p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Details</p>
                                <div className="space-y-1">
                                    {Object.entries(selectedLog.details).map(([key, value]) => (
                                        <div key={key} className="flex items-start gap-2 text-sm">
                                            <span className="text-gray-500 dark:text-gray-400 font-medium min-w-[120px]">
                                                {key}:
                                            </span>
                                            <span className="text-gray-900 dark:text-white break-all">
                                                {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* User Agent */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">User Agent</p>
                                <p className="text-sm text-gray-900 dark:text-white break-all">{selectedLog.userAgent}</p>
                            </div>

                            {/* Metadata */}
                            {selectedLog.metadata && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Metadata</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <p className="text-xs text-gray-400">Browser</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedLog.metadata.browser}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">OS</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedLog.metadata.os}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Platform</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedLog.metadata.platform}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;