// app/(dashboard)/management-report/[id]/report/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
    AlertCircle,
    ArrowLeft,
    ChevronRight,
    FileText,
    Loader2,
    Settings2,
    UserCircle,
} from "lucide-react";
import ManagementReportSheet from "@/components/management-report/ManagementReportSheet";
import type { AttendanceStatus, TaskRowData } from "@/types/management-report/managementReport";
import {
    generateMonthRows,
    mergeTasksIntoMonth,
    type ApiTask,
} from "@/lib/management-report/generateMonthRows";
import { useAuth } from "@/contexts/AuthContext";
import {
    loadEmployeeSettings,
    type EmployeeMonthSettings,
} from "@/types/management-report/employeeSettings";

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sept", "Oct", "Nov", "Dec",
];

function tabToMonthIndex(tab: string): number {
    return MONTH_NAMES.indexOf(tab);
}

interface EmployeeInfo {
    _id: string;
    fullName: string;
    email: string;
    employeeId?: string;
    position?: string;
    department?: { name?: string } | string;
}

export default function UserManagementReportPage() {
    const params = useParams<{ id: string }>();
    const { hasRole } = useAuth();
    const userId = params?.id;

    const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
    const [allTasks, setAllTasks] = useState<ApiTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [employeeSettings, setEmployeeSettings] =
        useState<EmployeeMonthSettings | null>(null);

    const now = new Date();
    const [activeTab, setActiveTab] = useState(MONTH_NAMES[now.getMonth()]);
    const [year] = useState(now.getFullYear());

    const canEdit = hasRole([
        "super_admin", "admin", "hr_manager", "dept_manager",
    ]);
    const readOnly = !canEdit;

    const [editedRows, setEditedRows] = useState<TaskRowData[]>([]);

    const monthIndex = tabToMonthIndex(activeTab);
    const isMonthTab = monthIndex >= 0;

    // -------------------------------------------------------------------------
    // Fetch employee + tasks
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!userId) return;
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await api.get(`/tasks/user/${userId}`);
                if (cancelled) return;

                setEmployee(res.data?.user || null);
                setAllTasks(res.data?.data || []);

                if ((res.data?.data || []).length === 0) {
                    setFetchError(
                        "This user has no tasks yet. Showing empty month rows.",
                    );
                }
            } catch (err: any) {
                console.error("❌ Failed to load report:", err);
                if (!cancelled) {
                    setFetchError(
                        err?.response?.data?.message || "Failed to load report",
                    );
                    toast.error(err?.response?.data?.message || "Failed to load report");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    // -------------------------------------------------------------------------
    // Load employee settings for the month
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!userId || !isMonthTab) return;
        try {
            setEmployeeSettings(loadEmployeeSettings(userId, year, monthIndex));
        } catch (err) {
            console.warn("Could not load settings", err);
            setEmployeeSettings(null);
        }
    }, [userId, year, monthIndex, isMonthTab]);

    // -------------------------------------------------------------------------
    // Compute rows
    // -------------------------------------------------------------------------
    const computedRows: TaskRowData[] = useMemo(() => {
        if (!isMonthTab) {
            return allTasks.map((task, i) => {
                const isCompleted = task.status === "completed";
                return {
                    id: i + 1,
                    dayNum: new Date(task.startDate || task.createdAt).getDate(),
                    status: isCompleted ? "Done - 100%" : "Not Yet Started",
                    priority: "Medium",
                    startDate: "",
                    endDate: "",
                    givenDuration: "00:00",
                    day: "",
                    taskDescription: task.title,
                    deliverDate: "",
                    attendance: (isCompleted ? "Present" : "Absent") as AttendanceStatus,
                    workLinkText: task.workLinkUrl || "",
                    workLinkUrl: task.workLinkUrl,
                    supervisor: (isCompleted ? "100%" : "0%") as any,
                    hr: (isCompleted ? "100%" : "0%") as any,
                    ceo: (isCompleted ? "100%" : "0%") as any,
                    comments: "",
                    taskId: task._id,
                };
            });
        }

        const specialOffDays: number[] = [];
        const leaveDays: Record<number, string> = {};

        (employeeSettings?.offDays || []).forEach((o) => {
            if (o.type === "gov" || o.type === "custom") {
                specialOffDays.push(o.day);
            } else if (o.type === "leave") {
                leaveDays[o.day] = o.label;
            }
        });

        const template = generateMonthRows({
            year,
            month: monthIndex,
            specialOffDays,
            leaveDays,
        });

        const monthTasks = allTasks.filter((t) => {
            const d = new Date(t.startDate || t.createdAt);
            return d.getFullYear() === year && d.getMonth() === monthIndex;
        });

        return mergeTasksIntoMonth(template, monthTasks);
    }, [allTasks, monthIndex, year, isMonthTab, employeeSettings]);

    useEffect(() => {
        setEditedRows(computedRows);
    }, [computedRows]);

    // -------------------------------------------------------------------------
    // Header values
    // -------------------------------------------------------------------------
    const monthLabel = isMonthTab ? `${activeTab}-${year}` : `${year}`;
    const employeeName = employee?.fullName || "Unknown User";
    const employeeRole = employee?.position || "";

    const targetLinks = [
        {
            label: "Department",
            value:
                typeof employee?.department === "string"
                    ? employee.department
                    : employee?.department?.name || "—",
        },
        { label: "Employee ID", value: employee?.employeeId || "—" },
        {
            label: "Email",
            url: employee?.email ? `mailto:${employee.email}` : undefined,
        },
    ];

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafd]">
                <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Loading report…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col bg-[#f8fafd]">
            {/* BREADCRUMB BAR */}
            <div className="shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6">
                    <nav className="flex min-w-0 flex-1 items-center gap-1 text-xs">
                        <Link
                            href="/management-report"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Management Report</span>
                            <span className="sm:hidden">Back</span>
                        </Link>

                        <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />

                        <div className="flex min-w-0 items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                            <UserCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[160px]">{employeeName}</span>
                        </div>

                        <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />

                        <div className="hidden items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1 font-medium text-slate-600 sm:flex">
                            <FileText className="h-3.5 w-3.5" />
                            <span>{monthLabel || "Report"}</span>
                        </div>
                    </nav>

                    <div className="flex items-center gap-2">
                        {fetchError && (
                            <div className="group relative">
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    <span className="hidden sm:inline">Report notice</span>
                                    <span className="sm:hidden">!</span>
                                </div>
                                <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-64 origin-top-right scale-95 rounded-xl border border-amber-200 bg-white p-3 text-left opacity-0 shadow-xl transition group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                        <div className="text-xs text-slate-700">
                                            <p className="font-bold text-amber-800">Notice</p>
                                            <p className="mt-0.5 leading-relaxed text-slate-600">
                                                {fetchError}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {canEdit && (
                            <Link
                                href={`/management-report/${userId}/settings`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-md"
                            >
                                <Settings2 className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Employee Settings</span>
                                <span className="sm:hidden">Settings</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* SHEET */}
            <div className="min-h-0 flex-1 overflow-hidden">
                <ManagementReportSheet
                    monthLabel={monthLabel}
                    rows={editedRows}
                    onRowsChange={setEditedRows}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    employeeName={employeeName}
                    employeeRole={employeeRole}
                    employeeId={employee?.employeeId}
                    targetLinks={targetLinks}
                    readOnly={readOnly}
                />
            </div>
        </div>
    );
}