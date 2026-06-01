"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue";
  deadline: string;
  estimatedHours: number;
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
}

export default function TasksPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  const canCreateTask = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
    "line_manager",
  ]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
    }
  }, [isAuthenticated, user, filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = "/tasks/my-tasks";
      if (hasRole(["admin", "super_admin", "dept_manager", "line_manager"])) {
        url = `/tasks?${filter !== "all" ? `status=${filter}` : ""}`;
      }

      const response = await api.get(url);

      if (response.data.success) {
        if (response.data.stats) {
          setStats(response.data.stats);
        }
        setTasks(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      normal: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
      high: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      urgent:
        "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-zinc-800 text-zinc-300 border border-zinc-700",
      in_progress: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
      submitted: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
      completed:
        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      overdue: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading || loading) {
    return (
      <div className="relative flex items-center justify-center min-h-screen bg-slate-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Syncing workspace...
          </p>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const statCards = [
    {
      label: "Total Tasks",
      value: stats.total,
      icon: Layers,
      color: "bg-slate-800/50 border-slate-700/50 text-slate-300",
      iconColor: "text-slate-400",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "bg-amber-500/5 border-amber-500/10 text-amber-400",
      iconColor: "text-amber-500",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Zap,
      color: "bg-sky-500/5 border-sky-500/10 text-sky-400",
      iconColor: "text-sky-500",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "bg-emerald-500/5 border-emerald-500/10 text-emerald-400",
      iconColor: "text-emerald-500",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "bg-rose-500/5 border-rose-500/10 text-rose-400",
      iconColor: "text-rose-500",
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-8 overflow-hidden">
      {/* Background Ambient Fluid Animation Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-[130px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-purple-500/10 to-transparent blur-[130px] animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto space-y-8">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text bg-gradient-to-r from-slate-100 via-white to-slate-300">
              Workspace Tasks
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Monitor, organize, and expedite production targets.
            </p>
          </div>
          {canCreateTask && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 group"
            >
              <Plus
                size={18}
                className="group-hover:rotate-90 transition-transform duration-200"
              />
              Create Task
            </button>
          )}
        </div>

        {/* Analytic Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className={`relative overflow-hidden backdrop-blur-md rounded-xl p-4 border shadow-sm transition-all duration-300 hover:scale-[1.02] ${stat.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold tracking-tight text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    {stat.label}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs Filter Grid */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-900 snap-x scrollbar-none">
          {["all", "pending", "in_progress", "completed", "overdue"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-xl capitalize whitespace-nowrap transition-all duration-200 snap-center ${
                  filter === tab
                    ? "bg-slate-800 border border-slate-700 text-white shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ),
          )}
        </div>

        {/* Dynamic List Render Interface */}
        {filteredTasks.length === 0 ? (
          <div className="bg-slate-900/20 border border-slate-900/60 backdrop-blur-md rounded-2xl p-16 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-500">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-1">
              Clear Board Situation
            </h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">
              There are currently no workspace matches corresponding to this
              status category filter.
            </p>
            {canCreateTask && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 mx-auto"
              >
                <Plus size={14} />
                Create your first task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className="group relative bg-slate-900/30 hover:bg-slate-900/60 border border-slate-900 hover:border-slate-800/80 rounded-2xl p-5 lg:p-6 shadow-xl backdrop-blur-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-md ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-md ${getStatusColor(task.status)}`}
                      >
                        {task.status.replace("_", " ").toUpperCase()}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-slate-500 font-medium ml-1">
                          Due • {formatDate(task.deadline)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors tracking-tight">
                        {task.title}
                      </h3>
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2 max-w-3xl leading-relaxed">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium pt-1">
                      <span className="flex items-center gap-1.5 bg-slate-950/40 border border-slate-900 px-2.5 py-1 rounded-lg">
                        <User size={13} className="text-slate-400" />
                        Owner:{" "}
                        <span className="text-slate-300 font-semibold">
                          {task.assignedTo?.fullName || "Unassigned"}
                        </span>
                      </span>
                      <span className="bg-slate-950/40 border border-slate-900 px-2.5 py-1 rounded-lg">
                        Est:{" "}
                        <span className="text-slate-300 font-semibold">
                          {task.estimatedHours}h
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end md:self-center border-t md:border-t-0 border-slate-900/60 pt-3 md:pt-0">
                    <button className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-1 bg-indigo-500/5 group-hover:bg-indigo-500/10 border border-indigo-500/10 px-4 py-2 rounded-xl transition-all group-hover:translate-x-0.5">
                      View Details
                      <ArrowRight
                        size={14}
                        className="transition-transform duration-200"
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Task Modal Component */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTaskCreated={fetchTasks}
      />
    </div>
  );
}
