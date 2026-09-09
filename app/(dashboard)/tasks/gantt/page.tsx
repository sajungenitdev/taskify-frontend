// app/(dashboard)/tasks/gantt/page.tsx
"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, memo, useTransition } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    Search,
    Loader2,
    RefreshCw,
    Download,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Users,
    AlertCircle,
    X,
    Flag,
    UserCircle,
    UserCheck,
    FileText,
    GitBranch,
    Gem,
    Link2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DependencyEditor from "@/components/tasks/DependencyEditor";

// ============ TYPES ============
interface Task {
    _id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    estimatedHours?: number;
    actualMinutes?: number;
    startDate?: string;
    deadline: string;
    createdAt?: string;
    updatedAt?: string;
    assignedTo?: {
        _id: string;
        fullName: string;
        email: string;
    } | null;
    projectId?: {
        _id: string;
        name: string;
        code?: string;
        color?: string;
    };
    createdBy?: {
        _id: string;
        fullName: string;
    };
    dependencies?: {
        taskId: string;
        type: string;
        lag: number;
    }[];
    order?: number;
    progress?: number;
    isMilestone?: boolean;
    parentTaskId?: string | null | { _id: string; title: string; status: string };
    subTaskCount?: number;
    completedSubTaskCount?: number;
}

interface GanttTask extends Task {
    start: Date;
    end: Date;
    duration: number;
    row: number;
    progressPercent: number;
    color: string;
    isOverdue: boolean;
    isToday: boolean;
    isThisWeek: boolean;
    startDayOffset: number;
    x: number;
    y: number;
    isVisible: boolean;
}

interface UserItem {
    _id: string;
    fullName: string;
    email: string;
    employeeId?: string;
    role?: string;
    department?: string;
}

interface DependencyEdge {
    from: string;
    to: string;
    type: string;
    lag: number;
}

// ============ CONSTANTS ============
const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    todo: "#64748b",
    in_progress: "#3b82f6",
    submitted: "#8b5cf6",
    completed: "#10b981",
    done: "#10b981",
    overdue: "#ef4444",
    rejected: "#f43f5e",
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    todo: "To Do",
    in_progress: "In Progress",
    submitted: "Submitted",
    completed: "Completed",
    done: "Done",
    overdue: "Overdue",
    rejected: "Rejected",
};

const PRIORITY_LABELS: Record<string, string> = {
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
};

const MS_PER_DAY = 86400000;

// ============ UTILITIES ============
const formatDate = (date: Date | string): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateShort = (date: Date | string): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getStatusColor = (status: string): string => STATUS_COLORS[status] || "#64748b";
const getStatusLabel = (status: string): string => STATUS_LABELS[status] || status;
const getPriorityLabel = (priority: string): string => PRIORITY_LABELS[priority] || priority;

