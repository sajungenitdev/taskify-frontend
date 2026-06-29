"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  X,
  Loader2,
  Building,
  RefreshCw,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  Flag,
  Sparkles,
  Crown,
  UsersRound,
  GanttChart,
  List,
  LayoutGrid,
  CalendarDays,
  Calendar as CalendarDaysIcon,
  ChevronDown,
  Filter,
  Menu,
  Eye,
  MessageSquare,
  Paperclip,
  User,
  Mail,
  Briefcase,
  MoreVertical,
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

type ViewMode = "month" | "week" | "day";

const statusColors = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  submitted: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-100 text-rose-700 border-rose-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const statusLabels = {
  pending: "To Do",
  in_progress: "In Progress",
  submitted: "Submitted",
  completed: "Completed",
  overdue: "Overdue",
  rejected: "Rejected",
};

const priorityColors = {
  urgent: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function TeamCalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchMyTeams();
    } else if (!isAuthenticated && !loading) {
      router.push("/login");
    }
  }, [isAuthenticated, user]);

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
      const response = await api.get("/tasks/my-tasks");
      if (response.data.success) {
        const allTasks = response.data.data || [];
        setTasks(allTasks);
      } else {
        setTasks([]);
      }
    } catch (error: any) {
      console.error("Error fetching user tasks:", error);
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
      }
    }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
  };

  // Check if a date has tasks
  const hasTasksOnDate = (date: Date) => {
    return getTasksForDate(date).length > 0;
  };

  // Get tasks for the selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = selectedDateTasks;
    if (filterStatus !== "all") {
      filtered = filtered.filter((task) => task.status === filterStatus);
    }
    if (filterPriority !== "all") {
      filtered = filtered.filter(
        (task) => (task.priority || "medium") === filterPriority,
      );
    }
    return filtered;
  }, [selectedDateTasks, filterStatus, filterPriority]);

  // Calendar navigation
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Generate calendar days for month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    // Add padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Add padding days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  // Generate week days
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return (
      1 +
      Math.round(
        ((d.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      )
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.toISOString().split("T")[0] === today.toISOString().split("T")[0]
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.toISOString().split("T")[0] ===
      selectedDate.toISOString().split("T")[0]
    );
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      pending: Circle,
      in_progress: Clock,
      submitted: AlertCircle,
      completed: CheckCircle,
      overdue: AlertCircle,
      rejected: X,
    };
    return icons[status] || Circle;
  };

  const getPriorityIcon = (priority?: string) => {
    return Flag;
  };

  // Get tasks for a specific day in week view
  const getTasksForWeekDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline).toISOString().split("T")[0];
      return taskDate === dateStr;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100/80">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              You're not in any team yet
            </h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">
              Join a team to see your task calendar and stay organized.
            </p>
            <button
              onClick={() => router.push("/dashboard/teams")}
              className="mt-6 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all font-medium shadow-lg shadow-indigo-500/25"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <CalendarIcon className="w-7 h-7 text-indigo-500" />
              Team Calendar
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              View and manage your team's task deadlines
            </p>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all font-medium shadow-lg shadow-indigo-500/25 text-sm flex items-center gap-2"
          >
            <CalendarDaysIcon className="w-4 h-4" />
            Today
          </button>
        </div>

        {/* Team Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {teams.map((team) => (
            <button
              key={team._id}
              onClick={() => {
                setSelectedTeamId(team._id);
                fetchUserTasks();
              }}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${
                selectedTeamId === team._id
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
                className={`w-1.5 h-1.5 rounded-full ${
                  selectedTeamId === team._id ? "bg-white" : "bg-emerald-500"
                }`}
              />
            </button>
          ))}
        </div>

        {selectedTeam && (
          <>
            {/* Calendar Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (viewMode === "month") navigateMonth(-1);
                      else if (viewMode === "week") navigateWeek(-1);
                      else navigateDay(-1);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900 min-w-[150px] text-center">
                    {viewMode === "month" && (
                      <>
                        {currentDate.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </>
                    )}
                    {viewMode === "week" && (
                      <>
                        Week {getWeekNumber(currentDate)},{" "}
                        {currentDate.getFullYear()}
                      </>
                    )}
                    {viewMode === "day" && (
                      <>
                        {currentDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </>
                    )}
                  </h2>
                  <button
                    onClick={() => {
                      if (viewMode === "month") navigateMonth(1);
                      else if (viewMode === "week") navigateWeek(1);
                      else navigateDay(1);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("month")}
                      className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-1.5 ${
                        viewMode === "month"
                          ? "bg-white shadow-sm text-indigo-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      Month
                    </button>
                    <button
                      onClick={() => setViewMode("week")}
                      className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-1.5 ${
                        viewMode === "week"
                          ? "bg-white shadow-sm text-indigo-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <List className="w-4 h-4" />
                      Week
                    </button>
                    <button
                      onClick={() => setViewMode("day")}
                      className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-sm flex items-center gap-1.5 ${
                        viewMode === "day"
                          ? "bg-white shadow-sm text-indigo-600"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <CalendarDaysIcon className="w-4 h-4" />
                      Day
                    </button>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg transition-colors ${
                      showFilters ||
                      filterStatus !== "all" ||
                      filterPriority !== "all"
                        ? "bg-indigo-100 text-indigo-600"
                        : "hover:bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-black px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm"
                  >
                    <option value="all">All Status</option>
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="text-black px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-sm"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  {(filterStatus !== "all" || filterPriority !== "all") && (
                    <button
                      onClick={() => {
                        setFilterStatus("all");
                        setFilterPriority("all");
                      }}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
              {viewMode === "month" && (
                <div className="p-4">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium text-gray-500 py-2"
                        >
                          {day}
                        </div>
                      ),
                    )}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {getMonthDays().map(({ date, isCurrentMonth }, index) => {
                      const dayTasks = getTasksForDate(date);
                      const hasTasks = dayTasks.length > 0;
                      const isTodayDate = isToday(date);
                      const isSelectedDate = isSelected(date);

                      return (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedDate(date);
                            if (dayTasks.length > 0) {
                              // Scroll to tasks section
                            }
                          }}
                          className={`
                            min-h-[80px] p-2 rounded-xl cursor-pointer transition-all
                            ${isCurrentMonth ? "hover:bg-gray-50" : "opacity-40"}
                            ${isTodayDate ? "ring-2 ring-indigo-500 ring-offset-2" : ""}
                            ${isSelectedDate ? "bg-indigo-50" : ""}
                            ${hasTasks ? "hover:shadow-sm" : ""}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`
                                text-sm font-medium
                                ${isTodayDate ? "text-indigo-600" : "text-gray-700"}
                                ${!isCurrentMonth ? "text-gray-400" : ""}
                              `}
                            >
                              {date.getDate()}
                            </span>
                            {hasTasks && (
                              <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                                {dayTasks.length}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-1">
                            {dayTasks.slice(0, 3).map((task) => (
                              <div
                                key={task._id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTaskId(task._id);
                                  setShowTaskDetail(true);
                                }}
                                className={`
                                  text-xs px-1.5 py-0.5 rounded truncate cursor-pointer
                                  ${statusColors[task.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700"}
                                  hover:opacity-80 transition-opacity
                                `}
                              >
                                {task.title}
                              </div>
                            ))}
                            {dayTasks.length > 3 && (
                              <div className="text-xs text-gray-400 pl-1.5">
                                +{dayTasks.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === "week" && (
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-2">
                    {getWeekDays().map((date, index) => {
                      const dayTasks = getTasksForWeekDay(date);
                      const isTodayDate = isToday(date);
                      const isSelectedDate = isSelected(date);

                      return (
                        <div key={index} className="min-h-[200px]">
                          <div
                            onClick={() => setSelectedDate(date)}
                            className={`
                              text-center py-2 rounded-xl cursor-pointer transition-all
                              ${isTodayDate ? "bg-indigo-50" : "hover:bg-gray-50"}
                              ${isSelectedDate ? "bg-indigo-100" : ""}
                            `}
                          >
                            <div className="text-xs text-gray-500">
                              {date.toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </div>
                            <div
                              className={`
                                text-lg font-semibold
                                ${isTodayDate ? "text-indigo-600" : "text-gray-700"}
                              `}
                            >
                              {date.getDate()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {dayTasks.length} tasks
                            </div>
                          </div>
                          <div className="mt-2 space-y-1.5 max-h-[300px] overflow-y-auto">
                            {dayTasks.map((task) => (
                              <div
                                key={task._id}
                                onClick={() => {
                                  setSelectedTaskId(task._id);
                                  setShowTaskDetail(true);
                                }}
                                className={`
                                  text-xs p-2 rounded-lg cursor-pointer transition-all
                                  ${statusColors[task.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700"}
                                  hover:shadow-md hover:scale-[1.02]
                                `}
                              >
                                <div className="font-medium truncate">
                                  {task.title}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Flag className="w-3 h-3" />
                                  <span className="text-xs opacity-75">
                                    {(task.priority || "medium")
                                      .charAt(0)
                                      .toUpperCase() +
                                      (task.priority || "medium").slice(1)}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {dayTasks.length === 0 && (
                              <div className="text-xs text-gray-400 text-center py-4">
                                No tasks
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === "day" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {currentDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getTasksForDate(currentDate).length} tasks due
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigateDay(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Today
                      </button>
                      <button
                        onClick={() => navigateDay(1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => {
                        const StatusIcon = getStatusIcon(task.status);
                        const statusColor =
                          statusColors[
                            task.status as keyof typeof statusColors
                          ] || "bg-gray-100 text-gray-700";
                        const priorityColor =
                          priorityColors[
                            task.priority as keyof typeof priorityColors
                          ] || "bg-gray-100 text-gray-700";

                        return (
                          <div
                            key={task._id}
                            onClick={() => {
                              setSelectedTaskId(task._id);
                              setShowTaskDetail(true);
                            }}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <StatusIcon
                                  className={`w-4 h-4 ${statusColor.split(" ")[1]}`}
                                />
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}
                                >
                                  {statusLabels[
                                    task.status as keyof typeof statusLabels
                                  ] || task.status}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {task.title}
                                </p>
                                {task.description && (
                                  <p className="text-sm text-gray-500 truncate">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${priorityColor}`}
                                >
                                  <Flag className="w-3 h-3 inline mr-1" />
                                  {(task.priority || "medium")
                                    .charAt(0)
                                    .toUpperCase() +
                                    (task.priority || "medium").slice(1)}
                                </span>
                                {task.assignedTo && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-medium">
                                      {getInitials(
                                        getUserDisplayName(task.assignedTo),
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-600 hidden sm:inline">
                                      {getUserDisplayName(task.assignedTo)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CalendarIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900">
                          No tasks due this day
                        </h4>
                        <p className="text-gray-500 text-sm mt-1">
                          Enjoy a free day! 🎉
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Task Detail Modal */}
            {showTaskDetail && selectedTaskId && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                  {(() => {
                    const task = tasks.find((t) => t._id === selectedTaskId);
                    if (!task) return null;
                    const StatusIcon = getStatusIcon(task.status);
                    const statusColor =
                      statusColors[task.status as keyof typeof statusColors] ||
                      "bg-gray-100 text-gray-700";
                    const priorityColor =
                      priorityColors[
                        task.priority as keyof typeof priorityColors
                      ] || "bg-gray-100 text-gray-700";

                    return (
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900">
                              {task.title}
                            </h2>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusColor}`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusLabels[
                                  task.status as keyof typeof statusLabels
                                ] || task.status}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${priorityColor}`}
                              >
                                <Flag className="w-3 h-3" />
                                {(task.priority || "medium")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (task.priority || "medium").slice(1)}
                              </span>
                              {task.deadline && (
                                <span className="text-sm text-gray-500">
                                  <CalendarIcon className="w-3 h-3 inline mr-1" />
                                  {formatDate(task.deadline)} at{" "}
                                  {formatTime(task.deadline)}
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
                                  {getInitials(
                                    getUserDisplayName(task.assignedTo),
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {getUserDisplayName(task.assignedTo)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {typeof task.assignedTo === "object" &&
                                      task.assignedTo.email}
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
                          <button
                            onClick={() => {
                              setShowTaskDetail(false);
                              setSelectedTaskId(null);
                            }}
                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                          >
                            Close
                          </button>
                          <button
                            onClick={() => {
                              router.push(`/dashboard/tasks/${task._id}`);
                            }}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
