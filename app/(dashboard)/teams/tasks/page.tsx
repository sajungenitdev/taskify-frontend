"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  X,
  Loader2,
  Building,
  RefreshCw,
  UserPlus,
  ChevronDown,
  Mail,
  User,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  Flag,
  Tag,
  Filter,
  Eye,
  MessageSquare,
  Paperclip,
  CalendarDays,
  Sparkles,
  Crown,
  UsersRound,
  GanttChart,
  ArrowUpDown,
  MoreVertical,
  List,
  LayoutGrid,
} from "lucide-react";
import { teamAPI } from "@/lib/team.api";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { Team } from "@/types/team.types";
import { useAuth } from "@/contexts/AuthContext";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status:
  | "pending"
  | "in_progress"
  | "submitted"
  | "completed"
  | "overdue"
  | "rejected";
  priority?: "low" | "medium" | "high" | "urgent";
  assignedTo?: User | string;
  assignedBy?: User | string;
  projectId?: string;
  deadline?: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: number;
  attachments?: string[];
  extensionRequests?: any[];
  order?: number;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId?: string;
  profilePhoto?: string;
  isActive?: boolean;
  department?: string;
  position?: string;
}

type ViewMode = "list" | "kanban";

const statusMapping = {
  pending: {
    label: "To Do",
    color: "bg-gray-50 text-gray-600 border-gray-200",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
  },
  submitted: {
    label: "Submitted",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: AlertCircle,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
  overdue: {
    label: "Overdue",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: X,
  },
};

const priorityColors = {
  urgent: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function TeamTasksPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as Task["status"],
    assignedTo: "",
    deadline: "",
  });

  // app/tasks/page.tsx - Updated useEffect
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Use a flag to prevent multiple calls
    let isLoaded = false;

    const loadAllData = async () => {
      if (isLoaded) return;
      isLoaded = true;

      try {
        await fetchTasks();
        await Promise.all([
          fetchUsers(),
          fetchProjects(),
          fetchDepartmentUsers(),
          fetchMyExtensionRequests(user),
          fetchAllExtensionRequests()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadAllData();

    // Cleanup
    return () => {
      isLoaded = true;
    };
  }, [isAuthenticated, user]); // Remove filter dependency

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getAllTeams();
      if (response.success) {
        const userTeams = response.data.filter((team: Team) => {
          const isMember = team.members.some(
            (member) => typeof member === "object" && member._id === user?._id,
          );
          const isLead =
            typeof team.lead === "object" && team.lead._id === user?._id;
          return isMember || isLead;
        });
        setTeams(userTeams);
        if (userTeams.length > 0) {
          setSelectedTeamId(userTeams[0]._id);
          // Fetch all user tasks directly instead of project-based
          await fetchUserTasks();
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load your teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTasks = async () => {
    try {
      // Fetch all tasks assigned to the current user
      const response = await api.get("/tasks/my-tasks");
      if (response.data.success) {
        const allTasks = response.data.data || [];
        // If we have a selected team, try to filter tasks by team members
        // Since tasks don't have teamId directly, we'll show all tasks
        // and let users filter by team if needed
        setTasks(allTasks);
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      console.error("Error fetching user tasks:", error);
      // If my-tasks fails, try to get all tasks
      try {
        const allTasksResponse = await api.get("/tasks");
        if (allTasksResponse.data.success) {
          setTasks(allTasksResponse.data.data || []);
        } else {
          setTasks([]);
        }
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError);
        setTasks([]);
        toast.error("Could not load tasks. Please try again.");
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!formData.assignedTo) {
      toast.error("Please assign the task to someone");
      return;
    }
    if (!selectedTeamId) {
      toast.error("No team selected");
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        projectId: selectedTeamId,
        deadline:
          formData.deadline ||
          new Date(Date.now() + 86400000 * 7).toISOString(),
        status: formData.status,
      };

      const response = await api.post("/tasks", payload);
      if (response.data.success) {
        toast.success("Task created successfully!");
        setShowCreateModal(false);
        resetForm();
        await fetchUserTasks();
      }
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.response?.data?.message || "Failed to create task");
    }
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    status: Task["status"],
  ) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status });
      if (response.data.success) {
        toast.success("Task status updated!");
        await fetchUserTasks();
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      if (response.data.success) {
        toast.success("Task deleted successfully!");
        await fetchUserTasks();
      }
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "pending",
      assignedTo: "",
      deadline: "",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = (userObj: any) => {
    if (!userObj) return "Unassigned";
    if (typeof userObj === "object") {
      return userObj.fullName || userObj.name || "Unassigned";
    }
    return userObj;
  };

  const getUserEmail = (userObj: any) => {
    if (!userObj) return "";
    if (typeof userObj === "object") {
      return userObj.email || "";
    }
    return "";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `${days} days left`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getTeamMembers = (team: Team) => {
    if (!team) return [];
    return team.members
      .map((member) => {
        if (typeof member === "object") return member;
        return null;
      })
      .filter(Boolean);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || task.status === filterStatus;

      const taskPriority = task.priority || "medium";
      const matchesPriority =
        filterPriority === "all" || taskPriority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, filterStatus, filterPriority]);

  // Get tasks by status for kanban view
  const tasksByStatus = useMemo(() => {
    const statuses = [
      "pending",
      "in_progress",
      "submitted",
      "completed",
      "overdue",
      "rejected",
    ];
    const grouped: Record<string, Task[]> = {};
    statuses.forEach((status) => {
      grouped[status] = filteredTasks.filter((task) => task.status === status);
    });
    return grouped;
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100/80">
            <div className="w-20 h-20 bg-linear-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              You're not in any team yet
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              Teams help you collaborate with colleagues and stay organized.
            </p>
            <button
              onClick={() => router.push("/dashboard/teams")}
              className="mt-6 px-6 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all font-medium shadow-lg shadow-indigo-500/25"
            >
              Browse All Teams
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedTeam = teams.find((t) => t._id === selectedTeamId);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <GanttChart className="w-7 h-7 text-indigo-500" />
              Team Tasks
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              Manage and track tasks across your teams
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 font-medium"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create Task
          </button>
        </div>

        {/* Team Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {teams.map((team) => (
            <button
              key={team._id}
              onClick={() => {
                setSelectedTeamId(team._id);
                // Refetch tasks when switching teams
                fetchUserTasks();
              }}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${selectedTeamId === team._id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: team.color || "#6366f1" }}
              >
                {getInitials(team.name)}
              </div>
              {team.name}
              <span
                className={`w-1.5 h-1.5 rounded-full ${selectedTeamId === team._id ? "bg-white" : "bg-emerald-500"
                  }`}
              />
            </button>
          ))}
        </div>

        {selectedTeam && (
          <>
            {/* Filters & View Toggle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[140px]"
                  >
                    <option value="all">All Status</option>
                    {Object.entries(statusMapping).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[140px]"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                      setFilterPriority("all");
                    }}
                    className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${viewMode === "list"
                          ? "bg-white shadow-sm text-indigo-600"
                          : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("kanban")}
                      className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${viewMode === "kanban"
                          ? "bg-white shadow-sm text-indigo-600"
                          : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Display */}
            {filteredTasks.length > 0 ? (
              viewMode === "list" ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Task
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Assigned To
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Deadline
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTasks.map((task) => {
                          const statusInfo =
                            statusMapping[task.status] || statusMapping.pending;
                          const StatusIcon = statusInfo.icon;
                          const priority = task.priority || "medium";
                          const priorityClass =
                            priorityColors[
                            priority as keyof typeof priorityColors
                            ] || priorityColors.medium;

                          return (
                            <tr
                              key={task._id}
                              className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                              onClick={() => {
                                setSelectedTaskId(task._id);
                                setShowTaskDetail(true);
                              }}
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-sm text-gray-500 truncate max-w-xs">
                                      {task.description}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${statusInfo.color}`}
                                >
                                  <StatusIcon className="w-3 h-3" />
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${priorityClass}`}
                                >
                                  <Flag className="w-3 h-3" />
                                  {priority.charAt(0).toUpperCase() +
                                    priority.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {task.assignedTo ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                                      {getInitials(
                                        getUserDisplayName(task.assignedTo),
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-700">
                                      {getUserDisplayName(task.assignedTo)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-sm ${task.deadline && new Date(task.deadline) < new Date() && task.status !== "completed" ? "text-rose-600 font-medium" : "text-gray-600"}`}
                                >
                                  {formatDate(task.deadline)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div
                                  className="flex items-center justify-end gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      handleUpdateTaskStatus(
                                        task._id,
                                        e.target.value as Task["status"],
                                      )
                                    }
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 hover:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                  >
                                    {Object.entries(statusMapping).map(
                                      ([key, { label }]) => (
                                        <option key={key} value={key}>
                                          {label}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                  <button
                                    onClick={() => handleDeleteTask(task._id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                // Kanban View
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(tasksByStatus).map(
                    ([status, statusTasks]) => {
                      const statusInfo =
                        statusMapping[status as keyof typeof statusMapping] ||
                        statusMapping.pending;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div
                          key={status}
                          className="bg-gray-50/80 rounded-2xl p-4 min-h-[300px]"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <StatusIcon
                                className={`w-4 h-4 ${statusInfo.color.split(" ")[1]}`}
                              />
                              <h3 className="font-medium text-gray-700">
                                {statusInfo.label}
                              </h3>
                              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                                {statusTasks.length}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {statusTasks.map((task) => {
                              const priority = task.priority || "medium";
                              const priorityClass =
                                priorityColors[
                                priority as keyof typeof priorityColors
                                ] || priorityColors.medium;
                              return (
                                <div
                                  key={task._id}
                                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                                  onClick={() => {
                                    setSelectedTaskId(task._id);
                                    setShowTaskDetail(true);
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium text-gray-900 text-sm flex-1">
                                      {task.title}
                                    </h4>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full border ${priorityClass} shrink-0`}
                                    >
                                      {priority}
                                    </span>
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                    {task.assignedTo ? (
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                                          {getInitials(
                                            getUserDisplayName(task.assignedTo),
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-600 truncate max-w-[80px]">
                                          {getUserDisplayName(task.assignedTo)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">
                                        Unassigned
                                      </span>
                                    )}
                                    {task.deadline && (
                                      <span
                                        className={`text-xs ${new Date(task.deadline) < new Date() && task.status !== "completed" ? "text-rose-500" : "text-gray-400"}`}
                                      >
                                        {formatDate(task.deadline)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {statusTasks.length === 0 && (
                              <div className="text-center py-8 text-gray-400 text-sm">
                                No tasks in this column
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100/80">
                <div className="w-20 h-20 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GanttChart className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  No tasks found
                </h3>
                <p className="text-gray-500 mt-1">
                  Create a task to get started with your team's work
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create Task
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Create New Task
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Task Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter task title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      placeholder="Enter task description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Assign To <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.assignedTo}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedTo: e.target.value })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select Team Member</option>
                      {selectedTeam &&
                        getTeamMembers(selectedTeam)
                          .filter(
                            (member): member is NonNullable<typeof member> =>
                              member !== null,
                          )
                          .map((member) => (
                            <option key={member._id} value={member._id}>
                              {member.fullName} ({member.email})
                            </option>
                          ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as Task["status"],
                        })
                      }
                      className="text-black w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      {Object.entries(statusMapping).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25"
                  >
                    Create Task
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetail && selectedTaskId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {(() => {
              const task = tasks.find((t) => t._id === selectedTaskId);
              if (!task) return null;
              const statusInfo =
                statusMapping[task.status] || statusMapping.pending;
              const StatusIcon = statusInfo.icon;
              const priority = task.priority || "medium";
              const priorityClass =
                priorityColors[priority as keyof typeof priorityColors] ||
                priorityColors.medium;

              return (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        {task.title}
                      </h2>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${statusInfo.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${priorityClass}`}
                        >
                          <Flag className="w-3 h-3" />
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                        {task.deadline && (
                          <span
                            className={`text-sm ${new Date(task.deadline) < new Date() && task.status !== "completed" ? "text-rose-600 font-medium" : "text-gray-500"}`}
                          >
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(task.deadline)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowTaskDetail(false);
                        setSelectedTaskId(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {task.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Description
                      </h3>
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {task.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {task.assignedTo && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          Assigned To
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                            {getInitials(getUserDisplayName(task.assignedTo))}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getUserDisplayName(task.assignedTo)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getUserEmail(task.assignedTo)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {task.createdAt && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          Created
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(task.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <select
                      value={task.status}
                      onChange={(e) => {
                        handleUpdateTaskStatus(
                          task._id,
                          e.target.value as Task["status"],
                        );
                        setShowTaskDetail(false);
                        setSelectedTaskId(null);
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      {Object.entries(statusMapping).map(([key, { label }]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        handleDeleteTask(task._id);
                        setShowTaskDetail(false);
                        setSelectedTaskId(null);
                      }}
                      className="px-4 py-2.5 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