const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ============ MEMOIZED COMPONENTS ============
const Tooltip = memo(({
    children,
    content,
    position = "top",
}: {
    children: React.ReactNode;
    content: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
}) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    return (
        <div
            className="relative inline-block w-full h-full"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute z-50 ${positionClasses[position]} min-w-max max-w-xs px-3 py-2 bg-slate-900 text-white text-xs rounded-xl shadow-xl pointer-events-none border border-slate-700`}
                >
                    {content}
                </div>
            )}
        </div>
    );
});
Tooltip.displayName = "Tooltip";

const TaskGanttBar = memo(({
    task,
    dayWidth,
    onTaskClick,
}: {
    task: GanttTask;
    dayWidth: number;
    onTaskClick: (task: GanttTask) => void;
}) => {
    if (!task.isVisible) return null;

    const left = Math.max(0, task.startDayOffset * dayWidth);
    const width = Math.max(task.duration * dayWidth, 26);
    const hasDependencies = (task.dependencies?.length ?? 0) > 0;

    const barColor = task.isOverdue
        ? "bg-rose-500"
        : task.status === "completed" || task.status === "done"
            ? "bg-emerald-500"
            : task.status === "in_progress"
                ? "bg-blue-600"
                : task.status === "submitted"
                    ? "bg-purple-600"
                    : "bg-amber-500";

    const barColorLight = task.isOverdue
        ? "bg-rose-50 border-rose-200"
        : task.status === "completed" || task.status === "done"
            ? "bg-emerald-50 border-emerald-200"
            : task.status === "in_progress"
                ? "bg-blue-50 border-blue-200"
                : task.status === "submitted"
                    ? "bg-purple-50 border-purple-200"
                    : "bg-amber-50 border-amber-200";

    const tooltipContent = (
        <div className="space-y-1 text-left">
            <p className="font-semibold text-white truncate max-w-[220px]">{task.title}</p>
            <div className="flex items-center gap-2 text-slate-300">
                <span>{getStatusLabel(task.status)}</span>
                <span>•</span>
                <span>{getPriorityLabel(task.priority)}</span>
            </div>
            <div className="text-slate-300">
                {formatDateShort(task.start)} – {formatDateShort(task.end)} ({task.duration}d)
            </div>
            <div className="text-slate-300">Progress: {task.progressPercent}%</div>
            {task.assignedTo && (
                <p className="text-slate-300 truncate">Assigned: {task.assignedTo.fullName}</p>
            )}
        </div>
    );

    return (
        <div
            className="absolute top-[8px] h-[28px] cursor-pointer group select-none"
            style={{
                left: `${left}px`,
                width: `${width}px`,
            }}
            onClick={() => onTaskClick(task)}
        >
            <Tooltip content={tooltipContent}>
                <div
                    className={`relative w-full h-full rounded-md border flex items-center overflow-hidden transition-all duration-100 group-hover:scale-[1.01] ${barColorLight} ${hasDependencies ? "border-l-4 border-l-indigo-500" : ""
                        }`}
                >
                    <div
                        className={`h-full ${barColor} opacity-90`}
                        style={{ width: `${Math.min(task.progressPercent || 0, 100)}%` }}
                    />
                    <span className="absolute left-2.5 text-[11px] font-medium text-slate-800 truncate pr-2 pointer-events-none">
                        {task.progressPercent > 20 ? task.title : ""}
                    </span>

                    {task.isOverdue && (
                        <span className="absolute right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                        </span>
                    )}
                </div>
            </Tooltip>
        </div>
    );
});
TaskGanttBar.displayName = "TaskGanttBar";

const MilestoneDiamond = memo(({
    task,
    dayWidth,
    onTaskClick,
}: {
    task: GanttTask;
    dayWidth: number;
    onTaskClick: (task: GanttTask) => void;
}) => {
    if (!task.isVisible) return null;

    const left = task.startDayOffset * dayWidth + dayWidth / 2 - 12;

    const diamondColor = task.isOverdue
        ? "text-rose-500"
        : task.status === "completed" || task.status === "done"
            ? "text-emerald-500"
            : task.status === "in_progress"
                ? "text-blue-500"
                : task.status === "submitted"
                    ? "text-purple-500"
                    : "text-amber-500";

    return (
        <div
            className="absolute top-[10px] cursor-pointer z-10 hover:scale-110 transition-transform select-none"
            style={{ left: `${left}px` }}
            onClick={() => onTaskClick(task)}
        >
            <Tooltip
                content={
                    <div>
                        <p className="font-semibold text-white">🚩 {task.title}</p>
                        <p className="text-slate-300 text-[11px]">{formatDate(task.start)}</p>
                    </div>
                }
            >
                <div className="relative">
                    <svg
                        className={`w-6 h-6 ${diamondColor} drop-shadow-xs`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <polygon points="12,2 22,12 12,22 2,12" />
                    </svg>
                    <Flag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white" fill="white" />
                </div>
            </Tooltip>
        </div>
    );
});
MilestoneDiamond.displayName = "MilestoneDiamond";

const DependencyOverlay = memo(({
    edges,
    tasks,
    dayWidth,
}: {
    edges: DependencyEdge[];
    tasks: GanttTask[];
    dayWidth: number;
}) => {
    const taskMap = useMemo(() => new Map(tasks.map((t) => [t._id, t])), [tasks]);

    return (
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10 overflow-visible">
            <defs>
                <marker
                    id="gantt-arrow-default"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
                </marker>
                <marker
                    id="gantt-arrow-overdue"
                    viewBox="0 0 10 10"
                    refX="7"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                </marker>
            </defs>

            {edges.map((edge, idx) => {
                const fromTask = taskMap.get(edge.from);
                const toTask = taskMap.get(edge.to);
                if (!fromTask || !toTask || !fromTask.isVisible || !toTask.isVisible) return null;

                const fromX = (fromTask.startDayOffset + fromTask.duration) * dayWidth;
                const fromY = fromTask.row * 44 + 22;
                const toX = toTask.startDayOffset * dayWidth;
                const toY = toTask.row * 44 + 22;

                const isBlocked = toTask.isOverdue;
                const strokeColor = isBlocked ? "#ef4444" : "#6366f1";
                const marker = isBlocked ? "url(#gantt-arrow-overdue)" : "url(#gantt-arrow-default)";
                const midX = (fromX + toX) / 2;

                return (
                    <path
                        key={`edge-${idx}`}
                        d={`M ${fromX} ${fromY} C ${midX} ${fromY - 16}, ${midX} ${toY - 16}, ${toX} ${toY}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isBlocked ? 2 : 1.5}
                        strokeDasharray={isBlocked ? "4,4" : undefined}
                        markerEnd={marker}
                        opacity={0.8}
                    />
                );
            })}
        </svg>
    );
});
DependencyOverlay.displayName = "DependencyOverlay";

