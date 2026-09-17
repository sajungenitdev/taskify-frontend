"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import {
    Users,
    Search,
    Download,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Filter,
    Building2,
    Mail,
    Phone,
    Briefcase,
    MapPin,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Eye,
    BarChart3,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ManagementUser {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    employeeId?: string;
    department?: { _id?: string; name?: string } | string;
    phoneNumber?: string;
    location?: string;
    position?: string;
    profilePhoto?: string;
    isActive?: boolean;
    onboardingCompleted?: boolean;
    createdAt?: string;
}

type SortKey =
    | "fullName"
    | "email"
    | "role"
    | "department"
    | "position"
    | "createdAt";

type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getDeptName = (u: ManagementUser): string => {
    if (!u.department) return "—";
    if (typeof u.department === "string") return u.department;
    return u.department.name || "—";
};

const formatDate = (iso?: string): string => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return "—";
    }
};

const roleBadgeColor: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700 border-purple-200",
    admin: "bg-red-100 text-red-700 border-red-200",
    hr_manager: "bg-pink-100 text-pink-700 border-pink-200",
    dept_manager: "bg-indigo-100 text-indigo-700 border-indigo-200",
    project_manager: "bg-blue-100 text-blue-700 border-blue-200",
    line_manager: "bg-cyan-100 text-cyan-700 border-cyan-200",
    employee: "bg-slate-100 text-slate-700 border-slate-200",
};

const prettyRole = (r: string) =>
    r
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

function resolveImageUrl(imagePath?: string): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith("data:image/")) return imagePath;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }
    const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const baseUrl = apiUrl.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
    let path = imagePath.replace(/\\/g, "/");
    if (!path.startsWith("/")) path = "/" + path;
    return `${baseUrl}${path}`;
}

