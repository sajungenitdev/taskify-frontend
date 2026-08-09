// app/(dashboard)/projects/[id]/gantt/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Target,
  Activity,
  Download,
  RefreshCw,
  Loader2,
  ChevronRight,
  Home,
  User,
  Briefcase,
  Flag,
  Eye,
  Edit2,
  Filter,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  GanttChartSquare,
  Layers,
  Users,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status:
    | "pending"
    | "in_progress"
    | "submitted"
    | "completed"
    | "overdue"
    | "rejected";
  deadline: string;
  estimatedHours: number;
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  order?: number;
}

interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  tasksCount: number;
  completedTasks: number;
}

interface GanttTask {
  _id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  progress: number;
  priority: string;
  status: string;
  assignee: string;
  assigneeId: string;
  isMilestone: boolean;
  dependencies: string[];
  color: string;
  row: number;
}

export default function ProjectGanttPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");

  const canManage = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
  ]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?projectId=${projectId}&limit=100`),
      ]);

      if (projectRes.data.success) {
        setProject(projectRes.data.data);
      }

      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching project data:", error);
      setError(error.response?.data?.message || "Failed to fetch project data");
      toast.error(
        error.response?.data?.message || "Failed to fetch project data",
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate Gantt data from tasks
  const ganttData = useMemo(() => {
    if (!project) return [];

    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const totalDays = Math.ceil(
      (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    const priorityColors: Record<string, string> = {
      urgent: "#ef4444",
      high: "#f59e0b",
      normal: "#3b82f6",
      low: "#10b981",
    };

    const statusColors: Record<string, string> = {
      completed: "#10b981",
      in_progress: "#3b82f6",
      submitted: "#8b5cf6",
      pending: "#f59e0b",
      overdue: "#ef4444",
      rejected: "#6b7280",
    };

    // Generate tasks with dates
    const ganttTasks: GanttTask[] = tasks.map((task, index) => {
      // Parse dates
      let startDate = new Date(projectStart);
      let endDate = new Date(projectStart);

      // If task has deadline, use it as end date
      if (task.deadline) {
        endDate = new Date(task.deadline);
        // Calculate start date based on estimated hours
        const durationDays = Math.max(1, Math.ceil(task.estimatedHours / 8));
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - durationDays);
      }

      // If start date is before project start, adjust
      if (startDate < projectStart) {
        startDate = new Date(projectStart);
      }

      // If end date is after project end, adjust
      if (endDate > projectEnd) {
        endDate = new Date(projectEnd);
      }

      const duration = Math.max(
        1,
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );

      return {
        _id: task._id,
        title: task.title,
        startDate,
        endDate,
        duration,
        progress:
          task.status === "completed"
            ? 100
            : task.status === "in_progress"
              ? 50
              : task.status === "submitted"
                ? 80
                : 0,
        priority: task.priority,
        status: task.status,
        assignee: task.assignedTo?.fullName || "Unassigned",
        assigneeId: task.assignedTo?._id || "",
        isMilestone: task.estimatedHours === 0,
        dependencies: [],
        color:
          priorityColors[task.priority] ||
          statusColors[task.status] ||
          "#6b7280",
        row: index,
      };
    });

    return ganttTasks;
  }, [tasks, project]);

  // Filter tasks
  const filteredGanttData = useMemo(() => {
    return ganttData.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || task.status === filterStatus;
      const matchesPriority =
        filterPriority === "all" || task.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [ganttData, searchTerm, filterStatus, filterPriority]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (!project || filteredGanttData.length === 0)
      return { start: new Date(), end: new Date() };

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);

    // Add padding
    const paddingDays = 7;
    start.setDate(start.getDate() - paddingDays);
    end.setDate(end.getDate() + paddingDays);

    return { start, end };
  }, [project, filteredGanttData]);

  // Get days between two dates
  const getDaysBetween = (start: Date, end: Date) => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get day label
  const getDayLabel = (date: Date, view: "day" | "week" | "month") => {
    if (view === "day") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } else if (view === "week") {
      return `Week ${Math.ceil(date.getDate() / 7)}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
  };

  // Get position of task in timeline
  const getTaskPosition = (task: GanttTask) => {
    const rangeStart = timelineRange.start;
    const rangeEnd = timelineRange.end;
    const totalDays = getDaysBetween(rangeStart, rangeEnd);
    const startOffset = getDaysBetween(rangeStart, task.startDate);
    const duration = task.duration;

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-500",
      in_progress: "bg-blue-500",
      submitted: "bg-purple-500",
      completed: "bg-emerald-500",
      overdue: "bg-rose-500",
      rejected: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusText = (status: string) => {
    return status.replace("_", " ").toUpperCase();
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-100 text-emerald-700",
      normal: "bg-blue-100 text-blue-700",
      high: "bg-amber-100 text-amber-700",
      urgent: "bg-rose-100 text-rose-700",
    };
    return colors[priority] || colors.normal;
  };

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const getTaskProgressColor = (progress: number) => {
    if (progress >= 80) return "text-emerald-600";
    if (progress >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading Gantt chart...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Failed to Load Project
          </h3>
          <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
          <button
            onClick={fetchProjectData}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-375 mx-auto">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm mb-4"
          >
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
            >
              <Home size={14} />
              Dashboard
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link
              href="/projects"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              Projects
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link
              href={`/projects/${projectId}`}
              className="text-gray-400 hover:text-gray-600 transition truncate max-w-[150px]"
            >
              {project.name}
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-indigo-600 font-medium">Gantt Chart</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6"
          >
            <div className="flex items-center gap-4">
              <Link
                href={`/projects/${projectId}/dashboard`}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <GanttChartSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                      Gantt Chart
                    </h1>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-mono text-gray-400">
                        {project.code}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(new Date(project.startDate))} -{" "}
                        {formatDate(new Date(project.endDate))}
                      </span>
                      <span className="text-xs text-emerald-600">
                        {project.tasksCount} tasks
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* View Mode */}
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    viewMode === "day"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    viewMode === "week"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    viewMode === "month"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Month
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                <button
                  onClick={handleZoomOut}
                  className="px-2 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="px-2 py-1.5 text-xs text-gray-600">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="px-2 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              <button
                onClick={toggleFullscreen}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                {isFullscreen ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </button>

              <button
                onClick={() => {
                  // Export Gantt data as CSV
                  const headers = [
                    "Task",
                    "Start Date",
                    "End Date",
                    "Duration",
                    "Progress",
                    "Priority",
                    "Status",
                    "Assignee",
                  ];
                  const rows = filteredGanttData.map((task) => [
                    task.title,
                    formatDate(task.startDate),
                    formatDate(task.endDate),
                    task.duration,
                    `${task.progress}%`,
                    task.priority,
                    task.status,
                    task.assignee,
                  ]);
                  const csv = [
                    headers.join(","),
                    ...rows.map((row) => row.join(",")),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `gantt_${project.code}_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Gantt data exported");
                }}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm flex items-center gap-2"
              >
                <Download size={16} />
                Export
              </button>

              <button
                onClick={fetchProjectData}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-6"
          >
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterPriority("all");
              }}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
            >
              <X size={16} />
              Reset
            </button>
          </motion.div>

          {/* Gantt Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all ${
              isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : ""
            }`}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "top left",
              width: `${100 / zoomLevel}%`,
            }}
          >
            {isFullscreen && (
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <GanttChartSquare size={20} className="text-indigo-500" />
                  <h3 className="font-semibold text-gray-800">Gantt Chart</h3>
                  <span className="text-xs text-gray-500">{project.name}</span>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  <Minimize2 size={18} />
                </button>
              </div>
            )}

            <div
              className="overflow-auto"
              style={{
                maxHeight: isFullscreen ? "calc(100vh - 60px)" : "600px",
              }}
            >
              {filteredGanttData.length === 0 ? (
                <div className="text-center py-12">
                  <GanttChartSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    No tasks to display
                  </p>
                  <p className="text-gray-400 text-sm">
                    Tasks will appear here once created
                  </p>
                </div>
              ) : (
                <div className="min-w-[800px]">
                  {/* Header */}
                  <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                    <div className="flex">
                      {/* Task Name Column */}
                      <div className="w-64 shrink-0 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Task Name
                      </div>
                      {/* Timeline Header */}
                      <div className="flex-1 relative px-4 py-3">
                        <div className="flex">
                          {Array.from(
                            {
                              length: Math.min(
                                30,
                                getDaysBetween(
                                  timelineRange.start,
                                  timelineRange.end,
                                ) + 1,
                              ),
                            },
                            (_, i) => {
                              const date = new Date(timelineRange.start);
                              date.setDate(date.getDate() + i);
                              return (
                                <div
                                  key={i}
                                  className="flex-1 text-center text-[10px] text-gray-400 border-l border-gray-100"
                                  style={{
                                    minWidth:
                                      viewMode === "day"
                                        ? "40px"
                                        : viewMode === "week"
                                          ? "80px"
                                          : "120px",
                                  }}
                                >
                                  {getDayLabel(date, viewMode)}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tasks */}
                  {filteredGanttData.map((task, index) => {
                    const position = getTaskPosition(task);
                    const isExpanded = expandedTasks.has(task._id);

                    return (
                      <div
                        key={task._id}
                        className={`flex border-b border-gray-100 hover:bg-gray-50 transition ${
                          task.status === "completed" ? "opacity-75" : ""
                        }`}
                      >
                        {/* Task Name */}
                        <div
                          className="w-64 shrink-0 px-4 py-3 border-r border-gray-200 cursor-pointer"
                          onClick={() => toggleTaskExpand(task._id)}
                        >
                          <div className="flex items-center gap-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              {isExpanded ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronUp size={14} />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}
                                >
                                  {task.priority}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {task.assignee}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex-1 relative px-4 py-3">
                          <div className="relative h-8">
                            {/* Task Bar */}
                            <div
                              className="absolute top-0 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:scale-y-110"
                              style={{
                                left: position.left,
                                width: position.width,
                                height: "100%",
                                backgroundColor: task.color,
                                opacity: task.status === "completed" ? 0.7 : 1,
                              }}
                              onClick={() =>
                                handleTaskClick(
                                  tasks.find((t) => t._id === task._id)!,
                                )
                              }
                            >
                              {/* Progress Fill */}
                              <div
                                className="absolute inset-0 rounded-lg bg-white/30"
                                style={{ width: `${task.progress}%` }}
                              />
                              {/* Label */}
                              <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium truncate px-1">
                                {task.duration > 2 ? task.title : ""}
                              </div>
                            </div>

                            {/* Milestone Marker */}
                            {task.isMilestone && (
                              <div
                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-md"
                                style={{
                                  left: position.left,
                                  backgroundColor: task.color,
                                }}
                              />
                            )}
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <span className="text-gray-500">Start</span>
                                  <p className="font-medium text-gray-800">
                                    {formatDate(task.startDate)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">End</span>
                                  <p className="font-medium text-gray-800">
                                    {formatDate(task.endDate)}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Duration
                                  </span>
                                  <p className="font-medium text-gray-800">
                                    {task.duration} days
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Progress
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          task.progress >= 80
                                            ? "bg-emerald-500"
                                            : task.progress >= 50
                                              ? "bg-amber-500"
                                              : "bg-rose-500"
                                        }`}
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                    <span
                                      className={`font-medium ${getTaskProgressColor(task.progress)}`}
                                    >
                                      {task.progress}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center gap-6 text-xs">
              <span className="text-gray-500 font-medium">Legend:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span className="text-gray-600">Submitted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span className="text-gray-600">Overdue</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full border-2 border-white shadow" />
                <span className="text-gray-600">Milestone</span>
              </div>
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-gray-800">
                {filteredGanttData.length}
              </p>
              <p className="text-xs text-gray-500">Total Tasks</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">
                {
                  filteredGanttData.filter((t) => t.status === "completed")
                    .length
                }
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
              <p className="text-2xl font-bold text-blue-600">
                {
                  filteredGanttData.filter((t) => t.status === "in_progress")
                    .length
                }
              </p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
              <p className="text-2xl font-bold text-amber-600">
                {
                  filteredGanttData.filter(
                    (t) => t.status === "pending" || t.status === "submitted",
                  ).length
                }
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm">
              <p className="text-2xl font-bold text-rose-600">
                {filteredGanttData.filter((t) => t.status === "overdue").length}
              </p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {showTaskDetails && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GanttChartSquare className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Task Details
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    {selectedTask.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {selectedTask.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full inline-block mt-0.5 ${getPriorityColor(selectedTask.priority)}`}
                    >
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(selectedTask.status)}`}
                      />
                      <span className="text-sm text-gray-800">
                        {getStatusText(selectedTask.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assignee</p>
                    <p className="text-gray-800 text-sm font-medium mt-0.5">
                      {selectedTask.assignedTo?.fullName || "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estimated Hours</p>
                    <p className="text-gray-800 text-sm font-medium mt-0.5">
                      {selectedTask.estimatedHours}h
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="text-gray-800 text-sm font-medium mt-0.5">
                      {new Date(selectedTask.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <Link
                    href={`/tasks/${selectedTask._id}`}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition text-center"
                  >
                    View Full Details
                  </Link>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
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
