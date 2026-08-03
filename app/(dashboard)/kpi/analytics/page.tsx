// app/(dashboard)/kpi/analytics/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Crown,
  Target,
  AlertCircle,
  Gauge,
  Lightbulb,
  Building2,
  Grid,
  Home,
  ChevronRight,
  RefreshCw,
  MinusCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import InsightsTab from "@/components/kpi/InsightsTab";
import ComparisonsTab from "@/components/kpi/ComparisonsTab";
import HeatMapTab from "@/components/kpi/HeatMapTab";
import PredictionsTab from "@/components/kpi/PredictionsTab";

// Types
interface Insight {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

interface Prediction {
  month: string;
  predictedScore: number;
  confidence: "low" | "medium" | "high";
  trend: "up" | "down" | "stable";
}

interface Recommendation {
  area: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
}

interface Anomaly {
  employeeId: string;
  employeeName: string;
  department: string;
  score: number;
  expectedScore: number;
  deviation: number;
  type: "high_performer" | "low_performer";
  severity: "critical" | "high" | "medium" | "low";
}

interface AnalyticsData {
  insights: Insight[];
  predictions: Prediction[];
  recommendations: Recommendation[];
  anomalies: Anomaly[];
  summary: {
    totalEmployees: number;
    averageScore: number;
    maxScore: number;
    minScore: number;
    stdDev: number;
    distribution: {
      excellent: number;
      good: number;
      average: number;
      needs_improvement: number;
    };
  };
  departmentStats: Array<{
    departmentId: string;
    departmentName: string;
    averageScore: number;
    employeeCount: number;
    minScore: number;
    maxScore: number;
    stdDev: number;
  }>;
}

interface DepartmentComparison {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalEmployees: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  components: {
    taskCompletion: number;
    qualityScore: number;
    efficiency: number;
    collaboration: number;
    innovation: number;
    attendance: number;
  };
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
  };
}

interface HeatMapData {
  employeeId: string;
  employeeName: string;
  department: string;
  taskCompletion: number;
  qualityScore: number;
  efficiency: number;
  collaboration: number;
  innovation: number;
  attendance: number;
  totalScore: number;
  performanceLevel: string;
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function KPIAnalyticsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [departmentComparisons, setDepartmentComparisons] = useState<
    DepartmentComparison[]
  >([]);
  const [heatMapData, setHeatMapData] = useState<HeatMapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "insights" | "comparisons" | "heatmap" | "predictions"
  >("insights");

  const canManage = hasRole([
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
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

  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  const isFetching = useRef(false);
  const isInitialized = useRef(false);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch departments function
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success && isMounted.current) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  // Fetch all data function
  const fetchAllData = useCallback(async () => {
    if (isFetching.current || !isMounted.current) return;

    try {
      isFetching.current = true;
      setLoading(true);

      const monthIndex = months.indexOf(selectedMonth) + 1;

      const [analyticsRes, comparisonsRes, heatmapRes] = await Promise.all([
        api.get("/kpi-analytics/insights", {
          params: {
            departmentId: selectedDepartment,
            month: monthIndex,
            year: selectedYear,
          },
        }),
        api.get("/kpi-analytics/department-comparisons", {
          params: {
            month: monthIndex,
            year: selectedYear,
          },
        }),
        api.get("/kpi-analytics/heatmap", {
          params: {
            departmentId: selectedDepartment,
            month: monthIndex,
            year: selectedYear,
          },
        }),
      ]);

      if (!isMounted.current) return;

      if (analyticsRes.data.success) {
        setAnalyticsData(analyticsRes.data.data);
      }

      if (comparisonsRes.data.success) {
        setDepartmentComparisons(comparisonsRes.data.data.departments || []);
      }

      if (heatmapRes.data.success) {
        setHeatMapData(heatmapRes.data.data.heatMapData || []);
      }
    } catch (error: any) {
      console.error("Error fetching analytics data:", error);
      if (isMounted.current) {
        toast.error(
          error.response?.data?.message || "Failed to fetch analytics data",
        );
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        isFetching.current = false;
      }
    }
  }, [selectedMonth, selectedYear, selectedDepartment, months]);

  // Initialize selected month - using a ref to prevent the warning
  useEffect(() => {
    if (!selectedMonth && !isInitialized.current) {
      isInitialized.current = true;
      setSelectedMonth(currentMonth);
    }
  }, [selectedMonth, currentMonth]);

  // Load departments - using a separate effect with proper cleanup
  useEffect(() => {
    let isActive = true;

    if (canManage) {
      const loadDepartments = async () => {
        try {
          const response = await api.get("/departments");
          if (response.data.success && isActive) {
            setDepartments(response.data.data || []);
          }
        } catch (error) {
          console.error("Error fetching departments:", error);
        }
      };
      loadDepartments();
    }

    return () => {
      isActive = false;
    };
  }, [canManage]);

  // Load analytics data when filters change
  useEffect(() => {
    if (selectedMonth && !isFetching.current) {
      fetchAllData();
    }
  }, [selectedMonth, selectedYear, selectedDepartment, fetchAllData]);

  // Helper functions
  const getImpactColor = (impact: string) => {
    const colors: Record<string, string> = {
      high: "text-rose-600 bg-rose-50 border-rose-200",
      medium: "text-amber-600 bg-amber-50 border-amber-200",
      low: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return colors[impact] || colors.low;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "text-rose-600 bg-rose-50 border-rose-200",
      medium: "text-amber-600 bg-amber-50 border-amber-200",
      low: "text-blue-600 bg-blue-50 border-blue-200",
    };
    return colors[priority] || colors.low;
  };

  const getConfidenceColor = (confidence: string) => {
    const colors: Record<string, string> = {
      high: "text-emerald-600 bg-emerald-50",
      medium: "text-amber-600 bg-amber-50",
      low: "text-rose-600 bg-rose-50",
    };
    return colors[confidence] || colors.low;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={14} className="text-emerald-500" />;
      case "down":
        return <TrendingDown size={14} className="text-rose-500" />;
      default:
        return <MinusCircle size={14} className="text-amber-500" />;
    }
  };

