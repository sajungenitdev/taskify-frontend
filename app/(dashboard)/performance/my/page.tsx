"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp,
  CheckCircle,
  Activity,
  Calendar,
  PieChart,
  Trophy,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  TrendingDown,
  Medal,
  Clock,
  Target,
  Filter,
  Award,
  BarChart3,
  LineChart as LineChartIcon,
  Users,
  Briefcase,
  Zap,
  Crown,
  GitBranch,
  Rocket,
  Brain,
  Sparkles,
  Gift,
  Flame,
  Milestone,
  Target as TargetIcon,
  AlertCircle,
  ChevronRight,
  User,
  CalendarDays,
  Hourglass,
  Percent,
  Award as AwardIcon,
} from "lucide-react";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Scatter,
} from "recharts";
import toast from "react-hot-toast";

// ==================== INTERFACES ====================

interface PerformanceMetric {
  _id: string;
  metric: string;
  value: number;
  target: number;
  progress: number;
  unit: string;
  trend: "up" | "down" | "stable";
  percentageChange: number;
}

interface TaskPerformance {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  submitted: number;
  overdue: number;
  rejected: number;
  completionRate: number;
  onTimeRate: number;
  averageCompletionTime: number;
  tasksByPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
}

interface ProductivityData {
  date: string;
  completed: number;
  submitted: number;
  hours: number;
  tasksCreated: number;
}

interface CategoryPerformance {
  name: string;
  completed: number;
  total: number;
  percentage: number;
  color: string;
  trend: "up" | "down" | "stable";
}

interface MonthlyStats {
  month: string;
  tasks: number;
  completionRate: number;
  avgHours: number;
  tasksCompleted: number;
  tasksCreated: number;
}

interface YearlyStats {
  year: string;
  totalTasks: number;
  completionRate: number;
  totalHours: number;
  months: MonthlyStats[];
}

interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  points: number;
  progress?: number;
  category: "productivity" | "quality" | "consistency" | "growth";
}

interface Rating {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentFeedback: {
    _id: string;
    rating: number;
    comment: string;
    reviewer: string;
    createdAt: string;
  }[];
}

interface PerformanceInsight {
  id: string;
  title: string;
  description: string;
  type: "positive" | "warning" | "info";
  icon: React.ReactNode;
}

// ==================== COMPONENT ====================

