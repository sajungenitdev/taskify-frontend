"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Loader2,
  ChevronRight,
  Home,
  User,
  Layers,
  Table,
  Flame,
  Eye,
  Search,
  ListTodo,
  Filter,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  BarChart,
} from "recharts";

interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: { _id: string; name: string; code: string };
  managerId?: { _id: string; fullName: string; email: string; role: string; avatar?: string };
  createdBy?: { _id: string; fullName: string; email: string };
  teamMembers: Array<{
    userId: { _id: string; fullName: string; email: string; avatar?: string };
    role: string;
    joinedAt: string;
  }>;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled" | "archived";
  priority: "low" | "normal" | "high" | "critical";
  startDate: string;
  endDate: string;
  budget?: { allocated: number; spent: number; currency: string };
  progress: number;
  tasksCount: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  archivedAt?: string;
  archivedBy?: { _id: string; fullName: string; email: string };
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  assignedTo?: { _id: string; fullName: string; email?: string };
  createdBy?: { _id: string; fullName: string; email?: string };
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  estimatedHours?: number;
  actualHours?: number;
  projectId?: string;
  project?: string | { _id: string };
  description?: string;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  submitted: number;
  overdue: number;
  rejected: number;
  byPriority: { low: number; normal: number; high: number; urgent: number };
  byAssignee: Array<{ userId: string; fullName: string; taskCount: number; completedCount: number; progress: number }>;
}

interface Contributor {
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: string;
  tasksCompleted: number;
  totalTasks: number;
  completionRate: number;
  hoursLogged: number;
  estimatedHours: number;
  hoursAccuracy: number;
  onTimeTasks: number;
  lateTasks: number;
  onTimeRate: number;
  avgTaskCompletionTime: number;
  taskBreakdown: {
    pending: number;
    inProgress: number;
    submitted: number;
    completed: number;
    overdue: number;
  };
  priorityBreakdown: {
    low: number;
    normal: number;
    high: number;
    critical: number;
  };
}

interface BurndownData {
  date: string;
  idealRemaining: number;
  actualRemaining: number;
  completed: number;
  total: number;
}

