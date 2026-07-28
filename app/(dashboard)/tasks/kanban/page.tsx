"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  GripVertical,
  Settings,
  Save,
  Trash2,
  Edit2,
  Move,
  MoreVertical,
  PlusCircle,
  Columns,
  Check,
  Square,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  CheckCheck,
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
  DragOverEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";

// ============================================================
// TYPES
// ============================================================
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
  updatedAt: string;
  comments?: number;
  attachments?: number;
  isStarred?: boolean;
}

interface Column {
  id: string;
  title: string;
  icon: any;
  color: string;
  tasks: Task[];
  count: number;
}

interface ColumnSettings {
  id: string;
  title: string;
  color: string;
  visible: boolean;
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  submitted: number;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TaskBoardPage() {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
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
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    submitted: 0,
  });
  const [columnSettings, setColumnSettings] = useState<ColumnSettings[]>([
    { id: "pending", title: "To Do", color: "amber", visible: true },
    { id: "in_progress", title: "In Progress", color: "sky", visible: true },
    { id: "submitted", title: "Review", color: "purple", visible: true },
    { id: "completed", title: "Done", color: "emerald", visible: true },
    { id: "overdue", title: "Overdue", color: "rose", visible: true },
  ]);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // Bulk Select State
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string | null>(null);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);

  // Quick Edit State
  const [quickEditTaskId, setQuickEditTaskId] = useState<string | null>(null);
  const [quickEditPriority, setQuickEditPriority] = useState<string>("");
  const [quickEditDeadline, setQuickEditDeadline] = useState<string>("");

  const canManageTasks = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
    "line_manager",
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event) => {
        const { currentTarget } = event;
        if (!currentTarget) return null;
        const rect = (currentTarget as HTMLElement).getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      },
    }),
  );

  // Load column settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("taskBoardColumns");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setColumnSettings(parsed);
      } catch (e) {
        console.error("Failed to parse column settings", e);
      }
    }
  }, []);

  // Save column settings to localStorage
  const saveColumnSettings = useCallback((settings: ColumnSettings[]) => {
    localStorage.setItem("taskBoardColumns", JSON.stringify(settings));
    setColumnSettings(settings);
  }, []);

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
        updateStats();
      }
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error(error.response?.data?.message || "Failed to update status");
      await fetchTasks();
    }
  };

  const updateStats = () => {
    // Stats will be updated on next fetch
  };

  // Bulk Move Functions
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleAllTasksInColumn = (columnId: string) => {
    const tasksInColumn = tasks.filter((t) => t.status === columnId);
    const allSelected = tasksInColumn.every((t) => selectedTaskIds.has(t._id));

    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      tasksInColumn.forEach((task) => {
        if (allSelected) {
          newSet.delete(task._id);
        } else {
          newSet.add(task._id);
        }
      });
      return newSet;
    });
  };

  const handleBulkMove = async () => {
    if (!bulkTargetStatus || selectedTaskIds.size === 0) return;

    const toastId = toast.loading(`Moving ${selectedTaskIds.size} tasks...`);

    try {
      const promises = Array.from(selectedTaskIds).map((taskId) =>
        api.patch(`/tasks/${taskId}/status`, { status: bulkTargetStatus }),
      );

      await Promise.all(promises);

      toast.dismiss(toastId);
      toast.success(
        `Successfully moved ${selectedTaskIds.size} tasks to ${bulkTargetStatus.replace("_", " ")}`,
      );

      setTasks((prev) =>
        prev.map((task) =>
          selectedTaskIds.has(task._id)
            ? { ...task, status: bulkTargetStatus as Task["status"] }
            : task,
        ),
      );

      setSelectedTaskIds(new Set());
      setBulkMode(false);
      setShowBulkMoveModal(false);
      setBulkTargetStatus(null);
      updateStats();
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error("Failed to move tasks. Please try again.");
      console.error("Bulk move error:", error);
    }
  };

  // Quick Edit Functions
  const toggleStar = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, isStarred: !task.isStarred } : task,
      ),
    );
  };

  const handleQuickEdit = (taskId: string, field: string, value: any) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    if (field === "priority") {
      setQuickEditTaskId(taskId);
      setQuickEditPriority(value);
    } else if (field === "deadline") {
      setQuickEditTaskId(taskId);
      setQuickEditDeadline(value);
    }
  };

  const saveQuickEdit = async () => {
    if (!quickEditTaskId) return;

    const updates: any = {};
    if (quickEditPriority) updates.priority = quickEditPriority;
    if (quickEditDeadline) updates.deadline = quickEditDeadline;

    if (Object.keys(updates).length === 0) {
      setQuickEditTaskId(null);
      return;
    }

    try {
      const response = await api.put(`/tasks/${quickEditTaskId}`, updates);
      if (response.data.success) {
        toast.success("Task updated successfully");
        setTasks((prev) =>
          prev.map((task) =>
            task._id === quickEditTaskId ? { ...task, ...updates } : task,
          ),
        );
        setQuickEditTaskId(null);
        setQuickEditPriority("");
        setQuickEditDeadline("");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update task");
    }
  };

  // Column Management
  const handleRenameColumn = (columnId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      toast.error("Column name cannot be empty");
      return;
    }
    const updated = columnSettings.map((col) =>
      col.id === columnId ? { ...col, title: newTitle.trim() } : col,
    );
    saveColumnSettings(updated);
    setEditingColumnId(null);
    toast.success("Column renamed");
  };

  const handleToggleColumnVisibility = (columnId: string) => {
    const updated = columnSettings.map((col) =>
      col.id === columnId ? { ...col, visible: !col.visible } : col,
    );
    saveColumnSettings(updated);
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      toast.error("Column name cannot be empty");
      return;
    }
    const newId = newColumnTitle.toLowerCase().replace(/\s+/g, "_");
    const colors = [
      "indigo",
      "pink",
      "cyan",
      "lime",
      "orange",
      "teal",
      "violet",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newColumn: ColumnSettings = {
      id: newId,
      title: newColumnTitle.trim(),
      color: randomColor,
      visible: true,
    };

    const updated = [...columnSettings, newColumn];
    saveColumnSettings(updated);
    setNewColumnTitle("");
    setIsAddingColumn(false);
    toast.success("Column added");
  };

  const handleDeleteColumn = (columnId: string) => {
    if (
      columnId === "pending" ||
      columnId === "in_progress" ||
      columnId === "submitted" ||
      columnId === "completed" ||
      columnId === "overdue"
    ) {
      toast.error("Cannot delete default columns");
      return;
    }
    if (
      confirm(
        `Delete column "${columnSettings.find((c) => c.id === columnId)?.title}"?`,
      )
    ) {
      const updated = columnSettings.filter((col) => col.id !== columnId);
      saveColumnSettings(updated);
      toast.success("Column deleted");
    }
  };

  // Helper Functions
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
      normal: "bg-blue-50 text-blue-700 border-blue-200",
      high: "bg-amber-50 text-amber-700 border-amber-200",
      urgent: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[priority] || colors.normal;
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
    const colors: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      in_progress: "bg-sky-50 text-sky-700 border-sky-200",
      submitted: "bg-purple-50 text-purple-700 border-purple-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      overdue: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[status] || colors.pending;
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

  // 1. Move static lookup tables outside the component (or memo block)
  const PRIORITY_ORDER: Record<string, number> = {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  };

  // Inside your component:
  const filteredTasks = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    // 1. Filter tasks cleanly
    const filtered = tasks.filter((task) => {
      const matchesSearch =
        !searchLower ||
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower);

      const matchesPriority =
        !selectedPriority || task.priority === selectedPriority;

      const matchesProject =
        !selectedProject || task.projectId?._id === selectedProject;

      return matchesSearch && matchesPriority && matchesProject;
    });

    // 2. Sort safely without in-place mutation side-effects
    return [...filtered].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      switch (sortBy) {
        case "deadline":
          aVal = a.deadline ? new Date(a.deadline).getTime() : 0;
          bVal = b.deadline ? new Date(b.deadline).getTime() : 0;
          break;
        case "priority":
          aVal = PRIORITY_ORDER[a.priority] ?? 0;
          bVal = PRIORITY_ORDER[b.priority] ?? 0;
          break;
        default:
          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [tasks, searchTerm, selectedPriority, selectedProject, sortBy, sortOrder]);

  // Build columns with tasks
  const columns = useMemo(() => {
    const visibleColumns = columnSettings.filter((col) => col.visible);
    return visibleColumns.map((col) => {
      const columnTasks = filteredTasks.filter((t) => t.status === col.id);
      const colorMap: Record<string, string> = {
        amber: "amber",
        sky: "sky",
        purple: "purple",
        emerald: "emerald",
        rose: "rose",
        indigo: "indigo",
        pink: "pink",
        cyan: "cyan",
        lime: "lime",
        orange: "orange",
        teal: "teal",
        violet: "violet",
      };
      const iconMap: Record<string, any> = {
        pending: Clock,
        in_progress: Activity,
        submitted: CheckCircle,
        completed: CheckCircle,
        overdue: AlertCircle,
      };
      return {
        id: col.id,
        title: col.title,
        icon: iconMap[col.id] || Clock,
        color: colorMap[col.color] || "gray",
        tasks: columnTasks,
        count: columnTasks.length,
      };
    });
  }, [filteredTasks, columnSettings]);

  const getActiveTask = () => tasks.find((task) => task._id === activeId);

  // Drag and Drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    let targetStatus: string | null = null;
    const columnIds = columnSettings
      .filter((col) => col.visible)
      .map((col) => col.id);

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
        <div className="max-w-[1440px] mx-auto">
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
                onClick={() => {
                  setBulkMode(!bulkMode);
                  if (bulkMode) setSelectedTaskIds(new Set());
                }}
                className={`px-3 py-2 rounded-lg transition text-sm flex items-center gap-2 shadow-sm ${bulkMode
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                <CheckSquare size={14} />
                {bulkMode ? "Exit Bulk" : "Bulk Select"}
              </button>

              {bulkMode && selectedTaskIds.size > 0 && (
                <button
                  onClick={() => setShowBulkMoveModal(true)}
                  className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm rounded-lg flex items-center gap-2 transition shadow-sm"
                >
                  <Move size={14} />
                  Move {selectedTaskIds.size} Task
                  {selectedTaskIds.size > 1 ? "s" : ""}
                </button>
              )}

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
              <button
                onClick={() => setShowColumnSettings(!showColumnSettings)}
                className={`px-3 py-2 rounded-lg transition text-sm flex items-center gap-2 shadow-sm ${showColumnSettings
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                <Columns size={14} />
                Columns
              </button>
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm">
                <button
                  onClick={() => setView("kanban")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${view === "kanban"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <LayoutGrid size={14} />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${view === "list"
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

          {/* Bulk Mode Info Bar */}
          {bulkMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span className="text-sm text-indigo-800">
                  {selectedTaskIds.size} task
                  {selectedTaskIds.size !== 1 ? "s" : ""} selected
                </span>
                {selectedTaskIds.size > 0 && (
                  <button
                    onClick={() => setSelectedTaskIds(new Set())}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedTaskIds.size > 0 && (
                  <button
                    onClick={() => setShowBulkMoveModal(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Move size={12} />
                    Move Selected
                  </button>
                )}
                <button
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedTaskIds(new Set());
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs rounded-lg transition"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          )}

          {/* Column Settings Modal */}
          <AnimatePresence>
            {showColumnSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Columns size={16} className="text-indigo-500" />
                    <h3 className="font-semibold text-gray-800">
                      Column Settings
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowColumnSettings(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {columnSettings.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition group"
                    >
                      <div className="flex-1 flex items-center gap-3">
                        {editingColumnId === col.id ? (
                          <input
                            type="text"
                            defaultValue={col.title}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRenameColumn(
                                  col.id,
                                  e.currentTarget.value,
                                );
                              }
                              if (e.key === "Escape") {
                                setEditingColumnId(null);
                              }
                            }}
                            onBlur={(e) => {
                              handleRenameColumn(col.id, e.target.value);
                            }}
                            className="flex-1 px-2 py-1 border border-indigo-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">
                            {col.title}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full bg-${col.color}-100 text-${col.color}-700`}
                        >
                          {col.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => setEditingColumnId(col.id)}
                          className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleToggleColumnVisibility(col.id)}
                          className={`p-1 rounded ${col.visible
                            ? "text-emerald-500 hover:text-emerald-600"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                          {col.visible ? (
                            <CheckCircle size={12} />
                          ) : (
                            <Eye size={12} className="opacity-50" />
                          )}
                        </button>
                        {![
                          "pending",
                          "in_progress",
                          "submitted",
                          "completed",
                          "overdue",
                        ].includes(col.id) && (
                            <button
                              onClick={() => handleDeleteColumn(col.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                      </div>
                    </div>
                  ))}

                  {isAddingColumn ? (
                    <div className="flex items-center gap-2 p-2 border-2 border-dashed border-indigo-300 rounded-lg">
                      <input
                        type="text"
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        placeholder="Enter column name..."
                        className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddColumn();
                          if (e.key === "Escape") {
                            setIsAddingColumn(false);
                            setNewColumnTitle("");
                          }
                        }}
                      />
                      <button
                        onClick={handleAddColumn}
                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingColumn(false);
                          setNewColumnTitle("");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingColumn(true)}
                      className="w-full p-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={14} />
                      Add Column
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
            >
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Total</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm hover:shadow-md transition">
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pending}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Pending</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-sky-200 shadow-sm hover:shadow-md transition">
                <p className="text-2xl font-bold text-sky-600">
                  {stats.inProgress}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm hover:shadow-md transition">
                <p className="text-2xl font-bold text-purple-600">
                  {stats.submitted || 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Submitted</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition">
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.completed}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Completed</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition">
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
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm ${showFilters
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
            >
              <Filter size={14} />
              Filters
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 w-full overflow-hidden"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Kanban Board */}
          {view === "kanban" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="h-[calc(100vh-480px)] min-h-[500px]"
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
                      onQuickEdit={handleQuickEdit}
                      onSaveQuickEdit={saveQuickEdit}
                      quickEditTaskId={quickEditTaskId}
                      quickEditPriority={quickEditPriority}
                      quickEditDeadline={quickEditDeadline}
                      setQuickEditPriority={setQuickEditPriority}
                      setQuickEditDeadline={setQuickEditDeadline}
                      activeId={activeId}
                      bulkMode={bulkMode}
                      selectedTaskIds={selectedTaskIds}
                      toggleTaskSelection={toggleTaskSelection}
                      toggleAllTasksInColumn={toggleAllTasksInColumn}
                    />
                  ))}
                  {columns.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Columns
                          size={32}
                          className="mx-auto mb-2 opacity-50"
                        />
                        <p>No columns visible. Add columns in settings.</p>
                      </div>
                    </div>
                  )}
                </div>

                <DragOverlay
                  dropAnimation={{
                    duration: 200,
                    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                    sideEffects: defaultDropAnimationSideEffects({
                      styles: { active: { opacity: "0.4" } },
                    }),
                  }}
                >
                  {activeId ? (
                    <div className="bg-white rounded-xl border-2 border-indigo-400 shadow-2xl p-4 w-[320px] opacity-95 scale-105">
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
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                        {bulkMode && (
                          <button
                            onClick={() => {
                              const allSelected = filteredTasks.every((t) =>
                                selectedTaskIds.has(t._id),
                              );
                              setSelectedTaskIds(
                                allSelected
                                  ? new Set()
                                  : new Set(filteredTasks.map((t) => t._id)),
                              );
                            }}
                            className="text-gray-400 hover:text-indigo-600"
                          >
                            {filteredTasks.every((t) =>
                              selectedTaskIds.has(t._id),
                            ) && selectedTaskIds.size > 0 ? (
                              <CheckSquare
                                size={16}
                                className="text-indigo-600"
                              />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        )}
                      </th>
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
                      >
                        <td className="px-4 py-3">
                          {bulkMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskSelection(task._id);
                              }}
                              className="text-gray-400 hover:text-indigo-600"
                            >
                              {selectedTaskIds.has(task._id) ? (
                                <CheckSquare
                                  size={16}
                                  className="text-indigo-600"
                                />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          )}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={() => setSelectedTask(task)}
                        >
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
                          <select
                            value={task.priority}
                            onChange={(e) => {
                              handleQuickEdit(
                                task._id,
                                "priority",
                                e.target.value,
                              );
                              setTimeout(saveQuickEdit, 100);
                            }}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={() => setSelectedTask(task)}
                        >
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${getStatusColor(task.status)}`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-sm text-gray-600"
                          onClick={() => setSelectedTask(task)}
                        >
                          {task.assignedTo?.fullName?.split(" ")[0] || "-"}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={() => setSelectedTask(task)}
                        >
                          <span
                            className={`text-xs font-medium ${new Date(task.deadline) < new Date() &&
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

      {/* Bulk Move Modal */}
      <AnimatePresence>
        {showBulkMoveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Move className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Bulk Move Tasks
                    </h2>
                    <p className="text-xs text-gray-500">
                      Move {selectedTaskIds.size} selected task
                      {selectedTaskIds.size > 1 ? "s" : ""} to another column
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Destination Column
                  </label>
                  <select
                    value={bulkTargetStatus || ""}
                    onChange={(e) => setBulkTargetStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="">Select column...</option>
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title} ({col.tasks.length} tasks)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{selectedTaskIds.size}</span>{" "}
                    tasks will be moved to{" "}
                    <span className="font-medium text-emerald-600">
                      {bulkTargetStatus
                        ? columnSettings.find((c) => c.id === bulkTargetStatus)
                          ?.title
                        : "..."}
                    </span>
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleBulkMove}
                    disabled={!bulkTargetStatus}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Move size={16} />
                    Move Tasks
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkMoveModal(false);
                      setBulkTargetStatus(null);
                    }}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
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

// ============================================================
// DROPPABLE COLUMN COMPONENT
// ============================================================
function DroppableColumn({
  column,
  tasks,
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  formatDate,
  onTaskClick,
  onStar,
  onQuickEdit,
  onSaveQuickEdit,
  quickEditTaskId,
  quickEditPriority,
  quickEditDeadline,
  setQuickEditPriority,
  setQuickEditDeadline,
  activeId,
  bulkMode,
  selectedTaskIds,
  toggleTaskSelection,
  toggleAllTasksInColumn,
}: any) {
  const { setNodeRef } = useSortable({ id: column.id });
  const allSelected =
    tasks.length > 0 && tasks.every((t: Task) => selectedTaskIds.has(t._id));

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-[280px] sm:w-[300px] md:w-[320px] h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 ${activeId ? "ring-2 ring-indigo-300" : ""
        }`}
    >
      {/* Column Header */}
      <div
        className={`shrink-0 p-3 border-b border-gray-100 bg-gradient-to-r from-${column.color}-50 to-white rounded-t-xl`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {bulkMode && (
              <button
                onClick={() => toggleAllTasksInColumn(column.id)}
                className="text-gray-400 hover:text-indigo-600 transition"
              >
                {allSelected ? (
                  <CheckSquare size={14} className="text-indigo-600" />
                ) : (
                  <Square size={14} />
                )}
              </button>
            )}
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
          {column.count > 0 && (
            <span className="text-[10px] text-gray-400">
              {column.count} task{column.count !== 1 ? "s" : ""}
            </span>
          )}
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
              onQuickEdit={onQuickEdit}
              onSaveQuickEdit={onSaveQuickEdit}
              quickEditTaskId={quickEditTaskId}
              quickEditPriority={quickEditPriority}
              quickEditDeadline={quickEditDeadline}
              setQuickEditPriority={setQuickEditPriority}
              setQuickEditDeadline={setQuickEditDeadline}
              bulkMode={bulkMode}
              isSelected={selectedTaskIds.has(task._id)}
              toggleTaskSelection={toggleTaskSelection}
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

// ============================================================
// TASK CARD COMPONENT
// ============================================================
function TaskCard({
  task,
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  formatDate,
  onTaskClick,
  onStar,
  onQuickEdit,
  onSaveQuickEdit,
  quickEditTaskId,
  quickEditPriority,
  quickEditDeadline,
  setQuickEditPriority,
  setQuickEditDeadline,
  bulkMode,
  isSelected,
  toggleTaskSelection,
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

  const isQuickEditing = quickEditTaskId === task._id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (bulkMode) {
          toggleTaskSelection(task._id);
        } else {
          onTaskClick(task);
        }
      }}
      className={`bg-white rounded-lg p-3 border transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 group ${isSelected
        ? "border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/30"
        : "border-gray-200 hover:border-indigo-300"
        }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {bulkMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskSelection(task._id);
              }}
              className="text-gray-400 hover:text-indigo-600 transition"
            >
              {isSelected ? (
                <CheckSquare size={14} className="text-indigo-600" />
              ) : (
                <Square size={14} />
              )}
            </button>
          )}
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
              className={`text-[8px] font-medium ${formatDate(task.deadline) === "Overdue"
                ? "text-rose-500"
                : "text-gray-500"
                }`}
            >
              {formatDate(task.deadline)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// TASK DETAILS MODAL
// ============================================================
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
  const [selectedStatus, setSelectedStatus] = useState(task.status);

  const handleStatusUpdate = async () => {
    if (selectedStatus === task.status) {
      onClose();
      return;
    }
    setUpdating(true);
    await onStatusChange(task._id, selectedStatus);
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
            <h3 className="text-sm font-semibold text-gray-700">
              Description
            </h3>
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
                className={`text-sm font-medium mt-0.5 ${new Date(task.deadline) < new Date() &&
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
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
              onClick={handleStatusUpdate}
              disabled={updating}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
            >
              {updating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Update"
              )}
            </button>
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