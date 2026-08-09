// app/hr/leaves/page.tsx

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  ChevronDown,
  Eye,
  Loader2,
  Sparkles,
  Building2,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Timer,
  UserCheck,
  UserX,
  Clock as ClockIcon,
  FileText,
  Printer,
  Mail,
  Phone,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  MessageSquare,
  Paperclip,
  Send,
  Ban,
  UserPlus,
  UsersRound,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Filter as FilterIcon,
  CalendarDays,
  Hourglass,
  Shield,
  Crown,
  UserCog,
  Home,
  ChevronRight as ChevronRightIcon,
  MoreVertical,
  Star,
  Bell,
  Clock8,
  CalendarClock,
  Plane,
  Heart,
  Stethoscope,
  Baby,
  GraduationCap,
  Briefcase as BriefcaseIcon,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  AlertTriangle,
  Info,
  FileCheck,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { badgeService } from "@/lib/badgeService";

// ============================================================================
// TYPES
// ============================================================================

interface LeaveRequest {
  _id: string;
  employeeId: {
    _id: string;
    fullName: string;
    email: string;
    employeeId?: string;
    departmentId?:
      | {
          _id: string;
          name: string;
          code: string;
        }
      | string;
    position?: string;
    profilePhoto?: string;
  };
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  substituteId?: string;
  substituteName?: string;
  substituteEmail?: string;
  signature?: string;
  attachments?: string[];
  notes?: string;
  approvedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  isHalfDay: boolean;
  halfDayType?: string;
  isPreviousDayOff: boolean;
  isNextDayOff: boolean;
  isGovernmentHoliday: boolean;
  holidayNote?: string;
  contactDuringLeave?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  rejectionReason?: string;
  employeeName?: string;
  employeeEmail?: string;
  departmentName?: string;
}

type ViewMode = "grid" | "table";
type LeaveStatus = "all" | "pending" | "approved" | "rejected" | "cancelled";

// ============================================================================
// CONSTANTS
// ============================================================================

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual Leave",
  sick: "Sick Leave",
  casual: "Casual Leave",
  maternity: "Maternity Leave",
  paternity: "Paternity Leave",
  bereavement: "Bereavement Leave",
  unpaid: "Unpaid Leave",
  earned: "Earned Leave",
  other: "Other Leave",
};

