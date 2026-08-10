// app/(dashboard)/tasks/gantt/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
    FileText,
    GitBranch,
    Gem,
    Link2,
    ArrowRight,
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
    isMilestone?: boolean;
    subTaskCount?: number;
    completedSubTaskCount?: number;
    parentTaskId?: string | null | { _id: string; title: string; status: string };
    x: number;
    y: number;
}

interface User {
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
    const key = status as keyof typeof STATUS_COLORS;
    return STATUS_COLORS[key] || "#6b7280";
};

const getStatusLabel = (status: string): string => {
    const key = status as keyof typeof STATUS_LABELS;
    return STATUS_LABELS[key] || status;
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

// ============ DEPENDENCY ARROW COMPONENT ============
const DependencyArrow = ({
    fromX,
    fromY,
    toX,
    toY,
    type = "FS",
    isBlocked = false,
    isOverdue = false,
}: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    type?: string;
    isBlocked?: boolean;
    isOverdue?: boolean;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = Math.abs(toX - fromX) + 60;
        const height = Math.abs(toY - fromY) + 60;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        const padding = 30;
        const startX = fromX - Math.min(fromX, toX) + padding;
        const startY = fromY - Math.min(fromY, toY) + padding;
        const endX = toX - Math.min(fromX, toX) + padding;
        const endY = toY - Math.min(fromY, toY) + padding;

        const arrowSize = 10;
        const angle = Math.atan2(endY - startY, endX - startX);

        let color = "#6366f1";
        if (isBlocked || isOverdue) {
            color = "#ef4444";
        }

        // Draw curved line with bezier curve
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2 - 30;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = isBlocked || isOverdue ? 3 : 2;
        ctx.setLineDash(isBlocked || isOverdue ? [6, 5] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw arrowhead
        const lastAngle = Math.atan2(endY - midY, endX - midX);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowSize * Math.cos(lastAngle - Math.PI / 6),
            endY - arrowSize * Math.sin(lastAngle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - arrowSize * Math.cos(lastAngle + Math.PI / 6),
            endY - arrowSize * Math.sin(lastAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Draw dependency type label
        const labelX = (startX + endX) / 2 - 12;
        const labelY = (startY + endY) / 2 - 40;
        ctx.fillStyle = color;
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(type, labelX, labelY);

        // Draw lag if > 0
        if (isOverdue) {
            ctx.fillStyle = "#ef4444";
            ctx.font = "12px sans-serif";
            ctx.fillText("⚠️", (startX + endX) / 2 + 10, labelY + 2);
        }
    }, [fromX, fromY, toX, toY, type, isBlocked, isOverdue]);

    const left = Math.min(fromX, toX) - 30;
    const top = Math.min(fromY, toY) - 30;

    return (
        <canvas
            ref={canvasRef}
            className="absolute pointer-events-none"
            style={{
                left: `${left}px`,
                top: `${top}px`,
                zIndex: 5,
                width: `${Math.abs(toX - fromX) + 60}px`,
                height: `${Math.abs(toY - fromY) + 60}px`,
            }}
        />
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

    const dependencyCount = task.dependencies?.length ?? 0;
    const hasDependencies = dependencyCount > 0;

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
            {hasDependencies && (
                <p className="text-xs text-gray-300">
                    🔗 {dependencyCount} dependencies
                </p>
            )}
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
            {task.subTaskCount && task.subTaskCount > 0 && (
                <p className="text-xs text-gray-300">
                    Sub-tasks: {task.completedSubTaskCount || 0}/{task.subTaskCount}
                </p>
            )}
        </div>
    );

    return (
        <Tooltip content={tooltipContent}>
            <div
                className={`absolute rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-y-110 group ${barColorLight} ${hasDependencies ? "border-l-4 border-indigo-400" : ""}`}
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
                {hasDependencies && (
                    <div className="absolute -top-1 -left-1">
                        <Link2 className="w-3 h-3 text-indigo-500" />
                    </div>
                )}
            </div>
        </Tooltip>
    );
};

// ============ MILESTONE DIAMOND COMPONENT ============
const MilestoneDiamond = ({
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

    const diamondColor = task.isOverdue
        ? "text-rose-500"
        : task.status === "completed" || task.status === "done"
            ? "text-emerald-500"
            : task.status === "in_progress"
                ? "text-blue-500"
                : task.status === "submitted"
                    ? "text-purple-500"
                    : "text-amber-500";

    const dependencyCount = task.dependencies?.length ?? 0;
    const hasDependencies = dependencyCount > 0;

    const tooltipContent = (
        <div className="space-y-1">
            <p className="font-semibold text-white">🚩 {task.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-300">
                <span>Status: {getStatusLabel(task.status)}</span>
                <span>•</span>
                <span>Priority: {getPriorityLabel(task.priority)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-300">
                <span>Milestone Date: {formatDate(task.start)}</span>
            </div>
            {hasDependencies && (
                <p className="text-xs text-gray-300">
                    🔗 {dependencyCount} dependencies
                </p>
            )}
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
                className="absolute cursor-pointer transition-all hover:scale-110 group"
                style={{
                    left: `${startOffset * dayWidth + dayWidth / 2 - 10}px`,
                    top: "10px",
                }}
                onClick={() => onTaskClick(task)}
            >
                <div className="relative">
                    <svg
                        className={`w-6 h-6 ${diamondColor} drop-shadow-md`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <polygon points="12,2 22,12 12,22 2,12" />
                    </svg>
                    <Flag
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white"
                        fill="white"
                    />
                    {task.isOverdue && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5">
                            <div className="animate-ping absolute w-2.5 h-2.5 bg-rose-400 rounded-full opacity-75" />
                            <div className="relative w-2.5 h-2.5 bg-rose-500 rounded-full" />
                        </div>
                    )}
                    {hasDependencies && (
                        <div className="absolute -top-1 -left-1">
                            <Link2 className="w-2.5 h-2.5 text-indigo-500" />
                        </div>
                    )}
                </div>
            </div>
        </Tooltip>
    );
};

// ============ SUB-TASK INDICATOR COMPONENT ============
const SubTaskIndicator = ({
    task,
    onTaskClick,
}: {
    task: GanttTask;
    onTaskClick: (task: GanttTask) => void;
}) => {
    const hasSubTasks = (task.subTaskCount || 0) > 0;

    if (!hasSubTasks) return null;

    return (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-blue-100 text-blue-700 text-[8px] font-medium px-1.5 py-0.5 rounded-full border border-blue-200">
            <GitBranch className="w-2.5 h-2.5" />
            {task.completedSubTaskCount || 0}/{task.subTaskCount}
        </div>
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
    const [filterMilestone, setFilterMilestone] = useState<string>("all");
    const [filterSubTask, setFilterSubTask] = useState<string>("all");
    const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
    const [viewTab, setViewTab] = useState<"all" | "employee">("all");
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
    const [exportingPDF, setExportingPDF] = useState(false);

    // 🆕 Dependency states
    const [dependencyEdges, setDependencyEdges] = useState<DependencyEdge[]>([]);
    const [showDependencyEditor, setShowDependencyEditor] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [loadingDependencies, setLoadingDependencies] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const tasksResponse = await api.get("/tasks");
            if (tasksResponse.data.success) {
                const taskData = tasksResponse.data.data || [];
                setTasks(taskData);

                const edges: DependencyEdge[] = [];
                taskData.forEach((task: any) => {
                    if (task.dependencies && task.dependencies.length > 0) {
                        task.dependencies.forEach((dep: any) => {
                            edges.push({
                                from: dep.taskId,
                                to: task._id,
                                type: dep.type || "FS",
                                lag: dep.lag || 0,
                            });
                        });
                    }
                });
                if (edges.length > 0) {
                    setDependencyEdges(edges);
                }
            }

            const projectsResponse = await api.get("/projects");
            if (projectsResponse.data.success) {
                const projectsData = projectsResponse.data.data || [];
                setProjects(projectsData.map((p: any) => ({ _id: p._id, name: p.name })));
            }

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

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, fetchData]);

    // ✅ FIX: Get day width function - defined BEFORE useMemo
    const getDayWidth = useCallback(() => {
        const baseWidth = viewMode === "day" ? 80 : viewMode === "week" ? 60 : 40;
        return baseWidth * zoomLevel;
    }, [viewMode, zoomLevel]);

    const dayWidth = getDayWidth();

    // Generate Gantt data
    const ganttData = useMemo(() => {
        const filteredTasks = tasks.filter((task) => {
            if (!task.startDate && !task.deadline) return false;

            if (filterMilestone === "milestones" && !task.isMilestone) return false;
            if (filterMilestone === "regular" && task.isMilestone) return false;

            if (filterSubTask === "parent" && task.parentTaskId) return false;
            if (filterSubTask === "subtask" && !task.parentTaskId) return false;

            if (filterEmployee !== "all" && task.assignedTo?._id !== filterEmployee) {
                return false;
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    task.title.toLowerCase().includes(query) ||
                    task.description?.toLowerCase().includes(query) ||
                    task.projectId?.name?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            if (filterStatus !== "all" && task.status !== filterStatus) return false;
            if (filterPriority !== "all" && task.priority !== filterPriority) return false;
            if (filterProject !== "all" && task.projectId?._id !== filterProject) return false;

            return true;
        });

        const sorted = [...filteredTasks].sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate) : new Date(a.deadline);
            const dateB = b.startDate ? new Date(b.startDate) : new Date(b.deadline);
            return dateA.getTime() - dateB.getTime();
        });

        let minDate = new Date();
        let maxDate = new Date();
        sorted.forEach((task) => {
            const start = task.startDate ? new Date(task.startDate) : new Date(task.deadline);
            const end = new Date(task.deadline);
            if (start < minDate) minDate = start;
            if (end > maxDate) maxDate = end;
        });

        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 2);

        const ganttTasks: GanttTask[] = sorted.map((task, index) => {
            const start = task.startDate ? new Date(task.startDate) : new Date(task.deadline);
            const end = new Date(task.deadline);
            const duration = getDaysBetween(start, end) || 1;
            const progressPercent = task.progress ||
                (task.status === "completed" || task.status === "done" ? 100 : 0);
            const isOverdue = end < new Date() && task.status !== "completed" && task.status !== "done";

            // ✅ Use the getDayWidth function here
            const currentDayWidth = getDayWidth();

            return {
                ...task,
                start,
                end,
                duration,
                row: index,
                progressPercent,
                color: getStatusColor(task.status),
                isOverdue,
                isToday: new Date() >= start && new Date() <= end,
                isThisWeek: new Date() >= new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000) &&
                    new Date() <= new Date(end.getTime() + 7 * 24 * 60 * 60 * 1000),
                isMilestone: task.isMilestone || false,
                subTaskCount: task.subTaskCount || 0,
                completedSubTaskCount: task.completedSubTaskCount || 0,
                x: getDaysBetween(minDate, start) * currentDayWidth,
                y: index * 48 + 24,
            };
        });

        return {
            tasks: ganttTasks,
            startDate: minDate,
            endDate: maxDate,
            totalDays: getDaysBetween(minDate, maxDate),
            totalTasks: ganttTasks.length,
            milestoneCount: ganttTasks.filter(t => t.isMilestone).length,
            parentTaskCount: ganttTasks.filter(t => !t.parentTaskId).length,
            subTaskCount: ganttTasks.filter(t => t.parentTaskId).length,
        };
    }, [tasks, searchQuery, filterStatus, filterPriority, filterProject, filterEmployee, filterMilestone, filterSubTask, getDayWidth]);

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

    // Open dependency editor
    const openDependencyEditor = (taskId: string) => {
        setSelectedTaskId(taskId);
        setShowDependencyEditor(true);
    };

    // ============================================================
    // PDF EXPORT FUNCTION
    // ============================================================
    const handleExportPDF = useCallback(async () => {
        try {
            setExportingPDF(true);
            toast.loading("Generating PDF...", { id: "pdf-export" });

            const doc = new jsPDF("l", "mm", "a4");
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.setFontSize(24);
            doc.setTextColor(99, 102, 241);
            doc.text("Gantt Chart", pageWidth / 2, 20, { align: "center" });

            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            const dateStr = new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
            doc.text(`Generated on ${dateStr}`, pageWidth / 2, 28, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);
            const totalTasks = ganttData.tasks.length;
            const completedTasks = ganttData.tasks.filter(t => t.status === "completed" || t.status === "done").length;
            const inProgressTasks = ganttData.tasks.filter(t => t.status === "in_progress").length;
            const overdueTasks = ganttData.tasks.filter(t => t.isOverdue).length;
            const milestoneCount = ganttData.milestoneCount;
            const dependencyCount = dependencyEdges.length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            doc.text(`Total Tasks: ${totalTasks}`, 20, 40);
            doc.text(`Completed: ${completedTasks}`, 20, 46);
            doc.text(`In Progress: ${inProgressTasks}`, 20, 52);
            doc.text(`Overdue: ${overdueTasks}`, 20, 58);
            doc.text(`Milestones: ${milestoneCount}`, 20, 64);
            doc.text(`Dependencies: ${dependencyCount}`, 20, 70);
            doc.text(`Overall Progress: ${progress}%`, 20, 76);

            const tableData = ganttData.tasks.map((task) => [
                task.title,
                task.projectId?.name || "N/A",
                getStatusLabel(task.status),
                getPriorityLabel(task.priority),
                task.isMilestone ? "⭐ Yes" : "No",
                task.parentTaskId ? "Yes" : "No",
                task.dependencies && task.dependencies.length > 0 ? `${task.dependencies.length} dep(s)` : "No",
                formatDate(task.start),
                formatDate(task.end),
                `${task.duration}d`,
                `${task.progressPercent}%`,
                task.assignedTo?.fullName || "Unassigned",
            ]);

            autoTable(doc, {
                startY: 84,
                head: [["Task", "Project", "Status", "Priority", "Milestone", "Sub-Task", "Dependencies", "Start", "Deadline", "Duration", "Progress", "Assigned To"]],
                body: tableData,
                theme: "striped",
                headStyles: {
                    fillColor: [99, 102, 241],
                    textColor: [255, 255, 255],
                    fontSize: 6,
                    fontStyle: "bold",
                },
                bodyStyles: {
                    fontSize: 5,
                },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 15 },
                    2: { cellWidth: 12 },
                    3: { cellWidth: 10 },
                    4: { cellWidth: 10 },
                    5: { cellWidth: 10 },
                    6: { cellWidth: 12 },
                    7: { cellWidth: 16 },
                    8: { cellWidth: 16 },
                    9: { cellWidth: 10 },
                    10: { cellWidth: 10 },
                    11: { cellWidth: 18 },
                },
                margin: { left: 6, right: 6 },
                didDrawPage: function (data) {
                    const pageCount = doc.getNumberOfPages();
                    const currentPage = data.pageNumber || 1;
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(
                        `Page ${currentPage} of ${pageCount} • Generated on ${new Date().toLocaleString()}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: "center" }
                    );
                },
            });

            doc.save(`Gantt_Chart_${new Date().toISOString().split("T")[0]}.pdf`);
            toast.success("PDF exported successfully!", { id: "pdf-export" });

        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Failed to export PDF", { id: "pdf-export" });
        } finally {
            setExportingPDF(false);
        }
    }, [ganttData.tasks, ganttData.milestoneCount, dependencyEdges.length]);

    // Export CSV
    const handleExportCSV = () => {
        try {
            const headers = [
                "Task",
                "Project",
                "Status",
                "Priority",
                "Milestone",
                "Sub-Task",
                "Dependencies",
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
                task.isMilestone ? "Yes" : "No",
                task.parentTaskId ? "Yes" : "No",
                task.dependencies && task.dependencies.length > 0 ? `${task.dependencies.length}` : "0",
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
            toast.success("CSV exported successfully");
        } catch (error) {
            toast.error("Failed to export CSV");
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

    // ============= MAIN RENDER ============
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
                                <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                    ⭐ {ganttData.milestoneCount} milestones
                                </span>
                                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    <GitBranch className="w-3 h-3 inline" /> {ganttData.subTaskCount} sub-tasks
                                </span>
                                <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                    <Link2 className="w-3 h-3 inline" /> {dependencyEdges.length} dependencies
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
                                onClick={handleExportCSV}
                                className="px-3 py-2 bg-white border border-gray-200 hover:border-indigo-300 rounded-lg transition flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                            >
                                <Download size={16} />
                                CSV
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={exportingPDF}
                                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                <FileText size={16} className={exportingPDF ? "animate-spin" : ""} />
                                {exportingPDF ? "Generating..." : "PDF"}
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

                    {/* Employee Selector */}
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

                                <select
                                    value={filterMilestone}
                                    onChange={(e) => setFilterMilestone(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                >
                                    <option value="all">All Tasks</option>
                                    <option value="milestones">⭐ Milestones Only</option>
                                    <option value="regular">Regular Tasks Only</option>
                                </select>

                                <select
                                    value={filterSubTask}
                                    onChange={(e) => setFilterSubTask(e.target.value)}
                                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                >
                                    <option value="all">All Tasks</option>
                                    <option value="parent">📋 Parent Tasks Only</option>
                                    <option value="subtask">📌 Sub-Tasks Only</option>
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
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative"
                    >
                        {ganttData.tasks.length === 0 ? (
                            <div className="p-12 text-center">
                                <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks to display</h3>
                                <p className="text-gray-500 text-sm">
                                    {filterEmployee !== "all"
                                        ? `No tasks assigned to the selected employee`
                                        : filterMilestone === "milestones"
                                            ? "No milestones found. Mark tasks as milestones to see them here."
                                            : filterMilestone === "regular"
                                                ? "No regular tasks found."
                                                : filterSubTask === "parent"
                                                    ? "No parent tasks found."
                                                    : filterSubTask === "subtask"
                                                        ? "No sub-tasks found."
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
                                        <div className="w-64 shrink-0 p-3 flex items-center justify-between">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Task
                                            </span>
                                            <button
                                                onClick={() => {
                                                    if (ganttData.tasks.length > 0) {
                                                        openDependencyEditor(ganttData.tasks[0]._id);
                                                    }
                                                }}
                                                className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-[10px] font-medium rounded-lg transition flex items-center gap-1"
                                            >
                                                <Link2 className="w-3 h-3" />
                                                Dependencies
                                            </button>
                                        </div>
                                        <div className="flex-1 relative overflow-hidden">
                                            <div
                                                className="flex"
                                                style={{ width: `${dateLabels.length * dayWidth}px` }}
                                            >
                                                {dateLabels.map((label, index) => (
                                                    <div
                                                        key={index}
                                                        className={`shrink-0 text-center p-2 border-r border-gray-100 ${label.isWeekend ? "bg-gray-50" : ""
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
                                    <div className="relative">
                                        {/* 🆕 Dependency Arrows - rendered in background */}
                                        {dependencyEdges.map((edge, index) => {
                                            const fromTask = ganttData.tasks.find(t => t._id === edge.from);
                                            const toTask = ganttData.tasks.find(t => t._id === edge.to);

                                            if (!fromTask || !toTask) return null;

                                            // ✅ Use the dayWidth from the outer scope
                                            const fromX = getDaysBetween(ganttData.startDate, fromTask.start) * dayWidth + dayWidth;
                                            const fromY = fromTask.row * 48 + 24;
                                            const toX = getDaysBetween(ganttData.startDate, toTask.start) * dayWidth;
                                            const toY = toTask.row * 48 + 24;

                                            return (
                                                <DependencyArrow
                                                    key={`dep-${index}`}
                                                    fromX={fromX}
                                                    fromY={fromY}
                                                    toX={toX}
                                                    toY={toY}
                                                    type={edge.type}
                                                    isBlocked={toTask.isOverdue}
                                                    isOverdue={toTask.isOverdue}
                                                />
                                            );
                                        })}

                                        {ganttData.tasks.map((task) => {
                                            const isSubTask = task.parentTaskId && task.parentTaskId !== null && task.parentTaskId !== '';
                                            const hasSubTasks = (task.subTaskCount || 0) > 0;
                                            const hasDependencies = task.dependencies && task.dependencies.length > 0;

                                            return (
                                                <div
                                                    key={task._id}
                                                    className={`flex border-b border-gray-100 hover:bg-gray-50 transition group ${task.isMilestone ? "bg-purple-50/30" : ""
                                                        } ${isSubTask ? "bg-blue-50/10" : ""} ${hasDependencies ? "border-l-2 border-l-indigo-300" : ""}`}
                                                >
                                                    {/* Task Info */}
                                                    <div
                                                        className="w-64 shrink-0 p-3 cursor-pointer"
                                                        onClick={() => handleTaskClick(task)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {task.isMilestone && (
                                                                <Gem className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                                            )}
                                                            {isSubTask && !task.isMilestone && (
                                                                <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                            )}
                                                            {hasSubTasks && !task.isMilestone && !isSubTask && (
                                                                <GitBranch className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                            )}
                                                            {hasDependencies && (
                                                                <Link2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                            )}
                                                            <div
                                                                className="w-2 h-2 rounded-full shrink-0"
                                                                style={{ backgroundColor: task.color }}
                                                            />
                                                            <span className={`text-sm font-medium truncate ${task.isMilestone ? "text-purple-700" : isSubTask ? "text-blue-700" : "text-gray-800"
                                                                }`}>
                                                                {task.title}
                                                            </span>
                                                            {task.isMilestone && (
                                                                <span className="text-[8px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                                    MILESTONE
                                                                </span>
                                                            )}
                                                            {isSubTask && !task.isMilestone && (
                                                                <span className="text-[8px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                                    SUB-TASK
                                                                </span>
                                                            )}
                                                            {hasSubTasks && !task.isMilestone && !isSubTask && (
                                                                <span className="text-[8px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                                    {task.completedSubTaskCount || 0}/{task.subTaskCount}
                                                                </span>
                                                            )}
                                                            {hasDependencies && (
                                                                <span className="text-[8px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full shrink-0">
                                                                    🔗 {task.dependencies?.length ?? 0}
                                                                </span>
                                                            )}
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
                                                            {isSubTask && task.parentTaskId && typeof task.parentTaskId === 'object' && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1 text-blue-500">
                                                                        <GitBranch size={10} />
                                                                        Parent: {task.parentTaskId.title}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Gantt Bar Area */}
                                                    <div className="flex-1 relative" style={{ height: "48px" }}>
                                                        {task.isMilestone ? (
                                                            <MilestoneDiamond
                                                                task={task}
                                                                dayWidth={dayWidth}
                                                                startDate={ganttData.startDate}
                                                                onTaskClick={handleTaskClick}
                                                            />
                                                        ) : (
                                                            <>
                                                                <TaskGanttBar
                                                                    task={task}
                                                                    dayWidth={dayWidth}
                                                                    startDate={ganttData.startDate}
                                                                    onTaskClick={handleTaskClick}
                                                                />
                                                                <SubTaskIndicator
                                                                    task={task}
                                                                    onTaskClick={handleTaskClick}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                        <div className="w-px h-6 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12,2 22,12 12,22 2,12" />
                            </svg>
                            <span className="font-medium text-purple-600">Milestone</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-blue-600">Sub-Task</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium text-emerald-600">Parent Task</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium text-indigo-600">Dependency</span>
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
                        {filterMilestone !== "all" && (
                            <>
                                <div className="w-px h-6 bg-gray-200" />
                                <div className="flex items-center gap-2 text-purple-600">
                                    <Flag size={14} />
                                    <span>
                                        {filterMilestone === "milestones" ? "Showing Milestones Only" : "Showing Regular Tasks Only"}
                                    </span>
                                </div>
                            </>
                        )}
                        {filterSubTask !== "all" && (
                            <>
                                <div className="w-px h-6 bg-gray-200" />
                                <div className="flex items-center gap-2 text-blue-600">
                                    <GitBranch size={14} />
                                    <span>
                                        {filterSubTask === "parent" ? "Showing Parent Tasks Only" : "Showing Sub-Tasks Only"}
                                    </span>
                                </div>
                            </>
                        )}
                    </motion.div>
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
                            <div className={`p-6 border-b ${selectedTask.isMilestone ? "border-purple-200 bg-purple-50/50" : selectedTask.parentTaskId ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
                                }`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-8 rounded"
                                                style={{ backgroundColor: selectedTask.color }}
                                            />
                                            {selectedTask.isMilestone && (
                                                <Gem className="w-5 h-5 text-purple-500" />
                                            )}
                                            {selectedTask.parentTaskId && !selectedTask.isMilestone && (
                                                <GitBranch className="w-5 h-5 text-blue-400" />
                                            )}
                                            <h3 className={`text-xl font-bold ${selectedTask.isMilestone ? "text-purple-700" : selectedTask.parentTaskId ? "text-blue-700" : "text-gray-800"
                                                }`}>
                                                {selectedTask.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                            <span>{getStatusLabel(selectedTask.status)}</span>
                                            <span>•</span>
                                            <span>{getPriorityLabel(selectedTask.priority)}</span>
                                            {selectedTask.isMilestone && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-purple-600 font-medium flex items-center gap-1">
                                                        <Gem size={12} />
                                                        Milestone
                                                    </span>
                                                </>
                                            )}
                                            {selectedTask.parentTaskId && typeof selectedTask.parentTaskId === 'object' && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-blue-600 font-medium flex items-center gap-1">
                                                        <GitBranch size={12} />
                                                        Sub-Task of: {selectedTask.parentTaskId.title}
                                                    </span>
                                                </>
                                            )}
                                            {selectedTask.subTaskCount && selectedTask.subTaskCount > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                                                        <GitBranch size={12} />
                                                        {selectedTask.completedSubTaskCount || 0}/{selectedTask.subTaskCount} sub-tasks
                                                    </span>
                                                </>
                                            )}
                                            {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-indigo-600 font-medium flex items-center gap-1">
                                                        <Link2 size={12} />
                                                        {selectedTask.dependencies.length} dependencies
                                                    </span>
                                                </>
                                            )}
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
                                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-6">
                                {selectedTask.description && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-1">Description</h4>
                                        <p className="text-gray-800">{selectedTask.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-1">Start Date</h4>
                                        <p className="text-gray-800">{formatDate(selectedTask.start)}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-1">Deadline</h4>
                                        <p className="text-gray-800">{formatDate(selectedTask.end)}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-1">Duration</h4>
                                        <p className="text-gray-800">{selectedTask.duration} days</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-1">Progress</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${selectedTask.progressPercent}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium">{selectedTask.progressPercent}%</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedTask.assignedTo && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-1">Assigned To</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                                {getInitials(selectedTask.assignedTo.fullName)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{selectedTask.assignedTo.fullName}</p>
                                                <p className="text-xs text-gray-500">{selectedTask.assignedTo.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                                            <Link2 size={14} />
                                            Dependencies ({selectedTask.dependencies.length})
                                        </h4>
                                        <div className="space-y-1">
                                            {selectedTask.dependencies.map((dep, idx) => {
                                                const depTask = tasks.find(t => t._id === dep.taskId);
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                                                        <span className="font-medium text-indigo-600">{dep.type}</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span>{depTask?.title || dep.taskId}</span>
                                                        {dep.lag > 0 && (
                                                            <span className="text-xs text-gray-500">(+{dep.lag}d)</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex justify-end">
                                <button
                                    onClick={() => setShowTaskDetails(false)}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
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