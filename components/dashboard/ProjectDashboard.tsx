// app/(dashboard)/dashboard/components/ProjectDashboard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CheckSquare,
  Loader2,
  RefreshCw,
  ArrowRight,
  Target,
  Clock,
  AlertCircle,
  User,
  UserCheck,
  UserX,
  Award,
  Eye,
  Plus,
  Search,
  Send,
  Activity,
  Building2,
  Zap,
  Layers,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  UserPlus,
  FileText,
  PieChart,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue" | "rejected";
  deadline: string;
  estimatedHours: number;
  actualMinutes?: number;
  assignedTo: { _id: string; fullName: string; email: string; avatar?: string };
  assignedBy: { _id: string; fullName: string };
  projectId?: { _id: string; name: string; code: string };
  departmentId?: { _id: string; name: string; code: string };
  evidenceUrls?: string[];
  rejectionReason?: string;
  approvalNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserType {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  department?: { _id: string; name: string; code: string };
  departmentId?: string;
  profilePhoto?: string;
  avatar?: string;
  isActive?: boolean;
  position?: string;
  employeeId?: string;
}

interface Project {
  _id: string;
  name: string;
  code: string;
  description: string;
  projectManager: { _id: string; fullName: string; email: string };
  departmentId: { _id: string; name: string; code: string };
  teamMembers: { userId: { _id: string; fullName: string; email: string }; role: string }[];
  tasksCount: number;
  completedTasks: number;
  progress: number;
  status: "planning" | "active" | "on_hold" | "completed" | "archived";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [departmentUsers, setDepartmentUsers] = useState<UserType[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "team" | "projects">("overview");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "in_progress" | "submitted" | "completed" | "overdue" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Get user's department ID from multiple possible sources
  const userDepartmentId = useMemo(() => {
    const extendedUser = user as any;
    return extendedUser?.department?._id ||
      extendedUser?.departmentId ||
      extendedUser?.department ||
      null;
  }, [user]);

  const isProjectManager = user?.role === "project_manager";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      console.log("🔍 Fetching dashboard data...");

      // Fetch all data
      const [usersRes, tasksRes, projectsRes] = await Promise.all([
        api.get("/users"),
        api.get("/tasks"),
        api.get("/projects"),
      ]);

      const allUsers = usersRes.data.data || [];
      const allTasksData = tasksRes.data.data || [];
      const allProjects = projectsRes.data.data || [];

      console.log("👥 All Users:", allUsers.length);
      console.log("📋 All Tasks:", allTasksData.length);
      console.log("📁 All Projects:", allProjects.length);

      // Log all users to see department data
      console.log("👥 All Users with departments:");
      allUsers.forEach((u: any) => {
        console.log(`  - ${u.fullName}: departmentId=${u.departmentId}, department=${u.department?._id || u.department}`);
      });

      // ============================================================
      // 1. FIND DEPARTMENT ID - CRITICAL FIX
      // ============================================================
      let deptId = null;
      let deptName = "";
      let deptCode = "";

      // Try to get department from user context first
      if (userDepartmentId) {
        deptId = userDepartmentId;
        console.log("🏢 Using memoized department ID:", deptId);
      }

      // Find current user in the users list to get department
      const currentUser = allUsers.find((u: any) => u._id === user?._id);
      console.log("👤 Current User from API:", currentUser);

      if (currentUser) {
        // Check if user has department object with _id
        if (currentUser.department && typeof currentUser.department === 'object' && currentUser.department._id) {
          deptId = currentUser.department._id;
          deptName = currentUser.department.name || "";
          deptCode = currentUser.department.code || "";
          console.log("🏢 Found department from user.department._id:", { deptId, deptName, deptCode });
        }
        // Check if user has departmentId string
        else if (currentUser.departmentId) {
          deptId = currentUser.departmentId;
          console.log("🏢 Found departmentId from user.departmentId:", deptId);
        }
        // Check if user has department as string
        else if (typeof currentUser.department === 'string') {
          deptId = currentUser.department;
          console.log("🏢 Found department as string:", deptId);
        }
      }

      // 🔥 FIX: If we still don't have a department ID, try to find the SQA department
      if (!deptId) {
        // Try to find department by name "SQA" or "SQA Department"
        const sqaUsers = allUsers.filter((u: any) => {
          const deptName = u.department?.name || "";
          return deptName.toLowerCase().includes("sqa");
        });

        if (sqaUsers.length > 0) {
          const firstUser = sqaUsers[0];
          deptId = firstUser.department?._id || firstUser.departmentId || firstUser.department;
          deptName = firstUser.department?.name || "SQA";
          deptCode = firstUser.department?.code || "SQA";
          console.log("🏢 Found SQA department from users:", { deptId, deptName, deptCode });
        }
      }

      // ============================================================
      // 2. FILTER DEPARTMENT USERS - SHOW ALL USERS IN DEPARTMENT
      // ============================================================
      let deptUsers = [];

      if (deptId) {
        // 🔥 CRITICAL: Filter users by department ID - SHOW ALL USERS
        deptUsers = allUsers.filter((u: any) => {
          // Check multiple possible department field locations
          const uDeptId = u.departmentId || u.department?._id || u.department;
          // Convert both to string for comparison
          const match = String(uDeptId) === String(deptId);
          if (match) {
            console.log(`✅ Found user ${u.fullName} in department`);
          }
          return match;
        });

        console.log("👥 All Department Users (filtered by ID):", deptUsers.length);
      }

      // If no users found by ID, try by department name
      if (deptUsers.length === 0 && deptName) {
        deptUsers = allUsers.filter((u: any) => {
          const uDeptName = u.department?.name || u.departmentName || "";
          return uDeptName.toLowerCase() === deptName.toLowerCase();
        });
        console.log("👥 Department Users (filtered by name):", deptUsers.length);
      }

      // 🔥 FALLBACK: If still no users, try to find users with department name containing "SQA"
      if (deptUsers.length === 0) {
        deptUsers = allUsers.filter((u: any) => {
          const uDeptName = u.department?.name || "";
          return uDeptName.toLowerCase().includes("sqa");
        });
        console.log("👥 Department Users (SQA fallback):", deptUsers.length);
      }

      // 🔥 FINAL FALLBACK: Show all users if department is SQA
      if (deptUsers.length === 0) {
        // Check if current user's department name contains SQA
        const currentUserDeptName = currentUser?.department?.name || "";
        if (currentUserDeptName.toLowerCase().includes("sqa")) {
          deptUsers = allUsers.filter((u: any) => {
            const uDeptName = u.department?.name || "";
            return uDeptName.toLowerCase().includes("sqa");
          });
          console.log("👥 Department Users (SQA fallback from current user):", deptUsers.length);
        }
      }

      // Set department name from the users or use fallback
      if (deptUsers.length > 0) {
        const firstUser = deptUsers[0];
        deptName = firstUser.department?.name || deptName || "SQA Department";
        deptCode = firstUser.department?.code || deptCode || "SQA";
      } else {
        deptName = "SQA Department";
        deptCode = "SQA";
      }

      setDepartmentName(deptName);
      setDepartmentCode(deptCode);

      // Get department user IDs
      const deptUserIds = deptUsers.map((u: any) => u._id);
      console.log("👥 Department User IDs:", deptUserIds);
      console.log("👥 Total Department Users:", deptUsers.length);

      // ============================================================
      // 3. GET DEPARTMENT TASKS
      // ============================================================
      let deptTasks = [];

      if (deptUserIds.length > 0) {
        // Tasks assigned to department users
        deptTasks = allTasksData.filter((t: any) => {
          const taskAssigneeId = t.assignedTo?._id || t.assignedTo;
          return deptUserIds.includes(taskAssigneeId);
        });
        console.log("📋 Tasks assigned to department users:", deptTasks.length);
      }

      // Also get tasks with departmentId matching
      let deptTasksByDeptId = [];
      if (deptId) {
        deptTasksByDeptId = allTasksData.filter((t: any) => {
          const taskDeptId = t.departmentId?._id || t.departmentId || t.department;
          return String(taskDeptId) === String(deptId);
        });
        console.log("📋 Tasks with department ID:", deptTasksByDeptId.length);
      }

      // Combine and remove duplicates
      const taskMap = new Map();
      [...deptTasks, ...deptTasksByDeptId].forEach((task: any) => {
        taskMap.set(task._id, task);
      });
      const combinedTasks = Array.from(taskMap.values());
      console.log("📋 Combined Tasks:", combinedTasks.length);

      // ============================================================
      // 4. GET PROJECTS
      // ============================================================
      // Projects managed by this user
      const managedProjects = allProjects.filter((p: any) => {
        const pmId = p.projectManager?._id || p.projectManager || p.projectManagerId;
        return String(pmId) === String(user?._id);
      });
      console.log("📁 Managed Projects:", managedProjects.length);

      // Projects in the department
      let deptProjects = [];
      if (deptId) {
        deptProjects = allProjects.filter((p: any) => {
          const pDeptId = p.departmentId?._id || p.departmentId || p.department;
          return String(pDeptId) === String(deptId);
        });
        console.log("📁 Department Projects:", deptProjects.length);
      }

      // Combine projects
      const projectMap = new Map();
      [...managedProjects, ...deptProjects].forEach((p: any) => {
        projectMap.set(p._id, p);
      });
      const combinedProjects = Array.from(projectMap.values());
      console.log("📁 Combined Projects:", combinedProjects.length);

      // ============================================================
      // 5. CALCULATE STATS
      // ============================================================
      const totalTasks = combinedTasks.length;
      const completedTasks = combinedTasks.filter((t: any) => t.status === "completed").length;
      const overdueTasks = combinedTasks.filter((t: any) => t.status === "overdue").length;
      const inProgressTasks = combinedTasks.filter((t: any) => t.status === "in_progress").length;
      const submittedTasks = combinedTasks.filter((t: any) => t.status === "submitted").length;
      const pendingTasks = combinedTasks.filter((t: any) => t.status === "pending").length;
      const rejectedTasks = combinedTasks.filter((t: any) => t.status === "rejected").length;

      // Sort tasks by createdAt and get recent ones
      const sortedTasks = [...combinedTasks].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);

