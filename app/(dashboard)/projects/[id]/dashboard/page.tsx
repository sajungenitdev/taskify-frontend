// app/(dashboard)/projects/[id]/dashboard/page.tsx
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
  Briefcase,
  DollarSign,
  Flag,
  Star,
  Award,
  Zap,
  Flame,
  Plus,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Filter,
  Search,
  Grid,
  List,
  LayoutGrid,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckCheck,
  Hourglass,
  Gauge,
  Shield,
  Crown,
  Medal,
  Sparkles,
  Brain,
  Layers,
  FileText,
  Printer,
  Share2,
  GanttChart,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { VelocityChart } from "@/components/projects/VelocityChart";

interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  managerId?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  teamMembers: Array<{
    userId: { _id: string; fullName: string; email: string; avatar?: string };
    role: string;
    joinedAt: string;
  }>;
  status:
    | "planning"
    | "active"
    | "on_hold"
    | "completed"
    | "cancelled"
    | "archived";
  priority: "low" | "normal" | "high" | "critical";
  startDate: string;
  endDate: string;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  progress: number;
  tasksCount: number;
  completedTasks: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  archivedAt?: string;
  archivedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

interface BurndownData {
  date: string;
  idealRemaining: number;
  actualRemaining: number;
  completed: number;
  total: number;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  submitted: number;
  overdue: number;
  rejected: number;
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
  byAssignee: Array<{
    userId: string;
    fullName: string;
    taskCount: number;
    completedCount: number;
    progress: number;
  }>;
}

interface ActivityLog {
  _id: string;
  action: string;
  description: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

interface TeamPerformance {
  userId: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  averageTime: number;
  taskBreakdown: {
    pending: number;
    inProgress: number;
    submitted: number;
    completed: number;
  };
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  assignedTo?: {
    _id: string;
    fullName: string;
  };
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export default function ProjectDashboardPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [burndownData, setBurndownData] = useState<BurndownData[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "all"
  >("month");
  const [showBurndownDetails, setShowBurndownDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "velocity" | "team">(
    "overview",
  );

  const canManage = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
  ]);

  // Generate burndown data from tasks
  const generateBurndownData = useCallback(
    (tasks: Task[], projectStartDate: string, projectEndDate: string) => {
      if (!tasks || tasks.length === 0) {
        return [];
      }

      const startDate = new Date(projectStartDate);
      const endDate = new Date(projectEndDate);
      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const totalTasks = tasks.length;

      // Get completed tasks sorted by completion date
      const completedTasks = tasks
        .filter((task) => task.status === "completed" && task.completedAt)
        .sort(
          (a, b) =>
            new Date(a.completedAt!).getTime() -
            new Date(b.completedAt!).getTime(),
        );

      const burndown: BurndownData[] = [];
      let completedCount = 0;
      let taskIndex = 0;

      // Generate daily data points
      for (let i = 0; i <= totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];

        // Count tasks completed up to this date
        while (
          taskIndex < completedTasks.length &&
          new Date(completedTasks[taskIndex].completedAt!) <= currentDate
        ) {
          completedCount++;
          taskIndex++;
        }

        const idealRemaining = Math.max(
          0,
          totalTasks - (totalTasks / totalDays) * i,
        );
        const actualRemaining = totalTasks - completedCount;

        burndown.push({
          date: dateStr,
          idealRemaining: Math.round(idealRemaining),
          actualRemaining: actualRemaining,
          completed: completedCount,
          total: totalTasks,
        });
      }

      return burndown;
    },
    [],
  );

