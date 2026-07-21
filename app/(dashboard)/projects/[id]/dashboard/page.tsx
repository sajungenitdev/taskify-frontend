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
  Table,
  UserCheck,
  Timer,
  CheckSquare,
  AlertOctagon,
  Trophy,
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
  estimatedHours?: number;
  actualHours?: number;
}

// New interface for Member Contribution
interface MemberContribution {
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
  trend: "up" | "down" | "stable";
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
  const [memberContributions, setMemberContributions] = useState<
    MemberContribution[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "week" | "month" | "all"
  >("month");
  const [showBurndownDetails, setShowBurndownDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "velocity" | "team" | "contributions"
  >("overview");

  // Contribution table sorting
  const [contributionSortBy, setContributionSortBy] = useState<
    "name" | "tasks" | "rate" | "hours" | "onTime"
  >("rate");
  const [contributionSortOrder, setContributionSortOrder] = useState<
    "asc" | "desc"
  >("desc");
  const [contributionSearch, setContributionSearch] = useState("");

  const canManage = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
  ]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

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

      for (let i = 0; i <= totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateStr = currentDate.toISOString().split("T")[0];

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

  // Generate member contributions
  const generateMemberContributions = useCallback(
    (tasks: Task[], teamMembers: any[]) => {
      if (!teamMembers || teamMembers.length === 0) {
        return [];
      }

      const contributions: MemberContribution[] = teamMembers.map((member) => {
        const memberId = member.userId._id;

        // Filter tasks assigned to this member
        const memberTasks = tasks.filter((t) => t.assignedTo?._id === memberId);

        if (memberTasks.length === 0) {
          return {
            userId: memberId,
            fullName: member.userId.fullName,
            email: member.userId.email,
            avatar: member.userId.avatar,
            role: member.role,
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
            taskBreakdown: {
              pending: 0,
              inProgress: 0,
              submitted: 0,
              completed: 0,
              overdue: 0,
            },
            priorityBreakdown: {
              low: 0,
              normal: 0,
              high: 0,
              critical: 0,
            },
            trend: "stable" as const,
          };
        }

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
        const overdue = memberTasks.filter(
          (t) =>
            t.status !== "completed" &&
            t.dueDate &&
            new Date(t.dueDate) < new Date(),
        ).length;

        // Calculate on-time tasks
        const completedTasks = memberTasks.filter(
          (t) => t.status === "completed",
        );
        const onTime = completedTasks.filter((t) => {
          if (!t.dueDate || !t.completedAt) return false;
          return new Date(t.completedAt) <= new Date(t.dueDate);
        }).length;
        const lateTasks = completed - onTime;

        // Calculate hours
        const estimatedHours = memberTasks.reduce(
          (sum, t) => sum + (t.estimatedHours || 0),
          0,
        );
        const actualHours = memberTasks.reduce(
          (sum, t) => sum + (t.actualHours || 0),
          0,
        );
        const hoursAccuracy =
          estimatedHours > 0
            ? Math.round((actualHours / estimatedHours) * 100)
            : 0;

        // Calculate average completion time
        const completedWithTime = completedTasks.filter(
          (t) => t.completedAt && t.createdAt,
        );
        const avgTime =
          completedWithTime.length > 0
            ? Math.round(
                completedWithTime.reduce((sum, t) => {
                  const diff =
                    new Date(t.completedAt!).getTime() -
                    new Date(t.createdAt).getTime();
                  return sum + diff / (1000 * 60 * 60);
                }, 0) / completedWithTime.length,
              )
            : 0;

        // Calculate trend
        const sortedTasks = [...memberTasks].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        const recentTasks = sortedTasks.slice(-5);
        const oldTasks = sortedTasks.slice(0, 5);
        const recentCompleted =
          recentTasks.filter((t) => t.status === "completed").length /
          (recentTasks.length || 1);
        const oldCompleted =
          oldTasks.filter((t) => t.status === "completed").length /
          (oldTasks.length || 1);
        let trend: "up" | "down" | "stable" = "stable";
        if (recentCompleted > oldCompleted + 0.1) trend = "up";
        else if (recentCompleted < oldCompleted - 0.1) trend = "down";

        // Priority breakdown
        const priorityBreakdown = {
          low: memberTasks.filter((t) => t.priority === "low").length,
          normal: memberTasks.filter(
            (t) => t.priority === "normal" || t.priority === "medium",
          ).length,
          high: memberTasks.filter((t) => t.priority === "high").length,
          critical: memberTasks.filter(
            (t) => t.priority === "critical" || t.priority === "urgent",
          ).length,
        };

        return {
          userId: memberId,
          fullName: member.userId.fullName,
          email: member.userId.email,
          avatar: member.userId.avatar,
          role: member.role,
          tasksCompleted: completed,
          totalTasks: memberTasks.length,
          completionRate:
            memberTasks.length > 0
              ? Math.round((completed / memberTasks.length) * 100)
              : 0,
          hoursLogged: actualHours,
          estimatedHours: estimatedHours,
          hoursAccuracy: hoursAccuracy,
          onTimeTasks: onTime,
          lateTasks: lateTasks,
          onTimeRate:
            completed > 0 ? Math.round((onTime / completed) * 100) : 0,
          avgTaskCompletionTime: avgTime,
          taskBreakdown: {
            pending,
            inProgress,
            submitted,
            completed,
            overdue,
          },
          priorityBreakdown,
          trend,
        };
      });

      return contributions;
    },
    [],
  );

  // Fetch all project data
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

      // Try to fetch tasks from the correct endpoint
      let tasksData: Task[] = [];
      try {
        // Tasks are at /tasks endpoint, not /projects/:id/tasks
        const tasksRes = await api.get("/tasks", {
          params: {
            projectId: projectId, // Filter tasks by projectId if your API supports it
          },
          validateStatus: (status) => status >= 200 && status < 500,
        });

        // Check if we got a valid response with data
        if (
          tasksRes.status === 200 &&
          tasksRes.data?.success &&
          tasksRes.data?.data
        ) {
          // If the API returns tasks with projectId, filter them
          const allTasks = tasksRes.data.data;
          if (Array.isArray(allTasks)) {
            tasksData = allTasks.filter(
              (task: any) =>
                task.projectId === projectId || task.project === projectId,
            );
            console.log(
              `✅ Found ${tasksData.length} tasks for project from API`,
            );
          } else {
            tasksData = [];
          }
        } else {
          console.log("📝 Tasks API returned no data, using mock data");
        }
      } catch (tasksError) {
        console.log("📝 Could not fetch tasks, using mock data:", tasksError);
      }

      // If no tasks from API, generate mock tasks
      if (tasksData.length === 0 && projectData) {
        tasksData = generateMockTasks(projectData);
        console.log(`📝 Generated ${tasksData.length} mock tasks`);
      }
      setTasks(tasksData);

      // Generate all data from tasks
      if (projectData.startDate && projectData.endDate) {
        const burndown = generateBurndownData(
          tasksData,
          projectData.startDate,
          projectData.endDate,
        );
        setBurndownData(burndown);
      }

      const stats = generateTaskStats(tasksData);
      setTaskStats(stats);

      if (projectData.teamMembers && projectData.teamMembers.length > 0) {
        const performance = generateTeamPerformance(
          tasksData,
          projectData.teamMembers,
        );
        setTeamPerformance(performance);

        const contributions = generateMemberContributions(
          tasksData,
          projectData.teamMembers,
        );
        setMemberContributions(contributions);
      }

      // Generate mock activities
      if (projectData.createdAt) {
        const activitiesData = [
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
        ];

        // Add task-related activities
        if (tasksData.length > 0) {
          const recentTasks = tasksData.slice(0, 5);
          recentTasks.forEach((task, index) => {
            activitiesData.push({
              _id: `task-${index}`,
              action: task.status === "completed" ? "completed" : "created",
              description: `Task "${task.title}" was ${
                task.status === "completed" ? "completed" : "created"
              }`,
              userId: {
                _id: task.assignedTo?._id || "system",
                fullName: task.assignedTo?.fullName || "System",
                email: "",
              },
              createdAt: task.completedAt || task.createdAt,
            });
          });
        }

        // Sort by date (newest first)
        activitiesData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setActivities(activitiesData.slice(0, 10));
      }
    } catch (error: any) {
      console.error("Error fetching project data:", error);
      setError(error.message || "Failed to fetch project data");
      toast.error(error.message || "Failed to fetch project data");
    } finally {
      setLoading(false);
    }
  }, [
    projectId,
    generateBurndownData,
    generateTaskStats,
    generateTeamPerformance,
    generateMemberContributions,
  ]);
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
      "Testing framework",
      "Deployment automation",
      "Security audit",
    ];

    const startDate = new Date(projectData.startDate);
    const endDate = new Date(projectData.endDate);
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const teamMembers = projectData.teamMembers || [];
    const memberCount = teamMembers.length || 1;

    // Generate 15-20 tasks
    const numTasks = Math.floor(Math.random() * 6) + 15;

    for (let i = 0; i < numTasks; i++) {
      const createdAt = new Date(startDate);
      createdAt.setDate(
        createdAt.getDate() + Math.floor(Math.random() * daysDiff * 0.9),
      );

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isCompleted = status === "completed";

      // Assign to a random team member
      const memberIndex = i % memberCount;
      const member = teamMembers[memberIndex];

      // Calculate due date (somewhere between start and end)
      const dueDate = new Date(startDate);
      dueDate.setDate(
        dueDate.getDate() +
          Math.floor(Math.random() * daysDiff * 0.8) +
          Math.floor(daysDiff * 0.1),
      );

      // Completion date (if completed)
      let completedAt: string | undefined;
      if (isCompleted) {
        completedAt = new Date(
          createdAt.getTime() +
            Math.random() * (dueDate.getTime() - createdAt.getTime()) * 0.9,
        ).toISOString();
      }

      tasks.push({
        _id: `mock-task-${i}`,
        title:
          taskNames[i % taskNames.length] +
          (i >= taskNames.length
            ? ` ${Math.floor(i / taskNames.length) + 1}`
            : ""),
        status: status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        assignedTo: member
          ? {
              _id: member.userId._id,
              fullName: member.userId.fullName,
            }
          : undefined,
        dueDate: dueDate.toISOString(),
        completedAt: completedAt,
        createdAt: createdAt.toISOString(),
        estimatedHours: Math.floor(Math.random() * 8) + 2,
        actualHours: Math.floor(Math.random() * 10) + 1,
      });
    }

    return tasks;
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, fetchProjectData]);

  // Filter tasks based on selected time range
  const getFilteredTasks = useCallback(() => {
    if (!tasks || tasks.length === 0) return tasks;

    const now = new Date();
    let cutoffDate = new Date();

    switch (selectedTimeRange) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "all":
      default:
        return tasks;
    }

    return tasks.filter((task) => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= cutoffDate;
    });
  }, [tasks, selectedTimeRange]);

  // Update stats when time range changes
  useEffect(() => {
    if (tasks.length > 0) {
      const filteredTasks = getFilteredTasks();
      const stats = generateTaskStats(filteredTasks);
      setTaskStats(stats);

      // Update burndown data based on filtered tasks
      if (project?.startDate && project?.endDate) {
        const burndown = generateBurndownData(
          filteredTasks,
          project.startDate,
          project.endDate,
        );
        setBurndownData(burndown);
      }

      // Update team performance and contributions
      if (project?.teamMembers) {
        const performance = generateTeamPerformance(
          filteredTasks,
          project.teamMembers,
        );
        setTeamPerformance(performance);

        const contributions = generateMemberContributions(
          filteredTasks,
          project.teamMembers,
        );
        setMemberContributions(contributions);
      }
    }
  }, [
    selectedTimeRange,
    tasks,
    project,
    generateTaskStats,
    generateBurndownData,
    generateTeamPerformance,
    generateMemberContributions,
    getFilteredTasks,
  ]);

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

  // Filter and sort contributions
  const filteredContributions = useMemo(() => {
    let filtered = memberContributions;

    if (contributionSearch) {
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(contributionSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(contributionSearch.toLowerCase()),
      );
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (contributionSortBy) {
        case "name":
          aVal = a.fullName;
          bVal = b.fullName;
          break;
        case "tasks":
          aVal = a.tasksCompleted;
          bVal = b.tasksCompleted;
          break;
        case "rate":
          aVal = a.completionRate;
          bVal = b.completionRate;
          break;
        case "hours":
          aVal = a.hoursLogged;
          bVal = b.hoursLogged;
          break;
        case "onTime":
          aVal = a.onTimeRate;
          bVal = b.onTimeRate;
          break;
        default:
          aVal = a.completionRate;
          bVal = b.completionRate;
      }
      if (typeof aVal === "string") {
        return contributionSortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return contributionSortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [
    memberContributions,
    contributionSearch,
    contributionSortBy,
    contributionSortOrder,
  ]);

  // Export contributions as CSV
  const exportContributions = () => {
    if (filteredContributions.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const headers = [
        "Member",
        "Role",
        "Tasks Completed",
        "Total Tasks",
        "Completion Rate",
        "Hours Logged",
        "Est. Hours",
        "Hours Accuracy",
        "On-Time Tasks",
        "Late Tasks",
        "On-Time Rate",
        "Avg Completion Time",
      ];

      const rows = filteredContributions.map((c) => [
        c.fullName,
        c.role,
        c.tasksCompleted,
        c.totalTasks,
        `${c.completionRate}%`,
        c.hoursLogged,
        c.estimatedHours,
        `${c.hoursAccuracy}%`,
        c.onTimeTasks,
        c.lateTasks,
        `${c.onTimeRate}%`,
        `${c.avgTaskCompletionTime}h`,
      ]);

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n",
      );
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contributions_${project?.code}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Contributions exported successfully");
    } catch (error) {
      toast.error("Failed to export contributions");
      console.error("Export error:", error);
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={14} className="text-emerald-500" />;
      case "down":
        return <TrendingDown size={14} className="text-rose-500" />;
      default:
        return <Minus size={14} className="text-amber-500" />;
    }
  };

  const Minus = ({ size, className }: { size: number; className?: string }) => (
    <span className={className}>—</span>
  );

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
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <FolderKanban className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                    {project.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">
                      {project.code}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(project.status)}`}
                    >
                      {project.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400">
                      Progress: {project.progress || 0}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={fetchProjectData}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Refresh
                </button>
                <Link
                  href={`/projects/active`}
                  className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
                >
                  <ArrowLeft size={14} />
                  Back Project 
                </Link>
              </div>
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
                    {taskStats?.total || 0}
                  </p>
                  <p className="text-xs text-gray-500">Total Tasks</p>
                </div>
                <Layers className="w-8 h-8 text-indigo-400 opacity-50" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {taskStats?.completed || 0}
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

          {/* Tab Navigation - Updated with Contributions tab */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-3 text-sm font-medium transition relative whitespace-nowrap ${
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
                className={`px-4 py-3 text-sm font-medium transition relative whitespace-nowrap ${
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
                onClick={() => setActiveTab("contributions")}
                className={`px-4 py-3 text-sm font-medium transition relative whitespace-nowrap ${
                  activeTab === "contributions"
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Table size={14} />
                  Contributions
                </span>
                {activeTab === "contributions" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("team")}
                className={`px-4 py-3 text-sm font-medium transition relative whitespace-nowrap ${
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

              {/* Contributions Tab */}
              {activeTab === "contributions" && (
                <div className="space-y-4">
                  {/* Contribution Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-4 border border-indigo-200/50">
                      <p className="text-xs text-gray-500 font-medium">
                        Total Contributors
                      </p>
                      <p className="text-2xl font-bold text-indigo-700">
                        {memberContributions.length}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                      <p className="text-xs text-gray-500 font-medium">
                        Total Tasks Completed
                      </p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {memberContributions.reduce(
                          (sum, c) => sum + c.tasksCompleted,
                          0,
                        )}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                      <p className="text-xs text-gray-500 font-medium">
                        Avg Completion Rate
                      </p>
                      <p className="text-2xl font-bold text-amber-700">
                        {memberContributions.length > 0
                          ? Math.round(
                              memberContributions.reduce(
                                (sum, c) => sum + c.completionRate,
                                0,
                              ) / memberContributions.length,
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
                      <p className="text-xs text-gray-500 font-medium">
                        Total Hours Logged
                      </p>
                      <p className="text-2xl font-bold text-purple-700">
                        {memberContributions.reduce(
                          (sum, c) => sum + c.hoursLogged,
                          0,
                        )}
                        h
                      </p>
                    </div>
                  </div>

                  {/* Contribution Table Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search contributors..."
                          value={contributionSearch}
                          onChange={(e) =>
                            setContributionSearch(e.target.value)
                          }
                          className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition w-48 md:w-64"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setContributionSortBy("name")}
                          className={`px-2 py-1 text-xs rounded-md transition ${
                            contributionSortBy === "name"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          Name
                        </button>
                        <button
                          onClick={() => setContributionSortBy("tasks")}
                          className={`px-2 py-1 text-xs rounded-md transition ${
                            contributionSortBy === "tasks"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          Tasks
                        </button>
                        <button
                          onClick={() => setContributionSortBy("rate")}
                          className={`px-2 py-1 text-xs rounded-md transition ${
                            contributionSortBy === "rate"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          Rate
                        </button>
                        <button
                          onClick={() => setContributionSortBy("hours")}
                          className={`px-2 py-1 text-xs rounded-md transition ${
                            contributionSortBy === "hours"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          Hours
                        </button>
                        <button
                          onClick={() => setContributionSortBy("onTime")}
                          className={`px-2 py-1 text-xs rounded-md transition ${
                            contributionSortBy === "onTime"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          On-Time
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          setContributionSortOrder(
                            contributionSortOrder === "asc" ? "desc" : "asc",
                          )
                        }
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition"
                      >
                        {contributionSortOrder === "asc" ? "↑" : "↓"}
                      </button>
                    </div>
                    <button
                      onClick={exportContributions}
                      className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
                    >
                      <Download size={14} />
                      Export
                    </button>
                  </div>

                  {/* Contribution Table */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Member
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tasks
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rate
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hours
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              On-Time
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trend
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredContributions.length > 0 ? (
                            filteredContributions.map((contrib) => (
                              <tr
                                key={contrib.userId}
                                className="hover:bg-gray-50 transition"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                      {contrib.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">
                                        {contrib.fullName}
                                      </p>
                                      <p className="text-xs text-gray-400">
                                        {contrib.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                                    {contrib.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-sm font-medium text-gray-800">
                                      {contrib.tasksCompleted}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      / {contrib.totalTasks}
                                    </span>
                                  </div>
                                  <div className="w-full max-w-16 mx-auto mt-1 bg-gray-200 rounded-full h-1">
                                    <div
                                      className="h-1 rounded-full bg-indigo-500"
                                      style={{
                                        width: `${contrib.totalTasks > 0 ? (contrib.tasksCompleted / contrib.totalTasks) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`text-sm font-medium ${
                                      contrib.completionRate >= 80
                                        ? "text-emerald-600"
                                        : contrib.completionRate >= 50
                                          ? "text-amber-600"
                                          : "text-rose-600"
                                    }`}
                                  >
                                    {contrib.completionRate}%
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">
                                      {contrib.hoursLogged}h
                                    </span>
                                    <span className="text-xs text-gray-400 ml-1">
                                      / {contrib.estimatedHours}h
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {contrib.hoursAccuracy}% accuracy
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div>
                                    <span
                                      className={`text-sm font-medium ${
                                        contrib.onTimeRate >= 80
                                          ? "text-emerald-600"
                                          : contrib.onTimeRate >= 50
                                            ? "text-amber-600"
                                            : "text-rose-600"
                                      }`}
                                    >
                                      {contrib.onTimeRate}%
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {contrib.onTimeTasks} on-time /{" "}
                                    {contrib.lateTasks} late
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {getTrendIcon(contrib.trend)}
                                    <span
                                      className={`text-xs font-medium ${
                                        contrib.trend === "up"
                                          ? "text-emerald-600"
                                          : contrib.trend === "down"
                                            ? "text-rose-600"
                                            : "text-amber-600"
                                      }`}
                                    >
                                      {contrib.trend === "up"
                                        ? "Improving"
                                        : contrib.trend === "down"
                                          ? "Declining"
                                          : "Stable"}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={7}
                                className="text-center py-8 text-gray-400"
                              >
                                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>No contribution data available</p>
                                <p className="text-xs mt-1">
                                  Assign tasks to team members to see
                                  contributions
                                </p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
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
