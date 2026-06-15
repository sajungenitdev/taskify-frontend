"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  Flag,
  User,
  FolderKanban,
  Timer,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Zap,
  AlertTriangle,
  Star,
  MessageSquare,
  Paperclip,
  Plus,
  Upload,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  projectId?: {
    _id: string;
    name: string;
    code: string;
  };
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
  isStarred?: boolean;
}

export default function MyTasksPage() {
  const { user, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const itemsPerPage = 9;

  // Allow all authenticated users to create tasks (they can create tasks for themselves)
  const canCreateTasks = isAuthenticated;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchMyTasks();
  }, [isAuthenticated, router]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks/my-tasks");
      if (response.data.success) {
        const enrichedTasks = (response.data.data || []).map((task: Task) => ({
          ...task,
          isStarred: false,
        }));
        setTasks(enrichedTasks);
      } else if (Array.isArray(response.data)) {
        const enrichedTasks = response.data.map((task: Task) => ({
          ...task,
          isStarred: false,
        }));
        setTasks(enrichedTasks);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      if (error.response?.status === 404) {
        setTasks([]);
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch tasks");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (updatingStatus === taskId) return;

    setUpdatingStatus(taskId);
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId
              ? { ...task, status: newStatus as Task["status"] }
              : task,
          ),
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
      await fetchMyTasks();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleStar = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === taskId ? { ...task, isStarred: !task.isStarred } : task,
      ),
    );
    toast.success("Task starred");
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      !selectedPriority || task.priority === selectedPriority;
    const matchesStatus = !selectedStatus || task.status === selectedStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      normal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle size={12} className="text-rose-400" />;
      case "high":
        return <Flag size={12} className="text-amber-400" />;
      case "normal":
        return <Flag size={12} className="text-blue-400" />;
      default:
        return <Flag size={12} className="text-emerald-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      in_progress: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      submitted: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      overdue: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityBgColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-500/20",
      normal: "bg-blue-500/20",
      high: "bg-amber-500/20",
      urgent: "bg-rose-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
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

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    submitted: tasks.filter((t) => t.status === "submitted").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    overdue: tasks.filter((t) => t.status === "overdue").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6 ps-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
                My Tasks
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                View and manage all tasks assigned to you
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-slate-800/50 rounded-xl p-0.5">
                <button
                  onClick={() => setView("grid")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    view === "grid"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid size={14} />
                  Grid
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    view === "list"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <List size={14} />
                  List
                </button>
              </div>
              {/* Show create buttons for all authenticated users */}
              <Link href="/tasks/bulk-upload">
                <button className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg flex items-center gap-2 transition">
                  <Upload size={14} />
                  Bulk Upload
                </button>
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg flex items-center gap-2 transition"
              >
                <Plus size={14} />
                Create Task
              </button>
              <button
                onClick={fetchMyTasks}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700 text-white rounded-lg transition"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total Tasks</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
              <p className="text-2xl font-bold text-amber-400">
                {stats.pending}
              </p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-sky-500/20">
              <p className="text-2xl font-bold text-sky-400">
                {stats.inProgress}
              </p>
              <p className="text-xs text-slate-400">In Progress</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-purple-500/20">
              <p className="text-2xl font-bold text-purple-400">
                {stats.submitted}
              </p>
              <p className="text-xs text-slate-400">Submitted</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20">
              <p className="text-2xl font-bold text-emerald-400">
                {stats.completed}
              </p>
              <p className="text-xs text-slate-400">Completed</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-rose-500/20">
              <p className="text-2xl font-bold text-rose-400">
                {stats.overdue}
              </p>
              <p className="text-xs text-slate-400">Overdue</p>
            </div>
          </motion.div>

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search your tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-slate-800/50 rounded-lg flex items-center gap-1 text-slate-400 hover:text-white text-sm"
            >
              <Filter size={14} />
              Filters
              {showFilters ? (
                <ChevronLeft size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-3 overflow-hidden"
              >
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
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
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
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
                  }}
                  className="px-3 py-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-white text-sm"
                >
                  Reset
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks Grid View */}
          {view === "grid" ? (
            filteredTasks.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
                <CheckSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white">
                  No tasks assigned yet
                </h3>
                <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                  You don't have any tasks assigned to you. Click the button
                  below to create your first task.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                  >
                    <Plus size={16} />
                    Create Single Task
                  </button>
                  <Link href="/tasks/bulk-upload">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">
                      <Upload size={16} />
                      Bulk Upload Tasks
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedTasks.map((task, index) => (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedTask(task)}
                      className="group bg-linear-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}
                          >
                            {getPriorityIcon(task.priority)}
                            <span>{task.priority.toUpperCase()}</span>
                          </div>
                          <div
                            className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}
                          >
                            {task.status.replace("_", " ")}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(task._id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition"
                        >
                          <Star
                            size={14}
                            className={`${task.isStarred ? "fill-amber-400 text-amber-400" : "text-slate-500 hover:text-amber-400"} transition-colors`}
                          />
                        </button>
                      </div>
                      <h3 className="text-white font-semibold mb-2 line-clamp-2">
                        {task.title}
                      </h3>
                      <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                        {task.description}
                      </p>
                      {task.projectId && (
                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                            <FolderKanban size={10} />
                            <span>{task.projectId.name}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">
                              {task.assignedBy?.fullName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                            Assigned by:{" "}
                            {task.assignedBy?.fullName?.split(" ")[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.estimatedHours > 0 && (
                            <div className="flex items-center gap-0.5">
                              <Timer size={10} className="text-slate-500" />
                              <span className="text-[10px] text-slate-500">
                                {task.estimatedHours}h
                              </span>
                            </div>
                          )}
                          {task.deadline && (
                            <div className="flex items-center gap-0.5">
                              <Calendar size={10} className="text-slate-500" />
                              <span
                                className={`text-[10px] ${formatDate(task.deadline) === "Overdue" ? "text-rose-400" : "text-slate-500"}`}
                              >
                                {formatDate(task.deadline)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50 hover:bg-slate-700 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg transition ${
                            currentPage === pageNum
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50 hover:bg-slate-700 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            // List View
            <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Task
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Priority
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Project
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Deadline
                      </th>
                      <th className="text-center px-4 py-3 text-xs text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400">
                            No tasks assigned yet
                          </p>
                          <div className="flex gap-3 justify-center mt-4">
                            <button
                              onClick={() => setShowCreateModal(true)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition"
                            >
                              <Plus size={14} />
                              Create Task
                            </button>
                            <Link href="/tasks/bulk-upload">
                              <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition">
                                <Upload size={14} />
                                Bulk Upload
                              </button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedTasks.map((task) => (
                        <tr
                          key={task._id}
                          className="hover:bg-slate-800/30 transition cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <td className="px-4 py-3">
                            <p className="text-white text-sm font-medium line-clamp-1">
                              {task.title}
                            </p>
                            <p className="text-slate-500 text-xs line-clamp-1">
                              {task.description}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={task.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleStatusChange(task._id, e.target.value);
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(task.status)} bg-transparent cursor-pointer`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="submitted">Submitted</option>
                              <option value="completed">Completed</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {task.projectId?.name || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs ${formatDate(task.deadline) === "Overdue" ? "text-rose-400" : "text-slate-400"}`}
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
                              className="p-1 text-slate-500 hover:text-indigo-400 transition"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-linear-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-linear-to-r from-indigo-600/10 to-purple-600/10 sticky top-0 bg-slate-900">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${getPriorityBgColor(selectedTask.priority)}`}
                  >
                    {getPriorityIcon(selectedTask.priority)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedTask.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(selectedTask.priority)}`}
                      >
                        {selectedTask.priority.toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(selectedTask.status)}`}
                      >
                        {selectedTask.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Description</p>
                  <p className="text-white">{selectedTask.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Project</p>
                    <p className="text-white text-sm mt-1">
                      {selectedTask.projectId?.name || "-"}
                    </p>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Assigned By</p>
                    <p className="text-white text-sm mt-1">
                      {selectedTask.assignedBy?.fullName || "-"}
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
                    <p className="text-xs text-slate-400">Created At</p>
                    <p className="text-white text-sm mt-1">
                      {new Date(selectedTask.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-xs text-slate-400">Last Updated</p>
                    <p className="text-white text-sm mt-1">
                      {new Date(selectedTask.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => {
                      handleStatusChange(selectedTask._id, e.target.value);
                      setSelectedTask(null);
                    }}
                    disabled={updatingStatus === selectedTask._id}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={() => {
          fetchMyTasks();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