  const getPerformanceConfig = (level: string) => {
    const config: Record<string, any> = {
      excellent: {
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        icon: Crown,
        label: "Excellent",
        emoji: "🌟",
      },
      good: {
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: Award,
        label: "Good",
        emoji: "⭐",
      },
      average: {
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: Award,
        label: "Average",
        emoji: "📊",
      },
      needs_improvement: {
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: AlertCircle,
        label: "Needs Improvement",
        emoji: "📈",
      },
    };
    return config[level] || config.average;
  };

  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            You don't have permission to view this page
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">
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
            <span className="text-gray-700 font-medium">KPI Analytics</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    KPI Analytics
                  </h1>
                  <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AI-powered insights and performance predictions
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fetchAllData()}
                disabled={loading}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 hover:bg-gray-50/80 text-gray-600 hover:text-gray-800 rounded-xl transition text-sm flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Summary Cards */}
          {analyticsData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-5 gap-4"
            >
              {[
                {
                  label: "Total Employees",
                  value: analyticsData.summary.totalEmployees,
                  icon: Users,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  label: "Average Score",
                  value: `${analyticsData.summary.averageScore}%`,
                  icon: Target,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  label: "Highest Score",
                  value: `${analyticsData.summary.maxScore}%`,
                  icon: Crown,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Lowest Score",
                  value: `${analyticsData.summary.minScore}%`,
                  icon: AlertCircle,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  label: "Std Deviation",
                  value: analyticsData.summary.stdDev.toFixed(1),
                  icon: Gauge,
                  color: "text-cyan-600",
                  bg: "bg-cyan-50",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${stat.bg} rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {stat.label}
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-gray-200 shadow-sm"
          >
            {[
              { id: "insights", icon: Lightbulb, label: "AI Insights" },
              {
                id: "comparisons",
                icon: Building2,
                label: "Department Comparisons",
              },
              { id: "heatmap", icon: Grid, label: "Heat Map" },
              { id: "predictions", icon: TrendingUp, label: "Predictions" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100/80"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-medium animate-pulse">
                  Analyzing data...
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "insights" && analyticsData && (
                <InsightsTab
                  analyticsData={analyticsData}
                  getImpactColor={getImpactColor}
                  getPriorityColor={getPriorityColor}
                  getPerformanceConfig={getPerformanceConfig}
                  formatScore={formatScore}
                  onViewEmployee={(userId: string) =>
                    router.push(`/kpi/employee/${userId}`)
                  }
                />
              )}
              {activeTab === "comparisons" && (
                <ComparisonsTab
                  departmentComparisons={departmentComparisons}
                  selectedDepartment={selectedDepartment}
                  formatScore={formatScore}
                  getPerformanceConfig={getPerformanceConfig}
                  COLORS={COLORS}
                />
              )}
              {activeTab === "heatmap" && (
                <HeatMapTab
                  heatMapData={heatMapData}
                  selectedDepartment={selectedDepartment}
                  departments={departments}
                  formatScore={formatScore}
                  getPerformanceConfig={getPerformanceConfig}
                  onViewEmployee={(userId: string) =>
                    router.push(`/kpi/employee/${userId}`)
                  }
                />
              )}
              {activeTab === "predictions" && analyticsData && (
                <PredictionsTab
                  analyticsData={{ predictions: analyticsData.predictions }}
                  getTrendIcon={getTrendIcon}
                  getConfidenceColor={getConfidenceColor}
                  formatScore={formatScore}
                  selectedDepartment={selectedDepartment}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
