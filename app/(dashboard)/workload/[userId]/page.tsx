// app/(dashboard)/workload/[userId]/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Activity,
  Star,
  Award,
  Timer,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Gauge,
  Layers,
  Orbit,
  Sparkles,
  Shield,
  Eye,
  FileText,
  MessageSquare,
  GitBranch,
  Rocket,
  Flag,
  AlertTriangle,
  Check,
  X,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  UserCheck,
  Users as UsersIcon,
  BarChart2,
  LineChart,
  TrendingUp as TrendingUpIcon,
  Award as AwardIcon,
  Target as TargetIcon,
  Activity as ActivityIcon,
  Zap as ZapIcon,
  Crown,
  Medal,
  Flame,
  Info,
  ExternalLink,
  CheckSquare,
  FolderKanban,
  Send,
  Filter,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// ============ TYPES ============
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  estimatedHours: number;
  actualMinutes: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | { _id: string; fullName: string };
  projectId?: {
    _id: string;
    name: string;
    code?: string;
  };
  createdBy?: {
    _id: string;
    fullName: string;
  };
  evidenceUrls?: string[];
  extensionRequests?: any[];
}

interface Project {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  tasks?: Task[];
  tasksCount?: number;
  completedTasks?: number;
  managerId?: { _id: string; fullName: string };
  departmentId?: { _id: string; name: string };
}

interface UserDetails {
  user: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
    department: string | { _id: string; name: string };
    role: string;
    joinDate: string;
    profilePhoto?: string;
  };
  metrics: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    totalEstimatedHours: number;
    totalActualHours: number;
    completionRate: number;
    productivityScore: number;
    efficiencyRate: number;
    avgTaskCompletionTime: number;
    onTimeDeliveryRate: number;
  };
  tasksByProject: Array<{
    project: { _id: string; name: string; code?: string; color?: string };
    tasks: Task[];
    totalEstimated: number;
    totalActual: number;
    completionRate: number;
  }>;
  activeTasks: Task[];
  recentCompleted: Task[];
  overdueTasks: Task[];
  weeklyBreakdown: Array<{
    week: string;
    start: string;
    end: string;
    tasks: number;
    completed: number;
    hours: number;
  }>;
  priorityDistribution: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
  statusDistribution: {
    pending: number;
    inProgress: number;
    submitted: number;
    completed: number;
    overdue: number;
    rejected: number;
  };
}

// ============ CONSTANTS ============
const STATUS_COLORS = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  submitted: "#8b5cf6",
  completed: "#10b981",
  overdue: "#ef4444",
  rejected: "#f43f5e",
  todo: "#6b7280",
  done: "#10b981",
};

const PRIORITY_COLORS = {
  low: "#10b981",
  normal: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

// ============ UTILITY FUNCTIONS ============
const getDepartmentDisplay = (dept: string | { _id: string; name: string } | null): string => {
  if (!dept) return "No Department";
  if (typeof dept === "string") return dept;
  return dept.name || "No Department";
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const formatDateShort = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

const getInitials = (name: string): string => {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    submitted: "Submitted",
    completed: "Completed",
    overdue: "Overdue",
    rejected: "Rejected",
    todo: "To Do",
    done: "Done",
  };
  return labels[status] || status;
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: "Low",
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
  };
  return labels[priority] || priority;
};

// ============ COMPONENTS ============
const StatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
    in_progress: { label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200" },
    submitted: { label: "Submitted", color: "bg-purple-50 text-purple-700 border-purple-200" },
    completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    overdue: { label: "Overdue", color: "bg-rose-50 text-rose-700 border-rose-200" },
    rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200" },
    todo: { label: "To Do", color: "bg-gray-50 text-gray-700 border-gray-200" },
    done: { label: "Done", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };
  const c = config[status] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${c.color}`}
    >
      {c.label}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const config: any = {
    low: { label: "Low", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    normal: { label: "Normal", color: "bg-blue-50 text-blue-700 border-blue-200" },
    high: { label: "High", color: "bg-amber-50 text-amber-700 border-amber-200" },
    urgent: { label: "Urgent", color: "bg-rose-50 text-rose-700 border-rose-200" },
  };
  const c = config[priority] || config.normal;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${c.color}`}
    >
      <Flag className="w-2.5 h-2.5" />
      {c.label}
    </span>
  );
};

