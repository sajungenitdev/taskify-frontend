// app/(dashboard)/workload/[userId]/page.tsx
"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";

interface UserDetails {
  user: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
    department: string;
    role: string;
    joinDate: string;
  };
  metrics: {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    totalEstimatedHours: number;
    totalActualHours: number;
    completionRate: number;
  };
  tasksByProject: Array<{
    project: { _id: string; name: string; code?: string };
    tasks: any[];
    totalEstimated: number;
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
}

export default function IndividualWorkloadPage() {
  const params = useParams();
  const userId = params?.userId as string; // Properly extract userId
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "overview" | "tasks" | "projects"
  >("overview");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch data when authenticated and userId is available
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchUserWorkload();
    } else if (isAuthenticated && !userId) {
      console.error("No userId provided in URL params");
      setError("No user ID provided");
      setLoading(false);
    }
  }, [isAuthenticated, userId]);

  const fetchUserWorkload = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching workload for user: ${userId}`);

      const response = await api.get(`/workload/individual/${userId}`);
      console.log("Response:", response.data);

      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || "Failed to load user data");
      }
    } catch (error: any) {
      console.error("Error fetching user workload:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to load user data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">
            {authLoading
              ? "Authenticating..."
              : "Loading user workload data..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
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

  // Show not found state
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            User Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The user you're looking for doesn't exist or you don't have
            permission to view their workload.
          </p>
          <Link
            href="/workload"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              href="/workload"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Workload Dashboard
            </Link>
          </motion.div>

          {/* User Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <span className="text-white text-3xl font-bold">
                  {data.user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">
                  {data.user.fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchUserWorkload}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-2 text-gray-700"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>

          {/* Metrics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium">
                    Total Tasks
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {data.metrics.totalTasks}
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-emerald-600">
                  {data.metrics.completedTasks} completed
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-amber-600">
                  {data.metrics.activeTasks} active
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium">
                    Completion Rate
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      data.metrics.completionRate > 70
                        ? "text-emerald-600"
                        : data.metrics.completionRate > 40
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {data.metrics.completionRate}%
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    data.metrics.completionRate > 70
                      ? "bg-emerald-50"
                      : data.metrics.completionRate > 40
                        ? "bg-amber-50"
                        : "bg-red-50"
                  }`}
                >
                  <Award
                    className={`w-5 h-5 ${
                      data.metrics.completionRate > 70
                        ? "text-emerald-500"
                        : data.metrics.completionRate > 40
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}
                  />
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    data.metrics.completionRate > 70
                      ? "bg-emerald-500"
                      : data.metrics.completionRate > 40
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${data.metrics.completionRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium">
                    Estimated Hours
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {data.metrics.totalEstimatedHours}h
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {data.metrics.totalActualHours}h actually tracked
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium">
                    Overdue Tasks
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      data.overdueTasks.length > 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {data.overdueTasks.length}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    data.overdueTasks.length > 0 ? "bg-red-50" : "bg-emerald-50"
                  }`}
                >
                  <AlertCircle
                    className={`w-5 h-5 ${
                      data.overdueTasks.length > 0
                        ? "text-red-500"
                        : "text-emerald-500"
                    }`}
                  />
                </div>
              </div>
              {data.overdueTasks.length > 0 && (
                <p className="text-xs text-red-500 mt-2">⚠️ Needs attention</p>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6"
          >
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {["overview", "tasks", "projects"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab as any)}
                  className={`px-6 py-3 text-sm font-medium transition capitalize whitespace-nowrap ${
                    selectedTab === tab
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6">
              {selectedTab === "overview" && (
                <div className="space-y-6">
                  {/* Weekly Breakdown */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Weekly Activity
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {data.weeklyBreakdown.map((week) => (
                        <div
                          key={week.week}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                        >
                          <p className="text-xs text-gray-400">{week.week}</p>
                          <p className="text-lg font-bold text-gray-800">
                            {week.tasks} tasks
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-emerald-600">
                              {week.completed} done
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-purple-600">
                              {week.hours}h
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Project Distribution */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Projects
                    </h3>
                    <div className="space-y-2">
                      {data.tasksByProject.map((project) => (
                        <div
                          key={project.project._id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100"
                        >
                          <div>
                            <p className="text-gray-800 font-medium">
                              {project.project.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {project.tasks.length} tasks
                            </p>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {project.totalEstimated}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "tasks" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-amber-500 rounded-full" />
                      <span className="text-gray-600">
                        Active: {data.metrics.activeTasks}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span className="text-gray-600">
                        Completed: {data.metrics.completedTasks}
                      </span>
                    </div>
                    {data.overdueTasks.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-gray-600">
                          Overdue: {data.overdueTasks.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Active Tasks */}
                  {data.activeTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Active Tasks
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {data.activeTasks.map((task) => (
                          <div
                            key={task._id}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-gray-800 font-medium">
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span
                                  className={`px-1.5 py-0.5 rounded ${
                                    task.priority === "urgent"
                                      ? "bg-red-100 text-red-700"
                                      : task.priority === "high"
                                        ? "bg-amber-100 text-amber-700"
                                        : task.priority === "normal"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {task.priority}
                                </span>
                                <span>
                                  {task.projectId?.name || "No Project"}
                                </span>
                                <span>•</span>
                                <span>{task.estimatedHours}h est.</span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">
                              Due {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Completed */}
                  {data.recentCompleted.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Recent Completed
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {data.recentCompleted.slice(0, 5).map((task) => (
                          <div
                            key={task._id}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-gray-800 font-medium">
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
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === "projects" && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {data.tasksByProject.map((project) => (
                    <div
                      key={project.project._id}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-gray-800 font-medium">
                            {project.project.name}
                          </h4>
                          <p className="text-xs text-gray-400">
                            {project.tasks.length} tasks •{" "}
                            {project.totalEstimated}h estimated
                          </p>
                        </div>
                        {project.project.code && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {project.project.code}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {project.tasks.slice(0, 5).map((task) => (
                          <div
                            key={task._id}
                            className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0"
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
                            </div>
                            <span className="text-xs text-gray-400">
                              {task.status}
                            </span>
                          </div>
                        ))}
                        {project.tasks.length > 5 && (
                          <p className="text-xs text-gray-400 text-center pt-2">
                            +{project.tasks.length - 5} more tasks
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
