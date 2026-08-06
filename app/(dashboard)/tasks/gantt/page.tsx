// app/(dashboard)/tasks/gantt/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    Clock,
    Filter,
    Search,
    Loader2,
    RefreshCw,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Users,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    BarChart3,
    X,
    CalendarDays,
    Flag,
    User,
    Briefcase,
    FolderKanban,
    TrendingUp,
    TrendingDown,
    Activity,
    Zap,
    UserCircle,
    UserCheck,
    UserPlus,
    ChevronDown,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ============ TYPES ============
interface Task {
    _id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    estimatedHours: number;
    actualMinutes: number;
    startDate?: string;
    deadline: string;
    createdAt: string;
    updatedAt: string;
    assignedTo: {
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
    dependencies?: string[];
    order?: number;
    progress?: number;
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
}

interface User {
    _id: string;
    fullName: string;
    email: string;
    employeeId?: string;
    role?: string;
    department?: string;
}

// ============ CONSTANTS ============
const STATUS_COLORS = {
    pending: "#f59e0b",
    todo: "#6b7280",
    in_progress: "#3b82f6",
    submitted: "#8b5cf6",
    completed: "#10b981",
    done: "#10b981",
    overdue: "#ef4444",
    rejected: "#f43f5e",
};

const PRIORITY_COLORS = {
    low: "#10b981",
    normal: "#3b82f6",
    high: "#f59e0b",
    urgent: "#ef4444",
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

// ============ UTILITY FUNCTIONS ============
const formatDate = (date: Date | string): string => {
    if (typeof date === "string") date = new Date(date);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const formatDateShort = (date: Date | string): string => {
    if (typeof date === "string") date = new Date(date);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
};

const getStatusColor = (status: string): string => {
    return STATUS_COLORS[status] || "#6b7280";
};

const getStatusLabel = (status: string): string => {
    return STATUS_LABELS[status] || status;
};

const getPriorityLabel = (priority: string): string => {
    return PRIORITY_LABELS[priority] || priority;
};

const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getDaysBetween = (start: Date, end: Date): number => {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ============ TOOLTIP COMPONENT ============
interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
}

const Tooltip = ({ children, content, position = "top" }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={`absolute z-50 ${positionClasses[position]} min-w-max max-w-xs px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none`}
                >
                    {content}
                </div>
            )}
        </div>
    );
};

