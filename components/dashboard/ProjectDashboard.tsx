// app/(dashboard)/dashboard/components/ProjectDashboard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CheckSquare,
  BarChart3,
  Loader2,
  RefreshCw,
  ArrowRight,
  Target,
  Clock,
  AlertCircle,
  User,
  UserCheck,
  UserX,
  Calendar,
  PieChart,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  MessageSquare,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Send,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  UserPlus,
  UserMinus,
  Building2,
  Activity,
  Zap,
  Layers,
  FileText,
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "team" | "projects">("overview");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "in_progress" | "submitted" | "completed" | "overdue" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const userDepartmentId = useMemo(() => {
    const extendedUser = user as any;
    return extendedUser?.department?._id || extendedUser?.departmentId || null;
  }, [user]);

  const isProjectManager = user?.role === "project_manager";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
        api.get("/users"),
      ]);

      const allProjects = projectsRes.data.data || [];
      const allTasks = tasksRes.data.data || [];
      const allUsers = usersRes.data.data || [];

      // Get projects managed by this user
      const managedProjects = allProjects.filter((p: any) =>
        p.projectManager?._id === user?._id || p.projectManager === user?._id
      );
      const projectIds = managedProjects.map((p: any) => p._id);

      // Get tasks for these projects
      const projectTasks = allTasks.filter((t: any) =>
        projectIds.includes(t.projectId?._id) || projectIds.includes(t.projectId)
      );

      const completedTasks = projectTasks.filter((t: any) => t.status === "completed").length;
      const overdueTasks = projectTasks.filter((t: any) => t.status === "overdue").length;
      const inProgressTasks = projectTasks.filter((t: any) => t.status === "in_progress").length;
      const submittedTasks = projectTasks.filter((t: any) => t.status === "submitted").length;
      const pendingTasks = projectTasks.filter((t: any) => t.status === "pending").length;
      const rejectedTasks = projectTasks.filter((t: any) => t.status === "rejected").length;

      // Get department users
      let deptUsers = [];
      if (userDepartmentId) {
        deptUsers = allUsers.filter((u: any) =>
          u.departmentId === userDepartmentId || u.department?._id === userDepartmentId
        );
      }

      // Sort tasks by createdAt and get recent ones
      const sortedTasks = [...projectTasks].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5);

      setStats({
        totalProjects: managedProjects.length,
        totalTasks: projectTasks.length,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        submittedTasks,
        pendingTasks,
        rejectedTasks,
        completionRate: projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0,
        totalTeamMembers: deptUsers.length,
        activeProjects: managedProjects.filter((p: any) => p.status === "active").length,
      });

      setDepartmentUsers(deptUsers);
      setRecentTasks(sortedTasks);
      setProjects(managedProjects);

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
    let filtered = recentTasks;
    if (taskFilter !== "all") {
      filtered = filtered.filter(task => task.status === taskFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [recentTasks, taskFilter, searchTerm]);

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
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Project Dashboard</h1>
            <p className="text-sm text-gray-500">
              {isProjectManager ? "Manage your projects, team, and tasks" : "Department Overview"}
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

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-gray-800">{stats.totalProjects}</p>
            <Briefcase className="w-5 h-5 text-cyan-500" />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Total Projects</p>
          <p className="text-xs text-green-600 mt-1">{stats.activeProjects} active</p>
        </div>

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
          <p className="text-xs text-purple-600 mt-1">Department team</p>
        </div>
      </motion.div>

      {/* Quick Stats - Extended */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
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
            {tab}
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
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/projects/create" className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition">
                <Plus className="w-6 h-6 mb-2" />
                <p className="font-semibold">Create Project</p>
                <p className="text-xs opacity-80">Start a new project</p>
              </Link>
              <Link href="/tasks/create" className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition">
                <CheckSquare className="w-6 h-6 mb-2" />
                <p className="font-semibold">Create Task</p>
                <p className="text-xs opacity-80">Assign a new task</p>
              </Link>
              <Link href="/tasks/tasks-board" className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition">
                <Eye className="w-6 h-6 mb-2" />
                <p className="font-semibold">Task Board</p>
                <p className="text-xs opacity-80">View all tasks</p>
              </Link>
              <Link href="/users" className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition">
                <Users className="w-6 h-6 mb-2" />
                <p className="font-semibold">Team Management</p>
                <p className="text-xs opacity-80">Manage your team</p>
              </Link>
            </div>

            {/* Recent Tasks Preview */}
            {recentTasks.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-800">Recent Tasks</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View All →
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {recentTasks.slice(0, 3).map((task) => (
                    <div key={task._id} className="p-3 hover:bg-gray-50 transition flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{task.assignedTo?.fullName || "Unassigned"}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-400">{getPriorityIcon(task.priority)} {task.priority}</span>
                        </div>
                      </div>
                      <Link href={`/tasks/${task._id}`} className="text-indigo-600 hover:text-indigo-800">
                        <Eye size={16} />
                      </Link>
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
              <div className="flex flex-wrap gap-2">
                {["all", "pending", "in_progress", "submitted", "completed", "overdue", "rejected"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter as any)}
                    className={`px-3 py-1 text-xs rounded-full transition capitalize ${taskFilter === filter
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                  >
                    {filter.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400 absolute ml-2" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No tasks found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTasks.map((task) => (
                  <div key={task._id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace("_", " ")}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityConfig(task.priority).color}`}>
                          {getPriorityIcon(task.priority)} {task.priority}
                        </span>
                        {task.deadline && (
                          <span className={`text-xs ${formatDate(task.deadline) === "Overdue" ? "text-rose-500" : "text-gray-500"}`}>
                            📅 {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1">{task.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500">
                          Assigned to: {task.assignedTo?.fullName || "Unassigned"}
                        </span>
                        {task.projectId && (
                          <span className="text-xs text-gray-400">
                            📁 {task.projectId.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/tasks/${task._id}`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                        <Eye size={16} />
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
                {(showAllUsers ? departmentUsers : departmentUsers.slice(0, 5)).map((member) => (
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${member.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {member.isActive !== false ? "Active" : "Inactive"}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{member.role?.replace("_", " ") || "Employee"}</span>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === "active" ? "bg-emerald-100 text-emerald-700" :
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