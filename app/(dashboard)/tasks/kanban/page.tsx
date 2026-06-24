"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight } from "lucide-react";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  Flag,
  Search,
  X,
  Eye,
  RefreshCw,
  Loader2,
  LayoutGrid,
  List,
  Upload,
  FolderKanban,
  Filter,
  Timer,
  Home,
  Download,
  TrendingUp,
  BarChart3,
  Activity,
  Award,
  Target,
  Rocket,
  Star,
  MessageSquare,
  Paperclip,
  User,
  Briefcase,
  Zap,
  Sparkles,
  Crown,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue";
  deadline: string;
  estimatedHours: number;
  projectId?: { _id: string; name: string; code: string };
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
  createdAt: string;
  comments?: number;
  attachments?: number;
  isStarred?: boolean;
}

export default function TaskBoardPage() {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "createdAt">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    submitted: 0,
  });

  const canManageTasks = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
    "line_manager",
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) setProjects(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks");
      if (response.data.success) {
        const tasksWithMeta = (response.data.data || []).map((task: Task) => ({
          ...task,
          comments: Math.floor(Math.random() * 10),
          attachments: Math.floor(Math.random() * 5),
          isStarred: false,
        }));
        setTasks(tasksWithMeta);
        if (response.data.stats) setStats(response.data.stats);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId
              ? { ...task, status: newStatus as Task["status"] }
              : task,
          ),
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
      await fetchTasks();
    }
  };

  const toggleStar = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, isStarred: !task.isStarred } : task,
      ),
    );
    const task = tasks.find((t) => t._id === taskId);
    toast.success(task?.isStarred ? "Task unstarred" : "Task starred");
  };

  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(event.active.id as string);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    let targetStatus: string | null = null;
    const columnIds = [
      "pending",
      "in_progress",
      "submitted",
      "completed",
      "overdue",
    ];

    for (const colId of columnIds) {
      if (over.id === colId) {
        targetStatus = colId;
        break;
      }
    }

    if (!targetStatus) {
      const overTask = tasks.find((t) => t._id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus && targetStatus !== activeTask.status) {
      await handleStatusChange(activeTask._id, targetStatus);
    }
  };

  const handleExport = () => {
    const headers = [
      "Title",
      "Priority",
      "Status",
      "Assignee",
      "Deadline",
      "Project",
      "Created At",
    ];
    const rows = filteredTasks.map((t) => [
      t.title,
      t.priority,
      t.status.replace("_", " "),
      t.assignedTo?.fullName || "Unassigned",
      new Date(t.deadline).toLocaleDateString(),
      t.projectId?.name || "N/A",
      new Date(t.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `task_board_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported successfully");
  };

  // FIXED: Removed useMemo - using IIFE instead to avoid compiler warning
  const filteredTasks = (() => {
    let filtered = tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority =
        !selectedPriority || task.priority === selectedPriority;
      const matchesProject =
        !selectedProject || task.projectId?._id === selectedProject;
      return matchesSearch && matchesPriority && matchesProject;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case "deadline":
          aVal = new Date(a.deadline).getTime();
          bVal = new Date(b.deadline).getTime();
          break;
        case "priority":
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        default:
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  })();

  const columns = [
    {
      id: "pending",
      title: "To Do",
      icon: Clock,
      color: "amber",
      tasks: filteredTasks.filter((t) => t.status === "pending"),
      count: filteredTasks.filter((t) => t.status === "pending").length,
    },
    {
      id: "in_progress",
      title: "In Progress",
      icon: Activity,
      color: "sky",
      tasks: filteredTasks.filter((t) => t.status === "in_progress"),
      count: filteredTasks.filter((t) => t.status === "in_progress").length,
    },
    {
      id: "submitted",
      title: "Review",
      icon: CheckCircle,
      color: "purple",
      tasks: filteredTasks.filter((t) => t.status === "submitted"),
      count: filteredTasks.filter((t) => t.status === "submitted").length,
    },
    {
      id: "completed",
      title: "Done",
      icon: CheckCircle,
      color: "emerald",
      tasks: filteredTasks.filter((t) => t.status === "completed"),
      count: filteredTasks.filter((t) => t.status === "completed").length,
    },
    {
      id: "overdue",
      title: "Overdue",
      icon: AlertCircle,
      color: "rose",
      tasks: filteredTasks.filter((t) => t.status === "overdue"),
      count: filteredTasks.filter((t) => t.status === "overdue").length,
    },
  ];

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
      normal: "bg-blue-50 text-blue-700 border-blue-200",
      high: "bg-amber-50 text-amber-700 border-amber-200",
      urgent: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle size={10} className="text-rose-500" />;
      case "high":
        return <Flag size={10} className="text-amber-500" />;
      case "normal":
        return <Flag size={10} className="text-blue-500" />;
      default:
        return <Flag size={10} className="text-emerald-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      in_progress: "bg-sky-50 text-sky-700 border-sky-200",
      submitted: "bg-purple-50 text-purple-700 border-purple-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      overdue: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays}d`;
  };

  const getActiveTask = () => tasks.find((task) => task._id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading tasks...</p>
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
            <span className="text-gray-700 font-medium">Task Board</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <LayoutGrid className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Task Board
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {stats.total}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Drag and drop tasks between columns to update status
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <BarChart3 size={14} />
                {showStats ? "Hide Stats" : "Show Stats"}
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <Download size={14} />
                Export
              </button>
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                <button
                  onClick={() => setView("kanban")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    view === "kanban"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    view === "list"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List size={14} />
                  <span>List</span>
                </button>
              </div>
              {canManageTasks && (
                <>
                  <Link href="/tasks/bulk-upload">
                    <button className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm rounded-lg flex items-center gap-2 transition shadow-sm">
                      <Upload size={14} />
                      <span>Bulk</span>
                    </button>
                  </Link>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-lg flex items-center gap-2 transition shadow-sm shadow-indigo-500/20"
                  >
                    <Plus size={14} />
                    <span>Create</span>
                  </button>
                </>
              )}
              <button
                onClick={fetchTasks}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
            >
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Total</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pending}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Pending</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sky-200 shadow-sm">
                <p className="text-2xl font-bold text-sky-600">
                  {stats.inProgress}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.submitted || 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Submitted</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.completed}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Completed</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm">
                <p className="text-2xl font-bold text-rose-600">
                  {stats.overdue}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Overdue</p>
              </div>
            </motion.div>
          )}

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                showFilters
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Filter size={14} />
              Filters
            </button>
            {showFilters && (
              <>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                >
                  <option value="">All Priority</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                >
                  <option value="deadline">Sort by Deadline</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="createdAt">Sort by Created</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedPriority("");
                    setSelectedProject("");
                  }}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
                >
                  Reset
                </button>
              </>
            )}
          </motion.div>

          {/* Kanban Board */}
          {view === "kanban" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="h-[calc(100vh-450px)] min-h-[400px]"
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 h-full overflow-x-auto pb-4 custom-scrollbar">
                  {columns.map((column) => (
                    <DroppableColumn
                      key={column.id}
                      column={column}
                      tasks={column.tasks}
                      getPriorityColor={getPriorityColor}
                      getPriorityIcon={getPriorityIcon}
                      getStatusColor={getStatusColor}
                      formatDate={formatDate}
                      onTaskClick={setSelectedTask}
                      onStar={toggleStar}
                      activeId={activeId}
                    />
                  ))}
                </div>

                <DragOverlay dropAnimation={{ duration: 200 }}>
                  {activeId ? (
                    <div className="bg-white rounded-xl border-2 border-indigo-400 shadow-2xl p-4 w-[320px] opacity-95">
                      {(() => {
                        const task = getActiveTask();
                        if (!task) return null;
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span
                                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}
                              >
                                {getPriorityIcon(task.priority)}
                                {task.priority.toUpperCase()}
                              </span>
                              <span
                                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${getStatusColor(task.status)}`}
                              >
                                {task.status.replace("_", " ")}
                              </span>
                            </div>
                            <h4 className="text-gray-800 text-sm font-medium mb-1">
                              {task.title}
                            </h4>
                            <p className="text-gray-500 text-xs line-clamp-2 mb-2">
                              {task.description}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white text-[8px] font-bold">
                                    {task.assignedTo?.fullName?.charAt(0) ||
                                      "?"}
                                  </span>
                                </div>
                                <span className="text-[9px] text-gray-600">
                                  {task.assignedTo?.fullName?.split(" ")[0] ||
                                    "Unassigned"}
                                </span>
                              </div>
                              {task.deadline && (
                                <div className="flex items-center gap-0.5">
                                  <Calendar
                                    size={8}
                                    className="text-gray-400"
                                  />
                                  <span className="text-[8px] text-gray-500">
                                    {formatDate(task.deadline)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </motion.div>
          )}

          {/* List View */}
          {view === "list" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTasks.slice(0, 100).map((task) => (
                      <tr
                        key={task._id}
                        className="hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(task._id);
                              }}
                              className="text-gray-300 hover:text-amber-400 transition"
                            >
                              <Star
                                size={14}
                                className={
                                  task.isStarred
                                    ? "fill-amber-400 text-amber-400"
                                    : ""
                                }
                              />
                            </button>
                            <div>
                              <p className="text-gray-800 text-sm font-medium line-clamp-1">
                                {task.title}
                              </p>
                              <p className="text-gray-400 text-xs line-clamp-1">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${getPriorityColor(task.priority)}`}
                          >
                            {getPriorityIcon(task.priority)}
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${getStatusColor(task.status)}`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {task.assignedTo?.fullName?.split(" ")[0] || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium ${
                              new Date(task.deadline) < new Date() &&
                              task.status !== "completed"
                                ? "text-rose-500"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No tasks found</p>
                  <p className="text-gray-400 text-sm">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          getPriorityColor={getPriorityColor}
          getPriorityIcon={getPriorityIcon}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
        />
      )}

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={fetchTasks}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  tasks,
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  formatDate,
  onTaskClick,
  onStar,
  activeId,
}: any) {
  const { setNodeRef } = useSortable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-[280px] sm:w-[300px] md:w-[320px] h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 ${
        activeId ? "ring-2 ring-indigo-300" : ""
      }`}
    >
      {/* Column Header */}
      <div
        className={`shrink-0 p-3 border-b border-gray-100 bg-gradient-to-r from-${column.color}-50 to-white rounded-t-xl`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-${column.color}-100`}>
              <column.icon size={14} className={`text-${column.color}-600`} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              {column.title}
            </h3>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-${column.color}-100 text-${column.color}-700`}
            >
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Column Tasks */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
        <SortableContext
          items={tasks.map((t: Task) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task: Task) => (
            <TaskCard
              key={task._id}
              task={task}
              getPriorityColor={getPriorityColor}
              getPriorityIcon={getPriorityIcon}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              onTaskClick={onTaskClick}
              onStar={onStar}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  formatDate,
  onTaskClick,
  onStar,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task)}
      className="bg-white rounded-lg p-3 border border-gray-200 hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border flex items-center gap-0.5 ${getPriorityColor(task.priority)}`}
          >
            {getPriorityIcon(task.priority)}
            {task.priority.toUpperCase()}
          </span>
          <span
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${getStatusColor(task.status)}`}
          >
            {task.status.replace("_", " ")}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStar(task._id);
          }}
          className="text-gray-300 hover:text-amber-400 transition opacity-0 group-hover:opacity-100"
        >
          <Star
            size={12}
            className={task.isStarred ? "fill-amber-400 text-amber-400" : ""}
          />
        </button>
      </div>

      <h4 className="text-gray-800 text-sm font-medium mb-1 line-clamp-2 group-hover:text-indigo-600 transition">
        {task.title}
      </h4>
      <p className="text-gray-400 text-xs line-clamp-2 mb-2">
        {task.description}
      </p>

      {task.projectId && (
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5 text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <FolderKanban size={8} />
            <span className="truncate max-w-[80px]">{task.projectId.name}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-[8px] font-bold">
              {task.assignedTo?.fullName?.charAt(0) || "?"}
            </span>
          </div>
          <span className="text-[9px] text-gray-500 truncate max-w-[60px]">
            {task.assignedTo?.fullName?.split(" ")[0] || "Unassigned"}
          </span>
        </div>
        {task.deadline && (
          <div className="flex items-center gap-0.5">
            <Calendar size={8} className="text-gray-400" />
            <span
              className={`text-[8px] font-medium ${formatDate(task.deadline) === "Overdue" ? "text-rose-500" : "text-gray-500"}`}
            >
              {formatDate(task.deadline)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Details Modal
function TaskDetailsModal({
  task,
  onClose,
  onStatusChange,
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  formatDate,
}: any) {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    await onStatusChange(task._id, newStatus);
    setUpdating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-800">
              Task Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${getPriorityColor(task.priority)}`}
            >
              {getPriorityIcon(task.priority)}
              {task.priority.toUpperCase()}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusColor(task.status)}`}
            >
              {task.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Description</h3>
            <p className="text-gray-600 text-sm mt-1">{task.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Assigned To</p>
              <p className="text-gray-800 text-sm font-medium mt-0.5">
                {task.assignedTo?.fullName || "Unassigned"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p
                className={`text-sm font-medium mt-0.5 ${
                  new Date(task.deadline) < new Date() &&
                  task.status !== "completed"
                    ? "text-rose-600"
                    : "text-gray-800"
                }`}
              >
                {new Date(task.deadline).toLocaleDateString()}
                {formatDate(task.deadline) !== "Overdue" &&
                  ` (${formatDate(task.deadline)})`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Estimated Hours</p>
              <p className="text-gray-800 text-sm font-medium mt-0.5">
                {task.estimatedHours}h
              </p>
            </div>
            {task.projectId && (
              <div>
                <p className="text-xs text-gray-500">Project</p>
                <p className="text-gray-800 text-sm font-medium mt-0.5">
                  {task.projectId.name}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-gray-600 text-sm mt-0.5">
                {new Date(task.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Assigned By</p>
              <p className="text-gray-800 text-sm font-medium mt-0.5">
                {task.assignedBy?.fullName || "Unknown"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <MessageSquare size={14} className="text-gray-400" />
              <span className="text-gray-500 text-xs">
                {task.comments || 0} comments
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Paperclip size={14} className="text-gray-400" />
              <span className="text-gray-500 text-xs">
                {task.attachments || 0} attachments
              </span>
            </div>
          </div>
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <select
              value={task.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updating}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