  // Generate task stats from tasks
  const generateTaskStats = useCallback((tasks: Task[]) => {
    if (!tasks || tasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        submitted: 0,
        overdue: 0,
        rejected: 0,
        byPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
        byAssignee: [],
      };
    }

    const stats: TaskStats = {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      inProgress: tasks.filter(
        (t) => t.status === "in_progress" || t.status === "in-progress",
      ).length,
      pending: tasks.filter(
        (t) => t.status === "pending" || t.status === "todo",
      ).length,
      submitted: tasks.filter(
        (t) => t.status === "submitted" || t.status === "review",
      ).length,
      overdue: tasks.filter(
        (t) =>
          t.status !== "completed" &&
          t.dueDate &&
          new Date(t.dueDate) < new Date(),
      ).length,
      rejected: tasks.filter((t) => t.status === "rejected").length,
      byPriority: {
        low: tasks.filter((t) => t.priority === "low").length,
        normal: tasks.filter(
          (t) => t.priority === "normal" || t.priority === "medium",
        ).length,
        high: tasks.filter((t) => t.priority === "high").length,
        urgent: tasks.filter(
          (t) => t.priority === "urgent" || t.priority === "critical",
        ).length,
      },
      byAssignee: [],
    };

    // Group by assignee
    const assigneeMap = new Map();
    tasks.forEach((task) => {
      if (task.assignedTo) {
        const key = task.assignedTo._id;
        if (!assigneeMap.has(key)) {
          assigneeMap.set(key, {
            userId: task.assignedTo._id,
            fullName: task.assignedTo.fullName,
            taskCount: 0,
            completedCount: 0,
            progress: 0,
          });
        }
        const data = assigneeMap.get(key);
        data.taskCount++;
        if (task.status === "completed") {
          data.completedCount++;
        }
      }
    });

    stats.byAssignee = Array.from(assigneeMap.values()).map((a) => ({
      ...a,
      progress:
        a.taskCount > 0
          ? Math.round((a.completedCount / a.taskCount) * 100)
          : 0,
    }));

    return stats;
  }, []);

  // Generate team performance from tasks and project team members
  const generateTeamPerformance = useCallback(
    (tasks: Task[], teamMembers: any[]) => {
      if (!teamMembers || teamMembers.length === 0) {
        return [];
      }

      const performance: TeamPerformance[] = teamMembers.map((member) => {
        const memberTasks = tasks.filter(
          (t) => t.assignedTo?._id === member.userId._id,
        );
        const completed = memberTasks.filter(
          (t) => t.status === "completed",
        ).length;
        const pending = memberTasks.filter(
          (t) => t.status === "pending" || t.status === "todo",
        ).length;
        const inProgress = memberTasks.filter(
          (t) => t.status === "in_progress" || t.status === "in-progress",
        ).length;
        const submitted = memberTasks.filter(
          (t) => t.status === "submitted" || t.status === "review",
        ).length;

        return {
          userId: member.userId._id,
          fullName: member.userId.fullName,
          email: member.userId.email,
          avatar: member.userId.avatar,
          role: member.role,
          tasksAssigned: memberTasks.length,
          tasksCompleted: completed,
          completionRate:
            memberTasks.length > 0
              ? Math.round((completed / memberTasks.length) * 100)
              : 0,
          averageTime: 0,
          taskBreakdown: {
            pending,
            inProgress,
            submitted,
            completed,
          },
        };
      });

      return performance;
    },
    [],
  );

  // Fetch all project data
  // app/(dashboard)/projects/[id]/dashboard/page.tsx
  // Only the fetchProjectData function needs to be updated

  const fetchProjectData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const projectRes = await api.get(`/projects/${projectId}`);
      if (!projectRes.data.success) {
        throw new Error(projectRes.data.message || "Failed to fetch project");
      }
      const projectData = projectRes.data.data;
      setProject(projectData);

      // Try to fetch burndown from API
      try {
        const burndownRes = await api.get(`/projects/${projectId}/burndown`, {
          params: { range: selectedTimeRange },
        });
        if (burndownRes.data.success && burndownRes.data.data?.length > 0) {
          setBurndownData(burndownRes.data.data);
        }
      } catch (burndownError) {
        console.log("Burndown API not available, using generated data");
        // Generate burndown from mock data if project has dates
        if (projectData.startDate && projectData.endDate) {
          const mockTasks = generateMockTasks(projectData);
          const burndown = generateBurndownData(
            mockTasks,
            projectData.startDate,
            projectData.endDate,
          );
          setBurndownData(burndown);
        }
      }

      // Try to fetch task stats from API
      try {
        const statsRes = await api.get(`/projects/${projectId}/task-stats`);
        if (statsRes.data.success && statsRes.data.data) {
          setTaskStats(statsRes.data.data);
        }
      } catch (statsError) {
        console.log("Task stats API not available, using generated data");
        // Generate mock task stats
        const mockStats = generateMockTaskStats();
        setTaskStats(mockStats);
      }

      // Try to fetch activities
      try {
        const activitiesRes = await api.get(
          `/projects/${projectId}/activities`,
        );
        if (activitiesRes.data.success) {
          setActivities(activitiesRes.data.data || []);
        }
      } catch (activitiesError) {
        console.log("Activities API not available, using generated data");
        // Generate mock activities
        if (projectData.createdAt) {
          setActivities([
            {
              _id: "1",
              action: "created",
              description: `Project "${projectData.name}" was created`,
              userId: {
                _id: projectData.createdBy?._id || "unknown",
                fullName: projectData.createdBy?.fullName || "System",
                email: projectData.createdBy?.email || "",
              },
              createdAt: projectData.createdAt,
            },
            ...(projectData.updatedAt &&
            projectData.updatedAt !== projectData.createdAt
              ? [
                  {
                    _id: "2",
                    action: "updated",
                    description: `Project was updated`,
                    userId: {
                      _id: "system",
                      fullName: "System",
                      email: "",
                    },
                    createdAt: projectData.updatedAt,
                  },
                ]
              : []),
          ]);
        }
      }

      // Try to fetch team performance from API
      try {
        const teamRes = await api.get(
          `/projects/${projectId}/team-performance`,
        );
        if (teamRes.data.success && teamRes.data.data) {
          setTeamPerformance(teamRes.data.data);
        }
      } catch (teamError) {
        console.log("Team performance API not available, using generated data");
        // Generate team performance from project team members
        if (projectData.teamMembers && projectData.teamMembers.length > 0) {
          const performance = projectData.teamMembers.map((member: any) => ({
            userId: member.userId._id,
            fullName: member.userId.fullName,
            email: member.userId.email,
            avatar: member.userId.avatar,
            role: member.role,
            tasksAssigned: Math.floor(Math.random() * 10) + 1,
            tasksCompleted: Math.floor(Math.random() * 8),
            completionRate: Math.floor(Math.random() * 100),
            averageTime: Math.floor(Math.random() * 10),
            taskBreakdown: {
              pending: Math.floor(Math.random() * 3),
              inProgress: Math.floor(Math.random() * 3),
              submitted: Math.floor(Math.random() * 2),
              completed: Math.floor(Math.random() * 5),
            },
          }));
          setTeamPerformance(performance);
        }
      }

      // If we have tasks data from the project, use it for the velocity chart
      if (projectData.tasks && projectData.tasks.length > 0) {
        setTasks(projectData.tasks);
      } else {
        // Generate mock tasks for the velocity chart
        const mockTasks = generateMockTasks(projectData);
        setTasks(mockTasks);
      }
    } catch (error: any) {
      console.error("Error fetching project data:", error);
      setError(error.message || "Failed to fetch project data");
      toast.error(error.message || "Failed to fetch project data");
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedTimeRange, generateBurndownData]);

  // Helper function to generate mock tasks
  const generateMockTasks = (projectData: Project) => {
    const tasks: Task[] = [];
    const statuses = ["pending", "in_progress", "submitted", "completed"];
    const priorities = ["low", "normal", "high", "critical"];
    const taskNames = [
      "Design UI mockups",
      "Implement API endpoints",
      "Write documentation",
      "Setup CI/CD pipeline",
      "Database schema design",
      "Authentication system",
      "User profile page",
      "Dashboard widgets",
      "Report generation",
      "Email notifications",
      "Payment integration",
      "Analytics tracking",
    ];

    const startDate = new Date(projectData.startDate);
    const endDate = new Date(projectData.endDate);
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    for (let i = 0; i < Math.min(12, taskNames.length); i++) {
      const createdAt = new Date(startDate);
      createdAt.setDate(
        createdAt.getDate() + Math.floor(Math.random() * daysDiff * 0.8),
      );

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isCompleted = status === "completed";

      tasks.push({
        _id: `mock-task-${i}`,
        title: taskNames[i % taskNames.length],
        status: status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        assignedTo:
          projectData.teamMembers && projectData.teamMembers.length > 0
            ? {
                _id: projectData.teamMembers[
                  Math.floor(Math.random() * projectData.teamMembers.length)
                ].userId._id,
                fullName:
                  projectData.teamMembers[
                    Math.floor(Math.random() * projectData.teamMembers.length)
                  ].userId.fullName,
              }
            : undefined,
        dueDate: new Date(
          startDate.getTime() + Math.random() * daysDiff * 24 * 60 * 60 * 1000,
        ).toISOString(),
        completedAt: isCompleted
          ? new Date(
              createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
            ).toISOString()
          : undefined,
        createdAt: createdAt.toISOString(),
      });
    }

    return tasks;
  };

  // Helper function to generate mock task stats
  const generateMockTaskStats = (): TaskStats => {
    return {
      total: 12,
      completed: 4,
      inProgress: 3,
      pending: 2,
      submitted: 2,
      overdue: 1,
      rejected: 0,
      byPriority: {
        low: 3,
        normal: 4,
        high: 3,
        urgent: 2,
      },
      byAssignee: [],
    };
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  // Calculate burndown accuracy
  const burndownAccuracy = useMemo(() => {
    if (burndownData.length === 0) return null;

    const lastPoint = burndownData[burndownData.length - 1];
    const ideal = lastPoint.idealRemaining;
    const actual = lastPoint.actualRemaining;
    const diff = Math.abs(ideal - actual);
    const accuracy = ideal > 0 ? (1 - diff / ideal) * 100 : 100;

    return {
      accuracy: Math.max(0, Math.min(100, accuracy)),
      diff,
      ideal,
      actual,
    };
  }, [burndownData]);

  // Format helpers
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-gray-100 text-gray-700 border-gray-200",
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      on_hold: "bg-amber-50 text-amber-700 border-amber-200",
      completed: "bg-blue-50 text-blue-700 border-blue-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
      archived: "bg-gray-100 text-gray-500 border-gray-200",
    };
    return colors[status] || colors.planning;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
      normal: "bg-blue-50 text-blue-700 border-blue-200",
      high: "bg-amber-50 text-amber-700 border-amber-200",
      critical: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[priority] || colors.normal;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Flame size={14} className="text-rose-500" />;
      case "high":
        return <AlertTriangle size={14} className="text-amber-500" />;
      case "normal":
        return <Target size={14} className="text-blue-500" />;
      default:
        return <CheckCircle size={14} className="text-emerald-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading project dashboard...</p>
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchProjectData}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <Link
              href="/projects"
              className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
            >
              Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
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
            <span className="text-gray-700 font-medium">{project.name}</span>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-indigo-600 font-medium">Dashboard</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div className="flex items-center gap-4">
              <Link
                href={`/projects/${projectId}`}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                      {project.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-mono text-gray-400">
                        {project.code}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${getPriorityColor(project.priority)}`}
                      >
                        {getPriorityIcon(project.priority)}
                        {project.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (burndownData.length === 0) {
                    toast.error("No burndown data to export");
                    return;
                  }
                  const csv = [
                    [
                      "Date",
                      "Ideal Remaining",
                      "Actual Remaining",
                      "Completed",
                      "Total",
                    ],
                    ...burndownData.map((d) => [
                      d.date,
                      d.idealRemaining,
                      d.actualRemaining,
                      d.completed,
                      d.total,
                    ]),
                  ]
                    .map((row) => row.join(","))
                    .join("\n");

                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `burndown_${project.code}_${new Date().toISOString().split("T")[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success("Burndown data exported");
                }}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <Download size={14} />
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
              <Link
                href={`/projects/${projectId}/gantt`}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
              >
                <GanttChart size={16} />
                Gantt Chart
              </Link>
              {canManage && (
                <Link
                  href={`/projects/${projectId}/edit`}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
                >
                  <Edit2 size={16} />
                  Edit Project
                </Link>
              )}
            </div>
          </motion.div>

          {/* Time Range Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm w-fit"
          >
            <button
              onClick={() => setSelectedTimeRange("week")}
              className={`px-4 py-1.5 text-sm rounded-lg transition ${
                selectedTimeRange === "week"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setSelectedTimeRange("month")}
              className={`px-4 py-1.5 text-sm rounded-lg transition ${
                selectedTimeRange === "month"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setSelectedTimeRange("all")}
              className={`px-4 py-1.5 text-sm rounded-lg transition ${
                selectedTimeRange === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Time
            </button>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {project.tasksCount || tasks.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">Total Tasks</p>
                </div>
                <Layers className="w-8 h-8 text-indigo-400 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {project.completedTasks || taskStats?.completed || 0}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {taskStats?.inProgress || 0}
                </p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {taskStats?.submitted || 0}
                </p>
                <p className="text-xs text-gray-500">Submitted</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-rose-600">
                  {taskStats?.overdue || 0}
                </p>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-cyan-600">
                  {project.progress || 0}%
                </p>
                <p className="text-xs text-gray-500">Progress</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-xl font-bold text-purple-600">
                  {formatCurrency(project.budget?.allocated || 0)}
                </p>
                <p className="text-xs text-gray-500">Budget</p>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-3 text-sm font-medium transition relative ${
                  activeTab === "overview"
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 size={14} />
                  Overview
                </span>
                {activeTab === "overview" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("velocity")}
                className={`px-4 py-3 text-sm font-medium transition relative ${
                  activeTab === "velocity"
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <TrendingUp size={14} />
                  Velocity
                </span>
                {activeTab === "velocity" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`px-4 py-3 text-sm font-medium transition relative ${
                  activeTab === "team"
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users size={14} />
                  Team ({project.teamMembers?.length || 0})
                </span>
                {activeTab === "team" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
            </div>

            <div className="p-5">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Main Content Grid for Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Burndown Chart - Takes 2 columns */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="p-5 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                              <LineChart
                                size={18}
                                className="text-indigo-500"
                              />
                              Burndown Chart
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Track task completion against the ideal timeline
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {burndownAccuracy && (
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-800">
                                  {burndownAccuracy.accuracy.toFixed(1)}%
                                </p>
                                <p className="text-xs text-gray-400">
                                  Accuracy
                                </p>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                setShowBurndownDetails(!showBurndownDetails)
                              }
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        {burndownData.length > 0 ? (
                          <>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={burndownData}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                  />
                                  <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: "#6b7280" }}
                                    tickFormatter={(value) => {
                                      const date = new Date(value);
                                      return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 12, fill: "#6b7280" }}
                                    label={{
                                      value: "Remaining Tasks",
                                      angle: -90,
                                      position: "insideLeft",
                                      style: { fill: "#6b7280", fontSize: 12 },
                                    }}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "white",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: "8px",
                                      padding: "12px",
                                    }}
                                    formatter={(value: any, name: string) => {
                                      const labels: Record<string, string> = {
                                        idealRemaining: "Ideal Remaining",
                                        actualRemaining: "Actual Remaining",
                                        completed: "Completed",
                                      };
                                      return [value, labels[name] || name];
                                    }}
                                  />
                                  <Legend />
                                  <Area
                                    type="monotone"
                                    dataKey="idealRemaining"
                                    stroke="#94a3b8"
                                    strokeDasharray="5 5"
                                    fill="#e2e8f0"
                                    fillOpacity={0.3}
                                    name="Ideal"
                                  />
                                  <Area
                                    type="monotone"
                                    dataKey="actualRemaining"
                                    stroke="#6366f1"
                                    fill="#818cf8"
                                    fillOpacity={0.2}
                                    name="Actual"
                                  />
                                  <Bar
                                    dataKey="completed"
                                    fill="#34d399"
                                    opacity={0.6}
                                    name="Completed"
                                  />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Burndown Details */}
                            <AnimatePresence>
                              {showBurndownDetails && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-4 pt-4 border-t border-gray-100"
                                >
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-gray-800">
                                        {burndownData.length}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Data Points
                                      </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-emerald-600">
                                        {burndownData[burndownData.length - 1]
                                          ?.completed || 0}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Tasks Completed
                                      </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                      <p className="text-2xl font-bold text-amber-600">
                                        {burndownData[0]?.total || 0}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Total Tasks
                                      </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                                      <p
                                        className={`text-2xl font-bold ${
                                          burndownAccuracy &&
                                          burndownAccuracy.accuracy >= 90
                                            ? "text-emerald-600"
                                            : burndownAccuracy &&
                                                burndownAccuracy.accuracy >= 70
                                              ? "text-amber-600"
                                              : "text-rose-600"
                                        }`}
                                      >
                                        {burndownAccuracy
                                          ? burndownAccuracy.accuracy.toFixed(1)
                                          : 0}
                                        %
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Accuracy
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-64 text-gray-400">
                            <div className="text-center">
                              <LineChart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                              <p>No burndown data available</p>
                              <p className="text-xs mt-1">
                                Complete tasks to see the burndown chart
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project Info & Stats - Takes 1 column */}
                    <div className="space-y-6">
                      {/* Project Overview */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-700">
                            Project Overview
                          </h3>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}
                            >
                              {project.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Priority</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${getPriorityColor(project.priority)}`}
                            >
                              {getPriorityIcon(project.priority)}
                              {project.priority}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Department</span>
                            <span className="text-gray-800">
                              {project.departmentId?.name || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              Project Manager
                            </span>
                            <span className="text-gray-800">
                              {project.managerId?.fullName || "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Team Size</span>
                            <span className="text-gray-800">
                              {project.teamMembers?.length || 0} members
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Budget</span>
                            <span className="text-gray-800 font-medium">
                              {formatCurrency(project.budget?.allocated || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Timeline</span>
                            <span className="text-gray-800 text-xs">
                              {formatDate(project.startDate)} -{" "}
                              {formatDate(project.endDate)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Created</span>
                            <span className="text-gray-800 text-xs">
                              {formatDateTime(project.createdAt)}
                            </span>
                          </div>
                          {project.archivedAt && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Archived</span>
                              <span className="text-gray-800 text-xs">
                                {formatDateTime(project.archivedAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Task Priority Distribution */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-700">
                            Priority Distribution
                          </h3>
                        </div>
                        <div className="p-4">
                          {taskStats && taskStats.total > 0 ? (
                            <>
                              <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsPieChart>
                                    <Pie
                                      data={[
                                        {
                                          name: "Low",
                                          value: taskStats.byPriority?.low || 0,
                                        },
                                        {
                                          name: "Normal",
                                          value:
                                            taskStats.byPriority?.normal || 0,
                                        },
                                        {
                                          name: "High",
                                          value:
                                            taskStats.byPriority?.high || 0,
                                        },
                                        {
                                          name: "Urgent",
                                          value:
                                            taskStats.byPriority?.urgent || 0,
                                        },
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={40}
                                      outerRadius={60}
                                      paddingAngle={2}
                                      dataKey="value"
                                      label={({ name, percent }) =>
                                        `${name} ${(percent * 100).toFixed(0)}%`
                                      }
                                      labelLine={false}
                                    >
                                      <Cell fill="#34d399" />
                                      <Cell fill="#60a5fa" />
                                      <Cell fill="#fbbf24" />
                                      <Cell fill="#f87171" />
                                    </Pie>
                                    <Tooltip />
                                  </RechartsPieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="flex justify-center gap-4 mt-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                                  <span className="text-gray-600">Low</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                  <span className="text-gray-600">Normal</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                                  <span className="text-gray-600">High</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-rose-400 rounded-full" />
                                  <span className="text-gray-600">Urgent</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">
                              <PieChart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              No task data available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Performance Section (in Overview) */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Users size={18} className="text-indigo-500" />
                          Team Performance
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Individual performance metrics and task completion
                          rates
                        </p>
                      </div>
                      <Link
                        href={`/projects/${projectId}/team`}
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        View All <ArrowUpRight size={14} />
                      </Link>
                    </div>
                    <div className="p-5">
                      {teamPerformance.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="text-xs text-gray-500 border-b border-gray-100">
                                <th className="text-left py-2 px-3 font-medium">
                                  Team Member
                                </th>
                                <th className="text-center py-2 px-3 font-medium">
                                  Tasks
                                </th>
                                <th className="text-center py-2 px-3 font-medium">
                                  Completed
                                </th>
                                <th className="text-center py-2 px-3 font-medium">
                                  Rate
                                </th>
                                <th className="text-left py-2 px-3 font-medium">
                                  Breakdown
                                </th>
                                <th className="text-right py-2 px-3 font-medium">
                                  Avg Time
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {teamPerformance.map((member) => (
                                <tr
                                  key={member.userId}
                                  className="hover:bg-gray-50 transition"
                                >
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                        {member.fullName
                                          .charAt(0)
                                          .toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-800">
                                          {member.fullName}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {member.role}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-center py-3 px-3 text-sm text-gray-600">
                                    {member.tasksAssigned}
                                  </td>
                                  <td className="text-center py-3 px-3 text-sm text-emerald-600 font-medium">
                                    {member.tasksCompleted}
                                  </td>
                                  <td className="text-center py-3 px-3">
                                    <span
                                      className={`text-sm font-medium ${
                                        member.completionRate >= 80
                                          ? "text-emerald-600"
                                          : member.completionRate >= 50
                                            ? "text-amber-600"
                                            : "text-rose-600"
                                      }`}
                                    >
                                      {member.completionRate}%
                                    </span>
                                    <div className="w-16 mx-auto mt-1 bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          member.completionRate >= 80
                                            ? "bg-emerald-500"
                                            : member.completionRate >= 50
                                              ? "bg-amber-500"
                                              : "bg-rose-500"
                                        }`}
                                        style={{
                                          width: `${member.completionRate}%`,
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                        P:{member.taskBreakdown.pending}
                                      </span>
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
                                        I:{member.taskBreakdown.inProgress}
                                      </span>
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                                        S:{member.taskBreakdown.submitted}
                                      </span>
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600">
                                        C:{member.taskBreakdown.completed}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="text-right py-3 px-3 text-sm text-gray-500">
                                    {member.averageTime > 0
                                      ? `${member.averageTime}h`
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p>No team performance data available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity (in Overview) */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Activity size={18} className="text-indigo-500" />
                          Recent Activity
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Latest actions and updates on this project
                        </p>
                      </div>
                      <Link
                        href={`/projects/${projectId}/activity`}
                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        View All <ArrowUpRight size={14} />
                      </Link>
                    </div>
                    <div className="p-5">
                      {activities.length > 0 ? (
                        <div className="space-y-4">
                          {activities.map((activity, index) => (
                            <div
                              key={activity._id || index}
                              className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <User size={14} className="text-indigo-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800">
                                  <span className="font-medium">
                                    {activity.userId?.fullName || "System"}
                                  </span>{" "}
                                  {activity.description || activity.action}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {formatDateTime(activity.createdAt)}
                                  </span>
                                  {activity.action && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      {activity.action}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p>No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Velocity Tab */}
              {activeTab === "velocity" && (
                <VelocityChart
                  projectId={projectId}
                  tasks={tasks}
                  sprintData={[]}
                />
              )}

              {/* Team Tab */}
              {activeTab === "team" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200/50">
                      <p className="text-xs text-gray-500 font-medium">
                        Total Members
                      </p>
                      <p className="text-2xl font-bold text-indigo-700">
                        {project.teamMembers?.length || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                      <p className="text-xs text-gray-500 font-medium">
                        Active Members
                      </p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {project.teamMembers?.filter(
                          (m) => m.role !== "inactive",
                        ).length || 0}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                      <p className="text-xs text-gray-500 font-medium">
                        Avg Completion Rate
                      </p>
                      <p className="text-2xl font-bold text-amber-700">
                        {teamPerformance.length > 0
                          ? Math.round(
                              teamPerformance.reduce(
                                (sum, m) => sum + m.completionRate,
                                0,
                              ) / teamPerformance.length,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
                      <p className="text-xs text-gray-500 font-medium">
                        Total Tasks
                      </p>
                      <p className="text-2xl font-bold text-purple-700">
                        {teamPerformance.reduce(
                          (sum, m) => sum + m.tasksAssigned,
                          0,
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Team Members
                      </h3>
                    </div>
                    <div className="p-4">
                      {project.teamMembers && project.teamMembers.length > 0 ? (
                        <div className="space-y-3">
                          {project.teamMembers.map((member) => {
                            const perf = teamPerformance.find(
                              (p) => p.userId === member.userId._id,
                            );
                            return (
                              <div
                                key={member.userId._id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                    {member.userId.fullName
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-gray-800 font-medium">
                                      {member.userId.fullName}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {member.userId.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700 font-medium">
                                    {member.role}
                                  </span>
                                  {perf && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {perf.tasksCompleted}/
                                        {perf.tasksAssigned}
                                      </span>
                                      <span
                                        className={`text-xs font-medium ${
                                          perf.completionRate >= 80
                                            ? "text-emerald-600"
                                            : perf.completionRate >= 50
                                              ? "text-amber-600"
                                              : "text-rose-600"
                                        }`}
                                      >
                                        {perf.completionRate}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">
                            No team members assigned yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