const leaveTypeColors: Record<string, string> = {
  annual: "bg-blue-100 text-blue-700 border-blue-200",
  sick: "bg-rose-100 text-rose-700 border-rose-200",
  casual: "bg-emerald-100 text-emerald-700 border-emerald-200",
  maternity: "bg-pink-100 text-pink-700 border-pink-200",
  paternity: "bg-purple-100 text-purple-700 border-purple-200",
  bereavement: "bg-gray-100 text-gray-700 border-gray-200",
  unpaid: "bg-amber-100 text-amber-700 border-amber-200",
  earned: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

const leaveTypeIcons: Record<string, any> = {
  annual: CalendarDays,
  sick: Heart,
  casual: Sun,
  maternity: Baby,
  paternity: Baby,
  bereavement: CloudRain,
  unpaid: Clock8,
  earned: Star,
  other: CalendarClock,
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  cancelled: "bg-gray-50 text-gray-600 border-gray-200",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  cancelled: Ban,
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LeaveManagementPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeaveStatus>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<
    "all" | "this-month" | "last-month" | "this-quarter"
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [showBulkAction, setShowBulkAction] = useState(false);
  const [statusAction, setStatusAction] = useState<"approved" | "rejected">(
    "approved",
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isHR, setIsHR] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (user) {
      const hrRoles = ["super_admin", "admin", "hr_manager"];
      setIsHR(hrRoles.includes(user.role));
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeaveData();
      fetchUsers();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchLeaveData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLeaveData = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);

      // Build query params
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterType !== "all") params.append("type", filterType);
      if (searchTerm) params.append("search", searchTerm);

      // Fetch all leaves for HR
      const url = params.toString()
        ? `/leaves/all?${params.toString()}`
        : "/leaves/all";

      const leavesResponse = await api.get(url);
      let data: LeaveRequest[] = [];

      if (leavesResponse.data.success) {
        data = leavesResponse.data.data || [];
        setLeaveRequests(data);

        const pendingCount = data.filter(
          (l: LeaveRequest) => l.status === "pending",
        ).length;
        badgeService.setBadge("pendingLeaves", pendingCount);
      }
    } catch (error: any) {
      console.error("Error fetching leave data:", error);
      if (!silent) {
        toast.error(
          error.response?.data?.message || "Failed to load leave data",
        );
      }
      setLeaveRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/leaves/substitutes");
      if (response.data.success) {
        setUsers(response.data.data || []);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.debug(
        "Could not fetch substitutes:",
        error?.response?.status || error?.message,
      );
      setUsers([]);
    }
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleUpdateStatus = async (
    leaveId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      const payload: any = { status };
      if (status === "rejected" && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }

      const response = await api.patch(`/leaves/${leaveId}/status`, payload);
      if (response.data.success) {
        toast.success(`Leave ${status} successfully!`);
        setShowStatusModal(false);
        setSelectedLeave(null);
        setRejectionReason("");

        await fetchLeaveData();
        badgeService.decrementBadge("pendingLeaves");
      }
    } catch (error: any) {
      console.error("Error updating leave status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update leave status",
      );
    }
  };

  const handleBulkStatusUpdate = async (status: "approved" | "rejected") => {
    if (selectedLeaves.length === 0) {
      toast.error("Please select at least one leave request");
      return;
    }

    try {
      const promises = selectedLeaves.map((id) =>
        api.patch(`/leaves/${id}/status`, { status }),
      );
      await Promise.all(promises);

      toast.success(`${selectedLeaves.length} leave requests ${status}!`);
      setSelectedLeaves([]);
      setShowBulkAction(false);

      await fetchLeaveData();
      badgeService.decrementBadge("pendingLeaves", selectedLeaves.length);
    } catch (error: any) {
      console.error("Error bulk updating leaves:", error);
      toast.error(error.response?.data?.message || "Failed to update leaves");
    }
  };

  const handleDeleteLeave = async () => {
    if (!selectedLeave) return;

    try {
      const response = await api.delete(`/leaves/${selectedLeave._id}`);
      if (response.data.success) {
        toast.success("Leave request deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedLeave(null);

        await fetchLeaveData();
        if (selectedLeave.status === "pending") {
          badgeService.decrementBadge("pendingLeaves");
        }
      }
    } catch (error: any) {
      console.error("Error deleting leave:", error);
      toast.error(error.response?.data?.message || "Failed to delete leave");
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const toggleSelectLeave = (leaveId: string) => {
    setSelectedLeaves((prev) =>
      prev.includes(leaveId)
        ? prev.filter((id) => id !== leaveId)
        : [...prev, leaveId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeaves.length === filteredLeaves.length) {
      setSelectedLeaves([]);
    } else {
      setSelectedLeaves(filteredLeaves.map((l) => l._id));
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getEmployeeName = (employee: any): string => {
    if (!employee) return "Unknown";
    if (typeof employee === "object" && employee.fullName) {
      return employee.fullName;
    }
    if (typeof employee === "string") return "Loading...";
    return "Unknown";
  };

  const getEmployeeEmail = (employee: any): string => {
    if (!employee) return "";
    if (typeof employee === "object" && employee.email) {
      return employee.email;
    }
    return "";
  };

  const getEmployeeId = (employee: any): string => {
    if (!employee) return "N/A";
    if (typeof employee === "object" && employee.employeeId) {
      return employee.employeeId;
    }
    return "N/A";
  };

  const getDepartmentName = (employee: any): string => {
    if (!employee || typeof employee !== "object") return "";
    if (employee.departmentId && typeof employee.departmentId === "object") {
      return employee.departmentId.name || "";
    }
    return "";
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    return statusIcons[status] || Clock;
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
  };

  const getLeaveTypeIcon = (type: string) => {
    return leaveTypeIcons[type] || Calendar;
  };

  const getLeaveTypeLabel = (type: string) => {
    return leaveTypeLabels[type] || type;
  };

  const getLeaveTypeColor = (type: string) => {
    return leaveTypeColors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredLeaves = useMemo(() => {
    let filtered = [...leaveRequests];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((leave) => {
        const employeeName = getEmployeeName(leave.employeeId).toLowerCase();
        const reason = leave.reason?.toLowerCase() || "";
        const leaveType = leave.type?.toLowerCase() || "";
        const employeeEmail = getEmployeeEmail(leave.employeeId).toLowerCase();

        return (
          employeeName.includes(search) ||
          reason.includes(search) ||
          leaveType.includes(search) ||
          employeeEmail.includes(search)
        );
      });
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((leave) => leave.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((leave) => leave.type === filterType);
    }

    if (filterDateRange !== "all") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfQuarter = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );

      filtered = filtered.filter((leave) => {
        const leaveDate = new Date(leave.createdAt);
        if (filterDateRange === "this-month") {
          return leaveDate >= startOfMonth;
        } else if (filterDateRange === "last-month") {
          return leaveDate >= startOfLastMonth && leaveDate <= endOfLastMonth;
        } else if (filterDateRange === "this-quarter") {
          return leaveDate >= startOfQuarter;
        }
        return true;
      });
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [leaveRequests, searchTerm, filterStatus, filterType, filterDateRange]);

  // ============================================================================
  // STATS
  // ============================================================================

  const statsCards = useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter((l) => l.status === "pending").length;
    const approved = leaveRequests.filter(
      (l) => l.status === "approved",
    ).length;
    const rejected = leaveRequests.filter(
      (l) => l.status === "rejected",
    ).length;
    const cancelled = leaveRequests.filter(
      (l) => l.status === "cancelled",
    ).length;

    return [
      {
        label: "Total Requests",
        value: total,
        icon: FileText,
        color: "text-gray-700",
        bg: "bg-gray-50",
      },
      {
        label: "Pending",
        value: pending,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
      },
      {
        label: "Approved",
        value: approved,
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      },
      {
        label: "Rejected",
        value: rejected,
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
      },
      {
        label: "Cancelled",
        value: cancelled,
        icon: Ban,
        color: "text-gray-600",
        bg: "bg-gray-50",
      },
    ];
  }, [leaveRequests]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50/80">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm mb-6"
        >
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
          >
            <Home size={14} />
            Dashboard
          </Link>
          <ChevronRightIcon size={14} className="text-gray-300" />
          <Link
            href="/hr"
            className="text-gray-400 hover:text-gray-600 transition"
          >
            HR
          </Link>
          <ChevronRightIcon size={14} className="text-gray-300" />
          <span className="text-gray-700 font-medium">Leave Management</span>
        </motion.div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <Calendar className="w-7 h-7 text-indigo-500" />
              Leave Management
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              Manage and approve leave requests
              {refreshing && (
                <span className="text-xs text-indigo-500 animate-pulse ml-2">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Updating...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {selectedLeaves.length > 0 && (
              <button
                onClick={() => setShowBulkAction(true)}
                className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all text-sm font-medium shadow-md shadow-indigo-500/25 flex items-center gap-2"
              >
                <UsersRound className="w-4 h-4" />
                Bulk Action ({selectedLeaves.length})
              </button>
            )}
            <button
              onClick={() => {
                setAutoRefreshEnabled(!autoRefreshEnabled);
                toast.success(
                  autoRefreshEnabled
                    ? "Auto-refresh disabled"
                    : "Auto-refresh enabled",
                );
              }}
              className={`cursor-pointer px-3 py-2 rounded-xl transition-all text-sm flex items-center gap-1.5 ${
                autoRefreshEnabled
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-gray-50 text-gray-400 border border-gray-200"
              }`}
              title={
                autoRefreshEnabled
                  ? "Auto-refresh is on"
                  : "Auto-refresh is off"
              }
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${autoRefreshEnabled ? "animate-spin-slow" : ""}`}
              />
              <span className="hidden sm:inline">
                {autoRefreshEnabled ? "Live" : "Paused"}
              </span>
            </button>
            <button
              onClick={() => fetchLeaveData()}
              disabled={refreshing}
              className="cursor-pointer px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition-all text-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {statsCards.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`${stat.bg} rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leaves by name, reason, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LeaveStatus)}
                className="text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[140px]"
              >
                <option value="all">All Types</option>
                {Object.entries(leaveTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value as any)}
                className="text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[140px]"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-quarter">This Quarter</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterType("all");
                  setFilterDateRange("all");
                  fetchLeaveData();
                }}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Clear filters"
              >
                <FilterIcon className="w-4 h-4" />
              </button>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter results count */}
          <div className="mt-3 text-xs text-gray-400 flex items-center justify-between">
            <span>
              Showing {filteredLeaves.length} of {leaveRequests.length} requests
            </span>
            {filteredLeaves.length > 0 && (
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  {filteredLeaves.filter((l) => l.status === "pending").length}{" "}
                  pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {filteredLeaves.filter((l) => l.status === "approved").length}{" "}
                  approved
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  {
                    filteredLeaves.filter((l) => l.status === "rejected").length
                  }{" "}
                  rejected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests */}
        {filteredLeaves.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLeaves.map((leave) => {
                const TypeIcon = getLeaveTypeIcon(leave.type);
                const typeColor = getLeaveTypeColor(leave.type);
                const StatusIcon = getStatusIcon(leave.status);
                const statusColor = getStatusColor(leave.status);
                const isPending = leave.status === "pending";
                const employeeName = getEmployeeName(leave.employeeId);
                const employeeEmail = getEmployeeEmail(leave.employeeId);
                const employeeId = getEmployeeId(leave.employeeId);
                const departmentName = getDepartmentName(leave.employeeId);

                return (
                  <motion.div
                    key={leave._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-xl hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-sm font-bold shrink-0">
                            {getInitials(employeeName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">
                              {employeeName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {employeeId !== "N/A" ? `ID: ${employeeId}` : ""}
                            </p>
                            {departmentName && (
                              <p className="text-[10px] text-gray-400 truncate">
                                {departmentName}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full border flex items-center gap-1 shrink-0 ${statusColor}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {getStatusLabel(leave.status)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-gray-400" />
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}
                          >
                            {getLeaveTypeLabel(leave.type)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {formatDate(leave.startDate)} -{" "}
                            {formatDate(leave.endDate)}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({leave.totalDays || 0} days)
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2">
                          {leave.reason}
                        </p>

                        {leave.substituteName && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <UserPlus className="w-3 h-3" />
                            <span>Substitute: {leave.substituteName}</span>
                          </div>
                        )}

                        {leave.notes && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <MessageSquare className="w-3 h-3" />
                            <span className="line-clamp-1">{leave.notes}</span>
                          </div>
                        )}

                        {leave.rejectionReason && (
                          <div className="mt-1 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                            <p className="text-xs text-rose-600 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>Rejection: {leave.rejectionReason}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setStatusAction("approved");
                                setShowStatusModal(true);
                              }}
                              className="flex-1 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLeave(leave);
                                setStatusAction("rejected");
                                setShowStatusModal(true);
                              }}
                              className="flex-1 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                      <th className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedLeaves.length === filteredLeaves.length &&
                            filteredLeaves.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeaves.map((leave) => {
                      const StatusIcon = getStatusIcon(leave.status);
                      const statusColor = getStatusColor(leave.status);
                      const isPending = leave.status === "pending";
                      const employeeName = getEmployeeName(leave.employeeId);
                      const employeeEmail = getEmployeeEmail(leave.employeeId);

                      return (
                        <tr
                          key={leave._id}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedLeaves.includes(leave._id)}
                              onChange={() => toggleSelectLeave(leave._id)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                                {getInitials(employeeName)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {employeeName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {employeeEmail}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${getLeaveTypeColor(leave.type)}`}
                            >
                              {getLeaveTypeLabel(leave.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{leave.totalDays || 0} days</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${statusColor}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {getStatusLabel(leave.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(leave.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setStatusAction("approved");
                                      setShowStatusModal(true);
                                    }}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedLeave(leave);
                                      setStatusAction("rejected");
                                      setShowStatusModal(true);
                                    }}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedLeave(leave);
                                  setShowViewModal(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
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
          )
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100/80">
            <div className="w-20 h-20 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No leave requests found
            </h3>
            <p className="text-gray-500 mt-1">
              No leave requests match your filters
            </p>
          </div>
        )}
      </div>

      {/* ============================================================
          MODALS
          ============================================================ */}

      {/* Status Update Modal */}
      {showStatusModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2.5 rounded-xl ${
                    statusAction === "approved"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  {statusAction === "approved" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {statusAction === "approved" ? "Approve" : "Reject"} Leave
                  Request
                </h2>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>{getEmployeeName(selectedLeave.employeeId)}</strong> -{" "}
                  {getLeaveTypeLabel(selectedLeave.type)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedLeave.startDate)} -{" "}
                  {formatDate(selectedLeave.endDate)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedLeave.reason}
                </p>
              </div>

              {statusAction === "rejected" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none text-gray-800"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    handleUpdateStatus(selectedLeave._id, statusAction)
                  }
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-colors font-medium shadow-lg ${
                    statusAction === "approved"
                      ? "bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-500/25"
                      : "bg-linear-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 shadow-rose-500/25"
                  }`}
                >
                  {statusAction === "approved" ? "Approve" : "Reject"} Request
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedLeave(null);
                    setRejectionReason("");
                  }}
                  className="flex-1 text-black px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      {showBulkAction && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                  <UsersRound className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Action</h2>
              </div>

              <p className="text-gray-600 mb-4">
                You have selected <strong>{selectedLeaves.length}</strong> leave
                requests. What would you like to do?
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleBulkStatusUpdate("approved")}
                  className="w-full px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Check className="w-5 h-5" />
                  Approve All
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate("rejected")}
                  className="w-full px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <X className="w-5 h-5" />
                  Reject All
                </button>
                <button
                  onClick={() => {
                    setSelectedLeaves([]);
                    setShowBulkAction(false);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Leave Details Modal */}
      {showViewModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Leave Request Details
                    </h2>
                    <p className="text-sm text-gray-500">
                      Request #{selectedLeave._id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedLeave(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3 mb-6">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(selectedLeave.status)}`}
                >
                  {(() => {
                    const StatusIcon = getStatusIcon(selectedLeave.status);
                    return <StatusIcon className="w-4 h-4" />;
                  })()}
                  {getStatusLabel(selectedLeave.status)}
                </span>
                {selectedLeave.approvedAt && (
                  <span className="text-xs text-gray-500">
                    Approved on {formatDate(selectedLeave.approvedAt)}
                  </span>
                )}
              </div>

              {/* Employee Info */}
              <div className="bg-linear-to-r from-gray-50 to-indigo-50/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-lg font-bold shrink-0">
                    {getInitials(getEmployeeName(selectedLeave.employeeId))}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {getEmployeeName(selectedLeave.employeeId)}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>
                        📧 {getEmployeeEmail(selectedLeave.employeeId) || "N/A"}
                      </span>
                      <span>🆔 {getEmployeeId(selectedLeave.employeeId)}</span>
                      {getDepartmentName(selectedLeave.employeeId) && (
                        <span>
                          🏢 {getDepartmentName(selectedLeave.employeeId)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Leave Type
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const TypeIcon = getLeaveTypeIcon(selectedLeave.type);
                      return <TypeIcon className="w-4 h-4 text-indigo-500" />;
                    })()}
                    <span
                      className={`text-sm font-medium px-2 py-0.5 rounded-full border ${getLeaveTypeColor(selectedLeave.type)}`}
                    >
                      {getLeaveTypeLabel(selectedLeave.type)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Duration
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedLeave.totalDays || 0} days
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Start Date
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedLeave.startDate)}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    End Date
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(selectedLeave.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                  Reason
                </label>
                <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                  {selectedLeave.reason || "No reason provided"}
                </p>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {selectedLeave.substituteName && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      Substitute
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <UserPlus className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-gray-800">
                        {selectedLeave.substituteName}
                      </span>
                    </div>
                    {selectedLeave.substituteEmail && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedLeave.substituteEmail}
                      </p>
                    )}
                  </div>
                )}

                {selectedLeave.approvedBy && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      Approved By
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-800">
                        {selectedLeave.approvedBy.fullName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedLeave.approvedBy.email}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedLeave.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <label className="text-xs text-amber-700 uppercase tracking-wider font-medium flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Notes
                  </label>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedLeave.notes}
                  </p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedLeave.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
                  <label className="text-xs text-rose-700 uppercase tracking-wider font-medium flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Rejection Reason
                  </label>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedLeave.rejectionReason}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-200 text-xs text-gray-400">
                <span>Created: {formatDateTime(selectedLeave.createdAt)}</span>
                <span>Updated: {formatDateTime(selectedLeave.updatedAt)}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                {selectedLeave.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setStatusAction("approved");
                        setShowStatusModal(true);
                      }}
                      className="flex-1 px-4 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-colors font-medium shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setStatusAction("rejected");
                        setShowStatusModal(true);
                      }}
                      className="flex-1 px-4 py-2.5 bg-linear-to-r from-rose-600 to-rose-500 text-white rounded-xl hover:from-rose-700 hover:to-rose-600 transition-colors font-medium shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedLeave(null);
                  }}
                  className="flex-1 text-black px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global styles */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
