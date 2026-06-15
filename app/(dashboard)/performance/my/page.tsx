"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp,
  Award,
  Star,
  CheckCircle,
  Clock,
  Calendar,
  Target,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Users,
  Briefcase,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Calendar as CalendarIcon,
  Filter,
  Eye,
  ThumbsUp,
  TrendingDown,
  Medal,
  Trophy,
  Flame,
  Sparkles,
} from "lucide-react";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart as ReLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  overdue: number;
  rejected: number;
  completionRate: number;
  onTimeRate: number;
}

interface ProductivityData {
  date: string;
  completed: number;
  submitted: number;
  hours: number;
}

interface CategoryPerformance {
  name: string;
  completed: number;
  total: number;
  percentage: number;
  color: string;
}

interface MonthlyStats {
  month: string;
  tasks: number;
  completionRate: number;
  avgHours: number;
}

interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  points: number;
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
}

export default function MyPerformancePage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");
  const [showFilters, setShowFilters] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);
  const [taskPerformance, setTaskPerformance] = useState<TaskPerformance>({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    rejected: 0,
    completionRate: 0,
    onTimeRate: 0,
  });
  const [productivityData, setProductivityData] = useState<ProductivityData[]>(
    [],
  );
  const [categoryPerformance, setCategoryPerformance] = useState<
    CategoryPerformance[]
  >([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [rating, setRating] = useState<Rating>({
    average: 0,
    total: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    tasks: true,
    productivity: true,
    categories: true,
    monthly: true,
    achievements: true,
    rating: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      fetchPerformanceData();
    }
  }, [user, selectedPeriod]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch all performance data in parallel
      const [
        metricsRes,
        taskStatsRes,
        productivityRes,
        categoryRes,
        monthlyRes,
        achievementsRes,
        ratingRes,
      ] = await Promise.all([
        api.get("/performance/metrics"),
        api.get("/performance/task-stats"),
        api.get(`/performance/productivity?period=${selectedPeriod}`),
        api.get("/performance/category-stats"),
        api.get("/performance/monthly-stats"),
        api.get("/performance/achievements"),
        api.get("/performance/ratings"),
      ]);

      if (metricsRes.data.success) setPerformanceMetrics(metricsRes.data.data);
      if (taskStatsRes.data.success) setTaskPerformance(taskStatsRes.data.data);
      if (productivityRes.data.success)
        setProductivityData(productivityRes.data.data);
      if (categoryRes.data.success)
        setCategoryPerformance(categoryRes.data.data);
      if (monthlyRes.data.success) setMonthlyStats(monthlyRes.data.data);
      if (achievementsRes.data.success)
        setAchievements(achievementsRes.data.data);
      if (ratingRes.data.success) setRating(ratingRes.data.data);
    } catch (error: any) {
      console.error("Error fetching performance data:", error);
      // Use mock data for demo
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = () => {
    setPerformanceMetrics([
      {
        _id: "1",
        metric: "Productivity",
        value: 85,
        target: 80,
        progress: 106,
        unit: "%",
        trend: "up",
        percentageChange: 5.2,
      },
      {
        _id: "2",
        metric: "Quality",
        value: 92,
        target: 90,
        progress: 102,
        unit: "%",
        trend: "up",
        percentageChange: 2.1,
      },
      {
        _id: "3",
        metric: "Efficiency",
        value: 78,
        target: 85,
        progress: 92,
        unit: "%",
        trend: "down",
        percentageChange: -3.5,
      },
      {
        _id: "4",
        metric: "On-Time Delivery",
        value: 88,
        target: 85,
        progress: 103,
        unit: "%",
        trend: "up",
        percentageChange: 4.8,
      },
    ]);

    setTaskPerformance({
      total: 45,
      completed: 32,
      pending: 8,
      inProgress: 3,
      overdue: 1,
      rejected: 1,
      completionRate: 71.1,
      onTimeRate: 84.2,
    });

    setProductivityData([
      { date: "Mon", completed: 5, submitted: 2, hours: 6.5 },
      { date: "Tue", completed: 7, submitted: 3, hours: 7.2 },
      { date: "Wed", completed: 4, submitted: 1, hours: 5.8 },
      { date: "Thu", completed: 8, submitted: 4, hours: 8.1 },
      { date: "Fri", completed: 6, submitted: 2, hours: 6.9 },
      { date: "Sat", completed: 2, submitted: 0, hours: 2.5 },
      { date: "Sun", completed: 0, submitted: 0, hours: 0 },
    ]);

    setCategoryPerformance([
      {
        name: "Development",
        completed: 15,
        total: 20,
        percentage: 75,
        color: "#6366f1",
      },
      {
        name: "Testing",
        completed: 8,
        total: 10,
        percentage: 80,
        color: "#10b981",
      },
      {
        name: "Documentation",
        completed: 5,
        total: 8,
        percentage: 62.5,
        color: "#f59e0b",
      },
      {
        name: "Meetings",
        completed: 4,
        total: 4,
        percentage: 100,
        color: "#ef4444",
      },
    ]);

    setMonthlyStats([
      { month: "Jan", tasks: 28, completionRate: 75, avgHours: 42 },
      { month: "Feb", tasks: 32, completionRate: 78, avgHours: 45 },
      { month: "Mar", tasks: 35, completionRate: 82, avgHours: 48 },
      { month: "Apr", tasks: 38, completionRate: 85, avgHours: 50 },
      { month: "May", tasks: 42, completionRate: 88, avgHours: 52 },
      { month: "Jun", tasks: 45, completionRate: 90, avgHours: 55 },
    ]);

    setAchievements([
      {
        _id: "1",
        title: "Task Master",
        description: "Completed 50 tasks",
        icon: "🏆",
        earnedAt: new Date().toISOString(),
        points: 100,
      },
      {
        _id: "2",
        title: "Early Bird",
        description: "Submitted 10 tasks before deadline",
        icon: "🐦",
        earnedAt: new Date().toISOString(),
        points: 50,
      },
      {
        _id: "3",
        title: "Quality Champion",
        description: "Maintained 95% quality score",
        icon: "⭐",
        earnedAt: new Date().toISOString(),
        points: 75,
      },
    ]);

    setRating({
      average: 4.5,
      total: 12,
      distribution: { 1: 0, 2: 0, 3: 2, 4: 4, 5: 6 },
    });
  };

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "up")
      return <TrendingUp size={14} className="text-emerald-400" />;
    if (trend === "down")
      return <TrendingDown size={14} className="text-rose-400" />;
    return <Activity size={14} className="text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6 ps-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  My Performance
                </h1>
              </div>
              <p className="text-slate-400 text-sm">
                Track your productivity, achievements, and growth metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-800/50 rounded-lg p-1">
                {["week", "month", "year"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period as any)}
                    className={`px-3 py-1.5 rounded-md text-sm capitalize transition ${
                      selectedPeriod === period
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition"
              >
                <Filter size={18} />
              </button>
              <button className="p-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition">
                <Download size={18} />
              </button>
            </div>
          </motion.div>

          {/* Key Metrics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {performanceMetrics.map((metric, idx) => (
              <div
                key={metric._id}
                className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-4 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">
                    {metric.metric}
                  </p>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span
                      className={`text-xs font-medium ${metric.trend === "up" ? "text-emerald-400" : metric.trend === "down" ? "text-rose-400" : "text-slate-400"}`}
                    >
                      {metric.percentageChange > 0 ? "+" : ""}
                      {metric.percentageChange}%
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-white">
                    {metric.value}
                  </span>
                  <span className="text-sm text-slate-500">{metric.unit}</span>
                </div>
                <div className="relative h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(metric.progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Target: {metric.target}
                  {metric.unit} • Progress: {metric.progress}%
                </p>
              </div>
            ))}
          </motion.div>

          {/* Task Performance Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 overflow-hidden"
          >
            <button
              onClick={() => toggleSection("tasks")}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Task Performance
                  </h3>
                  <p className="text-xs text-slate-400">
                    Overview of your task completion
                  </p>
                </div>
              </div>
              {expandedSections.tasks ? (
                <ChevronUp size={20} className="text-slate-400" />
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </button>

            {expandedSections.tasks && (
              <div className="p-5 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                  <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                    <p className="text-2xl font-bold text-white">
                      {taskPerformance.total}
                    </p>
                    <p className="text-xs text-slate-400">Total Tasks</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-400">
                      {taskPerformance.completed}
                    </p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                  <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-amber-400">
                      {taskPerformance.pending}
                    </p>
                    <p className="text-xs text-slate-400">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">
                      {taskPerformance.inProgress}
                    </p>
                    <p className="text-xs text-slate-400">In Progress</p>
                  </div>
                  <div className="text-center p-3 bg-rose-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-rose-400">
                      {taskPerformance.overdue}
                    </p>
                    <p className="text-xs text-slate-400">Overdue</p>
                  </div>
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-red-400">
                      {taskPerformance.rejected}
                    </p>
                    <p className="text-xs text-slate-400">Rejected</p>
                  </div>
                  <div className="text-center p-3 bg-purple-500/10 rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">
                      {taskPerformance.completionRate}%
                    </p>
                    <p className="text-xs text-slate-400">Completion Rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-white mb-3">
                      Completion Progress
                    </p>
                    <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${taskPerformance.completionRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      On-Time Rate: {taskPerformance.onTimeRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white mb-3">
                      Task Distribution
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-slate-400">
                          Completed ({taskPerformance.completed})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-xs text-slate-400">
                          Pending ({taskPerformance.pending})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-slate-400">
                          In Progress ({taskPerformance.inProgress})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Productivity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 overflow-hidden"
          >
            <button
              onClick={() => toggleSection("productivity")}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Productivity Trends
                  </h3>
                  <p className="text-xs text-slate-400">
                    Daily task completion and hours worked
                  </p>
                </div>
              </div>
              {expandedSections.productivity ? (
                <ChevronUp size={20} className="text-slate-400" />
              ) : (
                <ChevronDown size={20} className="text-slate-400" />
              )}
            </button>

            {expandedSections.productivity && (
              <div className="p-5 pt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        stackId="1"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.3}
                        name="Tasks Completed"
                      />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                        name="Hours Worked"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>

          {/* Category Performance & Monthly Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => toggleSection("categories")}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Category Performance
                    </h3>
                    <p className="text-xs text-slate-400">Tasks by category</p>
                  </div>
                </div>
                {expandedSections.categories ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>

              {expandedSections.categories && (
                <div className="p-5 pt-0">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="percentage"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        >
                          {categoryPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {categoryPerformance.map((cat) => (
                      <div
                        key={cat.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm text-slate-300">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-white">
                            {cat.completed}/{cat.total}
                          </span>
                          <span className="text-xs text-slate-400">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Monthly Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => toggleSection("monthly")}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Monthly Performance
                    </h3>
                    <p className="text-xs text-slate-400">
                      Task trends over time
                    </p>
                  </div>
                </div>
                {expandedSections.monthly ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>

              {expandedSections.monthly && (
                <div className="p-5 pt-0">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="tasks"
                          stroke="#6366f1"
                          strokeWidth={2}
                          name="Tasks"
                          dot={{ fill: "#6366f1" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="completionRate"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Completion Rate %"
                          dot={{ fill: "#10b981" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Achievements & Ratings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => toggleSection("achievements")}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Achievements
                    </h3>
                    <p className="text-xs text-slate-400">
                      Badges and rewards earned
                    </p>
                  </div>
                </div>
                {expandedSections.achievements ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>

              {expandedSections.achievements && (
                <div className="p-5 pt-0">
                  {achievements.length === 0 ? (
                    <div className="text-center py-8">
                      <Medal className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No achievements yet</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Complete tasks to earn badges
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {achievements.map((achievement) => (
                        <div
                          key={achievement._id}
                          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
                        >
                          <div className="w-10 h-10 bg-linear-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center text-xl">
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {achievement.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              {achievement.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-amber-400">
                              {achievement.points} pts
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {new Date(
                                achievement.earnedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Ratings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-linear-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => toggleSection("rating")}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Star className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Ratings & Feedback
                    </h3>
                    <p className="text-xs text-slate-400">
                      Performance reviews
                    </p>
                  </div>
                </div>
                {expandedSections.rating ? (
                  <ChevronUp size={20} className="text-slate-400" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400" />
                )}
              </button>

              {expandedSections.rating && (
                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white">
                        {rating.average}
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= rating.average
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-600"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Based on {rating.total} reviews
                      </p>
                    </div>
                    <div className="flex-1 max-w-50 space-y-2">
                      {Object.entries(rating.distribution)
                        .reverse()
                        .map(([stars, count]) => (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-6">
                              {stars}★
                            </span>
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-linear-to-r from-yellow-400 to-yellow-500 rounded-full"
                                style={{
                                  width: `${(count / rating.total) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-8">
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
