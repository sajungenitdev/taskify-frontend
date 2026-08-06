// app/(dashboard)/workload/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Search,
  Loader2,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Target,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  PieChart,
  User,
  Briefcase,
  Star,
  Award,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ============= Types =============
interface Department {
  _id: string;
  name: string;
  code?: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  department: string | Department | null;
  role: string;
  avatar?: string;
  profilePhoto?: string;
}

interface Workload {
  activeHours: number;
  completedHours: number;
  taskCount: number;
  completedTaskCount: number;
  activeTaskCount: number;
  capacityPercentage: number;
  statusColor: "green" | "amber" | "red";
  monthlyCapacity: number;
}

interface TaskBreakdown {
  pending: number;
  inProgress: number;
  submitted: number;
}

interface PriorityDistribution {
  low: number;
  normal: number;
  high: number;
  urgent: number;
}

interface UpcomingDeadline {
  _id: string;
  title: string;
  deadline: string;
  estimatedHours: number;
  priority: string;
  project: string;
}

interface Breakdown {
  taskBreakdown: TaskBreakdown;
  priorityDistribution: PriorityDistribution;
  upcomingDeadlines: UpcomingDeadline[];
}

interface TeamMember {
  user: User;
  workload: Workload;
  breakdown: Breakdown;
  projects: number;
}

interface Aggregates {
  totalMembers: number;
  totalActiveHours: number;
  totalTasks: number;
  averageUtilization: number;
  utilizationDistribution: {
    green: number;
    amber: number;
    red: number;
  };
}

// ============= Utility Functions =============
const getDepartmentDisplay = (dept: string | Department | null): string => {
  if (!dept) return "No Department";
  if (typeof dept === "string") return dept;
  return dept.name || "No Department";
};

const getDepartmentId = (dept: string | Department | null): string | null => {
  if (!dept) return null;
  if (typeof dept === "string") return dept;
  return dept._id || null;
};

const getDepartmentName = (dept: string | Department | null): string => {
  if (!dept) return "";
  if (typeof dept === "string") return dept;
  return dept.name || "";
};

