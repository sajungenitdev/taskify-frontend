// app/(dashboard)/workload/page.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Users,
  User,
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Search,
  Loader2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Zap,
  Target,
  Activity,
  Timer,
  Star,
  Award,
  AlertCircle,
  Plus,
  X,
  Info,
  Shield,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar as CalendarIcon,
  CheckCheck,
  Hourglass,
  Flame,
  Gauge,
  TrendingUp as TrendingUpIcon,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

interface TeamMember {
  user: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
    department: string;
    role: string;
    avatar?: string;
    profilePhoto?: string;
  };
  workload: {
    activeHours: number;
    completedHours: number;
    taskCount: number;
    completedTaskCount: number;
    capacityPercentage: number;
    statusColor: "green" | "amber" | "red";
    monthlyCapacity: number;
  };
  breakdown: {
    taskBreakdown: {
      pending: number;
      inProgress: number;
      submitted: number;
    };
    priorityDistribution: {
      low: number;
      normal: number;
      high: number;
      urgent: number;
    };
    upcomingDeadlines: Array<{
      _id: string;
      title: string;
      deadline: string;
      estimatedHours: number;
      priority: string;
      project: string;
    }>;
  };
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

export default function WorkloadCapacityPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [aggregates, setAggregates] = useState<Aggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "capacity" | "tasks">(
    "capacity",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(
    new Set(),
  );
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Overload Popup State
  const [showOverloadPopup, setShowOverloadPopup] = useState(false);
  const [overloadMember, setOverloadMember] = useState<TeamMember | null>(null);
  const [pendingTaskData, setPendingTaskData] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [overloadWarningAccepted, setOverloadWarningAccepted] = useState(false);

  // Helper function to check if image is base64
  const isBase64Image = useCallback(
    (imagePath: string | undefined): boolean => {
      if (!imagePath) return false;
      return imagePath.startsWith("data:image/");
    },
    [],
  );

  // Helper function to get image URL for a specific user
  const getImageUrl = useCallback(
    (member: TeamMember): string | null => {
      const imagePath = member.user.profilePhoto || member.user.avatar;
      if (!imagePath) return null;

      if (imageErrors[member.user._id]) return null;

      if (isBase64Image(imagePath)) {
        return imagePath;
      }

      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const baseUrl = apiUrl.replace("/api/v1", "");

      const path = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
      const timestamp = Date.now();
      return `${baseUrl}${path}?t=${timestamp}`;
    },
    [imageErrors, isBase64Image],
  );

  // Handle image error for a specific user
  const handleImageError = useCallback((userId: string) => {
    setImageErrors((prev) => ({
      ...prev,
      [userId]: true,
    }));
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch workload data
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkloadData();
    }
  }, [isAuthenticated]);

  const fetchWorkloadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/workload/capacity");

      if (response.data.success) {
        setTeamData(response.data.data || []);
        setAggregates(response.data.aggregates || null);
        setImageErrors({});
      } else {
        console.error("API returned error:", response.data.message);
        setError(response.data.message || "Failed to load workload data");
        toast.error(response.data.message || "Failed to load workload data");
      }
    } catch (error: any) {
      console.error("Error fetching workload data:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load workload data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ============ OVERLOAD CHECK ============
  const checkOverload = useCallback(
    (member: TeamMember, estimatedHours: number) => {
      const currentCapacity = member.workload.capacityPercentage;
      const newActiveHours = member.workload.activeHours + estimatedHours;
      const newCapacity = Math.min(
        Math.round((newActiveHours / member.workload.monthlyCapacity) * 100),
        200,
      );

      // If new capacity > 100%, show overload warning
      if (newCapacity > 100) {
        return {
          isOverload: true,
          currentCapacity,
          newCapacity,
          estimatedHours,
          activeHours: member.workload.activeHours,
          newActiveHours,
          monthlyCapacity: member.workload.monthlyCapacity,
          overloadAmount: newCapacity - 100,
        };
      }

      return {
        isOverload: false,
        currentCapacity,
        newCapacity,
        estimatedHours,
        activeHours: member.workload.activeHours,
        newActiveHours,
        monthlyCapacity: member.workload.monthlyCapacity,
        overloadAmount: 0,
      };
    },
    [],
  );

  // Handle task creation with overload check
  const handleCreateTask = useCallback(
    (taskData: any) => {
      // Find the assigned member
      const member = teamData.find((m) => m.user._id === taskData.assignedTo);
      if (!member) {
        // If member not found in workload data, proceed with task creation
        setPendingTaskData(taskData);
        setShowCreateModal(true);
        return;
      }

      const overloadCheck = checkOverload(member, taskData.estimatedHours || 0);

      if (overloadCheck.isOverload) {
        // Show overload popup
        setOverloadMember({
          ...member,
          overloadDetails: overloadCheck,
        } as any);
        setPendingTaskData(taskData);
        setOverloadWarningAccepted(false);
        setShowOverloadPopup(true);
      } else {
        // Proceed with task creation
        setPendingTaskData(taskData);
        setShowCreateModal(true);
      }
    },
    [teamData, checkOverload],
  );

  // Handle overload confirmation
  const handleOverloadConfirm = useCallback(() => {
    setOverloadWarningAccepted(true);
    setShowOverloadPopup(false);
    // Open create task modal with the pending task data
    setShowCreateModal(true);
  }, []);

  // Handle overload cancel
  const handleOverloadCancel = useCallback(() => {
    setShowOverloadPopup(false);
    setOverloadMember(null);
    setPendingTaskData(null);
    setOverloadWarningAccepted(false);
    toast.error("Task creation cancelled");
  }, []);

  // Handle task created successfully
  const handleTaskCreated = useCallback(() => {
    setShowCreateModal(false);
    setPendingTaskData(null);
    fetchWorkloadData();
    toast.success("Task created successfully!");
  }, []);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...teamData];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.user.fullName.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query) ||
          member.user.employeeId?.toLowerCase().includes(query) ||
          member.user.department?.toLowerCase().includes(query),
      );
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter(
        (member) => member.user.department === departmentFilter,
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.user.fullName.localeCompare(b.user.fullName);
          break;
        case "capacity":
          comparison =
            a.workload.capacityPercentage - b.workload.capacityPercentage;
          break;
        case "tasks":
          comparison = a.workload.taskCount - b.workload.taskCount;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [teamData, searchQuery, sortBy, sortOrder, departmentFilter]);

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(
      teamData.map((m) => m.user.department).filter(Boolean),
    );
    return Array.from(depts);
  }, [teamData]);

  // Toggle member expansion
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

  // Get color for capacity bar
  const getCapacityColor = (percentage: number) => {
    if (percentage > 100) return "bg-red-500";
    if (percentage > 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Get status icon
  const getStatusIcon = (statusColor: string) => {
    switch (statusColor) {
      case "green":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "amber":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "red":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get status text
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

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">
            {authLoading ? "Authenticating..." : "Loading workload data..."}
          </p>
          {loading && (
            <p className="text-xs text-gray-400 mt-2">
              {teamData.length > 0
                ? `Loaded ${teamData.length} members`
                : "Fetching data from server..."}
            </p>
          )}
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
            Failed to Load Data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchWorkloadData}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!teamData || teamData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No Team Members Found
            </h3>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
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
                Monitor team members' workload and capacity utilization
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchWorkloadData}
                className="px-4 py-2 bg-white border border-gray-200 hover:border-indigo-300 rounded-lg transition flex items-center gap-2 text-gray-700 hover:text-indigo-600"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={() => {
                  try {
                    const csv = [
                      [
                        "Name",
                        "Department",
                        "Active Hours",
                        "Capacity %",
                        "Tasks",
                        "Status",
                      ],
                      ...teamData.map((m) => [
                        m.user.fullName,
                        m.user.department || "N/A",
                        m.workload.activeHours,
                        m.workload.capacityPercentage,
                        m.workload.taskCount,
                        getStatusText(m.workload.statusColor),
                      ]),
                    ]
                      .map((row) => row.join(","))
                      .join("\n");

                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `workload_${new Date().toISOString().split("T")[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.success("Export started");
                  } catch (err) {
                    toast.error("Failed to export data");
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </motion.div>

          {/* Aggregates Summary */}
          {aggregates && (
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
                      Total Members
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {aggregates.totalMembers}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-500" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${(aggregates.utilizationDistribution.green / aggregates.totalMembers) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${(aggregates.utilizationDistribution.amber / aggregates.totalMembers) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${(aggregates.utilizationDistribution.red / aggregates.totalMembers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Active Hours
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {aggregates.totalActiveHours}h
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Total estimated hours across all tasks
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Total Tasks
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {aggregates.totalTasks}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Active tasks in progress
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium">
                      Avg Utilization
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        aggregates.averageUtilization > 100
                          ? "text-red-600"
                          : aggregates.averageUtilization > 80
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {aggregates.averageUtilization}%
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      aggregates.averageUtilization > 100
                        ? "bg-red-50"
                        : aggregates.averageUtilization > 80
                          ? "bg-amber-50"
                          : "bg-emerald-50"
                    }`}
                  >
                    <Activity
                      className={`w-5 h-5 ${
                        aggregates.averageUtilization > 100
                          ? "text-red-500"
                          : aggregates.averageUtilization > 80
                            ? "text-amber-500"
                            : "text-emerald-500"
                      }`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        aggregates.averageUtilization > 100
                          ? "bg-red-500"
                          : aggregates.averageUtilization > 80
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(aggregates.averageUtilization, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {aggregates.averageUtilization > 100 ? "Over" : "Under"}{" "}
                    capacity
                  </span>
                </div>
              </div>
            </motion.div>
          )}

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
              <div className="flex items-center gap-2">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="name">Sort by Name</option>
                  <option value="capacity">Sort by Capacity</option>
                  <option value="tasks">Sort by Tasks</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                >
                  {sortOrder === "asc" ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Team Members List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {filteredData.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  No team members found
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchQuery || departmentFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No workload data available for your team"}
                </p>
              </div>
            ) : (
              filteredData.map((member, index) => {
                const imageUrl = getImageUrl(member);
                const isOverCapacity = member.workload.capacityPercentage > 100;

                return (
                  <motion.div
                    key={member.user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                      isOverCapacity
                        ? "border-red-300 ring-1 ring-red-200"
                        : "border-gray-200"
                    }`}
                  >
                    {/* Member Row */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => toggleMemberExpansion(member.user._id)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full flex-shrink-0 shadow-sm overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={member.user.fullName}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(member.user._id)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white text-lg font-bold">
                                {member.user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-gray-800 font-medium">
                              {member.user.fullName}
                            </h3>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {member.user.employeeId || "N/A"}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {member.user.role}
                            </span>
                            {/* Over Capacity Badge */}
                            {isOverCapacity && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                <AlertCircle className="w-3 h-3" />
                                Over Capacity
                              </span>
                            )}
                            {member.workload.capacityPercentage > 80 &&
                              member.workload.capacityPercentage <= 100 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  Near Full
                                </span>
                              )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                            <span>{member.user.email}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>
                              {member.user.department || "No Department"}
                            </span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800">
                              {member.workload.activeHours}h
                            </p>
                            <p className="text-xs text-gray-400">Active</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800">
                              {member.workload.taskCount}
                            </p>
                            <p className="text-xs text-gray-400">Tasks</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-800">
                              {member.projects}
                            </p>
                            <p className="text-xs text-gray-400">Projects</p>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="w-32 md:w-40">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-sm font-bold ${
                                isOverCapacity
                                  ? "text-red-600"
                                  : member.workload.capacityPercentage > 80
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                              }`}
                            >
                              {member.workload.capacityPercentage}%
                            </span>
                            {getStatusIcon(member.workload.statusColor)}
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getCapacityColor(member.workload.capacityPercentage)}`}
                              style={{
                                width: `${Math.min(member.workload.capacityPercentage, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {getStatusText(member.workload.statusColor)}
                          </p>
                        </div>

                        {/* Expand Button */}
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMemberExpansion(member.user._id);
                          }}
                        >
                          {expandedMembers.has(member.user._id) ? (
                            <ChevronUp size={18} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={18} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedMembers.has(member.user._id) && (
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
                                  <Target
                                    size={14}
                                    className="text-indigo-500"
                                  />
                                  Task Breakdown
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                      Pending
                                    </span>
                                    <span className="font-medium text-gray-700">
                                      {member.breakdown.taskBreakdown.pending}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                      In Progress
                                    </span>
                                    <span className="font-medium text-amber-600">
                                      {
                                        member.breakdown.taskBreakdown
                                          .inProgress
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                      Submitted
                                    </span>
                                    <span className="font-medium text-purple-600">
                                      {member.breakdown.taskBreakdown.submitted}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                                    <span className="text-gray-500">
                                      Completed
                                    </span>
                                    <span className="font-medium text-emerald-600">
                                      {member.workload.completedTaskCount}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Priority Distribution */}
                              <div className="bg-white rounded-lg p-4 border border-gray-100">
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                  <AlertCircle
                                    size={14}
                                    className="text-amber-500"
                                  />
                                  Priority Distribution
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Low</span>
                                    <span className="font-medium text-emerald-600">
                                      {
                                        member.breakdown.priorityDistribution
                                          .low
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                      Normal
                                    </span>
                                    <span className="font-medium text-blue-600">
                                      {
                                        member.breakdown.priorityDistribution
                                          .normal
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">High</span>
                                    <span className="font-medium text-amber-600">
                                      {
                                        member.breakdown.priorityDistribution
                                          .high
                                      }
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                      Urgent
                                    </span>
                                    <span className="font-medium text-red-600">
                                      {
                                        member.breakdown.priorityDistribution
                                          .urgent
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Upcoming Deadlines */}
                              <div className="bg-white rounded-lg p-4 border border-gray-100">
                                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                  <Calendar
                                    size={14}
                                    className="text-red-500"
                                  />
                                  Upcoming Deadlines
                                </h4>
                                {member.breakdown.upcomingDeadlines.length ===
                                0 ? (
                                  <p className="text-sm text-gray-400">
                                    No upcoming deadlines
                                  </p>
                                ) : (
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {member.breakdown.upcomingDeadlines.map(
                                      (task) => (
                                        <div
                                          key={task._id}
                                          className="flex justify-between text-sm items-center"
                                        >
                                          <span className="text-gray-600 truncate max-w-[120px]">
                                            {task.title}
                                          </span>
                                          <span className="text-gray-400 text-xs">
                                            {new Date(
                                              task.deadline,
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* View Details Button */}
                            <div className="mt-4 flex justify-end">
                              <Link
                                href={`/workload/${member.user._id}`}
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
              })
            )}
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500 bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex-wrap"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded-full" />
              <span>Under 80% - Good Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded-full" />
              <span>81-100% - Near Full</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span>Over 100% - Over Capacity</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* OVERLOAD POPUP - Blocks assignment until manager confirms */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showOverloadPopup && overloadMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md"
            onClick={handleOverloadCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Warning Icon */}
              <div className="relative p-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25 animate-pulse">
                      <AlertCircle className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      ⚠️ Capacity Overload Warning
                      <span className="text-xs font-normal text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                        Action Required
                      </span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      This assignment would overload the team member. Please
                      review before proceeding.
                    </p>
                  </div>
                  <button
                    onClick={handleOverloadCancel}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Member Info */}
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {overloadMember.user.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {overloadMember.user.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {overloadMember.user.email} •{" "}
                      {overloadMember.user.department || "No Department"}
                    </p>
                  </div>
                </div>

                {/* Capacity Comparison */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">Current Capacity</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {overloadMember.workload.capacityPercentage}%
                    </p>
                    <p className="text-xs text-gray-400">
                      {overloadMember.workload.activeHours}h /{" "}
                      {overloadMember.workload.monthlyCapacity}h
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
                    <p className="text-xs text-red-500">New Capacity</p>
                    <p className="text-2xl font-bold text-red-600">
                      {Math.min(
                        Math.round(
                          ((overloadMember.workload.activeHours +
                            (pendingTaskData?.estimatedHours || 0)) /
                            overloadMember.workload.monthlyCapacity) *
                            100,
                        ),
                        200,
                      )}
                      %
                    </p>
                    <p className="text-xs text-red-500">
                      +{pendingTaskData?.estimatedHours || 0}h added
                    </p>
                  </div>
                </div>

                {/* Impact Details */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Impact of this assignment:
                      </p>
                      <ul className="text-xs text-amber-700 mt-1 space-y-1">
                        <li>
                          • This will push{" "}
                          {overloadMember.user.fullName.split(" ")[0]} to{" "}
                          <span className="font-bold">
                            {Math.min(
                              Math.round(
                                ((overloadMember.workload.activeHours +
                                  (pendingTaskData?.estimatedHours || 0)) /
                                  overloadMember.workload.monthlyCapacity) *
                                  100,
                              ),
                              200,
                            )}
                            %
                          </span>{" "}
                          capacity
                        </li>
                        <li>
                          • Overload by{" "}
                          <span className="font-bold">
                            {Math.max(
                              0,
                              Math.min(
                                Math.round(
                                  ((overloadMember.workload.activeHours +
                                    (pendingTaskData?.estimatedHours || 0)) /
                                    overloadMember.workload.monthlyCapacity) *
                                    100,
                                ),
                                200,
                              ) - 100,
                            )}
                            %
                          </span>{" "}
                          above capacity
                        </li>
                        <li>• May impact quality and delivery timeline</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleOverloadConfirm}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-lg transition flex items-center justify-center gap-2 shadow-md shadow-red-500/25"
                  >
                    <Shield className="w-4 h-4" />
                    Confirm Overload Assignment
                  </button>
                  <button
                    onClick={handleOverloadCancel}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center">
                  By confirming, you acknowledge that this assignment exceeds
                  the team member's recommended capacity.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setPendingTaskData(null);
        }}
        onTaskCreated={handleTaskCreated}
        initialData={pendingTaskData}
      />
    </div>
  );
}