// ============ COMPONENTS ============
const TaskGanttBar = ({
    task,
    dayWidth,
    startDate,
    onTaskClick,
}: {
    task: GanttTask;
    dayWidth: number;
    startDate: Date;
    onTaskClick: (task: GanttTask) => void;
}) => {
    const startOffset = getDaysBetween(startDate, task.start);
    const duration = task.duration || 1;

    const barColor = task.isOverdue
        ? "bg-rose-500"
        : task.status === "completed" || task.status === "done"
            ? "bg-emerald-500"
            : task.status === "in_progress"
                ? "bg-blue-500"
                : task.status === "submitted"
                    ? "bg-purple-500"
                    : "bg-amber-500";

    const barColorLight = task.isOverdue
        ? "bg-rose-100 border-rose-200"
        : task.status === "completed" || task.status === "done"
            ? "bg-emerald-100 border-emerald-200"
            : task.status === "in_progress"
                ? "bg-blue-100 border-blue-200"
                : task.status === "submitted"
                    ? "bg-purple-100 border-purple-200"
                    : "bg-amber-100 border-amber-200";

    const tooltipContent = (
        <div className="space-y-1">
            <p className="font-semibold text-white">{task.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-300">
                <span>Status: {getStatusLabel(task.status)}</span>
                <span>•</span>
                <span>Priority: {getPriorityLabel(task.priority)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
                <span>Progress: {task.progressPercent}%</span>
                <span>•</span>
                <span>{formatDate(task.start)} - {formatDate(task.end)}</span>
            </div>
            {task.assignedTo && (
                <p className="text-xs text-gray-300">
                    Assigned to: {task.assignedTo.fullName}
                </p>
            )}
            {task.projectId && (
                <p className="text-xs text-gray-300">
                    Project: {task.projectId.name}
                </p>
            )}
        </div>
    );

    return (
        <Tooltip content={tooltipContent}>
            <div
                className={`absolute rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-y-110 group ${barColorLight}`}
                style={{
                    left: `${startOffset * dayWidth}px`,
                    width: `${Math.max(duration * dayWidth, 30)}px`,
                    height: "28px",
                    top: "2px",
                }}
                onClick={() => onTaskClick(task)}
            >
                <div
                    className={`h-full rounded-lg flex items-center px-2 overflow-hidden ${barColor} bg-opacity-90`}
                    style={{
                        width: `${Math.min(task.progressPercent || 0, 100)}%`,
                        transition: "width 0.5s ease",
                    }}
                >
                    <span className="text-[10px] text-white font-medium truncate">
                        {task.progressPercent > 30 ? task.title : ""}
                    </span>
                </div>
                {task.isOverdue && (
                    <div className="absolute -top-1 -right-1 w-3 h-3">
                        <div className="animate-ping absolute w-3 h-3 bg-rose-400 rounded-full opacity-75" />
                        <div className="relative w-3 h-3 bg-rose-500 rounded-full" />
                    </div>
                )}
            </div>
        </Tooltip>
    );
};

// ============ MAIN COMPONENT ============
export default function GanttChartPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();

    // State
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
    const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
    const [viewTab, setViewTab] = useState<"all" | "employee">("all");
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // Fetch data
    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch tasks
            const tasksResponse = await api.get("/tasks");
            if (tasksResponse.data.success) {
                setTasks(tasksResponse.data.data || []);
            }

            // Fetch projects for filter
            const projectsResponse = await api.get("/projects");
            if (projectsResponse.data.success) {
                const projectsData = projectsResponse.data.data || [];
                setProjects(projectsData.map((p: any) => ({ _id: p._id, name: p.name })));
            }

            // Fetch users for employee filter
            const usersResponse = await api.get("/users");
            if (usersResponse.data.success) {
                setUsers(usersResponse.data.data || []);
            }
        } catch (error: any) {
            console.error("Error fetching data:", error);
            setError(error.response?.data?.message || "Failed to load data");
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    // Generate Gantt data
    const ganttData = useMemo(() => {
        const filteredTasks = tasks.filter((task) => {
            if (!task.startDate && !task.deadline) return false;

            // Employee filter
            if (filterEmployee !== "all" && task.assignedTo?._id !== filterEmployee) {
                return false;
            }

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    task.title.toLowerCase().includes(query) ||
                    task.description?.toLowerCase().includes(query) ||
                    task.projectId?.name?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (filterStatus !== "all" && task.status !== filterStatus) return false;

            // Priority filter
            if (filterPriority !== "all" && task.priority !== filterPriority)
                return false;

            // Project filter
            if (filterProject !== "all" && task.projectId?._id !== filterProject)
                return false;

            return true;
        });

        // Sort by start date
        const sorted = [...filteredTasks].sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate) : new Date(a.deadline);
            const dateB = b.startDate ? new Date(b.startDate) : new Date(b.deadline);
            return dateA.getTime() - dateB.getTime();
        });

        // Calculate date range
        let minDate = new Date();
        let maxDate = new Date();
        sorted.forEach((task) => {
            const start = task.startDate ? new Date(task.startDate) : new Date(task.deadline);
            const end = new Date(task.deadline);
            if (start < minDate) minDate = start;
            if (end > maxDate) maxDate = end;
        });

        // Add padding
        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 2);

        // Generate Gantt tasks
        const ganttTasks: GanttTask[] = sorted.map((task, index) => {
            const start = task.startDate ? new Date(task.startDate) : new Date(task.deadline);
            const end = new Date(task.deadline);
            const duration = getDaysBetween(start, end) || 1;
            const progressPercent = task.progress ||
                (task.status === "completed" || task.status === "done" ? 100 : 0);
            const isOverdue = end < new Date() && task.status !== "completed" && task.status !== "done";
            const isToday = new Date() >= start && new Date() <= end;
            const isThisWeek = new Date() >= new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000) &&
                new Date() <= new Date(end.getTime() + 7 * 24 * 60 * 60 * 1000);

            return {
                ...task,
                start,
                end,
                duration,
                row: index,
                progressPercent,
                color: getStatusColor(task.status),
                isOverdue,
                isToday,
                isThisWeek,
            };
        });

        return {
            tasks: ganttTasks,
            startDate: minDate,
            endDate: maxDate,
            totalDays: getDaysBetween(minDate, maxDate),
            totalTasks: ganttTasks.length,
        };
    }, [tasks, searchQuery, filterStatus, filterPriority, filterProject, filterEmployee]);

    // Get unique statuses, priorities, and employees for filters
    const statuses = useMemo(() => {
        const statusSet = new Set(tasks.map((t) => t.status));
        return Array.from(statusSet);
    }, [tasks]);

    const priorities = useMemo(() => {
        const prioritySet = new Set(tasks.map((t) => t.priority));
        return Array.from(prioritySet);
    }, [tasks]);

    // Navigate date
    const navigateDate = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate);
        if (viewMode === "day") {
            newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        } else if (viewMode === "week") {
            newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    const today = () => {
        setCurrentDate(new Date());
    };

    // Zoom controls
    const handleZoomIn = () => {
        setZoomLevel(Math.min(zoomLevel + 0.25, 2));
    };

    const handleZoomOut = () => {
        setZoomLevel(Math.max(zoomLevel - 0.25, 0.5));
    };

    // Get day width
    const getDayWidth = () => {
        const baseWidth = viewMode === "day" ? 80 : viewMode === "week" ? 60 : 40;
        return baseWidth * zoomLevel;
    };

    const dayWidth = getDayWidth();

    // Generate date labels
    const dateLabels = useMemo(() => {
        const labels: { date: Date; label: string; short: string; isWeekend: boolean; isToday: boolean }[] = [];
        const start = new Date(ganttData.startDate);
        const end = new Date(ganttData.endDate);
        const totalDays = getDaysBetween(start, end);

        for (let i = 0; i <= totalDays; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isToday = date.toDateString() === new Date().toDateString();

            let label = "";
            let short = "";
            if (viewMode === "day") {
                label = formatDate(date);
                short = formatDateShort(date);
            } else if (viewMode === "week") {
                label = formatDateShort(date);
                short = formatDateShort(date);
            } else {
                label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                short = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }

            labels.push({ date, label, short, isWeekend, isToday });
        }
        return labels;
    }, [ganttData.startDate, ganttData.endDate, viewMode]);

    // Task details modal
    const handleTaskClick = (task: GanttTask) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
    };

    // Get employee task count
    const getEmployeeTaskCount = (employeeId: string) => {
        return tasks.filter(t => t.assignedTo?._id === employeeId).length;
    };

    // Export CSV
    const handleExport = () => {
        try {
            const headers = [
                "Task",
                "Project",
                "Status",
                "Priority",
                "Start Date",
                "Deadline",
                "Duration (days)",
                "Progress (%)",
                "Assigned To",
            ];

            const rows = ganttData.tasks.map((task) => [
                `"${task.title}"`,
                `"${task.projectId?.name || "N/A"}"`,
                getStatusLabel(task.status),
                getPriorityLabel(task.priority),
                formatDate(task.start),
                formatDate(task.end),
                task.duration,
                task.progressPercent,
                `"${task.assignedTo?.fullName || "Unassigned"}"`,
            ]);

            const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `gantt_chart_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Export started");
        } catch (error) {
            toast.error("Failed to export data");
        }
    };

    // ============= LOADING STATE =============
    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-gray-500 text-sm">
                        {authLoading ? "Authenticating..." : "Loading Gantt chart..."}
                    </p>
                </div>
            </div>
        );
    }

    // ============= ERROR STATE =============
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Data</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2 mx-auto shadow-sm"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // ============= MAIN RENDER =============
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 md:p-6 lg:p-8">
                <div className="container mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
                    >
                        <div>
                            <Link
                                href="/tasks"
                                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
                            >
                                <ArrowLeft size={16} />
                                Back to Tasks
                            </Link>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3 mt-1">
                                <CalendarDays className="w-7 h-7 text-indigo-500" />
                                Gantt Chart
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Visual timeline of all tasks and their progress
                                <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    {ganttData.totalTasks} tasks
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={fetchData}
                                className="px-3 py-2 bg-white border border-gray-200 hover:border-indigo-300 rounded-lg transition flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-3 py-2 bg-white border border-gray-200 hover:border-indigo-300 rounded-lg transition flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                            >
                                <Download size={16} />
                                Export
                            </button>
                        </div>
                    </motion.div>

                    {/* View Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm mb-6 flex flex-wrap gap-1"
                    >
                        <button
                            onClick={() => {
                                setViewTab("all");
                                setFilterEmployee("all");
                                setSelectedEmployee(null);
                            }}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${viewTab === "all"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <Users size={18} />
                            All Tasks
                        </button>
                        <button
                            onClick={() => setViewTab("employee")}
                            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${viewTab === "employee"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <UserCircle size={18} />
                            Employee Wise
                        </button>
                    </motion.div>

                    {/* Employee Selector (shown only in employee view) */}
                    {viewTab === "employee" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <UserCheck className="w-4 h-4 text-indigo-500" />
                                    <span className="font-medium">Select Employee:</span>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <select
                                        value={filterEmployee}
                                        onChange={(e) => {
                                            const empId = e.target.value;
                                            setFilterEmployee(empId);
                                            const emp = users.find(u => u._id === empId);
                                            setSelectedEmployee(emp || null);
                                        }}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    >
                                        <option value="all">Select an employee...</option>
                                        {users.map((u) => (
                                            <option key={u._id} value={u._id}>
                                                {u.fullName} ({getEmployeeTaskCount(u._id)} tasks)
                                                {u.department ? ` - ${u.department}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedEmployee && (
                                    <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                            {getInitials(selectedEmployee.fullName)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {selectedEmployee.fullName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {selectedEmployee.role || "Employee"} • {getEmployeeTaskCount(selectedEmployee._id)} tasks
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setFilterEmployee("all");
                                                setSelectedEmployee(null);
                                            }}
                                            className="ml-2 p-1 hover:bg-indigo-100 rounded-lg transition"
                                        >
                                            <X size={14} className="text-gray-400" />
                                        </button>
                                    </div>
                                )}
                                {filterEmployee !== "all" && !selectedEmployee && (
                                    <button
                                        onClick={() => {
                                            setFilterEmployee("all");
                                            setSelectedEmployee(null);
                                        }}
                                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                    >
                                        Clear Selection
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6"
                    >
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
                                    onChange={(e) => setFilterProject(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                >
                                    <option value="all">All Projects</option>
                                    {projects.map((project) => (
                                        <option key={project._id} value={project._id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigateDate("prev")}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={today}
                                    className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => navigateDate("next")}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <ChevronRight size={18} />
                                </button>
                                <span className="text-sm font-medium text-gray-700 ml-2">
                                    {viewMode === "day"
                                        ? formatDate(currentDate)
                                        : viewMode === "week"
                                            ? `Week of ${formatDate(currentDate)}`
                                            : formatDate(currentDate)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    {[
                                        { id: "day", label: "Day", icon: Calendar },
                                        { id: "week", label: "Week", icon: CalendarDays },
                                        { id: "month", label: "Month", icon: Calendar },
                                    ].map((view) => {
                                        const Icon = view.icon;
                                        return (
                                            <button
                                                key={view.id}
                                                onClick={() => setViewMode(view.id as any)}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition flex items-center gap-1.5 ${viewMode === view.id
                                                    ? "bg-white text-indigo-600 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-700"
                                                    }`}
                                            >
                                                <Icon size={14} />
                                                {view.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex bg-gray-100 rounded-lg p-0.5">
                                    <button
                                        onClick={handleZoomOut}
                                        className="p-1.5 hover:bg-white rounded-lg transition"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut size={16} />
                                    </button>
                                    <button
                                        onClick={handleZoomIn}
                                        className="p-1.5 hover:bg-white rounded-lg transition"
                                        title="Zoom In"
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                    <span className="px-2 text-xs text-gray-500 flex items-center">
                                        {Math.round(zoomLevel * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Gantt Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        {ganttData.tasks.length === 0 ? (
                            <div className="p-12 text-center">
                                <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks to display</h3>
                                <p className="text-gray-500 text-sm">
                                    {filterEmployee !== "all"
                                        ? `No tasks assigned to the selected employee`
                                        : searchQuery || filterStatus !== "all" || filterPriority !== "all" || filterProject !== "all"
                                            ? "Try adjusting your filters"
                                            : "Create tasks with start dates and deadlines to see them on the Gantt chart"}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 480px)" }}>
                                <div className="min-w-[800px]">
                                    {/* Header Row */}
                                    <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                                        <div className="w-64 flex-shrink-0 p-3">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Task
                                            </span>
                                        </div>
                                        <div className="flex-1 relative overflow-hidden">
                                            <div
                                                className="flex"
                                                style={{ width: `${dateLabels.length * dayWidth}px` }}
                                            >
                                                {dateLabels.map((label, index) => (
                                                    <div
                                                        key={index}
                                                        className={`flex-shrink-0 text-center p-2 border-r border-gray-100 ${label.isWeekend ? "bg-gray-50" : ""
                                                            } ${label.isToday ? "bg-indigo-50" : ""}`}
                                                        style={{ width: `${dayWidth}px` }}
                                                    >
                                                        <div className="text-xs font-medium text-gray-700">
                                                            {viewMode === "month" ? label.short : label.short}
                                                        </div>
                                                        {label.isToday && (
                                                            <div className="w-1 h-1 bg-indigo-500 rounded-full mx-auto mt-0.5" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task Rows */}
                                    <div>
                                        {ganttData.tasks.map((task) => (
                                            <div
                                                key={task._id}
                                                className="flex border-b border-gray-100 hover:bg-gray-50 transition group"
                                            >
                                                {/* Task Info */}
                                                <div
                                                    className="w-64 flex-shrink-0 p-3 cursor-pointer"
                                                    onClick={() => handleTaskClick(task)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: task.color }}
                                                        />
                                                        <span className="text-sm font-medium text-gray-800 truncate">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                                        {task.projectId && (
                                                            <span>{task.projectId.name}</span>
                                                        )}
                                                        {task.assignedTo && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="flex items-center gap-1">
                                                                    <User size={10} />
                                                                    {task.assignedTo.fullName}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Gantt Bar Area */}
                                                <div className="flex-1 relative" style={{ height: "48px" }}>
                                                    <TaskGanttBar
                                                        task={task}
                                                        dayWidth={dayWidth}
                                                        startDate={ganttData.startDate}
                                                        onTaskClick={handleTaskClick}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Legend */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-amber-500 rounded" />
                            <span>Pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded" />
                            <span>In Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-500 rounded" />
                            <span>Submitted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded" />
                            <span>Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-rose-500 rounded animate-pulse" />
                            <span>Overdue</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded" />
                            <span>Progress Bar</span>
                        </div>
                        {filterEmployee !== "all" && selectedEmployee && (
                            <>
                                <div className="w-px h-6 bg-gray-200" />
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <UserCheck size={14} />
                                    <span>Viewing: {selectedEmployee.fullName}</span>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Task Details Modal */}
            <AnimatePresence>
                {showTaskDetails && selectedTask && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowTaskDetails(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-8 rounded"
                                                style={{ backgroundColor: selectedTask.color }}
                                            />
                                            <h3 className="text-xl font-bold text-gray-800">
                                                {selectedTask.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                            <span>{getStatusLabel(selectedTask.status)}</span>
                                            <span>•</span>
                                            <span>{getPriorityLabel(selectedTask.priority)}</span>
                                            {selectedTask.projectId && (
                                                <>
                                                    <span>•</span>
                                                    <span>{selectedTask.projectId.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowTaskDetails(false)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <X size={20} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                {selectedTask.description && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Description
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {selectedTask.description}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Start Date
                                        </h4>
                                        <p className="text-sm text-gray-800 mt-1">
                                            {formatDate(selectedTask.start)}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Deadline
                                        </h4>
                                        <p className={`text-sm mt-1 ${selectedTask.isOverdue ? "text-rose-600 font-medium" : "text-gray-800"}`}>
                                            {formatDate(selectedTask.end)}
                                            {selectedTask.isOverdue && " ⚠️ Overdue"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Duration
                                        </h4>
                                        <p className="text-sm text-gray-800 mt-1">
                                            {selectedTask.duration} days
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Progress
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all"
                                                    style={{ width: `${selectedTask.progressPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {selectedTask.progressPercent}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedTask.assignedTo && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Assigned To
                                        </h4>
                                        <p className="text-sm text-gray-800 mt-1">
                                            {selectedTask.assignedTo.fullName}
                                            {selectedTask.assignedTo.email && (
                                                <span className="text-gray-400 text-xs ml-2">
                                                    {selectedTask.assignedTo.email}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t border-gray-100">
                                    <Link
                                        href={`/tasks/${selectedTask._id}`}
                                        className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} />
                                        View Task Details
                                    </Link>
                                    <button
                                        onClick={() => setShowTaskDetails(false)}
                                        className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}