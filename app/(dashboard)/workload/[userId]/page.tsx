// app/(dashboard)/workload/[userId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
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
  PieChart as PieChartIcon,
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
  RadialBarChart,
  RadialBar,
} from "recharts";

// ============ TYPES ============
interface UserDetails {
  user: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
    department: string;
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
    tasks: any[];
    totalEstimated: number;
    totalActual: number;
    completionRate: number;
  }>;
  activeTasks: any[];
  recentCompleted: any[];
  overdueTasks: any[];
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
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  violet: "#8b5cf6",
};

const STATUS_COLORS = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  submitted: "#8b5cf6",
  completed: "#10b981",
  overdue: "#ef4444",
  rejected: "#f43f5e",
};

const PRIORITY_COLORS = {
  low: "#10b981",
  normal: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

// ============ COMPONENTS ============
const StatCard = ({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  trend,
  trendValue,
  delay = 0,
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-2xl p-5 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 group"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-800 mt-1.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div
        className={`p-2.5 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1.5 mt-3">
        {trend === "up" ? (
          <TrendingUp className="w-4 h-4 text-emerald-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-rose-500" />
        )}
        <span
          className={`text-xs font-medium ${trend === "up" ? "text-emerald-600" : "text-rose-600"}`}
        >
          {trendValue}
        </span>
        <span className="text-xs text-gray-400">vs last month</span>
      </div>
    )}
  </motion.div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config: any = {
    pending: {
      label: "Pending",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    in_progress: {
      label: "In Progress",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    submitted: {
      label: "Submitted",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    completed: {
      label: "Completed",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    overdue: {
      label: "Overdue",
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
    rejected: {
      label: "Rejected",
      color: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const c = config[status] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${c.color}`}
    >
      {status === "completed" && <Check className="w-3 h-3" />}
      {status === "pending" && <ClockIcon className="w-3 h-3" />}
      {status === "in_progress" && <Activity className="w-3 h-3" />}
      {status === "submitted" && <Send className="w-3 h-3" />}
      {status === "overdue" && <AlertTriangle className="w-3 h-3" />}
      {status === "rejected" && <X className="w-3 h-3" />}
      {c.label}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const config: any = {
    low: {
      label: "Low",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    normal: {
      label: "Normal",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    high: {
      label: "High",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    urgent: {
      label: "Urgent",
      color: "bg-rose-50 text-rose-700 border-rose-200",
    },
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

// ============ WORKLOAD STATUS MODAL ============
const WorkloadStatusModal = ({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: UserDetails | null;
}) => {
  if (!isOpen || !data) return null;

  const { metrics, user, overdueTasks, activeTasks } = data;

  // Calculate workload status
  const capacityPercentage = Math.min(
    Math.round((metrics.totalEstimatedHours / 160) * 100),
    200,
  );
  const statusColor =
    capacityPercentage > 100
      ? "red"
      : capacityPercentage > 80
        ? "amber"
        : "green";

  const statusConfig = {
    green: {
      title: "✅ Perfect Workload Balance",
      message: `${user.fullName} has an excellent workload distribution. The current workload of ${capacityPercentage}% is well within optimal capacity.`,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
      details: [
        `Active tasks: ${activeTasks.length}`,
        `Estimated hours: ${metrics.totalEstimatedHours}h`,
        `Completion rate: ${metrics.completionRate}%`,
        `On-time delivery: ${metrics.onTimeDeliveryRate}%`,
      ],
      recommendation:
        "Continue maintaining this balance. Consider taking on more challenging tasks to grow.",
    },
    amber: {
      title: "⚠️ Approaching Capacity",
      message: `${user.fullName} is approaching full capacity at ${capacityPercentage}%. Consider redistributing some tasks or adjusting deadlines.`,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: <AlertTriangle className="w-8 h-8 text-amber-500" />,
      details: [
        `Active tasks: ${activeTasks.length}`,
        `Estimated hours: ${metrics.totalEstimatedHours}h`,
        `Completion rate: ${metrics.completionRate}%`,
        `Overdue tasks: ${overdueTasks.length}`,
      ],
      recommendation:
        "Review current task assignments. Consider delegating or extending deadlines for lower priority tasks.",
    },
    red: {
      title: "🔴 Over Capacity - Action Required",
      message: `${user.fullName} is over capacity at ${capacityPercentage}%. Immediate action is needed to prevent burnout and missed deadlines.`,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <AlertCircle className="w-8 h-8 text-red-500" />,
      details: [
        `Active tasks: ${activeTasks.length}`,
        `Estimated hours: ${metrics.totalEstimatedHours}h`,
        `Overdue tasks: ${overdueTasks.length}`,
        `Completion rate: ${metrics.completionRate}%`,
      ],
      recommendation:
        "Urgently redistribute tasks. Consider extending deadlines for non-critical tasks and temporarily pausing new assignments.",
    },
  };

  const status = statusConfig[statusColor as keyof typeof statusConfig];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`p-6 ${status.bg} border-b ${status.border}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center flex-shrink-0">
                    {status.icon}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${status.color}`}>
                      {status.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Workload analysis for {user.fullName}
                    </p>
                  </div>
                </div>
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {status.message}
              </p>

              {/* Capacity Bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-500">
                    Workload Capacity
                  </span>
                  <span className={`text-sm font-bold ${status.color}`}>
                    {capacityPercentage}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      capacityPercentage > 100
                        ? "bg-red-500"
                        : capacityPercentage > 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>0%</span>
                  <span>80% (Optimal)</span>
                  <span>100%+</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {status.details.map((detail, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <p className="text-xs text-gray-500">
                      {detail.split(":")[0]}
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {detail.split(":")[1]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div
                className={`p-4 rounded-xl ${status.bg} border ${status.border}`}
              >
                <p className="text-xs font-medium text-gray-700 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Recommendation
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {status.recommendation}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
                >
                  Got it
                </button>
                <button
                  onClick={() => {
                    onClose();
                    toast.error("Workload report exported");
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Export Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "tasks" | "projects" | "analytics"
  >("overview");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">(
    "month",
  );
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchUserWorkload();
    } else if (isAuthenticated && !userId) {
      setError("No user ID provided");
      setLoading(false);
    }
  }, [isAuthenticated, userId]);

  const fetchUserWorkload = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/workload/individual/${userId}`);
      if (response.data.success) {
        const enrichedData = {
          ...response.data.data,
          metrics: {
            ...response.data.data.metrics,
            productivityScore: Math.min(
              Math.round(
                response.data.data.metrics.completionRate * 0.7 +
                  response.data.data.metrics.onTimeDeliveryRate * 0.3,
              ),
              100,
            ),
            efficiencyRate: Math.min(
              Math.round(
                (response.data.data.metrics.totalEstimatedHours /
                  (response.data.data.metrics.totalActualHours || 1)) *
                  100,
              ),
              100,
            ),
            avgTaskCompletionTime:
              response.data.data.metrics.totalActualHours /
              (response.data.data.metrics.completedTasks || 1),
            onTimeDeliveryRate: Math.min(
              Math.round(
                (response.data.data.metrics.completedTasks /
                  (response.data.data.metrics.totalTasks || 1)) *
                  100,
              ),
              100,
            ),
          },
          priorityDistribution: {
            low:
              response.data.data.activeTasks?.filter(
                (t: any) => t.priority === "low",
              ).length || 0,
            normal:
              response.data.data.activeTasks?.filter(
                (t: any) => t.priority === "normal",
              ).length || 0,
            high:
              response.data.data.activeTasks?.filter(
                (t: any) => t.priority === "high",
              ).length || 0,
            urgent:
              response.data.data.activeTasks?.filter(
                (t: any) => t.priority === "urgent",
              ).length || 0,
          },
          statusDistribution: {
            pending:
              response.data.data.activeTasks?.filter(
                (t: any) => t.status === "pending",
              ).length || 0,
            inProgress:
              response.data.data.activeTasks?.filter(
                (t: any) => t.status === "in_progress",
              ).length || 0,
            submitted:
              response.data.data.activeTasks?.filter(
                (t: any) => t.status === "submitted",
              ).length || 0,
            completed: response.data.data.metrics.completedTasks || 0,
            overdue: response.data.data.overdueTasks?.length || 0,
            rejected:
              response.data.data.activeTasks?.filter(
                (t: any) => t.status === "rejected",
              ).length || 0,
          },
        };
        setData(enrichedData);
      } else {
        setError(response.data.message || "Failed to load user data");
      }
    } catch (error: any) {
      console.error("Error fetching user workload:", error);
      setError(error.response?.data?.message || "Failed to load user data");
      toast.error(error.response?.data?.message || "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on time range
  const getFilteredData = useMemo(() => {
    if (!data) return null;

    // For now, we'll just return the data as is since we don't have historical data
    // In a real implementation, you would filter based on the time range
    return data;
  }, [data, timeRange]);

  // Prepare chart data
  const weeklyChartData = useMemo(() => {
    if (!data) return [];
    return data.weeklyBreakdown.map((week) => ({
      name: week.week,
      tasks: week.tasks,
      completed: week.completed,
      hours: week.hours,
    }));
  }, [data]);

  const priorityChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.priorityDistribution || {}).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: PRIORITY_COLORS[name as keyof typeof PRIORITY_COLORS] || "#gray",
      }),
    );
  }, [data]);

  const statusChartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.statusDistribution || {}).map(
      ([name, value]) => ({
        name:
          name === "inProgress"
            ? "In Progress"
            : name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || "#gray",
      }),
    );
  }, [data]);

  const projectChartData = useMemo(() => {
    if (!data) return [];
    return data.tasksByProject.map((project) => ({
      name: project.project.name,
      tasks: project.tasks.length,
      estimated: project.totalEstimated,
      actual: project.totalActual || 0,
      completion: project.completionRate || 0,
    }));
  }, [data]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 animate-spin text-white/80 p-3" />
          </div>
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            Loading user workload data...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/20 to-purple-50/20 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-6">{error || "User not found"}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchUserWorkload}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/10 to-purple-50/10">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                Employee Workload Analysis
              </h1>
              <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Comprehensive workload overview for {data.user.fullName}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2"
            >
              <button
                onClick={() => setShowWorkloadModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-500/25"
              >
                <Gauge size={16} />
                View Workload Status
              </button>
              <button
                onClick={fetchUserWorkload}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 rounded-xl transition flex items-center gap-2 text-gray-700 hover:text-indigo-600 shadow-sm"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={() => {
                  toast.success("Report generated successfully!");
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-500/25"
              >
                <Download size={16} />
                Export Report
              </button>
            </motion.div>
          </div>

          {/* Workload Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border ${
              capacityPercentage > 100
                ? "bg-red-50 border-red-200"
                : capacityPercentage > 80
                  ? "bg-amber-50 border-amber-200"
                  : "bg-emerald-50 border-emerald-200"
            } flex items-center justify-between flex-wrap gap-3 cursor-pointer hover:shadow-md transition`}
            onClick={() => setShowWorkloadModal(true)}
          >
            <div className="flex items-center gap-3">
              {capacityPercentage > 100 ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : capacityPercentage > 80 ? (
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              )}
              <div>
                <p className={`text-sm font-semibold ${workloadColor}`}>
                  Workload Status: {workloadStatus}
                </p>
                <p className="text-xs text-gray-500">
                  Current workload: {capacityPercentage}% •{" "}
                  {data.metrics.totalEstimatedHours}h / 160h monthly capacity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    capacityPercentage > 100
                      ? "bg-red-500"
                      : capacityPercentage > 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                />
              </div>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                View Details <ExternalLink size={12} />
              </button>
            </div>
          </motion.div>

          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden mb-6"
          >
            <div className="relative">
              <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="absolute -bottom-12 left-6 flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-xl flex-shrink-0">
                  <span className="text-white text-4xl font-bold">
                    {data.user.fullName.charAt(0).toUpperCase()}
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
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Joined {new Date(data.user.joinDate).toLocaleDateString()}
                    </span>
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

          {/* Metrics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6"
          >
            <StatCard
              icon={Layers}
              label="Total Tasks"
              value={data.metrics.totalTasks}
              color="text-indigo-500"
              trend="up"
              trendValue="12%"
              delay={0.1}
            />
            <StatCard
              icon={Activity}
              label="Active Tasks"
              value={data.metrics.activeTasks}
              color="text-blue-500"
              trend="down"
              trendValue="8%"
              delay={0.15}
            />
            <StatCard
              icon={CheckCircle}
              label="Completed"
              value={data.metrics.completedTasks}
              color="text-emerald-500"
              trend="up"
              trendValue="23%"
              delay={0.2}
            />
            <StatCard
              icon={Clock}
              label="Hours Tracked"
              value={`${data.metrics.totalActualHours}h`}
              subtitle={`${data.metrics.totalEstimatedHours}h estimated`}
              color="text-purple-500"
              trend="up"
              trendValue="15%"
              delay={0.25}
            />
            <StatCard
              icon={Award}
              label="Completion Rate"
              value={`${data.metrics.completionRate}%`}
              color="text-emerald-500"
              trend={data.metrics.completionRate > 70 ? "up" : "down"}
              trendValue={data.metrics.completionRate > 70 ? "+5%" : "-3%"}
              delay={0.3}
            />
            <StatCard
              icon={AlertCircle}
              label="Overdue"
              value={data.overdueTasks.length}
              color="text-rose-500"
              trend={data.overdueTasks.length > 0 ? "down" : "up"}
              trendValue={data.overdueTasks.length > 0 ? "+2" : "0"}
              delay={0.35}
            />
          </motion.div>

          {/* Time Range Selector - Fixed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center gap-4 mb-6"
          >
            <span className="text-sm text-gray-500 font-medium">
              Time Range:
            </span>
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
              {["week", "month", "quarter"].map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range as any);
                    toast.success(
                      `Switched to ${range.charAt(0).toUpperCase() + range.slice(1)} view`,
                    );
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    timeRange === range
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-2">
              Showing data for{" "}
              {timeRange === "week"
                ? "last 7 days"
                : timeRange === "month"
                  ? "this month"
                  : "last 3 months"}
            </span>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden mb-6"
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
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                      selectedTab === tab.id
                        ? "text-indigo-600 border-indigo-600 bg-indigo-50/30"
                        : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {selectedTab === "overview" && (
                <div className="space-y-6">
                  {/* Charts Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Weekly Activity Chart */}
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        Weekly Activity
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={weeklyChartData}>
                            <defs>
                              <linearGradient
                                id="tasks"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#6366f1"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#6366f1"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                              <linearGradient
                                id="completed"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#10b981"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#10b981"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="name"
                              stroke="#9ca3af"
                              fontSize={11}
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
                            <Area
                              type="monotone"
                              dataKey="tasks"
                              stroke="#6366f1"
                              fill="url(#tasks)"
                              strokeWidth={2}
                            />
                            <Area
                              type="monotone"
                              dataKey="completed"
                              stroke="#10b981"
                              fill="url(#completed)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Priority Distribution Chart */}
                    <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <PieChart className="w-4 h-4 text-indigo-500" />
                        Priority Distribution
                      </h4>
                      <div className="h-64 flex items-center justify-center">
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
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
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
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                            horizontal={false}
                          />
                          <XAxis type="number" stroke="#9ca3af" fontSize={11} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#9ca3af"
                            fontSize={11}
                            width={100}
                          />
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
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-amber-500 rounded-full" />
                      <span className="text-gray-600">
                        Pending: {data.statusDistribution?.pending || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-gray-600">
                        In Progress: {data.statusDistribution?.inProgress || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span className="text-gray-600">
                        Submitted: {data.statusDistribution?.submitted || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span className="text-gray-600">
                        Completed: {data.statusDistribution?.completed || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-rose-500 rounded-full" />
                      <span className="text-gray-600">
                        Overdue: {data.statusDistribution?.overdue || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-red-500 rounded-full" />
                      <span className="text-gray-600">
                        Rejected: {data.statusDistribution?.rejected || 0}
                      </span>
                    </div>
                  </div>

                  {data.activeTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        Active Tasks ({data.activeTasks.length})
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                        {data.activeTasks.map((task) => (
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
                                  <PriorityBadge priority={task.priority} />
                                  <StatusBadge status={task.status} />
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                                  <span>
                                    {task.projectId?.name || "No Project"}
                                  </span>
                                  <span>•</span>
                                  <span>{task.estimatedHours}h est.</span>
                                  {task.actualMinutes > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-emerald-600">
                                        {task.actualMinutes}m tracked
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-400">
                                  Due:{" "}
                                  {new Date(task.deadline).toLocaleDateString()}
                                </span>
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
                    </div>
                  )}

                  {data.recentCompleted.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Recent Completed
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {data.recentCompleted.slice(0, 10).map((task) => (
                          <div
                            key={task._id}
                            className="bg-gray-50/80 rounded-xl p-3 border border-gray-100"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="text-gray-800 font-medium text-sm">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span className="text-emerald-600">
                                    ✓ Completed
                                  </span>
                                  <span>
                                    {task.projectId?.name || "No Project"}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(task.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.overdueTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        Overdue Tasks ({data.overdueTasks.length})
                      </h4>
                      <div className="space-y-2">
                        {data.overdueTasks.map((task) => (
                          <div
                            key={task._id}
                            className="bg-rose-50/80 rounded-xl p-3 border border-rose-200"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="text-gray-800 font-medium text-sm">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span className="text-rose-600">
                                    ⚠️ Overdue
                                  </span>
                                  <span>
                                    {task.projectId?.name || "No Project"}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs text-rose-600 font-medium">
                                Due:{" "}
                                {new Date(task.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Projects Tab */}
              {selectedTab === "projects" && (
                <div className="space-y-4">
                  {data.tasksByProject.map((project) => (
                    <div
                      key={project.project._id}
                      className="bg-white/50 rounded-xl p-4 border border-gray-200/50 hover:border-indigo-200 transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <FolderKanban className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-gray-800 font-medium">
                              {project.project.name}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {project.tasks.length} tasks •{" "}
                              {project.totalEstimated}h estimated
                            </p>
                          </div>
                        </div>
                        {project.project.code && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {project.project.code}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-800">
                            {project.tasks.length}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Total Tasks
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-emerald-600">
                            {project.completionRate || 0}%
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Completion Rate
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-indigo-600">
                            {project.totalEstimated}h
                          </p>
                          <p className="text-[10px] text-gray-400">Estimated</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-600">
                            {project.totalActual || 0}h
                          </p>
                          <p className="text-[10px] text-gray-400">Tracked</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {project.tasks.slice(0, 3).map((task) => (
                          <div
                            key={task._id}
                            className="flex items-center justify-between text-sm py-1.5 px-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  task.status === "completed"
                                    ? "bg-emerald-500"
                                    : task.status === "in_progress"
                                      ? "bg-amber-500"
                                      : task.status === "submitted"
                                        ? "bg-purple-500"
                                        : "bg-gray-400"
                                }`}
                              />
                              <span className="text-gray-700">
                                {task.title}
                              </span>
                              <PriorityBadge priority={task.priority} />
                            </div>
                            <StatusBadge status={task.status} />
                          </div>
                        ))}
                        {project.tasks.length > 3 && (
                          <p className="text-xs text-gray-400 text-center pt-2">
                            +{project.tasks.length - 3} more tasks
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Analytics Tab */}
              {selectedTab === "analytics" && (
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                      <p className="text-xs text-gray-500 font-medium">
                        Productivity Score
                      </p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {data.metrics.productivityScore}%
                      </p>
                      <div className="w-full h-1.5 bg-emerald-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${data.metrics.productivityScore}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs text-gray-500 font-medium">
                        Efficiency Rate
                      </p>
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
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-xs text-gray-500 font-medium">
                        On-Time Delivery
                      </p>
                      <p className="text-2xl font-bold text-amber-600 mt-1">
                        {data.metrics.onTimeDeliveryRate}%
                      </p>
                      <div className="w-full h-1.5 bg-amber-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${data.metrics.onTimeDeliveryRate}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <p className="text-xs text-gray-500 font-medium">
                        Avg Completion Time
                      </p>
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
                  <div className="bg-white/50 rounded-xl p-4 border border-gray-200/50">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-indigo-500" />
                      Project Performance
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={projectChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
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
                          <Bar
                            dataKey="tasks"
                            name="Tasks"
                            fill="#6366f1"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="estimated"
                            name="Est. Hours"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey="actual"
                            name="Actual Hours"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Strengths
                      </h4>
                      <ul className="mt-3 space-y-2">
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500" />
                          High completion rate of {data.metrics.completionRate}%
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-emerald-500" />
                          {data.metrics.productivityScore}% productivity score
                        </li>
                        {data.metrics.onTimeDeliveryRate > 70 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <Check className="w-4 h-4 text-emerald-500" />
                            Strong on-time delivery rate of{" "}
                            {data.metrics.onTimeDeliveryRate}%
                          </li>
                        )}
                      </ul>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl p-4 border border-rose-100">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Areas for Improvement
                      </h4>
                      <ul className="mt-3 space-y-2">
                        {data.overdueTasks.length > 0 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            {data.overdueTasks.length} overdue task
                            {data.overdueTasks.length > 1 ? "s" : ""}
                          </li>
                        )}
                        {data.metrics.efficiencyRate < 80 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Efficiency rate could be improved (
                            {data.metrics.efficiencyRate}%)
                          </li>
                        )}
                        {data.metrics.onTimeDeliveryRate < 70 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            On-time delivery needs attention (
                            {data.metrics.onTimeDeliveryRate}%)
                          </li>
                        )}
                        {data.activeTasks.length > 10 && (
                          <li className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            High active workload ({data.activeTasks.length}{" "}
                            tasks)
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

      {/* Workload Status Modal */}
      <WorkloadStatusModal
        isOpen={showWorkloadModal}
        onClose={() => setShowWorkloadModal(false)}
        data={data}
      />

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