      setStats({
        totalProjects: combinedProjects.length,
        totalTasks: totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        submittedTasks,
        pendingTasks,
        rejectedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        totalTeamMembers: deptUsers.length,
        activeProjects: combinedProjects.filter((p: any) => p.status === "active").length,
      });

      setDepartmentUsers(deptUsers);
      setRecentTasks(sortedTasks);
      setAllTasks(combinedTasks);
      setProjects(combinedProjects);

      console.log("✅ Final Stats:", {
        totalTasks,
        totalProjects: combinedProjects.length,
        totalTeamMembers: deptUsers.length,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      });

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      in_progress: "bg-sky-100 text-sky-700 border-sky-200",
      submitted: "bg-purple-100 text-purple-700 border-purple-200",
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      overdue: "bg-rose-100 text-rose-700 border-rose-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getPriorityIcon = (priority: string) => {
    const icons = {
      low: "🟢",
      normal: "🔵",
      high: "🟠",
      urgent: "🔴",
    };
    return icons[priority as keyof typeof icons] || "🔵";
  };

  const getPriorityConfig = (priority: string) => {
    const config = {
      low: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Low" },
      normal: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Normal" },
      high: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "High" },
      urgent: { color: "bg-rose-50 text-rose-700 border-rose-200", label: "Urgent" },
    };
    return config[priority as keyof typeof config] || config.normal;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days left`;
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "?";
  };

  const filteredTasks = useMemo(() => {
    let filtered = allTasks;
    if (taskFilter !== "all") {
      filtered = filtered.filter(task => task.status === taskFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered.slice(0, 10);
  }, [allTasks, taskFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Project Manager Dashboard</h1>
            <p className="text-sm text-gray-500">
              {departmentName} Department {departmentCode ? `(${departmentCode})` : ""} • {stats.totalTeamMembers} Team Members
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </motion.div>

      {/* Department Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-pink-50/80 border border-indigo-200/50 rounded-xl p-4 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md shadow-indigo-500/25">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {departmentName} Department {departmentCode ? `(${departmentCode})` : ""}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Users size={12} />
              {stats.totalTeamMembers} members
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              {stats.totalProjects} projects
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              {stats.totalTasks} tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-3 py-1 bg-white/80 rounded-full border border-indigo-200 text-indigo-700 shadow-sm">
            {isProjectManager ? "Project Manager" : "Department Overview"}
          </span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-800">{stats.totalTasks}</p>
            <CheckSquare className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Total Tasks</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="text-xs text-emerald-600">{stats.completedTasks} done</span>
            <span className="text-xs text-amber-600">{stats.inProgressTasks} in progress</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
            <Briefcase className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Total Projects</p>
          <p className="text-xs text-green-600 mt-1">{stats.activeProjects} active</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-emerald-600">{stats.completionRate}%</p>
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Completion Rate</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-800">{stats.totalTeamMembers}</p>
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Team Members</p>
          <p className="text-xs text-purple-600 mt-1">{departmentName} team</p>
        </div>
      </motion.div>

      {/* Quick Stats - Task Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-6 gap-3"
      >
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">Pending</p>
          </div>
          <p className="text-xl font-bold text-amber-800">{stats.pendingTasks || 0}</p>
        </div>

        <div className="bg-sky-50 rounded-xl p-3 border border-sky-200">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <p className="text-sm font-medium text-sky-700">In Progress</p>
          </div>
          <p className="text-xl font-bold text-sky-800">{stats.inProgressTasks || 0}</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-purple-600" />
            <p className="text-sm font-medium text-purple-700">Submitted</p>
          </div>
          <p className="text-xl font-bold text-purple-800">{stats.submittedTasks || 0}</p>
        </div>

        <div className="bg-rose-50 rounded-xl p-3 border border-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <p className="text-sm font-medium text-rose-700">Overdue</p>
          </div>
          <p className="text-xl font-bold text-rose-800">{stats.overdueTasks || 0}</p>
        </div>

        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-700">Completed</p>
          </div>
          <p className="text-xl font-bold text-emerald-800">{stats.completedTasks || 0}</p>
        </div>

        <div className="bg-red-50 rounded-xl p-3 border border-red-200">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-medium text-red-700">Rejected</p>
          </div>
          <p className="text-xl font-bold text-red-800">{stats.rejectedTasks || 0}</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <Link href="/projects/create" className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition group">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Create Project</p>
              <p className="text-xs opacity-80">Start a new project</p>
            </div>
          </div>
        </Link>
        <Link href="/tasks/create" className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition group">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Create Task</p>
              <p className="text-xs opacity-80">Assign a new task</p>
            </div>
          </div>
        </Link>
        <Link href="/tasks/tasks-board" className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition group">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Task Board</p>
              <p className="text-xs opacity-80">View all tasks</p>
            </div>
          </div>
        </Link>
        <Link href="/users" className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-3 text-white shadow-lg hover:shadow-xl transition group">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Team</p>
              <p className="text-xs opacity-80">Manage your team</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {["overview", "tasks", "team", "projects"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition capitalize ${activeTab === tab
              ? "bg-indigo-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100"
              }`}
          >
            {tab === "overview" ? "📊 Overview" :
              tab === "tasks" ? "📋 Tasks" :
                tab === "team" ? "👥 Team" : "📁 Projects"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Recent Tasks */}
            {recentTasks.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-800">Recent Tasks</h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {recentTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {recentTasks.slice(0, 5).map((task) => (
                    <div key={task._id} className="p-3 hover:bg-gray-50 transition flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-500">{getPriorityIcon(task.priority)}</span>
                          <span className="text-xs text-gray-400 truncate max-w-[150px]">
                            {task.assignedTo?.fullName || "Unassigned"}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-0.5">{task.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.deadline && (
                          <span className={`text-xs ${formatDate(task.deadline) === "Overdue" ? "text-rose-500" : "text-gray-400"}`}>
                            📅 {formatDate(task.deadline)}
                          </span>
                        )}
                        <Link href={`/tasks/${task._id}`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                          <Eye size={16} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members Preview - Shows ALL department members */}
            {departmentUsers.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-gray-800">Team Members</h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {departmentUsers.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab("team")}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3">
                  {departmentUsers.slice(0, 6).map((member) => (
                    <div key={member._id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {getInitials(member.fullName)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{member.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{member.role?.replace("_", " ") || "Employee"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "tasks" && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Task Filters */}
            <div className="p-4 border-b border-gray-200 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {["all", "pending", "in_progress", "submitted", "completed", "overdue", "rejected"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter as any)}
                    className={`px-2.5 py-1 text-[10px] rounded-full transition capitalize ${taskFilter === filter
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {filter.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition w-40"
                  />
                </div>
                <span className="text-xs text-gray-400">{filteredTasks.length} tasks</span>
              </div>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No tasks found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {filteredTasks.map((task) => (
                  <div key={task._id} className="p-3 hover:bg-gray-50 transition flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace("_", " ")}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityConfig(task.priority).color}`}>
                          {getPriorityIcon(task.priority)} {task.priority}
                        </span>
                        {task.deadline && (
                          <span className={`text-[10px] ${formatDate(task.deadline) === "Overdue" ? "text-rose-500" : "text-gray-400"}`}>
                            📅 {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{task.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">
                          👤 {task.assignedTo?.fullName || "Unassigned"}
                        </span>
                        {task.projectId && (
                          <span className="text-xs text-gray-400">
                            📁 {task.projectId.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Link href={`/tasks/${task._id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                        <Eye size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "team" && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-800">Team Members</h3>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    {departmentUsers.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {showAllUsers ? "Show Less" : "View All"}
                </button>
              </div>
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {departmentUsers.map((member) => (
                  <div key={member._id} className="p-3 hover:bg-gray-50 transition flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-bold">
                          {getInitials(member.fullName)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{member.fullName}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${member.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {member.isActive !== false ? "Active" : "Inactive"}
                      </span>
                      <span className="text-[10px] text-gray-400 capitalize">{member.role?.replace("_", " ") || "Employee"}</span>
                    </div>
                  </div>
                ))}
                {departmentUsers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>No team members found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <UserCheck className="w-5 h-5 text-emerald-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{departmentUsers.filter(u => u.isActive !== false).length}</p>
                <p className="text-xs text-gray-500">Active Members</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <UserX className="w-5 h-5 text-rose-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{departmentUsers.filter(u => u.isActive === false).length}</p>
                <p className="text-xs text-gray-500">Inactive Members</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <Award className="w-5 h-5 text-amber-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{departmentUsers.filter(u => u.role === "project_manager" || u.role === "dept_manager").length}</p>
                <p className="text-xs text-gray-500">Managers</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <User className="w-5 h-5 text-blue-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{departmentUsers.filter(u => u.role === "employee" || u.role === "line_manager").length}</p>
                <p className="text-xs text-gray-500">Team Members</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "projects" && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {projects.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl p-8 text-center border border-gray-200">
                <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No projects found</p>
                <Link href="/projects/create" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-800">
                  Create your first project →
                </Link>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{project.name}</h4>
                        <p className="text-xs text-gray-500">{project.code}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${project.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        project.status === "planning" ? "bg-amber-100 text-amber-700" :
                          project.status === "on_hold" ? "bg-rose-100 text-rose-700" :
                            project.status === "completed" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                        }`}>
                        {project.status?.replace("_", " ") || "Active"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📋 {project.tasksCount || 0} tasks</span>
                      <span>✅ {project.completedTasks || 0} completed</span>
                      <span className="text-emerald-600 font-medium">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        Team: {project.teamMembers?.length || 0} members
                      </span>
                      <Link
                        href={`/projects/${project._id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                      >
                        View Details <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}