function UserAvatar({
    src,
    name,
    size = 36,
}: {
    src?: string;
    name: string;
    size?: number;
}) {
    const [errored, setErrored] = useState(false);
    const url = useMemo(() => resolveImageUrl(src), [src]);

    const initials =
        (name || "?")
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() || "?";

    if (url && !errored) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={url}
                alt={name}
                width={size}
                height={size}
                onError={() => setErrored(true)}
                className="rounded-full object-cover border border-slate-200 shrink-0"
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div
            className="rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs shrink-0"
            style={{ width: size, height: size }}
            aria-label={name}
        >
            {initials}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ManagementReportPage() {
    const { user, hasRole } = useAuth();

    const [users, setUsers] = useState<ManagementUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [deptFilter, setDeptFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const [sortKey, setSortKey] = useState<SortKey>("fullName");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const fetchUsers = async (isRefresh = false) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            setError(null);

            const res = await api.get("/users", { params: { limit: 1000 } });
            const payload =
                res.data?.data?.users ||
                res.data?.data ||
                res.data?.users ||
                res.data ||
                [];
            const list: ManagementUser[] = Array.isArray(payload)
                ? payload
                : payload.users || [];
            setUsers(list);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message || err?.message || "Failed to load users";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const roles = useMemo(() => {
        const s = new Set<string>();
        users.forEach((u) => u.role && s.add(u.role));
        return Array.from(s).sort();
    }, [users]);

    const departments = useMemo(() => {
        const s = new Set<string>();
        users.forEach((u) => {
            const d = getDeptName(u);
            if (d && d !== "—") s.add(d);
        });
        return Array.from(s).sort();
    }, [users]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let out = users.filter((u) => {
            if (q) {
                const hay = [u.fullName, u.email, u.employeeId, u.position, getDeptName(u), u.phoneNumber]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (roleFilter !== "all" && u.role !== roleFilter) return false;
            if (deptFilter !== "all" && getDeptName(u) !== deptFilter) return false;
            if (statusFilter !== "all") {
                const active = u.isActive !== false;
                if (statusFilter === "active" && !active) return false;
                if (statusFilter === "inactive" && active) return false;
            }
            return true;
        });

        out = [...out].sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            const av = sortKey === "department" ? getDeptName(a) : (a as any)[sortKey] ?? "";
            const bv = sortKey === "department" ? getDeptName(b) : (b as any)[sortKey] ?? "";
            return String(av).localeCompare(String(bv)) * dir;
        });

        return out;
    }, [users, search, roleFilter, deptFilter, statusFilter, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paged = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, deptFilter, statusFilter, pageSize]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const clearFilters = () => {
        setSearch("");
        setRoleFilter("all");
        setDeptFilter("all");
        setStatusFilter("all");
    };

    const exportCSV = () => {
        if (!filtered.length) return toast.error("Nothing to export");
        const headers = ["Employee ID", "Full Name", "Email", "Phone", "Role", "Department", "Position", "Location", "Status", "Created"];
        const rows = filtered.map((u) => [
            u.employeeId || "",
            u.fullName || "",
            u.email || "",
            u.phoneNumber || "",
            u.role || "",
            getDeptName(u),
            u.position || "",
            u.location || "",
            u.isActive === false ? "Inactive" : "Active",
            formatDate(u.createdAt),
        ]);
        const escape = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
        const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `management-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exported CSV");
    };

    const canManage = hasRole(["super_admin", "admin", "hr_manager", "dept_manager"]);

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="h-7 w-7 text-indigo-600" />
                        Management Report
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Overview of all users across departments
                        {user?.fullName ? ` • Signed in as ${user.fullName}` : ""}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fetchUsers(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button
                        onClick={exportCSV}
                        disabled={!filtered.length}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={users.length} color="text-indigo-600 bg-indigo-50" />
                <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Active" value={users.filter((u) => u.isActive !== false).length} color="text-emerald-600 bg-emerald-50" />
                <StatCard icon={<XCircle className="h-5 w-5" />} label="Inactive" value={users.filter((u) => u.isActive === false).length} color="text-rose-600 bg-rose-50" />
                <StatCard icon={<Building2 className="h-5 w-5" />} label="Departments" value={departments.length} color="text-amber-600 bg-amber-50" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-slate-700">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-semibold">Filters</span>
                    {(search || roleFilter !== "all" || deptFilter !== "all" || statusFilter !== "all") && (
                        <button onClick={clearFilters} className="ml-auto text-xs text-indigo-600 hover:underline">
                            Clear all
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative md:col-span-2">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, employee ID, position…"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        />
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                        <option value="all">All Roles</option>
                        {roles.map((r) => (
                            <option key={r} value={r}>{prettyRole(r)}</option>
                        ))}
                    </select>

                    <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    >
                        <option value="all">All Departments</option>
                        {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {(["all", "active", "inactive"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${statusFilter === s
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}

                    <span className="ml-auto text-xs text-slate-500">
                        {filtered.length} of {users.length} users
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                                <Th sortKey="fullName" current={sortKey} dir={sortDir} onSort={handleSort}>User</Th>
                                <Th sortKey="email" current={sortKey} dir={sortDir} onSort={handleSort}>Contact</Th>
                                <Th sortKey="role" current={sortKey} dir={sortDir} onSort={handleSort}>Role</Th>
                                <Th sortKey="department" current={sortKey} dir={sortDir} onSort={handleSort}>Department</Th>
                                <Th sortKey="position" current={sortKey} dir={sortDir} onSort={handleSort}>Position</Th>
                                <th className="px-4 py-3">Status</th>
                                <Th sortKey="createdAt" current={sortKey} dir={sortDir} onSort={handleSort}>Joined</Th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <SkeletonRows rows={pageSize} cols={8} />
                            ) : error ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-rose-600">{error}</td>
                                </tr>
                            ) : paged.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                        No users match your filters.
                                    </td>
                                </tr>
                            ) : (
                                paged.map((u) => {
                                    const active = u.isActive !== false;
                                    return (
                                        <tr key={u._id} className="hover:bg-slate-50/60">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <UserAvatar src={u.profilePhoto} name={u.fullName} size={36} />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-slate-900 truncate">{u.fullName || "—"}</p>
                                                        <p className="text-xs text-slate-500 truncate">{u.employeeId || "—"}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-slate-700">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="truncate max-w-[200px]">{u.email || "—"}</span>
                                                    </div>
                                                    {u.phoneNumber && (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                            {u.phoneNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadgeColor[u.role] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                                    <ShieldCheck className="h-3 w-3" />
                                                    {prettyRole(u.role || "—")}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                    {getDeptName(u)}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                                    {u.position || "—"}
                                                </div>
                                                {u.location && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                        <MapPin className="h-3 w-3 text-slate-400" />
                                                        {u.location}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                {active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="h-3 w-3" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                        <XCircle className="h-3 w-3" /> Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-slate-600">
                                                {formatDate(u.createdAt)}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        href={`/management-report/${u._id}`}
                                                        title="View Profile"
                                                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 inline-flex items-center"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/management-report/${u._id}/report`}
                                                        title="View Task Report"
                                                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 inline-flex items-center"
                                                    >
                                                        <BarChart3 className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filtered.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                        <div className="text-xs text-slate-500">
                            Showing <span className="font-medium text-slate-700">{(currentPage - 1) * pageSize + 1}</span>{" "}
                            – <span className="font-medium text-slate-700">{Math.min(currentPage * pageSize, filtered.length)}</span>{" "}
                            of <span className="font-medium text-slate-700">{filtered.length}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="px-2 py-1.5 rounded-md border border-slate-200 text-xs bg-white"
                            >
                                {[10, 20, 50, 100].map((n) => (
                                    <option key={n} value={n}>{n} / page</option>
                                ))}
                            </select>

                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <span className="text-xs text-slate-600 min-w-[70px] text-center">
                                Page {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-xl font-bold text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    );
}

function Th({
    children,
    sortKey,
    current,
    dir,
    onSort,
    className = "",
}: {
    children: React.ReactNode;
    sortKey: SortKey;
    current: SortKey;
    dir: SortDir;
    onSort: (k: SortKey) => void;
    className?: string;
}) {
    const active = current === sortKey;
    return (
        <th
            className={`px-4 py-3 cursor-pointer select-none hover:text-slate-700 ${className}`}
            onClick={() => onSort(sortKey)}
        >
            <span className="inline-flex items-center gap-1">
                {children}
                {active ? (
                    dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronDown className="h-3 w-3 opacity-30" />
                )}
            </span>
        </th>
    );
}

function SkeletonRows({ rows, cols }: { rows: number; cols: number }) {
    return (
        <>
            {Array.from({ length: Math.min(rows, 8) }).map((_, r) => (
                <tr key={r} className="animate-pulse">
                    {Array.from({ length: cols }).map((__, c) => (
                        <td key={c} className="px-4 py-4">
                            <div className="h-4 bg-slate-100 rounded w-3/4" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}