export default function ProjectDashboardPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  // State
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "analytics" | "contributions">("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState<"week" | "month" | "all">("all");

  // Task table filters
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");
  const [taskSortBy, setTaskSortBy] = useState<"title" | "status" | "priority" | "dueDate" | "createdAt">("createdAt");
  const [taskSortOrder, setTaskSortOrder] = useState<"asc" | "desc">("desc");
  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 10;

  // Contribution table
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "tasks" | "rate" | "hours">("tasks");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // ============================================================
  // FETCH PROJECT DATA - FULLY DYNAMIC
  // ============================================================

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectRes = await api.get(`/projects/${projectId}`);
      if (projectRes.data.success) {
        setProject(projectRes.data.data);
      }

      // Fetch tasks for this project - USE THE CORRECT ENDPOINT
      let tasksData: Task[] = [];

      try {
        // Use the project-specific tasks endpoint
        const tasksRes = await api.get(`/tasks/project/${projectId}`);

        if (tasksRes.data.success && tasksRes.data.data) {
          tasksData = tasksRes.data.data;
          console.log(`✅ Found ${tasksData.length} tasks for project from /tasks/project/${projectId}`);
        }
      } catch (tasksError) {
        console.error("Failed to fetch tasks from project endpoint:", tasksError);

        // Fallback: Try the main tasks endpoint and filter manually
        try {
          const allTasksRes = await api.get("/tasks");
          if (allTasksRes.data.success && allTasksRes.data.data) {
            const allTasks = allTasksRes.data.data;
            if (Array.isArray(allTasks)) {
              tasksData = allTasks.filter((t: any) => {
                const taskProject = t.projectId || t.project?._id || t.project;
                return taskProject === projectId || taskProject?.toString() === projectId;
              });
              console.log(`✅ Found ${tasksData.length} tasks from fallback filtering`);
            }
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      }

      // If still no tasks, try getting tasks from project data
      if (tasksData.length === 0 && projectRes.data.data?.tasks) {
        tasksData = projectRes.data.data.tasks;
        console.log(`✅ Found ${tasksData.length} tasks from project data`);
      }

      setTasks(tasksData);
      console.log("📋 Final tasks count:", tasksData.length);

    } catch (err: any) {
      console.error("Error fetching project data:", err);
      setError(err.message || "Failed to load project data");
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  // ============================================================
  // DERIVED DATA - CALCULATED FROM REAL TASKS
  // ============================================================

  // Filter tasks by time range
  const filteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return tasks;

    const now = new Date();
    const cutoff = new Date();

    switch (selectedTimeRange) {
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "all":
      default:
        return tasks;
    }

    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= cutoff;
    });
  }, [tasks, selectedTimeRange]);

  // Calculate progress from real tasks
  const progress = useMemo(() => {
    if (!filteredTasks.length) return 0;
    const completed = filteredTasks.filter(t => t.status === "completed").length;
    return Math.round((completed / filteredTasks.length) * 100);
  }, [filteredTasks]);

  // Task stats from real tasks
  const taskStats = useMemo(() => {
    const tasksList = filteredTasks || [];
    return {
      total: tasksList.length,
      completed: tasksList.filter(t => t.status === "completed").length,
      inProgress: tasksList.filter(t => t.status === "in_progress" || t.status === "in-progress").length,
      pending: tasksList.filter(t => t.status === "pending" || t.status === "todo").length,
      submitted: tasksList.filter(t => t.status === "submitted" || t.status === "review").length,
      overdue: tasksList.filter(t => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date()).length,
      rejected: tasksList.filter(t => t.status === "rejected").length,
      byPriority: {
        low: tasksList.filter(t => t.priority === "low").length,
        normal: tasksList.filter(t => t.priority === "normal" || t.priority === "medium").length,
        high: tasksList.filter(t => t.priority === "high").length,
        critical: tasksList.filter(t => t.priority === "critical" || t.priority === "urgent").length,
      }
    };
  }, [filteredTasks]);

  // Generate contributors from real tasks
  const contributors = useMemo(() => {
    const tasksList = filteredTasks || [];
    if (!tasksList.length) return [];

    const map = new Map<string, Contributor>();

    tasksList.forEach(task => {
      // Use assignedTo or fallback to createdBy
      const user = task.assignedTo || task.createdBy;
      if (!user) return;

      const key = user._id;
      if (!map.has(key)) {
        map.set(key, {
          userId: key,
          fullName: user.fullName || "Unknown User",
          email: user.email || "",
          avatar: "string | undefined",
          role: "Contributor",
          tasksCompleted: 0,
          totalTasks: 0,
          completionRate: 0,
          hoursLogged: 0,
          estimatedHours: 0,
          hoursAccuracy: 0,
          onTimeTasks: 0,
          lateTasks: 0,
          onTimeRate: 0,
          avgTaskCompletionTime: 0,
          taskBreakdown: { pending: 0, inProgress: 0, submitted: 0, completed: 0, overdue: 0 },
          priorityBreakdown: { low: 0, normal: 0, high: 0, critical: 0 },
        });
      }

      const contributor = map.get(key)!;
      contributor.totalTasks++;

      const status = task.status || "pending";
      if (status === "completed") {
        contributor.tasksCompleted++;
        contributor.taskBreakdown.completed++;
        if (task.dueDate && task.completedAt) {
          const isOnTime = new Date(task.completedAt) <= new Date(task.dueDate);
          if (isOnTime) contributor.onTimeTasks++;
          else contributor.lateTasks++;
        }
      } else if (status === "in_progress" || status === "in-progress") {
        contributor.taskBreakdown.inProgress++;
      } else if (status === "submitted" || status === "review") {
        contributor.taskBreakdown.submitted++;
      } else if (status === "pending" || status === "todo") {
        contributor.taskBreakdown.pending++;
      } else if (status === "overdue") {
        contributor.taskBreakdown.overdue++;
      }

      const priority = task.priority || "normal";
      if (priority === "low") contributor.priorityBreakdown.low++;
      else if (priority === "normal" || priority === "medium") contributor.priorityBreakdown.normal++;
      else if (priority === "high") contributor.priorityBreakdown.high++;
      else if (priority === "critical" || priority === "urgent") contributor.priorityBreakdown.critical++;

      if (task.estimatedHours) contributor.estimatedHours += task.estimatedHours;
      if (task.actualHours) contributor.hoursLogged += task.actualHours;
    });

    const result = Array.from(map.values()).map(contrib => ({
      ...contrib,
      completionRate: contrib.totalTasks > 0 ? Math.round((contrib.tasksCompleted / contrib.totalTasks) * 100) : 0,
      onTimeRate: contrib.tasksCompleted > 0 ? Math.round((contrib.onTimeTasks / contrib.tasksCompleted) * 100) : 0,
      hoursAccuracy: contrib.estimatedHours > 0 ? Math.round((contrib.hoursLogged / contrib.estimatedHours) * 100) : 0,
      avgTaskCompletionTime: 0,
    }));

    result.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
    return result;
  }, [filteredTasks]);

  // Generate burndown from real tasks
  const burndownData = useMemo(() => {
    const tasksList = filteredTasks || [];
    if (!project || !tasksList.length) return [];

    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return [];

    const total = tasksList.length;
    const completedTasks = tasksList
      .filter(t => t.status === "completed" && t.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    const data: BurndownData[] = [];
    let completed = 0;
    let idx = 0;

    for (let i = 0; i <= Math.min(days, 30); i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      while (idx < completedTasks.length && new Date(completedTasks[idx].completedAt!) <= date) {
        completed++;
        idx++;
      }

      const ideal = Math.max(0, total - (total / Math.max(days, 1)) * i);
      const actual = Math.max(0, total - completed);

      data.push({
        date: dateStr,
        idealRemaining: Math.round(ideal),
        actualRemaining: actual,
        completed: completed,
        total: total,
      });
    }

    return data;
  }, [filteredTasks, project]);

  // ============================================================
  // TASK TABLE FILTERING - DYNAMIC
  // ============================================================
  const filteredTaskList = useMemo(() => {
    let filtered = filteredTasks || [];

    if (taskSearch) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(taskSearch.toLowerCase())
      );
    }

    if (taskStatusFilter !== "all") {
      filtered = filtered.filter(t => t.status === taskStatusFilter);
    }

    if (taskPriorityFilter !== "all") {
      filtered = filtered.filter(t => t.priority === taskPriorityFilter);
    }

    filtered.sort((a, b) => {
      let valA: any, valB: any;
      switch (taskSortBy) {
        case "title": valA = a.title; valB = b.title; break;
        case "status": valA = a.status; valB = b.status; break;
        case "priority": valA = a.priority; valB = b.priority; break;
        case "dueDate": valA = a.dueDate || ""; valB = b.dueDate || ""; break;
        case "createdAt": valA = a.createdAt; valB = b.createdAt; break;
        default: valA = a.createdAt; valB = b.createdAt;
      }
      if (typeof valA === "string") {
        return taskSortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return taskSortOrder === "asc" ? valA - valB : valB - valA;
    });

    return filtered;
  }, [filteredTasks, taskSearch, taskStatusFilter, taskPriorityFilter, taskSortBy, taskSortOrder]);

  const paginatedTasks = useMemo(() => {
    const start = (taskPage - 1) * tasksPerPage;
    const end = start + tasksPerPage;
    return filteredTaskList.slice(start, end);
  }, [filteredTaskList, taskPage]);

  const totalTaskPages = Math.ceil(filteredTaskList.length / tasksPerPage);

  const filteredContributors = useMemo(() => {
    let filtered = contributors;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    filtered.sort((a, b) => {
      let valA: any, valB: any;
      switch (sortBy) {
        case "name": valA = a.fullName; valB = b.fullName; break;
        case "tasks": valA = a.tasksCompleted; valB = b.tasksCompleted; break;
        case "rate": valA = a.completionRate; valB = b.completionRate; break;
        case "hours": valA = a.hoursLogged; valB = b.hoursLogged; break;
        default: valA = a.completionRate; valB = b.completionRate;
      }
      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
    return filtered;
  }, [contributors, searchTerm, sortBy, sortOrder]);

  const burndownAccuracy = useMemo(() => {
    if (burndownData.length === 0) return null;
    const last = burndownData[burndownData.length - 1];
    const ideal = last.idealRemaining;
    const actual = last.actualRemaining;
    const diff = Math.abs(ideal - actual);
    const accuracy = ideal > 0 ? (1 - diff / ideal) * 100 : 100;
    return { accuracy: Math.max(0, Math.min(100, accuracy)), diff, ideal, actual };
  }, [burndownData]);

  // ============================================================
  // HELPERS
  // ============================================================
  const formatDate = (d: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (d: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-gray-100 text-gray-700",
      active: "bg-emerald-100 text-emerald-700",
      on_hold: "bg-amber-100 text-amber-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-rose-100 text-rose-700",
      archived: "bg-gray-100 text-gray-500",
      pending: "bg-gray-100 text-gray-700",
      in_progress: "bg-amber-100 text-amber-700",
      "in-progress": "bg-amber-100 text-amber-700",
      submitted: "bg-purple-100 text-purple-700",
      review: "bg-purple-100 text-purple-700",
      overdue: "bg-rose-100 text-rose-700",
      rejected: "bg-rose-100 text-rose-700",
      todo: "bg-gray-100 text-gray-700",
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-100 text-emerald-700",
      normal: "bg-blue-100 text-blue-700",
      high: "bg-amber-100 text-amber-700",
      critical: "bg-rose-100 text-rose-700",
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical": return <Flame size={14} className="text-rose-500" />;
      case "high": return <AlertTriangle size={14} className="text-amber-500" />;
      case "normal": return <Target size={14} className="text-blue-500" />;
      default: return <CheckCircle size={14} className="text-emerald-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle size={14} className="text-green-500" />;
      case "in_progress": return <Activity size={14} className="text-amber-500" />;
      case "submitted": return <Clock size={14} className="text-purple-500" />;
      case "overdue": return <AlertTriangle size={14} className="text-rose-500" />;
      case "rejected": return <X size={14} className="text-rose-500" />;
      default: return <Target size={14} className="text-gray-500" />;
    }
  };

  const exportCSV = () => {
    if (!filteredContributors.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = ["Name", "Email", "Tasks", "Completed", "Rate", "Hours", "On-Time"];
      const rows = filteredContributors.map(c => [
        c.fullName, c.email, c.totalTasks, c.tasksCompleted,
        `${c.completionRate}%`, `${c.hoursLogged}h`, `${c.onTimeRate}%`
      ]);

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contributors_${project?.code}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported successfully");
    } catch (error) {
      toast.error("Failed to export");
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchProjectData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const resetTaskFilters = () => {
    setTaskSearch("");
    setTaskStatusFilter("all");
    setTaskPriorityFilter("all");
    setTaskPage(1);
  };

  // ============================================================
  // LOADING / ERROR
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading project...</p>
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
          <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to Load</h3>
          <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
          <button onClick={fetchProjectData} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
            <RefreshCw size={16} className="inline mr-2" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
              <Home size={14} />
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <Link href="/projects" className="text-gray-400 hover:text-gray-600">Projects</Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">{project.name}</span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-indigo-600 font-medium">Dashboard</span>
          </div>

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <FolderKanban className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{project.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                      {project.status?.replace("_", " ") || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-400">Progress: {progress}%</span>
                    {progress === 100 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle size={10} /> Complete
                      </span>
                    )}
                    <span className="text-xs text-gray-400">• {filteredTasks.length} tasks</span>
                    <span className="text-xs text-gray-400">• {contributors.length} contributors</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={refresh} disabled={refreshing} className="px-3 py-2 bg-white border text-amber-700 border-gray-200 hover:bg-gray-50 rounded-lg text-sm flex items-center gap-2">
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                  {refreshing ? "Updating..." : "Refresh"}
                </button>
                <Link href="/projects" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center gap-2">
                  <ArrowLeft size={14} /> Back
                </Link>
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm w-fit">
            <button onClick={() => setSelectedTimeRange("week")} className={`px-4 py-1.5 text-sm rounded-lg transition ${selectedTimeRange === "week" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>Week</button>
            <button onClick={() => setSelectedTimeRange("month")} className={`px-4 py-1.5 text-sm rounded-lg transition ${selectedTimeRange === "month" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>Month</button>
            <button onClick={() => setSelectedTimeRange("all")} className={`px-4 py-1.5 text-sm rounded-lg transition ${selectedTimeRange === "all" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>All Time</button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-gray-800">{taskStats.total}</p>
              <p className="text-xs text-gray-500">Total Tasks</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{taskStats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-amber-600">{taskStats.inProgress}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{taskStats.submitted}</p>
              <p className="text-xs text-gray-500">Submitted</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-rose-600">{taskStats.overdue}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-indigo-600">{contributors.length}</p>
              <p className="text-xs text-gray-500">Contributors</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{progress}%</p>
              <p className="text-xs text-gray-500">Progress</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-3 text-sm font-medium transition relative whitespace-nowrap ${activeTab === "overview" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span className="flex items-center gap-2"><BarChart3 size={14} /> Overview</span>
                {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>
              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-4 py-3 text-sm font-medium transition relative whitespace-nowrap ${activeTab === "tasks" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span className="flex items-center gap-2"><ListTodo size={14} /> Tasks ({filteredTaskList.length})</span>
                {activeTab === "tasks" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-3 text-sm font-medium transition relative whitespace-nowrap ${activeTab === "analytics" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span className="flex items-center gap-2"><TrendingUp size={14} /> Analytics</span>
                {activeTab === "analytics" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>
              <button
                onClick={() => setActiveTab("contributions")}
                className={`px-4 py-3 text-sm font-medium transition relative whitespace-nowrap ${activeTab === "contributions" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <span className="flex items-center gap-2"><Users size={14} /> Contributors ({contributors.length})</span>
                {activeTab === "contributions" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
              </button>
            </div>

            <div className="p-5">

              {/* ========================================================== */}
              {/* OVERVIEW TAB */}
              {/* ========================================================== */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Burndown */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <LineChart size={18} className="text-indigo-500" /> Burndown Chart
                      </h3>
                      {burndownAccuracy && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{burndownAccuracy.accuracy.toFixed(1)}%</p>
                          <p className="text-xs text-gray-400">Accuracy</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {burndownData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={burndownData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Legend />
                              <Area type="monotone" dataKey="idealRemaining" stroke="#94a3b8" strokeDasharray="5 5" fill="#e2e8f0" fillOpacity={0.3} name="Ideal" />
                              <Area type="monotone" dataKey="actualRemaining" stroke="#6366f1" fill="#818cf8" fillOpacity={0.2} name="Actual" />
                              <Bar dataKey="completed" fill="#34d399" opacity={0.6} name="Completed" />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <LineChart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No burndown data available</p>
                          <p className="text-xs mt-1">Complete tasks to see the burndown chart</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Details & Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Project Details</h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(project.status)}`}>{project.status?.replace("_", " ") || "Unknown"}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Priority</span><span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${getPriorityColor(project.priority)}`}>{getPriorityIcon(project.priority)} {project.priority}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Department</span><span className="text-gray-800">{project.departmentId?.name || "N/A"}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Manager</span><span className="text-gray-800">{project.managerId?.fullName || "Unassigned"}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Budget</span><span className="text-gray-800 font-medium">{formatCurrency(project.budget?.allocated || 0)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Timeline</span><span className="text-gray-800 text-xs">{formatDate(project.startDate)} - {formatDate(project.endDate)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-500">Team</span><span className="text-gray-800">{project.teamMembers?.length || 0} members</span></div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Priority Distribution</h3>
                      </div>
                      <div className="p-4">
                        {taskStats.total > 0 ? (
                          <>
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                  <Pie data={[
                                    { name: "Low", value: taskStats.byPriority.low },
                                    { name: "Normal", value: taskStats.byPriority.normal },
                                    { name: "High", value: taskStats.byPriority.high },
                                    { name: "Critical", value: taskStats.byPriority.critical },
                                  ]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                                    <Cell fill="#34d399" /><Cell fill="#60a5fa" /><Cell fill="#fbbf24" /><Cell fill="#f87171" />
                                  </Pie>
                                  <Tooltip />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-4 mt-2 text-xs">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full" /> Low</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full" /> Normal</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" /> High</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-400 rounded-full" /> Critical</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-400 text-sm">No tasks</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* TASKS TAB - DYNAMIC DATA */}
              {/* ========================================================== */}
              {activeTab === "tasks" && (
                <div className="space-y-4">
                  {/* Task Stats Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-gray-800">{taskStats.total}</p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600">{taskStats.completed}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-amber-600">{taskStats.inProgress}</p>
                      <p className="text-xs text-gray-500">In Progress</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-purple-600">{taskStats.submitted}</p>
                      <p className="text-xs text-gray-500">Submitted</p>
                    </div>
                    <div className="bg-rose-50 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-rose-600">{taskStats.overdue}</p>
                      <p className="text-xs text-gray-500">Overdue</p>
                    </div>
                  </div>

                  {/* Task Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={taskSearch}
                        onChange={(e) => setTaskSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                    <select
                      value={taskStatusFilter}
                      onChange={(e) => setTaskStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
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
                      value={taskPriorityFilter}
                      onChange={(e) => setTaskPriorityFilter(e.target.value)}
                      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                    >
                      <option value="all">All Priority</option>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <button
                      onClick={resetTaskFilters}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-1 transition"
                    >
                      <X size={14} /> Reset
                    </button>
                    <div className="flex gap-1 ml-auto">
                      <button
                        onClick={() => {
                          if (taskSortBy === "createdAt") {
                            setTaskSortOrder(taskSortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setTaskSortBy("createdAt");
                            setTaskSortOrder("desc");
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-md transition ${taskSortBy === "createdAt" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        Date {taskSortBy === "createdAt" && (taskSortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => {
                          if (taskSortBy === "title") {
                            setTaskSortOrder(taskSortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setTaskSortBy("title");
                            setTaskSortOrder("asc");
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-md transition ${taskSortBy === "title" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        Title {taskSortBy === "title" && (taskSortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => {
                          if (taskSortBy === "status") {
                            setTaskSortOrder(taskSortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setTaskSortBy("status");
                            setTaskSortOrder("asc");
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-md transition ${taskSortBy === "status" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        Status {taskSortBy === "status" && (taskSortOrder === "asc" ? "↑" : "↓")}
                      </button>
                      <button
                        onClick={() => {
                          if (taskSortBy === "dueDate") {
                            setTaskSortOrder(taskSortOrder === "asc" ? "desc" : "asc");
                          } else {
                            setTaskSortBy("dueDate");
                            setTaskSortOrder("asc");
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded-md transition ${taskSortBy === "dueDate" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        Due {taskSortBy === "dueDate" && (taskSortOrder === "asc" ? "↑" : "↓")}
                      </button>
                    </div>
                  </div>

                  {/* Task Table - DYNAMIC DATA */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Task</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedTasks.length > 0 ? (
                            paginatedTasks.map((task) => {
                              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";
                              return (
                                <tr key={task._id} className="hover:bg-gray-50 transition">
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                                      {task.description && (
                                        <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>
                                      )}
                                      {task.estimatedHours && (
                                        <p className="text-xs text-gray-400">{task.estimatedHours}h estimated</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                                      {task.status?.replace("_", " ") || "Unknown"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit mx-auto ${getPriorityColor(task.priority)}`}>
                                      {getPriorityIcon(task.priority)}
                                      {task.priority}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-gray-700">
                                      {task.assignedTo?.fullName || task.createdBy?.fullName || "Unassigned"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`text-sm ${isOverdue ? "text-rose-600 font-medium" : "text-gray-600"}`}>
                                      {task.dueDate ? formatDate(task.dueDate) : "N/A"}
                                    </span>
                                    {isOverdue && (
                                      <span className="ml-1 text-xs text-rose-500">(Overdue)</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center text-sm text-gray-500">
                                    {formatDate(task.createdAt)}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-gray-400">
                                <ListTodo className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No tasks found</p>
                                <p className="text-xs mt-1">Try adjusting your filters</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {totalTaskPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-gray-500">
                        Showing {((taskPage - 1) * tasksPerPage) + 1} to {Math.min(taskPage * tasksPerPage, filteredTaskList.length)} of {filteredTaskList.length} tasks
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setTaskPage(p => Math.max(1, p - 1))}
                          disabled={taskPage === 1}
                          className="px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition text-sm"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalTaskPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalTaskPages <= 5) {
                            pageNum = i + 1;
                          } else if (taskPage <= 3) {
                            pageNum = i + 1;
                          } else if (taskPage >= totalTaskPages - 2) {
                            pageNum = totalTaskPages - 4 + i;
                          } else {
                            pageNum = taskPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setTaskPage(pageNum)}
                              className={`px-3 py-1 rounded-md text-sm transition ${taskPage === pageNum ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setTaskPage(p => Math.min(totalTaskPages, p + 1))}
                          disabled={taskPage === totalTaskPages}
                          className="px-3 py-1 rounded-md bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition text-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================== */}
              {/* ANALYTICS TAB */}
              {/* ========================================================== */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  {/* Task Status Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <PieChart size={18} className="text-indigo-500" /> Task Status Distribution
                        </h3>
                      </div>
                      <div className="p-4">
                        {taskStats.total > 0 ? (
                          <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie data={[
                                  { name: "Completed", value: taskStats.completed },
                                  { name: "In Progress", value: taskStats.inProgress },
                                  { name: "Pending", value: taskStats.pending },
                                  { name: "Submitted", value: taskStats.submitted },
                                  { name: "Overdue", value: taskStats.overdue },
                                ]} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                                  <Cell fill="#34d399" /><Cell fill="#fbbf24" /><Cell fill="#94a3b8" /><Cell fill="#8b5cf6" /><Cell fill="#f87171" />
                                </Pie>
                                <Tooltip />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">No data</div>
                        )}
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <BarChart3 size={18} className="text-indigo-500" /> Priority Distribution
                        </h3>
                      </div>
                      <div className="p-4">
                        {taskStats.total > 0 ? (
                          <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={[
                                { name: "Low", value: taskStats.byPriority.low },
                                { name: "Normal", value: taskStats.byPriority.normal },
                                { name: "High", value: taskStats.byPriority.high },
                                { name: "Critical", value: taskStats.byPriority.critical },
                              ]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* CONTRIBUTIONS TAB */}
              {/* ========================================================== */}
              {activeTab === "contributions" && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200/50">
                      <p className="text-xs text-gray-500 font-medium">Contributors</p>
                      <p className="text-2xl font-bold text-indigo-700">{contributors.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                      <p className="text-xs text-gray-500 font-medium">Tasks Completed</p>
                      <p className="text-2xl font-bold text-emerald-700">{contributors.reduce((s, c) => s + c.tasksCompleted, 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                      <p className="text-xs text-gray-500 font-medium">Avg Completion</p>
                      <p className="text-2xl font-bold text-amber-700">{contributors.length ? Math.round(contributors.reduce((s, c) => s + c.completionRate, 0) / contributors.length) : 0}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
                      <p className="text-xs text-gray-500 font-medium">Total Hours</p>
                      <p className="text-2xl font-bold text-purple-700">{contributors.reduce((s, c) => s + c.hoursLogged, 0)}h</p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search contributors..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none w-48"
                        />
                      </div>
                      <div className="flex gap-1">
                        {["name", "tasks", "rate", "hours"].map((key) => (
                          <button
                            key={key}
                            onClick={() => setSortBy(key as any)}
                            className={`px-2 py-1 text-xs rounded-md transition ${sortBy === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </button>
                        ))}
                        <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </button>
                      </div>
                    </div>
                    <button onClick={exportCSV} className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm flex items-center gap-2">
                      <Download size={14} /> Export
                    </button>
                  </div>

                  {/* Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tasks</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rate</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hours</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">On-Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredContributors.length > 0 ? (
                            filteredContributors.map((c) => (
                              <tr key={c.userId} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                      {c.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{c.fullName}</p>
                                      <p className="text-xs text-gray-400">{c.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center text-sm text-gray-600">{c.totalTasks}</td>
                                <td className="text-center text-sm text-emerald-600 font-medium">{c.tasksCompleted}</td>
                                <td className="text-center">
                                  <span className={`text-sm font-medium ${c.completionRate >= 80 ? "text-emerald-600" : c.completionRate >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                                    {c.completionRate}%
                                  </span>
                                  <div className="w-16 mx-auto mt-1 bg-gray-200 rounded-full h-1">
                                    <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${c.completionRate}%` }} />
                                  </div>
                                </td>
                                <td className="text-center text-sm text-gray-600">{c.hoursLogged}h</td>
                                <td className="text-center">
                                  <span className={`text-sm font-medium ${c.onTimeRate >= 80 ? "text-emerald-600" : c.onTimeRate >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                                    {c.onTimeRate}%
                                  </span>
                                  <div className="text-xs text-gray-400">{c.onTimeTasks} on-time / {c.lateTasks} late</div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-gray-400">
                                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No contributors found</p>
                                <p className="text-xs mt-1">Tasks need to be assigned to users</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}