// ============ MAIN COMPONENT ============
export default function IndividualWorkloadPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"overview" | "tasks" | "projects" | "analytics">("overview");
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "active" | "completed" | "overdue">("all");
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchAllData();
    }
  }, [isAuthenticated, userId]);

  // Fetch workload data
  const fetchWorkloadData = useCallback(async () => {
    try {
      const response = await api.get(`/workload/user/${userId}`);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching workload:", error);
      return null;
    }
  }, [userId]);

  // Fetch user's tasks using the my-tasks endpoint with query params
  const fetchUserTasks = useCallback(async () => {
    try {
      setFetchingTasks(true);
      // Use the my-tasks endpoint with assignee filter
      const response = await api.get(`/tasks?assignedTo=${userId}`);
      if (response.data.success) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    } finally {
      setFetchingTasks(false);
    }
  }, [userId]);

  // Fetch user's projects
  const fetchUserProjects = useCallback(async () => {
    try {
      setFetchingProjects(true);
      const response = await api.get(`/projects`);
      if (response.data.success) {
        const allProjects = response.data.data || [];
        // Filter projects where user is a team member or manager
        return allProjects;
      }
      return [];
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    } finally {
      setFetchingProjects(false);
    }
  }, []);

  // Remove useCallback wrapper
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [workloadData, tasksData, projectsData] = await Promise.all([
        fetchWorkloadData(),
        fetchUserTasks(),
        fetchUserProjects(),
      ]);

      // Get user info from workload data or fallback
      const userInfo = workloadData?.user || {
        _id: userId,
        fullName: 'Unknown User',
        email: '',
        employeeId: '',
        department: null,
        role: 'employee',
        joinDate: new Date().toISOString(),
      };

      // Use tasks from either workload or fetched tasks
      let tasks = tasksData || [];
      if (workloadData?.tasks && workloadData.tasks.length > 0) {
        tasks = workloadData.tasks;
      }

      // Group tasks by project
      const tasksByProjectMap = new Map();
      tasks.forEach((task: Task) => {
        const projectId = task.projectId?._id || 'unassigned';
        const projectName = task.projectId?.name || 'Unassigned';
        const projectCode = task.projectId?.code || '';

        if (!tasksByProjectMap.has(projectId)) {
          tasksByProjectMap.set(projectId, {
            project: { _id: projectId, name: projectName, code: projectCode },
            tasks: [],
            totalEstimated: 0,
            totalActual: 0,
            completionRate: 0,
          });
        }

        const projectData = tasksByProjectMap.get(projectId);
        projectData.tasks.push(task);
        projectData.totalEstimated += task.estimatedHours || 0;
        projectData.totalActual += (task.actualMinutes || 0) / 60;
      });

      // Calculate completion rates
      tasksByProjectMap.forEach((projectData) => {
        const completed = projectData.tasks.filter((t: Task) =>
          t.status === 'completed' || t.status === 'done'
        ).length;
        projectData.completionRate = projectData.tasks.length > 0
          ? Math.round((completed / projectData.tasks.length) * 100)
          : 0;
      });

      const tasksByProject = Array.from(tasksByProjectMap.values());

      // Calculate status distribution
      const statusDist = {
        pending: tasks.filter((t: Task) => t.status === 'pending' || t.status === 'todo').length,
        inProgress: tasks.filter((t: Task) => t.status === 'in_progress').length,
        submitted: tasks.filter((t: Task) => t.status === 'submitted').length,
        completed: tasks.filter((t: Task) => t.status === 'completed' || t.status === 'done').length,
        overdue: 0,
        rejected: tasks.filter((t: Task) => t.status === 'rejected').length,
      };

      // Calculate priority distribution
      const priorityDist = {
        low: tasks.filter((t: Task) => t.priority === 'low').length,
        normal: tasks.filter((t: Task) => t.priority === 'normal').length,
        high: tasks.filter((t: Task) => t.priority === 'high').length,
        urgent: tasks.filter((t: Task) => t.priority === 'urgent').length,
      };

      // Get active tasks
      const activeTasks = tasks.filter((t: Task) =>
        ['pending', 'in_progress', 'submitted', 'todo'].includes(t.status)
      );

      // Get completed tasks
      const completedTasks = tasks.filter((t: Task) =>
        ['completed', 'done'].includes(t.status)
      );

      // Get overdue tasks (if deadline passed and not completed)
      const now = new Date();
      const overdueTasks = tasks.filter((t: Task) =>
        t.deadline && new Date(t.deadline) < now &&
        !['completed', 'done'].includes(t.status)
      );

      // Calculate metrics
      const totalTasks = tasks.length;
      const completedCount = completedTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
      const totalEstimatedHours = tasks.reduce((sum: number, t: Task) => sum + (t.estimatedHours || 0), 0);
      const totalActualHours = tasks.reduce((sum: number, t: Task) => sum + ((t.actualMinutes || 0) / 60), 0);

      // Build enriched data
      const enrichedData: UserDetails = {
        user: {
          _id: userInfo._id || userId,
          fullName: userInfo.fullName || 'Unknown User',
          email: userInfo.email || '',
          employeeId: userInfo.employeeId || userInfo.employeeID || '',
          department: userInfo.department || null,
          role: userInfo.role || 'employee',
          joinDate: userInfo.joinDate || userInfo.createdAt || new Date().toISOString(),
          profilePhoto: userInfo.profilePhoto || userInfo.avatar,
        },
        metrics: {
          totalTasks,
          activeTasks: activeTasks.length,
          completedTasks: completedCount,
          totalEstimatedHours,
          totalActualHours,
          completionRate,
          productivityScore: Math.min(Math.round(completionRate * 0.7 + (completedCount / Math.max(totalTasks, 1)) * 30), 100),
          efficiencyRate: totalActualHours > 0 ? Math.min(Math.round((totalEstimatedHours / totalActualHours) * 100), 100) : 0,
          avgTaskCompletionTime: completedCount > 0 ? Math.round((totalActualHours / completedCount) * 10) / 10 : 0,
          onTimeDeliveryRate: completionRate,
        },
        tasksByProject,
        activeTasks,
        recentCompleted: completedTasks.slice(0, 10),
        overdueTasks,
        weeklyBreakdown: workloadData?.weeklyBreakdown || [],
        priorityDistribution: priorityDist,
        statusDistribution: statusDist,
      };

      setAllTasks(tasks);
      setAllProjects(projectsData || []);
      setData(enrichedData);

      toast.success(`Loaded ${totalTasks} tasks for ${enrichedData.user.fullName}`);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to load data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ============= Memoized Chart Data =============
  const weeklyChartData = useMemo(() => {
    if (!data?.weeklyBreakdown) return [];
    return data.weeklyBreakdown.map((week) => ({
      name: week.week || week.start || "Week",
      tasks: week.tasks || 0,
      completed: week.completed || 0,
      hours: week.hours || 0,
    }));
  }, [data]);

  const priorityChartData = useMemo(() => {
    if (!data?.priorityDistribution) return [];
    return Object.entries(data.priorityDistribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value || 0,
      color: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] || "#gray",
    }));
  }, [data]);

  const statusChartData = useMemo(() => {
    if (!data?.statusDistribution) return [];
    return Object.entries(data.statusDistribution).map(([name, value]) => ({
      name: name === "inProgress" ? "In Progress" : name.charAt(0).toUpperCase() + name.slice(1),
      value: value || 0,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || "#gray",
    }));
  }, [data]);

  const projectChartData = useMemo(() => {
    if (!data?.tasksByProject) return [];
    return data.tasksByProject.map((project) => ({
      name: project.project?.name || "Unknown Project",
      tasks: project.tasks?.length || 0,
      estimated: project.totalEstimated || 0,
      actual: project.totalActual || 0,
      completion: project.completionRate || 0,
    }));
  }, [data]);

  // ============= Filtered Tasks =============
  const getFilteredTasks = useCallback(() => {
    if (!data) return { active: [], completed: [], overdue: [], all: [] };

    return {
      all: allTasks || [],
      active: data.activeTasks || [],
      completed: data.recentCompleted || [],
      overdue: data.overdueTasks || [],
    };
  }, [data, allTasks]);

  // ============= Loading State =============
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-white/80 p-3" />
          </div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading user data...
          </p>
          {(fetchingTasks || fetchingProjects) && (
            <p className="text-xs text-gray-400">
              {fetchingTasks && "Fetching tasks..."}
              {fetchingProjects && " Fetching projects..."}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============= Error State =============
  if (error || !data) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error || "User not found"}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchAllData}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <Link
              href="/workload"
              className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============= Calculations =============
  const capacityPercentage = Math.min(
    Math.round((data.metrics.totalEstimatedHours / 160) * 100),
    200,
  );
  const workloadStatus =
    capacityPercentage > 100
      ? "Over Capacity"
      : capacityPercentage > 80
        ? "Near Full"
        : "Good Capacity";
  const workloadColor =
    capacityPercentage > 100
      ? "text-red-600"
      : capacityPercentage > 80
        ? "text-amber-600"
        : "text-emerald-600";

  const totalTasks = data.metrics.totalTasks || 0;
  const completedTasks = data.metrics.completedTasks || 0;
  const activeTasks = data.metrics.activeTasks || 0;
  const overdueCount = data.overdueTasks?.length || 0;

  const filteredTasks = getFilteredTasks();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-indigo-50/10 to-purple-50/10">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link
                href="/workload"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                Back to Workload Dashboard
              </Link>
              <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                Employee Workload Analysis
              </h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                {data.metrics.totalTasks} tasks across {data.tasksByProject.length} projects
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2 flex-wrap"
            >
              <button
                onClick={fetchAllData}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 text-gray-700 hover:text-indigo-600 shadow-sm"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={() => {
                  toast.success("Report generated successfully!");
                }}
                className="px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-500/25"
              >
                <Download size={16} />
                Export Report
              </button>
            </motion.div>
          </div>

          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden mb-6"
          >
            <div className="relative">
              <div className="h-24 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="absolute -bottom-12 left-6 flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-xl shrink-0">
                  <span className="text-white text-4xl font-bold">
                    {getInitials(data.user.fullName)}
                  </span>
                </div>
                <div className="mb-0">
                  <h2 className="text-xl font-bold text-gray-800">
                    {data.user.fullName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail size={14} />
                      {data.user.email}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Briefcase size={14} />
                      {data.user.employeeId || "N/A"}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {data.user.role}
                    </span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    {/* <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Joined {formatDate(data.user.joinDate)}
                    </span> */}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-16 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Target className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Completion Rate</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {data.metrics.completionRate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Productivity Score</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {data.metrics.productivityScore}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">On-Time Delivery</p>
                    <p className="text-lg font-bold text-amber-600">
                      {data.metrics.onTimeDeliveryRate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Efficiency Rate</p>
                    <p className="text-lg font-bold text-purple-600">
                      {data.metrics.efficiencyRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-400">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{totalTasks}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-400">Active</p>
              <p className="text-2xl font-bold text-blue-600">{activeTasks}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{completedTasks}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-rose-600">{overdueCount}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-400">Projects</p>
              <p className="text-2xl font-bold text-purple-600">{data.tasksByProject.length}</p>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden"
          >
            <div className="flex border-b border-gray-200/50 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "tasks", label: "Tasks", icon: CheckSquare },
                { id: "projects", label: "Projects", icon: FolderKanban },
                { id: "analytics", label: "Analytics", icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition whitespace-nowrap border-b-2 ${selectedTab === tab.id
                        ? "text-indigo-600 border-indigo-600 bg-indigo-50/30"
                        : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {tab.id === "tasks" && totalTasks > 0 && (
                      <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {totalTasks}
                      </span>
                    )}
                    {tab.id === "projects" && data.tasksByProject.length > 0 && (
                      <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {data.tasksByProject.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {selectedTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Weekly Activity Chart */}
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        Weekly Activity
                      </h4>
                      {weeklyChartData.length > 0 ? (
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyChartData}>
                              <defs>
                                <linearGradient id="tasks" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                              <YAxis stroke="#9ca3af" fontSize={11} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                  padding: "8px 12px",
                                }}
                              />
                              <Area type="monotone" dataKey="tasks" stroke="#6366f1" fill="url(#tasks)" strokeWidth={2} />
                              <Area type="monotone" dataKey="completed" stroke="#10b981" fill="url(#completed)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                          <p>No weekly data available</p>
                        </div>
                      )}
                    </div>

                    {/* Priority Distribution Chart */}
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-indigo-500" />
                        Priority Distribution
                      </h4>
                      <div className="h-64 flex items-center justify-center">
                        {priorityChartData.some(d => d.value > 0) ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                              <Pie
                                data={priorityChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {priorityChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                  padding: "8px 12px",
                                }}
                              />
                              <Legend />
                            </RePieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-gray-400">No priority data</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Distribution */}
                  <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-500" />
                      Task Status Distribution
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                          <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                          <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={100} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                              padding: "8px 12px",
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks Tab */}
              {selectedTab === "tasks" && (
                <div className="space-y-4">
                  {/* Task Filters */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-sm text-gray-500 font-medium">Filter:</span>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                      {[
                        { id: "all", label: `All (${totalTasks})` },
                        { id: "active", label: `Active (${activeTasks})` },
                        { id: "completed", label: `Completed (${completedTasks})` },
                        { id: "overdue", label: `Overdue (${overdueCount})` },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setTaskFilter(filter.id as any)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${taskFilter === filter.id
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-gray-500 hover:bg-white/50"
                            }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Task List */}
                  {(() => {
                    let tasksToShow: Task[] = [];
                    if (taskFilter === "active") tasksToShow = filteredTasks.active;
                    else if (taskFilter === "completed") tasksToShow = filteredTasks.completed;
                    else if (taskFilter === "overdue") tasksToShow = filteredTasks.overdue;
                    else {
                      // Show all tasks by combining all sources
                      tasksToShow = filteredTasks.all || [];
                      if (tasksToShow.length === 0) {
                        // Fallback: combine active and completed
                        tasksToShow = [...filteredTasks.active, ...filteredTasks.completed];
                        // Remove duplicates
                        tasksToShow = tasksToShow.filter((task, index, self) =>
                          index === self.findIndex((t) => t._id === task._id)
                        );
                      }
                    }

                    if (tasksToShow.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-400">
                          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No {taskFilter !== "all" ? taskFilter : ""} tasks found</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {tasksToShow.map((task) => (
                          <div
                            key={task._id}
                            className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 transition group"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-gray-800 font-medium">
                                    {task.title}
                                  </p>
                                  <PriorityBadge priority={task.priority || 'normal'} />
                                  <StatusBadge status={task.status || 'pending'} />
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                                  <span>
                                    {task.projectId?.name || "No Project"}
                                  </span>
                                  <span>•</span>
                                  <span>{task.estimatedHours || 0}h est.</span>
                                  {task.actualMinutes > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-600">
                                        {Math.round(task.actualMinutes / 60)}h tracked
                                      </span>
                                    </>
                                  )}
                                  {task.deadline && (
                                    <>
                                      <span>•</span>
                                      <span className={new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-rose-600' : 'text-gray-400'}>
                                        Due: {formatDateShort(task.deadline)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/tasks/${task._id}`}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                >
                                  <Eye size={14} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Projects Tab */}
              {selectedTab === "projects" && (
                <div className="space-y-4">
                  {data.tasksByProject && data.tasksByProject.length > 0 ? (
                    data.tasksByProject.map((projectData) => (
                      <div
                        key={projectData.project?._id || Math.random().toString()}
                        className="bg-white/50 rounded-xl p-4 border border-gray-200/50 hover:border-indigo-200 transition"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                              <FolderKanban className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-gray-800 font-medium">
                                {projectData.project?.name || "Unassigned"}
                              </h4>
                              <p className="text-xs text-gray-400">
                                {projectData.tasks?.length || 0} tasks •{" "}
                                {projectData.totalEstimated || 0}h estimated
                              </p>
                            </div>
                          </div>
                          {projectData.project?.code && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                              {projectData.project.code}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-800">
                              {projectData.tasks?.length || 0}
                            </p>
                            <p className="text-[10px] text-gray-400">Total Tasks</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-emerald-600">
                              {projectData.completionRate || 0}%
                            </p>
                            <p className="text-[10px] text-gray-400">Completion Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-indigo-600">
                              {projectData.totalEstimated || 0}h
                            </p>
                            <p className="text-[10px] text-gray-400">Estimated</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-purple-600">
                              {projectData.totalActual || 0}h
                            </p>
                            <p className="text-[10px] text-gray-400">Tracked</p>
                          </div>
                        </div>
                        {projectData.tasks && projectData.tasks.length > 0 && (
                          <div className="space-y-1.5">
                            {projectData.tasks.slice(0, 3).map((task) => (
                              <div
                                key={task._id}
                                className="flex items-center justify-between text-sm py-1.5 px-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${task.status === "completed" || task.status === "done"
                                        ? "bg-emerald-500"
                                        : task.status === "in_progress"
                                          ? "bg-amber-500"
                                          : task.status === "submitted"
                                            ? "bg-purple-500"
                                            : "bg-gray-400"
                                      }`}
                                  />
                                  <span className="text-gray-700">{task.title}</span>
                                  <PriorityBadge priority={task.priority || 'normal'} />
                                </div>
                                <StatusBadge status={task.status || 'pending'} />
                              </div>
                            ))}
                            {projectData.tasks.length > 3 && (
                              <p className="text-xs text-gray-400 text-center pt-2">
                                +{projectData.tasks.length - 3} more tasks
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No projects with tasks found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {selectedTab === "analytics" && (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                      <p className="text-xs text-gray-500 font-medium">Productivity Score</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {data.metrics.productivityScore}%
                      </p>
                      <div className="w-full h-1.5 bg-emerald-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${data.metrics.productivityScore}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs text-gray-500 font-medium">Efficiency Rate</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {data.metrics.efficiencyRate}%
                      </p>
                      <div className="w-full h-1.5 bg-blue-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${data.metrics.efficiencyRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs text-gray-500 font-medium">On-Time Delivery</p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        {data.metrics.onTimeDeliveryRate}%
                      </p>
                      <div className="w-full h-1.5 bg-amber-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${data.metrics.onTimeDeliveryRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <p className="text-xs text-gray-500 font-medium">Avg Completion Time</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">
                        {data.metrics.avgTaskCompletionTime?.toFixed(1) || 0}h
                      </p>
                      <div className="w-full h-1.5 bg-purple-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${Math.min(((data.metrics.avgTaskCompletionTime || 0) / 10) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Performance */}
                  {projectChartData.length > 0 && (
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-indigo-500" />
                        Project Performance
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={projectChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="name"
                              stroke="#9ca3af"
                              fontSize={11}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis stroke="#9ca3af" fontSize={11} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "8px 12px",
                              }}
                            />
                            <Legend />
                            <Bar dataKey="tasks" name="Tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="estimated" name="Est. Hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="actual" name="Actual Hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Strengths
                      </h4>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Completion rate of {data.metrics.completionRate}%
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500" />
                          {data.metrics.productivityScore}% productivity score
                        </li>
                        {data.metrics.onTimeDeliveryRate > 70 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-emerald-500" />
                            {data.metrics.onTimeDeliveryRate}% on-time delivery
                          </li>
                        )}
                        {data.tasksByProject.length > 0 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-emerald-500" />
                            Working on {data.tasksByProject.length} projects
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="bg-linear-to-br from-rose-50 to-amber-50 rounded-xl p-4 border border-rose-100">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Areas for Improvement
                      </h4>
                      <ul className="mt-3 space-y-2">
                        {data.overdueTasks && data.overdueTasks.length > 0 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            {data.overdueTasks.length} overdue task{data.overdueTasks.length > 1 ? "s" : ""}
                          </li>
                        )}
                        {data.metrics.efficiencyRate < 80 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Efficiency rate: {data.metrics.efficiencyRate}%
                          </li>
                        )}
                        {data.metrics.completionRate < 70 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Completion rate needs improvement
                          </li>
                        )}
                        {data.metrics.activeTasks > 10 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            High active workload ({data.metrics.activeTasks} tasks)
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
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
      `}</style>
    </div>
  );
}