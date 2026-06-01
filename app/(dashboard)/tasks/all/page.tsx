"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  User,
  Layers,
  Zap,
  Calendar,
  Flag,
  Briefcase,
  Users,
  Filter,
  Search,
  X,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Menu,
  LayoutGrid,
  List,
  BarChart3,
  GripVertical,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue";
  deadline: string;
  estimatedHours: number;
  actualMinutes: number;
  project?: string;
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export default function TaskBoardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  const canManageTasks = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
    "line_manager",
  ]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks");
      if (response.data.success) {
        setTasks(response.data.data || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
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
        fetchTasks();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task._id);
    // Add drag image styling
    const dragImage = document.createElement("div");
    dragImage.className = "bg-indigo-600 text-white p-2 rounded-lg shadow-lg";
    dragImage.textContent = task.title;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask) return;

    // Don't do anything if dropping in same column
    if (draggedTask.status === targetStatus) return;

    // Update the task status
    await handleStatusChange(draggedTask._id, targetStatus);
    setDraggedTask(null);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      !selectedPriority || task.priority === selectedPriority;
    const matchesStatus = !selectedStatus || task.status === selectedStatus;
    const matchesAssignee =
      !selectedAssignee || task.assignedTo?._id === selectedAssignee;
    return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
  });

  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      normal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-slate-800 text-slate-300 border-slate-700",
      in_progress: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      submitted: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      overdue: "bg-rose-500/10 text-rose-400 border-rose-500/20",
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
    return `${diffDays} days left`;
  };

  const kanbanColumns = [
    {
      id: "pending",
      title: "To Do",
      icon: Clock,
      color: "bg-amber-500/10 text-amber-400",
      borderColor: "border-amber-500/20",
      tasks: filteredTasks.filter((t) => t.status === "pending"),
    },
    {
      id: "in_progress",
      title: "In Progress",
      icon: Zap,
      color: "bg-sky-500/10 text-sky-400",
      borderColor: "border-sky-500/20",
      tasks: filteredTasks.filter((t) => t.status === "in_progress"),
    },
    {
      id: "submitted",
      title: "Review",
      icon: CheckSquare,
      color: "bg-purple-500/10 text-purple-400",
      borderColor: "border-purple-500/20",
      tasks: filteredTasks.filter((t) => t.status === "submitted"),
    },
    {
      id: "completed",
      title: "Done",
      icon: CheckCircle,
      color: "bg-emerald-500/10 text-emerald-400",
      borderColor: "border-emerald-500/20",
      tasks: filteredTasks.filter((t) => t.status === "completed"),
    },
    {
      id: "overdue",
      title: "Overdue",
      icon: AlertCircle,
      color: "bg-rose-500/10 text-rose-400",
      borderColor: "border-rose-500/20",
      tasks: filteredTasks.filter((t) => t.status === "overdue"),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Task Board</h1>
            <p className="text-slate-400 text-sm mt-1">
              Drag and drop tasks to update their status
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setView("kanban")}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition ${view === "kanban" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <LayoutGrid size={14} />
                Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 transition ${view === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                <List size={14} />
                List
              </button>
            </div>
            {canManageTasks && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
              >
                <Plus size={16} />
                Create Task
              </button>
            )}
            <button
              onClick={fetchTasks}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400">Total Tasks</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-xs text-slate-400">Pending</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-sky-400">
              {stats.inProgress}
            </p>
            <p className="text-xs text-slate-400">In Progress</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-emerald-400">
              {stats.completed}
            </p>
            <p className="text-xs text-slate-400">Completed</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-rose-400">{stats.overdue}</p>
            <p className="text-xs text-slate-400">Overdue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
            />
          </div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedPriority("");
              setSelectedStatus("");
              setSelectedAssignee("");
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
          >
            <X size={16} />
            Reset
          </button>
        </div>

        {/* Kanban View with Drag & Drop */}
        {view === "kanban" && (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {kanbanColumns.map((column) => (
                <div
                  key={column.id}
                  className={`w-80 flex-shrink-0 transition-all duration-200 ${
                    dragOverColumn === column.id
                      ? "ring-2 ring-indigo-500 ring-opacity-50 scale-[1.02]"
                      : ""
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div
                    className={`${column.color} rounded-t-xl p-3 border ${column.borderColor} border-b-0`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <column.icon size={16} />
                        <h3 className="font-semibold">{column.title}</h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800/50">
                        {column.tasks.length}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-900/30 rounded-b-xl border border-slate-800 border-t-0 p-3 space-y-3 max-h-[70vh] overflow-y-auto min-h-[400px]">
                    {column.tasks.map((task) => (
                      <div
                        key={task._id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, task)}
                        className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 hover:border-indigo-500/50 transition cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-indigo-500/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical
                              size={14}
                              className="text-slate-500"
                            />
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                          {task.deadline && (
                            <span className="text-[10px] text-slate-500">
                              {formatDate(task.deadline)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-white text-sm font-medium mb-1 line-clamp-2 pl-5">
                          {task.title}
                        </h4>
                        <p className="text-slate-400 text-xs line-clamp-2 mb-2 pl-5">
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700 pl-5">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <User size={12} />
                            <span className="truncate max-w-[100px]">
                              {task.assignedTo?.fullName?.split(" ")[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock size={12} />
                            <span>{task.estimatedHours}h</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {column.tasks.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-lg">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">
                        Task
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">
                        Priority
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">
                        Assignee
                      </th>
                      <th className="text-left px-6 py-3 text-xs text-slate-400 uppercase">
                        Deadline
                      </th>
                      <th className="text-right px-6 py-3 text-xs text-slate-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {paginatedTasks.map((task) => (
                      <tr
                        key={task._id}
                        className="hover:bg-slate-800/30 transition cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-white text-sm font-medium">
                              {task.title}
                            </p>
                            <p className="text-slate-500 text-xs line-clamp-1">
                              {task.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={task.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(task._id, e.target.value);
                            }}
                            className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(task.status)} bg-transparent cursor-pointer`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="submitted">Submitted</option>
                            <option value="completed">Completed</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {task.assignedTo?.fullName || "Unassigned"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-sm ${new Date(task.deadline) < new Date() && task.status !== "completed" ? "text-rose-400" : "text-slate-400"}`}
                          >
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTask(task);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 ml-auto"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No tasks found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => i + 1,
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                {totalPages > 5 && (
                  <span className="px-2 py-2 text-slate-500">...</span>
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    selectedTask.priority === "urgent"
                      ? "bg-rose-500"
                      : selectedTask.priority === "high"
                        ? "bg-amber-500"
                        : selectedTask.priority === "normal"
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                  }`}
                />
                <h2 className="text-lg font-semibold text-white">
                  {selectedTask.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Priority</p>
                  <span
                    className={`text-sm px-2 py-0.5 rounded-full inline-block mt-1 ${getPriorityColor(selectedTask.priority)}`}
                  >
                    {selectedTask.priority.toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Status</p>
                  <span
                    className={`text-sm px-2 py-0.5 rounded-full inline-block mt-1 ${getStatusColor(selectedTask.status)}`}
                  >
                    {selectedTask.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Assignee</p>
                  <p className="text-white text-sm mt-1">
                    {selectedTask.assignedTo?.fullName || "Unassigned"}
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Deadline</p>
                  <p className="text-white text-sm mt-1">
                    {new Date(selectedTask.deadline).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Estimated Hours</p>
                  <p className="text-white text-sm mt-1">
                    {selectedTask.estimatedHours}h
                  </p>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Created By</p>
                  <p className="text-white text-sm mt-1">
                    {selectedTask.assignedBy?.fullName}
                  </p>
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-xs text-slate-400">Description</p>
                <p className="text-white text-sm mt-1">
                  {selectedTask.description}
                </p>
              </div>
              {selectedTask.project && (
                <div className="bg-slate-800/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Project</p>
                  <p className="text-white text-sm mt-1">
                    {selectedTask.project}
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handleStatusChange(
                      selectedTask._id,
                      selectedTask.status === "pending"
                        ? "in_progress"
                        : selectedTask.status === "in_progress"
                          ? "submitted"
                          : selectedTask.status === "submitted"
                            ? "completed"
                            : "pending",
                    );
                    setSelectedTask(null);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition"
                >
                  Update Status
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={fetchTasks}
      />
    </div>
  );
}