export default function MyPerformancePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // ==================== STATE ====================
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);
  const [taskPerformance, setTaskPerformance] = useState<TaskPerformance>({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    submitted: 0,
    overdue: 0,
    rejected: 0,
    completionRate: 0,
    onTimeRate: 0,
    averageCompletionTime: 0,
    tasksByPriority: { low: 0, normal: 0, high: 0, urgent: 0 },
  });
  const [productivityData, setProductivityData] = useState<ProductivityData[]>(
    [],
  );
  const [categoryPerformance, setCategoryPerformance] = useState<
    CategoryPerformance[]
  >([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [yearlyStats, setYearlyStats] = useState<YearlyStats[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rating, setRating] = useState<Rating>({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentFeedback: [],
  });
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    tasks: true,
    productivity: true,
    categories: true,
    monthly: true,
    achievements: true,
    rating: true,
    insights: true,
  });
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "analytics" | "achievements"
  >("overview");

  // ==================== AUTH CHECK ====================
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, selectedPeriod]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const [
        metricsRes,
        taskStatsRes,
        productivityRes,
        categoryRes,
        monthlyRes,
        yearlyRes,
        achievementsRes,
        ratingRes,
      ] = await Promise.allSettled([
        api.get("/performance/metrics"),
        api.get("/performance/task-stats"),
        api.get(`/performance/productivity?period=${selectedPeriod}`),
        api.get("/performance/category-stats"),
        api.get(`/performance/monthly-stats?period=${selectedPeriod}`),
        api
          .get("/performance/yearly-stats")
          .catch(() => ({ data: { success: true, data: [] } })),
        api.get("/performance/achievements"),
        api.get("/performance/ratings"),
      ]);

      // Safely extract data with fallbacks
      if (
        metricsRes.status === "fulfilled" &&
        metricsRes.value?.data?.success
      ) {
        setPerformanceMetrics(metricsRes.value.data.data);
      }

      if (
        taskStatsRes.status === "fulfilled" &&
        taskStatsRes.value?.data?.success
      ) {
        setTaskPerformance(taskStatsRes.value.data.data);
      }

      if (
        productivityRes.status === "fulfilled" &&
        productivityRes.value?.data?.success
      ) {
        setProductivityData(productivityRes.value.data.data);
      }

      if (
        categoryRes.status === "fulfilled" &&
        categoryRes.value?.data?.success
      ) {
        setCategoryPerformance(categoryRes.value.data.data);
      }

      if (
        monthlyRes.status === "fulfilled" &&
        monthlyRes.value?.data?.success
      ) {
        setMonthlyStats(monthlyRes.value.data.data);
      }

      if (
        yearlyRes.status === "fulfilled" &&
        yearlyRes.value?.data?.success &&
        yearlyRes.value.data.data.length > 0
      ) {
        setYearlyStats(yearlyRes.value.data.data);
      } else {
        generateYearlyStatsFromMonthly(monthlyStats);
      }

      if (
        achievementsRes.status === "fulfilled" &&
        achievementsRes.value?.data?.success
      ) {
        setAchievements(achievementsRes.value.data.data);
      }

      if (ratingRes.status === "fulfilled" && ratingRes.value?.data?.success) {
        setRating(ratingRes.value.data.data);
      }

      // Generate insights
      generateInsights(
        metricsRes.status === "fulfilled"
          ? metricsRes.value?.data?.data || []
          : [],
        taskStatsRes.status === "fulfilled"
          ? taskStatsRes.value?.data?.data
          : taskPerformance,
        achievementsRes.status === "fulfilled"
          ? achievementsRes.value?.data?.data || []
          : [],
      );
    } catch (error: any) {
      console.error("Error fetching performance data:", error);
      toast.error(
        error.response?.data?.message || "Failed to load performance data",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================

  const generateYearlyStatsFromMonthly = (monthlyData: MonthlyStats[]) => {
    if (!monthlyData || monthlyData.length === 0) {
      setYearlyStats([]);
      return;
    }

    const yearsMap = new Map<string, MonthlyStats[]>();
    monthlyData.forEach((month) => {
      const year =
        month.month.split(" ")[1] || new Date().getFullYear().toString();
      if (!yearsMap.has(year)) {
        yearsMap.set(year, []);
      }
      yearsMap.get(year)?.push(month);
    });

    const generatedYearlyStats: YearlyStats[] = [];
    yearsMap.forEach((months, year) => {
      const totalTasks = months.reduce((sum, m) => sum + m.tasks, 0);
      const totalHours = months.reduce((sum, m) => sum + m.avgHours, 0);
      const avgCompletionRate =
        months.reduce((sum, m) => sum + m.completionRate, 0) / months.length;

      generatedYearlyStats.push({
        year,
        totalTasks,
        completionRate: avgCompletionRate,
        totalHours,
        months,
      });
    });

    setYearlyStats(generatedYearlyStats);
  };

  const generateInsights = (
    metrics: PerformanceMetric[],
    taskStats: TaskPerformance,
    achievements: Achievement[],
  ) => {
    const newInsights: PerformanceInsight[] = [];

    // Completion rate insight
    if (taskStats.completionRate > 80 && taskStats.total > 0) {
      newInsights.push({
        id: "high-completion",
        title: "Excellent Completion Rate",
        description: `You're crushing it with a ${taskStats.completionRate.toFixed(1)}% completion rate. Keep up the great work!`,
        type: "positive",
        icon: <Rocket className="w-4 h-4" />,
      });
    } else if (taskStats.completionRate < 50 && taskStats.total > 0) {
      newInsights.push({
        id: "low-completion",
        title: "Focus on Task Completion",
        description: `Your completion rate is ${taskStats.completionRate.toFixed(1)}%. Try breaking down tasks into smaller chunks.`,
        type: "warning",
        icon: <TargetIcon className="w-4 h-4" />,
      });
    }

    // On-time rate insight
    if (taskStats.onTimeRate > 75 && taskStats.total > 0) {
      newInsights.push({
        id: "ontime-good",
        title: "Great Time Management",
        description: `${taskStats.onTimeRate.toFixed(1)}% of tasks completed on time. Excellent punctuality!`,
        type: "positive",
        icon: <Clock className="w-4 h-4" />,
      });
    } else if (taskStats.onTimeRate < 50 && taskStats.total > 0) {
      newInsights.push({
        id: "ontime-needs",
        title: "Improve Time Management",
        description: `${taskStats.onTimeRate.toFixed(1)}% on-time rate. Consider setting earlier deadlines.`,
        type: "warning",
        icon: <Clock className="w-4 h-4" />,
      });
    }

    // Achievement insight
    const recentAchievements = achievements.filter(
      (a) =>
        a.earnedAt &&
        new Date(a.earnedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
    if (recentAchievements.length > 0) {
      newInsights.push({
        id: "new-achievements",
        title: "Recent Achievements",
        description: `You've earned ${recentAchievements.length} new achievement${recentAchievements.length > 1 ? "s" : ""} this month!`,
        type: "positive",
        icon: <Trophy className="w-4 h-4" />,
      });
    }

    // Productivity insight
    if (taskStats.total > 100) {
      newInsights.push({
        id: "high-productivity",
        title: "High Productivity",
        description: `You've completed ${taskStats.total} tasks. You're a productivity powerhouse!`,
        type: "positive",
        icon: <Zap className="w-4 h-4" />,
      });
    }

    // Overdue tasks insight
    if (taskStats.overdue > 5) {
      newInsights.push({
        id: "overdue-tasks",
        title: "Overdue Tasks Alert",
        description: `You have ${taskStats.overdue} overdue tasks. Prioritize these immediately.`,
        type: "warning",
        icon: <Flame className="w-4 h-4" />,
      });
    }

    // Info insights
    if (taskStats.total === 0) {
      newInsights.push({
        id: "no-tasks",
        title: "Start Your Journey",
        description:
          "You haven't created any tasks yet. Start by creating your first task!",
        type: "info",
        icon: <GitBranch className="w-4 h-4" />,
      });
    }

    setInsights(newInsights);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up")
      return <TrendingUp size={14} className="text-emerald-500" />;
    if (trend === "down")
      return <TrendingDown size={14} className="text-rose-500" />;
    return <Activity size={14} className="text-gray-400" />;
  };

  const getStatusColor = (
    value: number,
    type: "completion" | "rate" = "completion",
  ) => {
    if (type === "completion") {
      if (value >= 80)
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      if (value >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
      return "text-rose-600 bg-rose-50 border-rose-200";
    } else {
      if (value >= 80) return "text-emerald-600";
      if (value >= 60) return "text-amber-600";
      return "text-rose-600";
    }
  };

  const categoryColors = useMemo(
    () => [
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#d946ef",
      "#ec4899",
      "#f43f5e",
      "#fb7185",
      "#f97316",
      "#f59e0b",
      "#84cc16",
      "#22d3ee",
      "#06b6d4",
      "#3b82f6",
    ],
    [],
  );

  const getCategoryColor = useCallback(
    (index: number) => {
      return categoryColors[index % categoryColors.length];
    },
    [categoryColors],
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get(
        `/performance/export?period=${selectedPeriod}`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `performance-report-${selectedPeriod}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully");
    } catch (error) {
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (monthlyStats.length > 0 && yearlyStats.length === 0) {
      generateYearlyStatsFromMonthly(monthlyStats);
    }
  }, [monthlyStats]);

  // ==================== RADAR DATA ====================
  const radarData = useMemo(() => {
    const metrics = [
      {
        subject: "Productivity",
        value:
          performanceMetrics.find((m) => m.metric === "Productivity")?.value ||
          0,
      },
      {
        subject: "Quality",
        value:
          performanceMetrics.find((m) => m.metric === "Quality")?.value || 0,
      },
      {
        subject: "Efficiency",
        value:
          performanceMetrics.find((m) => m.metric === "Efficiency")?.value || 0,
      },
      {
        subject: "On-Time",
        value:
          performanceMetrics.find((m) => m.metric === "On-Time Delivery")
            ?.value || 0,
      },
    ];
    return metrics;
  }, [performanceMetrics]);

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6">
          {/* ==================== HEADER ==================== */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Performance Dashboard
                </h1>
                <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {selectedPeriod.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Track your productivity, achievements, and growth metrics
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                {["week", "month", "year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period as any)}
                    className={`px-3 py-1.5 rounded-md text-sm capitalize transition-all duration-200 ${
                      selectedPeriod === period
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fetchPerformanceData()}
                className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition shadow-sm"
                title="Refresh Data"
              >
                <Filter size={18} />
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
                title="Export Report"
              >
                {isExporting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
              </button>
            </div>
          </motion.div>

          {/* ==================== TABS ==================== */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: <TrendingUp size={16} />,
              },
              { id: "tasks", label: "Tasks", icon: <CheckCircle size={16} /> },
              {
                id: "analytics",
                label: "Analytics",
                icon: <BarChart3 size={16} />,
              },
              {
                id: "achievements",
                label: "Achievements",
                icon: <Trophy size={16} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ==================== INSIGHTS BANNER ==================== */}
          {insights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-xl border ${
                    insight.type === "positive"
                      ? "bg-emerald-50 border-emerald-200"
                      : insight.type === "warning"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 p-1 rounded-lg ${
                        insight.type === "positive"
                          ? "bg-emerald-100 text-emerald-600"
                          : insight.type === "warning"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {insight.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {insight.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === "overview" && (
            <>
              {/* Key Metrics Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {performanceMetrics.map((metric, index) => (
                  <motion.div
                    key={metric._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                        {metric.metric}
                      </p>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(metric.trend)}
                        <span
                          className={`text-xs font-medium ${
                            metric.trend === "up"
                              ? "text-emerald-600"
                              : metric.trend === "down"
                                ? "text-rose-600"
                                : "text-gray-500"
                          }`}
                        >
                          {metric.percentageChange > 0 ? "+" : ""}
                          {metric.percentageChange}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-800">
                        {metric.value}
                      </span>
                      <span className="text-sm text-gray-400">
                        {metric.unit}
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 group-hover:scale-x-105"
                        style={{ width: `${Math.min(metric.progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                      <span>
                        Target: {metric.target}
                        {metric.unit}
                      </span>
                      <span className="font-medium">{metric.progress}%</span>
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Radar Chart - Skills Overview */}
              {radarData.some((d) => d.value > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    Skills Overview
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                          dataKey="subject"
                          stroke="#6b7280"
                          fontSize={12}
                        />
                        <PolarRadiusAxis
                          stroke="#6b7280"
                          fontSize={10}
                          domain={[0, 100]}
                        />
                        <Radar
                          name="Performance"
                          dataKey="value"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.3}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                          formatter={(value: any) => {
                            if (value === undefined || value === null)
                              return ["0%", "Score"];
                            return [`${value}%`, "Score"];
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}

              {/* Task Performance Overview */}
              {taskPerformance.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    Task Performance Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                      <p className="text-2xl font-bold text-gray-800">
                        {taskPerformance.total}
                      </p>
                      <p className="text-xs text-gray-500">Total Tasks</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {taskPerformance.completed}
                      </p>
                      <p className="text-xs text-emerald-500">Completed</p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-center">
                      <p className="text-2xl font-bold text-indigo-600">
                        {Math.round(taskPerformance.completionRate)}%
                      </p>
                      <p className="text-xs text-indigo-500">Completion Rate</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {Math.round(taskPerformance.onTimeRate)}%
                      </p>
                      <p className="text-xs text-amber-500">On-Time Rate</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* ==================== TASKS TAB ==================== */}
          {activeTab === "tasks" && (
            <>
              {/* Task Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
              >
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Task Performance
                  </h3>
                  <p className="text-xs text-gray-500">
                    Detailed breakdown of your task completion
                  </p>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xl font-bold text-gray-800">
                        {taskPerformance.total}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-xl font-bold text-emerald-600">
                        {taskPerformance.completed}
                      </p>
                      <p className="text-xs text-emerald-500">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-xl font-bold text-amber-600">
                        {taskPerformance.pending}
                      </p>
                      <p className="text-xs text-amber-500">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xl font-bold text-blue-600">
                        {taskPerformance.inProgress}
                      </p>
                      <p className="text-xs text-blue-500">In Progress</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-xl font-bold text-purple-600">
                        {taskPerformance.submitted}
                      </p>
                      <p className="text-xs text-purple-500">Submitted</p>
                    </div>
                    <div className="text-center p-3 bg-rose-50 rounded-lg border border-rose-100">
                      <p className="text-xl font-bold text-rose-600">
                        {taskPerformance.overdue}
                      </p>
                      <p className="text-xs text-rose-500">Overdue</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-xl font-bold text-red-600">
                        {taskPerformance.rejected}
                      </p>
                      <p className="text-xs text-red-500">Rejected</p>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <p className="text-xl font-bold text-indigo-600">
                        {Math.round(taskPerformance.completionRate)}%
                      </p>
                      <p className="text-xs text-indigo-500">Completion</p>
                    </div>
                  </div>

                  {/* Priority Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Priority Distribution
                      </p>
                      <div className="space-y-2">
                        {Object.entries(taskPerformance.tasksByPriority).map(
                          ([priority, count]) => (
                            <div
                              key={priority}
                              className="flex items-center gap-3"
                            >
                              <span className="text-xs capitalize text-gray-600 w-16">
                                {priority}
                              </span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    priority === "urgent"
                                      ? "bg-rose-500"
                                      : priority === "high"
                                        ? "bg-amber-500"
                                        : priority === "normal"
                                          ? "bg-blue-500"
                                          : "bg-emerald-500"
                                  }`}
                                  style={{
                                    width:
                                      taskPerformance.total > 0
                                        ? `${(count / taskPerformance.total) * 100}%`
                                        : 0,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">
                                {count}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Key Metrics
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600">
                            Avg. Completion Time
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {taskPerformance.averageCompletionTime || 0}h
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600">
                            On-Time Rate
                          </span>
                          <span className="text-sm font-semibold text-emerald-600">
                            {taskPerformance.onTimeRate}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600">
                            Completion Rate
                          </span>
                          <span className="text-sm font-semibold text-indigo-600">
                            {Math.round(taskPerformance.completionRate)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Category Performance */}
              {categoryPerformance.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-indigo-600" />
                    Category Performance
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryPerformance}
                        layout="vertical"
                        margin={{ left: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#9ca3af"
                          fontSize={12}
                          width={70}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                          formatter={(value: any) => {
                            if (value === undefined || value === null)
                              return ["0%", "Completion"];
                            return [`${value}%`, "Completion"];
                          }}
                        />
                        <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                          {categoryPerformance.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || getCategoryColor(index)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* ==================== ANALYTICS TAB ==================== */}
          {activeTab === "analytics" && (
            <>
              {/* Productivity Chart */}
              {productivityData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      Productivity Trends
                    </h3>
                    <p className="text-xs text-gray-500">
                      Daily task completion and hours worked
                    </p>
                  </div>
                  <div className="p-5 pt-0">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={productivityData}>
                          <defs>
                            <linearGradient
                              id="completedGrad"
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
                              id="hoursGrad"
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
                            dataKey="date"
                            stroke="#9ca3af"
                            fontSize={12}
                          />
                          <YAxis stroke="#9ca3af" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="completed"
                            stroke="#6366f1"
                            fill="url(#completedGrad)"
                            name="Tasks Completed"
                          />
                          <Area
                            type="monotone"
                            dataKey="hours"
                            stroke="#10b981"
                            fill="url(#hoursGrad)"
                            name="Hours Worked"
                          />
                          <Area
                            type="monotone"
                            dataKey="tasksCreated"
                            stroke="#8b5cf6"
                            fill="none"
                            strokeDasharray="5 5"
                            name="Tasks Created"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Monthly/Yearly Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {monthlyStats.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      {selectedPeriod === "year"
                        ? "Yearly Overview"
                        : "Monthly Performance"}
                    </h3>
                    {selectedPeriod === "year" && yearlyStats.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-gray-800">
                              {yearlyStats.reduce(
                                (sum, y) => sum + y.totalTasks,
                                0,
                              )}
                            </p>
                            <p className="text-xs text-gray-500">Total Tasks</p>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                            <p className="text-2xl font-bold text-emerald-600">
                              {Math.round(
                                yearlyStats.reduce(
                                  (sum, y) => sum + y.completionRate,
                                  0,
                                ) / yearlyStats.length,
                              )}
                              %
                            </p>
                            <p className="text-xs text-emerald-500">
                              Avg. Completion
                            </p>
                          </div>
                          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-center">
                            <p className="text-2xl font-bold text-indigo-600">
                              {yearlyStats.reduce(
                                (sum, y) => sum + y.totalHours,
                                0,
                              )}
                            </p>
                            <p className="text-xs text-indigo-500">
                              Total Hours
                            </p>
                          </div>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yearlyStats}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                              />
                              <XAxis
                                dataKey="year"
                                stroke="#9ca3af"
                                fontSize={12}
                              />
                              <YAxis stroke="#9ca3af" fontSize={12} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                }}
                              />
                              <Legend />
                              <Bar
                                dataKey="totalTasks"
                                fill="#6366f1"
                                name="Total Tasks"
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="totalHours"
                                fill="#10b981"
                                name="Total Hours"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : monthlyStats.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={monthlyStats}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="month"
                              stroke="#9ca3af"
                              fontSize={12}
                            />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="tasksCreated"
                              fill="#8b5cf6"
                              name="Tasks Created"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="tasksCompleted"
                              fill="#6366f1"
                              name="Tasks Completed"
                              radius={[4, 4, 0, 0]}
                            />
                            <Line
                              type="monotone"
                              dataKey="completionRate"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="Completion Rate %"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">
                          No data available for this period
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Ratings */}
                {rating.total > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-indigo-600" />
                      Ratings & Feedback
                    </h3>
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-800">
                          {rating.average.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              className={
                                star <= Math.round(rating.average)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Based on {rating.total} reviews
                        </p>
                      </div>
                      <div className="flex-1 max-w-[200px] space-y-1.5">
                        {Object.entries(rating.distribution)
                          .reverse()
                          .map(([stars, count]) => (
                            <div
                              key={stars}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs text-gray-500 w-6">
                                {stars}★
                              </span>
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full transition-all duration-500"
                                  style={{
                                    width:
                                      rating.total > 0
                                        ? `${(count / rating.total) * 100}%`
                                        : 0,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">
                                {count}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    {rating.recentFeedback &&
                      rating.recentFeedback.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            Recent Feedback
                          </p>
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                            {rating.recentFeedback
                              .slice(0, 3)
                              .map((feedback) => (
                                <div
                                  key={feedback._id}
                                  className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            size={12}
                                            className={
                                              star <= feedback.rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs font-medium text-gray-600">
                                        {feedback.reviewer}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(
                                        feedback.createdAt,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {feedback.comment && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      "{feedback.comment}"
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </motion.div>
                )}
              </div>
            </>
          )}

          {/* ==================== ACHIEVEMENTS TAB ==================== */}
          {activeTab === "achievements" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-indigo-600" />
                    Achievements
                  </h3>
                  <p className="text-xs text-gray-500">
                    Badges and rewards earned
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {
                      achievements.filter((a) => a.progress === undefined)
                        .length
                    }{" "}
                    earned
                  </span>
                  <span className="text-xs text-gray-300">|</span>
                  <span className="text-xs text-gray-500">
                    {
                      achievements.filter((a) => a.progress !== undefined)
                        .length
                    }{" "}
                    in progress
                  </span>
                </div>
              </div>

              {achievements.length === 0 ? (
                <div className="text-center py-12">
                  <Medal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">
                    No achievements yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Complete tasks and maintain quality to earn badges
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {achievements.map((achievement) => (
                    <motion.div
                      key={achievement._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-4 rounded-xl border transition-all ${
                        achievement.progress !== undefined
                          ? "bg-gray-50 border-gray-200"
                          : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                            achievement.progress !== undefined
                              ? "bg-gray-200"
                              : "bg-gradient-to-br from-amber-400 to-orange-500 shadow-md"
                          }`}
                        >
                          {achievement.icon || "🏆"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {achievement.title}
                            </p>
                            {achievement.progress === undefined && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                                {achievement.points} pts
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                            {achievement.description}
                          </p>
                          {achievement.progress !== undefined && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                                <span>Progress</span>
                                <span>{Math.round(achievement.progress)}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(achievement.progress, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          {achievement.earnedAt &&
                            achievement.progress === undefined && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                Earned:{" "}
                                {new Date(
                                  achievement.earnedAt,
                                ).toLocaleDateString()}
                              </p>
                            )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