const getInitials = (name: string): string => {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

// ============= Main Component =============
export default function WorkloadCapacityPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "capacity" | "tasks">("capacity");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // ============= Image Helpers =============
  const isBase64Image = useCallback((imagePath: string | undefined): boolean => {
    if (!imagePath) return false;
    return imagePath.startsWith("data:image/");
  }, []);

  const getImageUrl = useCallback(
    (member: TeamMember): string | null => {
      const imagePath = member.user?.profilePhoto || member.user?.avatar;
      if (!imagePath) return null;
      if (imageErrors[member.user?._id]) return null;
      if (isBase64Image(imagePath)) return imagePath;
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const baseUrl = apiUrl.replace("/api/v1", "");
      const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
      return `${baseUrl}${path}?t=${Date.now()}`;
    },
    [imageErrors, isBase64Image]
  );

  const handleImageError = useCallback((userId: string) => {
    setImageErrors((prev) => ({ ...prev, [userId]: true }));
  }, []);

  // ============= Authentication =============
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // ============= Fetch Data =============
  const fetchWorkloadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/workload/capacity");

      if (response.data.success) {
        const rawData = response.data.data || [];
        const rawAggregates = response.data.aggregates || null;

        // Sanitize and map the data
        const sanitizedData = rawData.map((member: any) => ({
          user: {
            _id: member.user?._id || member._id || 'unknown',
            fullName: member.user?.fullName || member.fullName || 'Unknown User',
            email: member.user?.email || member.email || '',
            employeeId: member.user?.employeeId || member.employeeId || member.employeeID || '',
            department: member.user?.department || member.department || null,
            role: member.user?.role || member.role || 'employee',
            avatar: member.user?.avatar || member.avatar,
            profilePhoto: member.user?.profilePhoto || member.profilePhoto,
          },
          workload: {
            activeHours: member.workload?.activeHours || 0,
            completedHours: member.workload?.completedHours || 0,
            taskCount: member.workload?.taskCount || 0,
            completedTaskCount: member.workload?.completedTaskCount || 0,
            activeTaskCount: member.workload?.activeTaskCount || 0,
            capacityPercentage: member.workload?.capacityPercentage || 0,
            statusColor: member.workload?.statusColor || "green",
            monthlyCapacity: member.workload?.monthlyCapacity || 160,
          },
          breakdown: {
            taskBreakdown: {
              pending: member.breakdown?.taskBreakdown?.pending || 0,
              inProgress: member.breakdown?.taskBreakdown?.inProgress || 0,
              submitted: member.breakdown?.taskBreakdown?.submitted || 0,
            },
            priorityDistribution: {
              low: member.breakdown?.priorityDistribution?.low || 0,
              normal: member.breakdown?.priorityDistribution?.normal || 0,
              high: member.breakdown?.priorityDistribution?.high || 0,
              urgent: member.breakdown?.priorityDistribution?.urgent || 0,
            },
            upcomingDeadlines: member.breakdown?.upcomingDeadlines || [],
          },
          projects: member.projects || 0,
        }));

        // Calculate aggregates if not provided
        let finalAggregates = rawAggregates;
        if (!finalAggregates) {
          const totalMembers = sanitizedData.length;
          let totalActiveHours = 0;
          let totalTasks = 0;
          let totalCapacity = 0;
          let green = 0,
            amber = 0,
            red = 0;

          sanitizedData.forEach((member: TeamMember) => {
            totalActiveHours += member.workload.activeHours || 0;
            totalTasks += member.workload.taskCount || 0;
            const cap = member.workload.capacityPercentage || 0;
            totalCapacity += cap;

            if (cap <= 70) green++;
            else if (cap <= 90) amber++;
            else red++;
          });

          finalAggregates = {
            totalMembers,
            totalActiveHours,
            totalTasks,
            averageUtilization: totalMembers > 0 ? Math.round(totalCapacity / totalMembers) : 0,
            utilizationDistribution: { green, amber, red }
          };
        }

        setTeamData(sanitizedData);
        setAggregates(finalAggregates);
        setImageErrors({});

        toast.success(`Loaded ${sanitizedData.length} team members`);
      } else {
        throw new Error(response.data.message || "Failed to load workload data");
      }
    } catch (error: any) {
      console.error("Error fetching workload data:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to load workload data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkloadData();
    }
  }, [isAuthenticated, fetchWorkloadData]);

  // ============= Departments =============
  const departments = useMemo(() => {
    const deptMap = new Map<string, { id: string; name: string }>();

    teamData.forEach((member) => {
      const dept = member.user?.department;
      if (!dept) return;

      if (typeof dept === "string") {
        if (!deptMap.has(dept)) {
          deptMap.set(dept, { id: dept, name: dept });
        }
      } else {
        const id = dept._id || dept.name;
        if (id && !deptMap.has(id)) {
          deptMap.set(id, { id: id, name: dept.name || id });
        }
      }
    });

    return Array.from(deptMap.values());
  }, [teamData]);

  // ============= Filtering and Sorting =============
  const filteredData = useMemo(() => {
    let filtered = [...teamData];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((member) => {
        const deptStr = getDepartmentDisplay(member.user?.department).toLowerCase();
        return (
          member.user?.fullName?.toLowerCase().includes(query) ||
          member.user?.email?.toLowerCase().includes(query) ||
          member.user?.employeeId?.toLowerCase().includes(query) ||
          deptStr.includes(query)
        );
      });
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((member) => {
        const deptId = getDepartmentId(member.user?.department);
        const deptName = getDepartmentName(member.user?.department);
        return deptId === departmentFilter || deptName === departmentFilter;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.user?.fullName || "").localeCompare(b.user?.fullName || "");
          break;
        case "capacity":
          comparison = (a.workload?.capacityPercentage || 0) - (b.workload?.capacityPercentage || 0);
          break;
        case "tasks":
          comparison = (a.workload?.taskCount || 0) - (b.workload?.taskCount || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [teamData, searchQuery, sortBy, sortOrder, departmentFilter]);

  // ============= UI Helpers =============
  const toggleMemberExpansion = (memberId: string) => {
    setExpandedMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getCapacityTextColor = (percentage: number) => {
    if (percentage > 90) return "text-red-600";
    if (percentage > 70) return "text-amber-600";
    return "text-emerald-600";
  };

  const getStatusIcon = (statusColor: string) => {
    switch (statusColor) {
      case "green":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "amber":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "red":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (statusColor: string) => {
    switch (statusColor) {
      case "green":
        return "Good Capacity";
      case "amber":
        return "Near Full";
      case "red":
        return "Over Capacity";
      default:
        return "Unknown";
    }
  };

  const getStatusBadgeColor = (statusColor: string) => {
    switch (statusColor) {
      case "green":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "red":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleExport = () => {
    try {
      const headers = ["Name", "Department", "Role", "Total Tasks", "Completed", "Active", "Capacity %", "Status"];
      const rows = teamData.map((m) => [
        m.user?.fullName || "Unknown",
        getDepartmentDisplay(m.user?.department),
        m.user?.role || "N/A",
        m.workload?.taskCount || 0,
        m.workload?.completedTaskCount || 0,
        m.workload?.activeTaskCount || 0,
        m.workload?.capacityPercentage || 0,
        getStatusText(m.workload?.statusColor || ""),
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workload_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Export started");
    } catch (err) {
      toast.error("Failed to export data");
    }
  };

  // ============= Loading State =============
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">
            {authLoading ? "Authenticating..." : "Loading workload data..."}
          </p>
        </div>
      </div>
    );
  }

  // ============= Error State =============
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchWorkloadData}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2 mx-auto shadow-sm"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============= Empty State =============
  if (!teamData || teamData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Team Members Found</h3>
            <p className="text-gray-500 mb-6">
              {user?.role === "employee"
                ? "You don't have any team members to view."
                : "No team members have been assigned to you yet."}
            </p>
            <button
              onClick={fetchWorkloadData}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============= Main Render =============
  const displayAggregates = aggregates || {
    totalMembers: teamData.length,
    totalActiveHours: teamData.reduce((sum, m) => sum + (m.workload?.activeHours || 0), 0),
    totalTasks: teamData.reduce((sum, m) => sum + (m.workload?.taskCount || 0), 0),
    averageUtilization: Math.round(teamData.reduce((sum, m) => sum + (m.workload?.capacityPercentage || 0), 0) / teamData.length),
    utilizationDistribution: {
      green: teamData.filter(m => (m.workload?.capacityPercentage || 0) <= 70).length,
      amber: teamData.filter(m => (m.workload?.capacityPercentage || 0) > 70 && (m.workload?.capacityPercentage || 0) <= 90).length,
      red: teamData.filter(m => (m.workload?.capacityPercentage || 0) > 90).length,
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
          >
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <BarChart3 className="w-7 h-7 text-indigo-500" />
                Team Workload Capacity
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Monitor team members' workload, task distribution, and capacity utilization
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                {viewMode === "grid" ? "List View" : "Grid View"}
              </button>
              <button
                onClick={fetchWorkloadData}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 rounded-lg transition flex items-center gap-2 text-gray-700 hover:text-indigo-600"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </motion.div>

          {/* Aggregates Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Total Members</p>
                  <p className="text-2xl font-bold text-gray-800">{displayAggregates.totalMembers}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(displayAggregates.utilizationDistribution.green / Math.max(displayAggregates.totalMembers, 1)) * 100}%` }}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${(displayAggregates.utilizationDistribution.amber / Math.max(displayAggregates.totalMembers, 1)) * 100}%` }}
                  />
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${(displayAggregates.utilizationDistribution.red / Math.max(displayAggregates.totalMembers, 1)) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Good: {displayAggregates.utilizationDistribution.green}</span>
                <span>Near: {displayAggregates.utilizationDistribution.amber}</span>
                <span>Over: {displayAggregates.utilizationDistribution.red}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-800">{displayAggregates.totalTasks}</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {teamData.reduce((sum, m) => sum + (m.workload?.completedTaskCount || 0), 0)} completed
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Active Hours</p>
                  <p className="text-2xl font-bold text-gray-800">{displayAggregates.totalActiveHours}h</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Estimated workload hours</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium">Avg Utilization</p>
                  <p
                    className={`text-2xl font-bold ${getCapacityTextColor(displayAggregates.averageUtilization)}`}
                  >
                    {displayAggregates.averageUtilization}%
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${displayAggregates.averageUtilization > 90
                      ? "bg-red-50"
                      : displayAggregates.averageUtilization > 70
                        ? "bg-amber-50"
                        : "bg-emerald-50"
                    }`}
                >
                  <Activity
                    className={`w-5 h-5 ${displayAggregates.averageUtilization > 90
                        ? "text-red-500"
                        : displayAggregates.averageUtilization > 70
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getCapacityColor(displayAggregates.averageUtilization)}`}
                    style={{ width: `${Math.min(displayAggregates.averageUtilization, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {displayAggregates.averageUtilization > 90 ? "Over" : displayAggregates.averageUtilization > 70 ? "Near" : "Good"} capacity
                </span>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="capacity">Sort by Capacity</option>
                  <option value="name">Sort by Name</option>
                  <option value="tasks">Sort by Tasks</option>
                </select>
                <button
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                >
                  {sortOrder === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {(searchQuery || departmentFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDepartmentFilter("all");
                    }}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Team Members List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {filteredData.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No team members found</h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery || departmentFilter !== "all" ? "Try adjusting your filters" : "No workload data available for your team"}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredData.map((member, index) => {
                  const imageUrl = getImageUrl(member);
                  const workload = member.workload;
                  const breakdown = member.breakdown;

                  return (
                    <motion.div
                      key={member.user?._id || index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                    >
                      <div className="p-5">
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full flex-shrink-0 shadow-sm overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={member.user?.fullName || "User"}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(member.user?._id)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-white text-lg font-bold">
                                  {getInitials(member.user?.fullName || "User")}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-gray-800 font-semibold truncate">
                              {member.user?.fullName || "Unknown"}
                            </h3>
                            <p className="text-xs text-gray-400 truncate">
                              {member.user?.email || "No email"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {member.user?.role || "N/A"}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {getDepartmentDisplay(member.user?.department)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-gray-800">{workload.taskCount}</p>
                            <p className="text-[10px] text-gray-400">Total Tasks</p>
                          </div>
                          <div className="text-center bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-emerald-600">{workload.completedTaskCount}</p>
                            <p className="text-[10px] text-gray-400">Completed</p>
                          </div>
                          <div className="text-center bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-bold text-amber-600">{workload.activeTaskCount}</p>
                            <p className="text-[10px] text-gray-400">Active</p>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Capacity</span>
                            <span className={`text-sm font-bold ${getCapacityTextColor(workload.capacityPercentage)}`}>
                              {workload.capacityPercentage}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getCapacityColor(workload.capacityPercentage)}`}
                              style={{ width: `${Math.min(workload.capacityPercentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-400">
                              {getStatusText(workload.statusColor)}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {workload.activeHours}h / {workload.monthlyCapacity}h
                            </span>
                          </div>
                        </div>

                        {/* Task Breakdown */}
                        <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-3">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">Pending: <span className="font-medium text-gray-700">{breakdown.taskBreakdown.pending}</span></span>
                            <span className="text-gray-500">In Progress: <span className="font-medium text-amber-600">{breakdown.taskBreakdown.inProgress}</span></span>
                          </div>
                          <Link
                            href={`/workload/${member.user?._id}`}
                            className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                          >
                            View <Eye size={14} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              // List View
              <div className="space-y-4">
                {filteredData.map((member, index) => {
                  const imageUrl = getImageUrl(member);
                  const isExpanded = expandedMembers.has(member.user?._id);
                  const workload = member.workload;
                  const breakdown = member.breakdown;
                  const deptDisplay = getDepartmentDisplay(member.user?.department);

                  return (
                    <motion.div
                      key={member.user?._id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Member Row */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => toggleMemberExpansion(member.user?._id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full flex-shrink-0 shadow-sm overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={member.user?.fullName || "User"}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(member.user?._id)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-white text-lg font-bold">
                                  {getInitials(member.user?.fullName || "User")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-gray-800 font-medium">{member.user?.fullName || "Unknown"}</h3>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {member.user?.employeeId || "N/A"}
                              </span>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {member.user?.role || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                              <span>{member.user?.email || "No email"}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span>{deptDisplay}</span>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="hidden md:flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-sm font-semibold text-gray-800">{workload.taskCount}</p>
                              <p className="text-xs text-gray-400">Total Tasks</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-emerald-600">{workload.completedTaskCount}</p>
                              <p className="text-xs text-gray-400">Completed</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-amber-600">{workload.activeTaskCount}</p>
                              <p className="text-xs text-gray-400">Active</p>
                            </div>
                          </div>

                          {/* Capacity Bar */}
                          <div className="w-32 md:w-40">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-bold ${getCapacityTextColor(workload.capacityPercentage)}`}>
                                {workload.capacityPercentage}%
                              </span>
                              {getStatusIcon(workload.statusColor)}
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getCapacityColor(workload.capacityPercentage)}`}
                                style={{ width: `${Math.min(workload.capacityPercentage, 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5 text-center">
                              {getStatusText(workload.statusColor)}
                            </p>
                          </div>

                          {/* Expand Button */}
                          <button
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMemberExpansion(member.user?._id);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp size={18} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-gray-100"
                          >
                            <div className="p-4 bg-gray-50">
                              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Task Breakdown */}
                                <div className="bg-white rounded-lg p-4 border border-gray-100">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <Target size={14} className="text-indigo-500" />
                                    Task Breakdown
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Pending</span>
                                      <span className="font-medium text-gray-700">
                                        {breakdown.taskBreakdown.pending}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">In Progress</span>
                                      <span className="font-medium text-amber-600">
                                        {breakdown.taskBreakdown.inProgress}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Completed</span>
                                      <span className="font-medium text-emerald-600">
                                        {breakdown.taskBreakdown.submitted}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-100">
                                      <span className="text-gray-700">Total</span>
                                      <span className="text-gray-800">
                                        {breakdown.taskBreakdown.pending + breakdown.taskBreakdown.inProgress + breakdown.taskBreakdown.submitted}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Priority Distribution */}
                                <div className="bg-white rounded-lg p-4 border border-gray-100">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <AlertCircle size={14} className="text-amber-500" />
                                    Priority Distribution
                                  </h4>
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Low</span>
                                      <span className="font-medium text-emerald-600">
                                        {breakdown.priorityDistribution.low}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Normal</span>
                                      <span className="font-medium text-blue-600">
                                        {breakdown.priorityDistribution.normal}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">High</span>
                                      <span className="font-medium text-amber-600">
                                        {breakdown.priorityDistribution.high}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Urgent</span>
                                      <span className="font-medium text-red-600">
                                        {breakdown.priorityDistribution.urgent}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Upcoming Deadlines */}
                                <div className="bg-white rounded-lg p-4 border border-gray-100">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <Calendar size={14} className="text-red-500" />
                                    Upcoming Deadlines
                                  </h4>
                                  {breakdown.upcomingDeadlines.length === 0 ? (
                                    <p className="text-sm text-gray-400">No upcoming deadlines</p>
                                  ) : (
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                      {breakdown.upcomingDeadlines.map((task) => (
                                        <div key={task._id} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                                          <span className="text-gray-600 truncate max-w-[140px]">
                                            {task.title}
                                          </span>
                                          <span className="text-gray-400 text-xs">
                                            {formatDate(task.deadline)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* View Details Button */}
                              <div className="mt-4 flex justify-end">
                                <Link
                                  href={`/workload/${member.user?._id}`}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 text-sm shadow-sm"
                                >
                                  <Eye size={14} />
                                  View Full Details
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span>0-70% - Good Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span>71-90% - Near Full</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>91%+ - Over Capacity</span>
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <span className="text-xs text-gray-400">
              {teamData.length} members • {displayAggregates.totalTasks} total tasks
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}