// ============ MAIN COMPONENT ============
export default function GanttChartPage() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLoading, setFilterLoading] = useState(false);
    const [, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Filters & UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTask, setSelectedTask] = useState<GanttTask | null>(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);
    const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [zoomLevel, setZoomLevel] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterPriority, setFilterPriority] = useState<string>("all");
    const [filterProject, setFilterProject] = useState<string>("all");
    const [filterEmployee, setFilterEmployee] = useState<string>("all");
    const [filterMilestone, setFilterMilestone] = useState<string>("all");
    const [filterSubTask, setFilterSubTask] = useState<string>("all");
    const [viewTab, setViewTab] = useState<"all" | "employee">("all");
    const [selectedEmployee, setSelectedEmployee] = useState<UserItem | null>(null);
    const [exportingPDF, setExportingPDF] = useState(false);

    // Dependencies
    const [dependencyEdges, setDependencyEdges] = useState<DependencyEdge[]>([]);
    const [showDependencyEditor, setShowDependencyEditor] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState("");

    // Container Refs
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [tasksRes, projectsRes, usersRes] = await Promise.all([
                api.get("/tasks"),
                api.get("/projects").catch(() => ({ data: { success: false, data: [] } })),
                api.get("/users").catch(() => ({ data: { success: false, data: [] } })),
            ]);

            if (tasksRes.data?.success) {
                const taskData: Task[] = tasksRes.data.data || [];
                setTasks(taskData);

                const edges: DependencyEdge[] = [];
                taskData.forEach((task) => {
                    task.dependencies?.forEach((dep) => {
                        edges.push({
                            from: dep.taskId,
                            to: task._id,
                            type: dep.type || "FS",
                            lag: dep.lag || 0,
                        });
                    });
                });
                setDependencyEdges(edges);
            }

            if (projectsRes.data?.success) {
                setProjects(projectsRes.data.data.map((p: any) => ({ _id: p._id, name: p.name })));
            }

            if (usersRes.data?.success) {
                setUsers(usersRes.data.data || []);
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } } };
            console.error("Failed to load Gantt data:", errorObj);
            setError(errorObj.response?.data?.message || "Failed to load data");
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, fetchData]);

    // Responsive Day Width
    const dayWidth = useMemo(() => {
        const base = viewMode === "day" ? 64 : viewMode === "week" ? 42 : 28;
        return Math.round(base * zoomLevel);
    }, [viewMode, zoomLevel]);

    const handleFilterChange = <T extends string>(
        setter: React.Dispatch<React.SetStateAction<T>>,
        val: T
    ) => {
        setFilterLoading(true);
        startTransition(() => {
            setter(val);
            setTimeout(() => setFilterLoading(false), 60);
        });
    };

    // Calculate bounded window based on currentDate and viewMode
    const timelineBounds = useMemo(() => {
        const baseDate = new Date(currentDate);
        baseDate.setHours(0, 0, 0, 0);

        let daysBefore = 7;
        let daysAfter = 21;

        if (viewMode === "day") {
            daysBefore = 5;
            daysAfter = 15;
        } else if (viewMode === "week") {
            daysBefore = 7;
            daysAfter = 28;
        } else if (viewMode === "month") {
            daysBefore = 10;
            daysAfter = 50;
        }

        const start = new Date(baseDate.getTime() - daysBefore * MS_PER_DAY);
        const end = new Date(baseDate.getTime() + daysAfter * MS_PER_DAY);
        const totalDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);

        return { start, end, totalDays };
    }, [currentDate, viewMode]);

    // Gantt Dataset
    const ganttData = useMemo(() => {
        const filtered = tasks.filter((task) => {
            if (!task.startDate && !task.deadline) return false;
            if (filterMilestone === "milestones" && !task.isMilestone) return false;
            if (filterMilestone === "regular" && task.isMilestone) return false;
            if (filterSubTask === "parent" && task.parentTaskId) return false;
            if (filterSubTask === "subtask" && !task.parentTaskId) return false;
            if (filterEmployee !== "all" && task.assignedTo?._id !== filterEmployee) return false;
            if (filterStatus !== "all" && task.status !== filterStatus) return false;
            if (filterPriority !== "all" && task.priority !== filterPriority) return false;
            if (filterProject !== "all" && task.projectId?._id !== filterProject) return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match =
                    task.title.toLowerCase().includes(q) ||
                    task.description?.toLowerCase().includes(q) ||
                    task.projectId?.name?.toLowerCase().includes(q);
                if (!match) return false;
            }
            return true;
        });

        const sorted = [...filtered].sort((a, b) => {
            const dA = new Date(a.startDate || a.deadline).getTime();
            const dB = new Date(b.startDate || b.deadline).getTime();
            return dA - dB;
        });

        const now = new Date();
        const timelineStartTs = timelineBounds.start.getTime();
        const timelineEndTs = timelineBounds.end.getTime();

        const ganttTasks: GanttTask[] = sorted.map((task, index) => {
            const start = new Date(task.startDate || task.deadline);
            const end = new Date(task.deadline);
            const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY));
            const startDayOffset = Math.round((start.getTime() - timelineStartTs) / MS_PER_DAY);
            const progressPercent = task.progress ?? (task.status === "completed" || task.status === "done" ? 100 : 0);
            const isOverdue = end < now && task.status !== "completed" && task.status !== "done";

            const isVisible = end.getTime() >= timelineStartTs && start.getTime() <= timelineEndTs;

            return {
                ...task,
                start,
                end,
                duration,
                row: index,
                progressPercent,
                color: getStatusColor(task.status),
                isOverdue,
                isToday: now >= start && now <= end,
                isThisWeek: Math.abs(now.getTime() - start.getTime()) < 7 * MS_PER_DAY,
                isMilestone: task.isMilestone || false,
                subTaskCount: task.subTaskCount || 0,
                completedSubTaskCount: task.completedSubTaskCount || 0,
                startDayOffset,
                x: startDayOffset * dayWidth,
                y: index * 44 + 22,
                isVisible,
            };
        });

        return {
            tasks: ganttTasks,
            startDate: timelineBounds.start,
            endDate: timelineBounds.end,
            totalDays: timelineBounds.totalDays,
            totalTasks: ganttTasks.length,
            milestoneCount: ganttTasks.filter((t) => t.isMilestone).length,
            parentTaskCount: ganttTasks.filter((t) => !t.parentTaskId).length,
            subTaskCount: ganttTasks.filter((t) => !!t.parentTaskId).length,
        };
    }, [tasks, searchQuery, filterStatus, filterPriority, filterProject, filterEmployee, filterMilestone, filterSubTask, timelineBounds, dayWidth]);

    const statuses = useMemo(() => Array.from(new Set(tasks.map((t) => t.status))), [tasks]);
    const priorities = useMemo(() => Array.from(new Set(tasks.map((t) => t.priority))), [tasks]);

    // Timeline Columns
    const dateLabels = useMemo(() => {
        const labels = [];
        const start = new Date(timelineBounds.start);
        const todayStr = new Date().toDateString();

        for (let i = 0; i <= timelineBounds.totalDays; i++) {
            const date = new Date(start.getTime() + i * MS_PER_DAY);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = date.toDateString() === todayStr;

            let text = "";
            const subText = date.getDate().toString();

            if (viewMode === "day") {
                text = date.toLocaleDateString("en-US", { weekday: "short" });
            } else if (viewMode === "week") {
                text = date.toLocaleDateString("en-US", { weekday: "narrow" });
            } else {
                text = date.getDate() === 1 ? date.toLocaleDateString("en-US", { month: "short" }) : "";
            }

            labels.push({ text, subText, isWeekend, isToday });
        }
        return labels;
    }, [timelineBounds, viewMode]);

    const navigateDate = useCallback((direction: "prev" | "next") => {
        setFilterLoading(true);
        startTransition(() => {
            setCurrentDate((prev) => {
                const shiftDays = viewMode === "day" ? 5 : viewMode === "week" ? 14 : 30;
                const next = new Date(prev.getTime() + (direction === "next" ? shiftDays : -shiftDays) * MS_PER_DAY);
                return next;
            });
            setTimeout(() => setFilterLoading(false), 50);
        });
    }, [viewMode]);

    const goToToday = useCallback(() => {
        setFilterLoading(true);
        startTransition(() => {
            setCurrentDate(new Date());
            setTimeout(() => setFilterLoading(false), 50);
        });
    }, []);

    const handleZoomIn = () => {
        setFilterLoading(true);
        startTransition(() => {
            setZoomLevel((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 1.5));
            setTimeout(() => setFilterLoading(false), 60);
        });
    };

    const handleZoomOut = () => {
        setFilterLoading(true);
        startTransition(() => {
            setZoomLevel((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.7));
            setTimeout(() => setFilterLoading(false), 60);
        });
    };

    const handleTaskClick = useCallback((task: GanttTask) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
    }, []);

    const getEmployeeTaskCount = useCallback(
        (empId: string) => tasks.filter((t) => t.assignedTo?._id === empId).length,
        [tasks]
    );

    // PDF Export
    const handleExportPDF = useCallback(async () => {
        try {
            setExportingPDF(true);
            toast.loading("Generating PDF...", { id: "pdf-export" });

            const doc = new jsPDF("l", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();

            doc.setFontSize(18);
            doc.setTextColor(79, 70, 229);
            doc.text("Gantt Chart Report", pageWidth / 2, 16, { align: "center" });

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: "center" });

            const tableData = ganttData.tasks.map((task) => [
                task.title,
                task.projectId?.name || "N/A",
                getStatusLabel(task.status),
                getPriorityLabel(task.priority),
                task.isMilestone ? "⭐ Yes" : "No",
                task.parentTaskId ? "Yes" : "No",
                task.dependencies?.length ? `${task.dependencies.length}` : "0",
                formatDate(task.start),
                formatDate(task.end),
                `${task.duration}d`,
                `${task.progressPercent}%`,
                task.assignedTo?.fullName || "Unassigned",
            ]);

            autoTable(doc, {
                startY: 28,
                head: [["Task", "Project", "Status", "Priority", "Milestone", "Sub", "Deps", "Start", "Deadline", "Dur", "Prog", "Assignee"]],
                body: tableData,
                theme: "striped",
                headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
                bodyStyles: { fontSize: 7 },
            });

            doc.save(`Gantt_Chart_${new Date().toISOString().split("T")[0]}.pdf`);
            toast.success("PDF exported successfully!", { id: "pdf-export" });
        } catch {
            toast.error("Failed to export PDF", { id: "pdf-export" });
        } finally {
            setExportingPDF(false);
        }
    }, [ganttData.tasks]);

    // CSV Export
    const handleExportCSV = () => {
        try {
            const headers = [
                "Task", "Project", "Status", "Priority", "Milestone", "Sub-Task",
                "Dependencies", "Start Date", "Deadline", "Duration (days)", "Progress (%)", "Assigned To"
            ];
            const rows = ganttData.tasks.map((task) => [
                `"${task.title.replace(/"/g, '""')}"`,
                `"${(task.projectId?.name || "N/A").replace(/"/g, '""')}"`,
                getStatusLabel(task.status),
                getPriorityLabel(task.priority),
                task.isMilestone ? "Yes" : "No",
                task.parentTaskId ? "Yes" : "No",
                task.dependencies?.length || 0,
                formatDate(task.start),
                formatDate(task.end),
                task.duration,
                task.progressPercent,
                `"${(task.assignedTo?.fullName || "Unassigned").replace(/"/g, '""')}"`,
            ]);

            const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `gantt_chart_${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("CSV exported successfully");
        } catch {
            toast.error("Failed to export CSV");
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] w-full">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-slate-500 text-sm font-medium">Loading schedule...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full flex items-center justify-center p-4 min-h-[300px]">
                <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Failed to Load Schedule</h3>
                    <p className="text-slate-500 text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 mx-auto shadow-xs"
                    >
                        <RefreshCw size={15} /> Retry
                    </button>
                </div>
            </div>
        );
    }

    const totalTimelineWidth = (dateLabels.length + 1) * dayWidth;

    return (
        <div className="container overflow-hidden p-4 md:p-6 space-y-4 mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 tracking-tight">
                        <CalendarDays className="w-6 h-6 text-indigo-600" />
                        Gantt Chart
                    </h1>
                    <p className="text-slate-500 text-xs mt-0.5">
                        Interactive visual timeline
                        <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            {ganttData.totalTasks} tasks
                        </span>
                        <span className="ml-2 text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                            ⭐ {ganttData.milestoneCount} milestones
                        </span>
                        <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                            <GitBranch className="w-3 h-3 inline" /> {ganttData.subTaskCount} sub-tasks
                        </span>
                        <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            <Link2 className="w-3 h-3 inline" /> {dependencyEdges.length} dependencies
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={fetchData}
                        className="p-2 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl transition text-slate-600 hover:text-indigo-600 shadow-xs"
                        title="Refresh"
                    >
                        <RefreshCw size={15} />
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold text-slate-700 shadow-xs"
                    >
                        <Download size={14} /> CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={exportingPDF || ganttData.tasks.length === 0}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center gap-1.5 text-xs font-semibold shadow-xs disabled:opacity-50"
                    >
                        <FileText size={14} className={exportingPDF ? "animate-spin" : ""} />
                        {exportingPDF ? "Exporting..." : "PDF"}
                    </button>
                </div>
            </motion.div>

            {/* View Tabs */}
            <div className="bg-slate-200/60 rounded-xl p-1 flex flex-wrap gap-1 max-w-xs">
                <button
                    onClick={() => {
                        handleFilterChange(setViewTab, "all");
                        setFilterEmployee("all");
                        setSelectedEmployee(null);
                    }}
                    className={`flex-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${viewTab === "all" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Users size={14} /> All Tasks
                </button>
                <button
                    onClick={() => handleFilterChange(setViewTab, "employee")}
                    className={`flex-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${viewTab === "employee" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <UserCircle size={14} /> Employee Wise
                </button>
            </div>

            {/* Employee Selector */}
            {viewTab === "employee" && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <UserCheck className="w-4 h-4 text-indigo-600" />
                            <span>Employee:</span>
                        </div>
                        <div className="flex-1 min-w-[220px]">
                            <select
                                value={filterEmployee}
                                onChange={(e) => {
                                    const empId = e.target.value;
                                    handleFilterChange(setFilterEmployee, empId);
                                    const emp = users.find((u) => u._id === empId);
                                    setSelectedEmployee(emp || null);
                                }}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-indigo-100 outline-none"
                            >
                                <option value="all">Select an employee...</option>
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.fullName} ({getEmployeeTaskCount(u._id)} tasks) {u.department ? `• ${u.department}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedEmployee && (
                            <div className="flex items-center gap-2.5 px-3 py-1 bg-indigo-50/70 rounded-lg border border-indigo-100">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                                    {getInitials(selectedEmployee.fullName)}
                                </div>
                                <div className="text-xs">
                                    <p className="font-semibold text-slate-800 leading-tight">{selectedEmployee.fullName}</p>
                                    <p className="text-[10px] text-slate-500 leading-none">{selectedEmployee.role || "Employee"}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        handleFilterChange(setFilterEmployee, "all");
                                        setSelectedEmployee(null);
                                    }}
                                    className="p-0.5 hover:bg-indigo-100 rounded text-slate-400 hover:text-slate-600 ml-1"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Filter Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
                <div className="flex flex-col lg:flex-row gap-2.5">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                        <select
                            value={filterStatus}
                            onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none"
                        >
                            <option value="all">All Statuses</option>
                            {statuses.map((status) => (
                                <option key={status} value={status}>
                                    {getStatusLabel(status)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterPriority}
                            onChange={(e) => handleFilterChange(setFilterPriority, e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none"
                        >
                            <option value="all">All Priorities</option>
                            {priorities.map((priority) => (
                                <option key={priority} value={priority}>
                                    {getPriorityLabel(priority)}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterProject}
                            onChange={(e) => handleFilterChange(setFilterProject, e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none max-w-[140px] truncate"
                        >
                            <option value="all">All Projects</option>
                            {projects.map((p) => (
                                <option key={p._id} value={p._id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterMilestone}
                            onChange={(e) => handleFilterChange(setFilterMilestone, e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none"
                        >
                            <option value="all">All Tasks</option>
                            <option value="milestones">⭐ Milestones Only</option>
                            <option value="regular">Regular Tasks Only</option>
                        </select>

                        <select
                            value={filterSubTask}
                            onChange={(e) => handleFilterChange(setFilterSubTask, e.target.value)}
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none"
                        >
                            <option value="all">All Tasks</option>
                            <option value="parent">📋 Parent Tasks Only</option>
                            <option value="subtask">📌 Sub-Tasks Only</option>
                        </select>
                    </div>
                </div>

                {/* Scale and Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-semibold text-slate-700">View:</span>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg">
                            {(["day", "week", "month"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => {
                                        setFilterLoading(true);
                                        startTransition(() => {
                                            setViewMode(mode);
                                            setTimeout(() => setFilterLoading(false), 50);
                                        });
                                    }}
                                    className={`px-3 py-1 text-xs font-semibold capitalize rounded-md transition ${viewMode === mode ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                        }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigateDate("prev")}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={goToToday}
                                className="px-2 py-0.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => navigateDate("next")}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="h-3.5 w-px bg-slate-200" />

                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-medium">Scale</span>
                            <button
                                onClick={handleZoomOut}
                                className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition"
                                title="Zoom Out"
                            >
                                <ZoomOut size={13} />
                            </button>
                            <span className="text-xs font-mono font-semibold text-slate-600 w-10 text-center">
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <button
                                onClick={handleZoomIn}
                                className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition"
                                title="Zoom In"
                            >
                                <ZoomIn size={13} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Unified Gantt Container (Zero Layout Thrashing & No Infinite Width) */}
            <div className="relative bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Non-Blocking Loader Overlay */}
                {filterLoading && (
                    <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-[1.5px] flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                            Updating Timeline...
                        </span>
                    </div>
                )}

                {ganttData.tasks.length === 0 ? (
                    <div className="p-12 text-center">
                        <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h3 className="text-sm font-semibold text-slate-800 mb-0.5">No tasks to display</h3>
                        <p className="text-slate-400 text-xs">
                            {filterEmployee !== "all"
                                ? "No tasks assigned to the selected employee"
                                : "Try adjusting your filters or date criteria."}
                        </p>
                    </div>
                ) : (
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto overflow-y-auto w-full"
                        style={{ maxHeight: "calc(100vh - 430px)" }}
                    >
                        <div style={{ width: `${260 + totalTimelineWidth}px`, position: "relative" }}>
                            {/* Sticky Header */}
                            <div className="sticky top-0 z-30 flex h-[44px] bg-slate-50 border-b border-slate-200">
                                <div className="sticky left-0 z-40 w-[260px] shrink-0 bg-slate-50 px-3.5 border-r border-slate-200 flex items-center justify-between shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Task</span>
                                    <span className="text-[11px] text-slate-400 font-normal">{ganttData.tasks.length} items</span>
                                </div>
                                <div className="flex" style={{ width: `${totalTimelineWidth}px` }}>
                                    {dateLabels.map((col, idx) => (
                                        <div
                                            key={idx}
                                            className={`shrink-0 text-center py-1.5 border-r border-slate-100 flex flex-col justify-center select-none ${col.isWeekend ? "bg-slate-100/50" : ""
                                                } ${col.isToday ? "bg-indigo-50 font-bold text-indigo-600" : "text-slate-600"}`}
                                            style={{ width: `${dayWidth}px` }}
                                        >
                                            <span className="text-[9px] text-slate-400 leading-none">{col.text}</span>
                                            <span className="text-xs leading-tight">{col.subText}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Schedule Rows */}
                            <div className="relative">
                                {/* SVG Dependency Connectors */}
                                <div className="absolute top-0 left-[260px] right-0 bottom-0 pointer-events-none z-10">
                                    <DependencyOverlay
                                        edges={dependencyEdges}
                                        tasks={ganttData.tasks}
                                        dayWidth={dayWidth}
                                    />
                                </div>

                                {ganttData.tasks.map((task) => {
                                    const isSubTask = !!task.parentTaskId;
                                    const hasSubTasks = (task.subTaskCount || 0) > 0;
                                    const hasDependencies = (task.dependencies?.length || 0) > 0;

                                    return (
                                        <div
                                            key={task._id}
                                            className={`flex h-[44px] border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${task.isMilestone ? "bg-purple-50/20" : isSubTask ? "bg-blue-50/10" : ""
                                                }`}
                                        >
                                            {/* Pinned Left Sidebar Cell */}
                                            <div
                                                className="sticky left-0 z-20 w-[260px] shrink-0 px-3 bg-white border-r border-slate-200 flex flex-col justify-center cursor-pointer shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]"
                                                onClick={() => handleTaskClick(task)}
                                            >
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    {task.isMilestone && <Gem className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                                                    {isSubTask && !task.isMilestone && <GitBranch className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                                    {hasSubTasks && !task.isMilestone && !isSubTask && <GitBranch className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                                    {hasDependencies && <Link2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}

                                                    <div
                                                        className="w-2 h-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: task.color }}
                                                    />
                                                    <span
                                                        className={`text-xs font-semibold truncate ${task.isMilestone ? "text-purple-700" : isSubTask ? "text-blue-700" : "text-slate-800"
                                                            }`}
                                                    >
                                                        {task.title}
                                                    </span>

                                                    {task.isMilestone && (
                                                        <span className="text-[8px] font-bold text-purple-600 bg-purple-100 px-1 py-0.2 rounded-full shrink-0">
                                                            MILESTONE
                                                        </span>
                                                    )}
                                                    {isSubTask && !task.isMilestone && (
                                                        <span className="text-[8px] font-medium text-blue-600 bg-blue-100 px-1 py-0.2 rounded-full shrink-0">
                                                            SUB
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 truncate">
                                                    {task.projectId && <span className="truncate">{task.projectId.name}</span>}
                                                    {task.assignedTo && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate">{task.assignedTo.fullName}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Timeline Track */}
                                            <div
                                                className="relative h-[44px] shrink-0"
                                                style={{
                                                    width: `${totalTimelineWidth}px`,
                                                    backgroundImage: "linear-gradient(to right, #f1f5f9 1px, transparent 1px)",
                                                    backgroundSize: `${dayWidth}px 100%`,
                                                }}
                                            >
                                                {task.isMilestone ? (
                                                    <MilestoneDiamond
                                                        task={task}
                                                        dayWidth={dayWidth}
                                                        onTaskClick={handleTaskClick}
                                                    />
                                                ) : (
                                                    <TaskGanttBar
                                                        task={task}
                                                        dayWidth={dayWidth}
                                                        onTaskClick={handleTaskClick}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded" /> <span>Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded" /> <span>In Progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded" /> <span>Submitted</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded" /> <span>Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-rose-500 rounded animate-pulse" /> <span>Overdue</span>
                </div>
                <div className="w-px h-3.5 bg-slate-200" />
                <div className="flex items-center gap-1.5 text-purple-600 font-medium">
                    <Gem className="w-3.5 h-3.5" /> <span>Milestone</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                    <GitBranch className="w-3.5 h-3.5" /> <span>Sub-Task</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                    <Link2 className="w-3.5 h-3.5" /> <span>Dependency</span>
                </div>
            </div>

            {/* Dependency Editor Modal */}
            <DependencyEditor
                taskId={selectedTaskId}
                isOpen={showDependencyEditor}
                onClose={() => {
                    setShowDependencyEditor(false);
                    setSelectedTaskId("");
                    fetchData();
                }}
                onDependencyUpdated={() => {
                    fetchData();
                    setShowDependencyEditor(false);
                }}
            />

            {/* Task Details Modal */}
            <AnimatePresence>
                {showTaskDetails && selectedTask && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
                        onClick={() => setShowTaskDetails(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: selectedTask.color }}
                                        />
                                        <h3 className="text-base font-bold text-slate-900">{selectedTask.title}</h3>
                                    </div>
                                    <p className="text-xs text-slate-400">Project: {selectedTask.projectId?.name || "General"}</p>
                                </div>
                                <button
                                    onClick={() => setShowTaskDetails(false)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4 text-xs">
                                {selectedTask.description && (
                                    <p className="p-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-100">
                                        {selectedTask.description}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                                        <p className="font-semibold text-slate-800 mt-0.5">{getStatusLabel(selectedTask.status)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                                        <p className="font-semibold text-slate-800 mt-0.5">{getPriorityLabel(selectedTask.priority)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Start Date</span>
                                        <p className="font-semibold text-slate-800 mt-0.5">{formatDate(selectedTask.start)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Deadline</span>
                                        <p className="font-semibold text-slate-800 mt-0.5">{formatDate(selectedTask.end)}</p>
                                    </div>
                                </div>

                                {selectedTask.assignedTo && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                                            {getInitials(selectedTask.assignedTo.fullName)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{selectedTask.assignedTo.fullName}</p>
                                            <p className="text-[11px] text-slate-400">{selectedTask.assignedTo.email}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        setSelectedTaskId(selectedTask._id);
                                        setShowDependencyEditor(true);
                                        setShowTaskDetails(false);
                                    }}
                                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                                >
                                    <Link2 size={13} /> Manage Dependencies
                                </button>
                                <button
                                    onClick={() => setShowTaskDetails(false)}
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}