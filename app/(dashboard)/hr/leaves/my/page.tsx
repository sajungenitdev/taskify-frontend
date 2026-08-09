// app/hr/leaves/my/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  User,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  ChevronDown,
  Eye,
  Loader2,
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
  Info,
  AlertTriangle as AlertTriangleIcon,
  FileSignature,
  AlertCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

interface LeaveRequest {
  _id: string;
  type:
    | "annual"
    | "sick"
    | "casual"
    | "maternity"
    | "paternity"
    | "bereavement"
    | "unpaid"
    | "earned"
    | "other";
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  substituteId?: string;
  substituteName?: string;
  substituteEmail?: string;
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
  signatureText?: string;
  signature?: string;
  rejectionReason?: string;
  employeeName?: string;
  employeeEmail?: string;
  departmentName?: string;
}

interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
  pending: number;
  percentage: number;
}

interface LeaveStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  byType: Record<string, number>;
  totalDays: number;
  approvedDays: number;
}

type LeaveStatus = "all" | "pending" | "approved" | "rejected" | "cancelled";

// ============================================================================
// CONSTANTS
// ============================================================================

const LEAVE_TYPES = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "earned", label: "Earned Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "bereavement", label: "Bereavement Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "other", label: "Other Leave" },
];

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

// DEFAULT LEAVE BALANCES (These should match backend entitlements)
const DEFAULT_LEAVE_BALANCES: Record<string, number> = {
  annual: 15,
  sick: 10,
  casual: 12,
  earned: 15,
  maternity: 90,
  paternity: 5,
  bereavement: 0,
  unpaid: 0,
  other: 0,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyLeavesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // State
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<LeaveStatus>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [applyForm, setApplyForm] = useState({
    type: "annual",
    startDate: "",
    endDate: "",
    isHalfDay: false,
    halfDayType: "first_half",
    isPreviousDayOff: false,
    isNextDayOff: false,
    isGovernmentHoliday: false,
    holidayNote: "",
    substituteId: "",
    reason: "",
    additionalDetails: "",
    contactDuringLeave: "",
    emergencyContact: {
      name: "",
      phone: "",
      relation: "",
    },
    signatureText: "",
    signatureImage: null as File | null,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeaveData();
      fetchUsers();
    }
  }, [isAuthenticated]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Calculate balances from leave requests
  const calculateBalances = (requests: LeaveRequest[]): LeaveBalance[] => {
    const leaveTypes = Object.keys(DEFAULT_LEAVE_BALANCES);

    return leaveTypes.map((type) => {
      const defaultBalance = DEFAULT_LEAVE_BALANCES[type] || 0;

      // Calculate used days from approved leaves
      const used = requests
        .filter((r) => r.type === type && r.status === "approved")
        .reduce((sum, r) => sum + (r.totalDays || 0), 0);

      // Calculate pending days from pending leaves
      const pending = requests
        .filter((r) => r.type === type && r.status === "pending")
        .reduce((sum, r) => sum + (r.totalDays || 0), 0);

      // Calculate remaining = default - used
      const remaining = Math.max(0, defaultBalance - used);

      // Calculate percentage used
      const percentage = defaultBalance > 0 ? (used / defaultBalance) * 100 : 0;

      return {
        leaveType: type,
        total: defaultBalance,
        used: used,
        pending: pending,
        remaining: remaining,
        percentage: percentage,
      };
    });
  };

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      // Fetch my leaves
      const leavesResponse = await api.get("/leaves/my-leaves");
      let requests: LeaveRequest[] = [];

      if (leavesResponse.data.success) {
        requests = leavesResponse.data.data || [];
        setLeaveRequests(requests);
      }

      // Fetch leave stats
      try {
        const statsResponse = await api.get("/leaves/my-stats");
        if (statsResponse.data.success) {
          setLeaveStats(statsResponse.data.data);
        }
      } catch (error) {
        // Silent fail for stats
      }

      // Fetch leave balances
      try {
        const balanceResponse = await api.get("/leaves/balances");
        if (balanceResponse.data.success) {
          const balances = balanceResponse.data.data;
          // Convert balances to our format
          const formattedBalances: LeaveBalance[] = Object.keys(
            balances.entitlements || {},
          ).map((type) => {
            const total = balances.entitlements[type] || 0;
            const used = balances.used[type] || 0;
            const remaining = balances.remaining[type] || 0;
            const pending = requests
              .filter((r) => r.type === type && r.status === "pending")
              .reduce((sum, r) => sum + (r.totalDays || 0), 0);

            return {
              leaveType: type,
              total: total,
              used: used,
              remaining: remaining,
              pending: pending,
              percentage: total > 0 ? (used / total) * 100 : 0,
            };
          });
          setLeaveBalances(formattedBalances);
        } else {
          // Calculate from requests if API fails
          setLeaveBalances(calculateBalances(requests));
        }
      } catch (error) {
        // Calculate from requests on error
        setLeaveBalances(calculateBalances(requests));
      }
    } catch (error: any) {
      console.error("Error fetching leave data:", error);
      toast.error(error.response?.data?.message || "Failed to load leave data");
      setLeaveRequests([]);
      setLeaveBalances(calculateBalances([]));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/leaves/substitutes");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error: any) {
      // Silent fail - users are not critical for leave functionality
      console.debug(
        "Could not fetch users list:",
        error?.response?.status || error?.message,
      );
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getAvailableSubstitutes = useMemo(() => {
    return users.filter((u) => u._id !== user?._id);
  }, [users, user]);

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getRemainingBalance = (leaveType: string): number => {
    const balance = leaveBalances.find((b) => b.leaveType === leaveType);
    return balance?.remaining || 0;
  };

  const getDefaultBalance = (leaveType: string): number => {
    const balance = leaveBalances.find((b) => b.leaveType === leaveType);
    return balance?.total || DEFAULT_LEAVE_BALANCES[leaveType] || 0;
  };

  const getUsedBalance = (leaveType: string): number => {
    const balance = leaveBalances.find((b) => b.leaveType === leaveType);
    return balance?.used || 0;
  };

  const getLeaveTypeLabel = (type: string): string => {
    return leaveTypeLabels[type] || type;
  };

  const getStatusLabel = (status: string): string => {
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    return statusColors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (status: string): any => {
    return statusIcons[status] || Clock;
  };

  const getLeaveTypeColor = (type: string): string => {
    return leaveTypeColors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getLeaveTypeIcon = (type: string): any => {
    return leaveTypeIcons[type] || Calendar;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleLeaveTypeChange = (type: string) => {
    const remaining = getRemainingBalance(type);
    const defaultBal = getDefaultBalance(type);
    const used = getUsedBalance(type);

    setApplyForm({ ...applyForm, type });

    if (remaining === 0 && defaultBal > 0) {
      toast.error(
        `You have no ${getLeaveTypeLabel(type)} remaining! (Used: ${used} of ${defaultBal})`,
      );
    } else if (remaining < 3 && defaultBal > 0) {
      toast.error(
        `You only have ${remaining} ${getLeaveTypeLabel(type)} days remaining! (Used: ${used} of ${defaultBal})`,
      );
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setApplyForm({ ...applyForm, signatureImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    if (!applyForm.startDate || !applyForm.endDate) {
      toast.error("Please select start and end dates");
      return false;
    }

    if (!applyForm.reason) {
      toast.error("Please provide a reason for your leave");
      return false;
    }

    const days = calculateDays(applyForm.startDate, applyForm.endDate);
    const remaining = getRemainingBalance(applyForm.type);

    if (applyForm.type !== "unpaid" && applyForm.type !== "other") {
      const defaultBal = getDefaultBalance(applyForm.type);
      if (defaultBal === 0) {
        toast.error(
          `${getLeaveTypeLabel(applyForm.type)} is not available for you`,
        );
        return false;
      }
      if (days > remaining) {
        toast.error(
          `You only have ${remaining} ${getLeaveTypeLabel(applyForm.type)} days remaining! (Used: ${getUsedBalance(applyForm.type)} of ${defaultBal})`,
        );
        return false;
      }
    }

    return true;
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const days = calculateDays(applyForm.startDate, applyForm.endDate);

      const payload = {
        type: applyForm.type,
        startDate: applyForm.startDate,
        endDate: applyForm.endDate,
        reason: applyForm.reason,
        isHalfDay: applyForm.isHalfDay,
        halfDayType: applyForm.halfDayType,
        isPreviousDayOff: applyForm.isPreviousDayOff,
        isNextDayOff: applyForm.isNextDayOff,
        isGovernmentHoliday: applyForm.isGovernmentHoliday,
        holidayNote: applyForm.holidayNote || undefined,
        substituteId: applyForm.substituteId || undefined,
        contactDuringLeave: applyForm.contactDuringLeave || undefined,
        emergencyContact: {
          name: applyForm.emergencyContact.name || undefined,
          phone: applyForm.emergencyContact.phone || undefined,
          relation: applyForm.emergencyContact.relation || undefined,
        },
        additionalDetails: applyForm.additionalDetails || undefined,
        signatureText: applyForm.signatureText || undefined,
      };

      const response = await api.post("/leaves", payload);

      if (response.data.success) {
        toast.success("Leave request submitted successfully!");
        setShowApplyModal(false);
        resetForm();
        fetchLeaveData();
      }
    } catch (error: any) {
      console.error("Error creating leave:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit leave request",
      );
    } finally {
      setIsSubmitting(false);
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
        fetchLeaveData();
      }
    } catch (error: any) {
      console.error("Error deleting leave:", error);
      toast.error(error.response?.data?.message || "Failed to delete leave");
    }
  };

  const resetForm = () => {
    setApplyForm({
      type: "annual",
      startDate: "",
      endDate: "",
      isHalfDay: false,
      halfDayType: "first_half",
      isPreviousDayOff: false,
      isNextDayOff: false,
      isGovernmentHoliday: false,
      holidayNote: "",
      substituteId: "",
      reason: "",
      additionalDetails: "",
      contactDuringLeave: "",
      emergencyContact: {
        name: "",
        phone: "",
        relation: "",
      },
      signatureText: "",
      signatureImage: null,
    });
    setSignaturePreview(null);
  };

  // ============================================================================
  // MEMOIZED DATA
  // ============================================================================

  const filteredLeaves = useMemo(() => {
    let filtered = [...leaveRequests];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (leave) =>
          leave.reason?.toLowerCase().includes(search) ||
          leave.type?.toLowerCase().includes(search) ||
          leave.employeeName?.toLowerCase().includes(search) ||
          leave.departmentName?.toLowerCase().includes(search),
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((leave) => leave.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((leave) => leave.type === filterType);
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [leaveRequests, searchTerm, filterStatus, filterType]);

  const stats = useMemo(() => {
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

    return { total, pending, approved, rejected, cancelled };
  }, [leaveRequests]);

  const totalDaysTaken = useMemo(() => {
    return leaveRequests
      .filter((l) => l.status === "approved")
      .reduce((sum, l) => sum + (l.totalDays || 0), 0);
  }, [leaveRequests]);

  const totalPendingDays = useMemo(() => {
    return leaveRequests
      .filter((l) => l.status === "pending")
      .reduce((sum, l) => sum + (l.totalDays || 0), 0);
  }, [leaveRequests]);

  const totalAvailable = useMemo(() => {
    return leaveBalances.reduce((sum, b) => sum + b.remaining, 0);
  }, [leaveBalances]);

  const balanceCards = useMemo(() => {
    if (!Array.isArray(leaveBalances) || leaveBalances.length === 0) {
      return calculateBalances(leaveRequests);
    }
    return leaveBalances;
  }, [leaveBalances, leaveRequests]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50/80">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ============================================================
            BREADCRUMB
            ============================================================ */}
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
          <span className="text-gray-700 font-medium">My Leaves</span>
        </motion.div>

        {/* ============================================================
            HEADER
            ============================================================ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <Calendar className="w-7 h-7 text-indigo-500" />
              My Leaves
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              Track your leave requests and balances
              {refreshing && (
                <span className="text-xs text-indigo-500 animate-pulse ml-2">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Updating...
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="cursor-pointer px-4 py-2 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl transition-all text-sm font-medium shadow-md shadow-indigo-500/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Apply Leave
          </button>
        </div>

        {/* ============================================================
            STATS CARDS
            ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Total Requests
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pending}
                </p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Pending
                </p>
              </div>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.approved}
                </p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Approved
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-rose-600">
                  {stats.rejected}
                </p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Rejected
                </p>
              </div>
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-md text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{totalAvailable}</p>
                <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider">
                  Available Days
                </p>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ============================================================
            LEAVE BALANCES
            ============================================================ */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              Leave Balances
              <span className="text-xs font-normal text-gray-400 ml-2">
                (Default: Annual 15, Sick 10, Casual 12, Earned 15)
              </span>
            </h3>
            <button
              onClick={() => fetchLeaveData()}
              className="text-xs text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <RefreshCw
                className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {balanceCards.map((balance) => {
              const Icon = getLeaveTypeIcon(balance.leaveType);
              const label = getLeaveTypeLabel(balance.leaveType);
              const isLow = balance.remaining < balance.total * 0.2;
              const isCritical = balance.remaining === 0 && balance.total > 0;

              return (
                <motion.div
                  key={balance.leaveType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all relative"
                >
                  {isCritical && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                  {isLow && !isCritical && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      className={`w-3.5 h-3.5 ${isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-indigo-500"}`}
                    />
                    <span className="text-[10px] font-medium text-gray-500 uppercase truncate">
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-lg font-bold ${isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-gray-800"}`}
                    >
                      {balance.remaining}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      / {balance.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div
                      className={`h-1 rounded-full transition-all ${isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-indigo-500"}`}
                      style={{
                        width:
                          balance.total > 0
                            ? `${Math.min(100, (balance.used / balance.total) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[9px] text-gray-400">
                      <span className="text-blue-500">Used:</span> {balance.used}
                    </p>
                    {balance.pending > 0 && (
                      <p className="text-[9px] text-amber-500 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {balance.pending} pending
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            SUMMARY CARDS
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-linear-to-r from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200/50 rounded-lg">
                <CalendarDays className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Days Taken</p>
                <p className="text-2xl font-bold text-blue-900">
                  {totalDaysTaken}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-200/50 rounded-lg">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-amber-700">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-900">
                  {totalPendingDays} days
                </p>
              </div>
            </div>
          </div>
          <div className="bg-linear-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-200/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-emerald-700">Available Balance</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {totalAvailable} days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            FILTERS
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search your leaves..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LeaveStatus)}
                className="text-gray-400 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[140px]"
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
                className="text-gray-400 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[140px]"
              >
                <option value="all">All Types</option>
                {Object.entries(leaveTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterType("all");
                  fetchLeaveData();
                }}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Showing {filteredLeaves.length} of {leaveRequests.length} requests
          </div>
        </div>

        {/* ============================================================
            LEAVE REQUESTS LIST
            ============================================================ */}
        {filteredLeaves.length > 0 ? (
          <div className="space-y-4">
            {filteredLeaves.map((leave) => {
              const TypeIcon = getLeaveTypeIcon(leave.type);
              const typeColor = getLeaveTypeColor(leave.type);
              const StatusIcon = getStatusIcon(leave.status);
              const statusColor = getStatusColor(leave.status);
              const isPending = leave.status === "pending";

              return (
                <motion.div
                  key={leave._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-md transition-all p-5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="p-2.5 rounded-xl bg-gray-50">
                        <TypeIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">
                            {getLeaveTypeLabel(leave.type)}
                            {/* {getLeaveTypeLabel(leave.type)} */}
                          </h3>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${typeColor}`}
                          >
                            {leave.totalDays || 0} days
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${statusColor}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {getStatusLabel(leave.status)}
                          </span>
                          {leave.isHalfDay && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              Half Day (
                              {leave.halfDayType === "first_half"
                                ? "First"
                                : "Second"}
                              )
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {leave.reason}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(leave.startDate)} -{" "}
                            {formatDate(leave.endDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(leave.createdAt)}
                          </span>
                          {leave.substituteName && (
                            <span className="flex items-center gap-1">
                              <UserPlus className="w-3.5 h-3.5" />
                              Substitute: {leave.substituteName}
                            </span>
                          )}
                          {leave.departmentName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5" />
                              {leave.departmentName}
                            </span>
                          )}
                        </div>
                        {leave.rejectionReason && (
                          <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                            <p className="text-xs text-rose-600 flex items-start gap-1">
                              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>
                                Rejection Reason: {leave.rejectionReason}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {leave.status === "approved" && leave.approvedByName && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          Approved by {leave.approvedByName}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100/80">
            <div className="w-20 h-20 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No leave requests found
            </h3>
            <p className="text-gray-500 mt-1">
              {searchTerm || filterStatus !== "all" || filterType !== "all"
                ? "No requests match your filters"
                : "You haven't submitted any leave requests yet"}
            </p>
            <button
              onClick={() => setShowApplyModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Apply for Leave
            </button>
          </div>
        )}
      </div>

      {/* ============================================================
          APPLY LEAVE MODAL
          ============================================================ */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start z-10">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Apply for Leave
                  </h2>
                  <p className="text-xs text-gray-500">
                    Submit a new leave request
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="p-5 space-y-4">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User size={14} className="text-indigo-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Employee Name
                      </label>
                      <input
                        type="text"
                        value={user?.fullName || ""}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={user?.departmentId?.name || "Not Assigned"}
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={
                          user?.role?.replace(/_/g, " ").toUpperCase() || ""
                        }
                        disabled
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-700 text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-purple-500" />
                    Leave Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Leave Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={applyForm.type}
                        onChange={(e) => handleLeaveTypeChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        required
                      >
                        {LEAVE_TYPES.map((type) => {
                          const remaining = getRemainingBalance(type.value);
                          const defaultBal = getDefaultBalance(type.value);
                          const used = getUsedBalance(type.value);
                          return (
                            <option key={type.value} value={type.value}>
                              {type.label}
                              {defaultBal > 0 &&
                                ` (${remaining} of ${defaultBal} left)`}
                              {used > 0 && ` - Used: ${used}`}
                            </option>
                          );
                        })}
                      </select>
                      {applyForm.type !== "unpaid" &&
                        applyForm.type !== "other" && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-gray-500">Balance:</span>
                            <span className="font-medium text-gray-700">
                              {getRemainingBalance(applyForm.type)} remaining
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-500">
                              Used: {getUsedBalance(applyForm.type)} of{" "}
                              {getDefaultBalance(applyForm.type)}
                            </span>
                            {getRemainingBalance(applyForm.type) === 0 && (
                              <span className="text-rose-600 text-xs font-medium">
                                (No balance left!)
                              </span>
                            )}
                            {getRemainingBalance(applyForm.type) < 3 &&
                              getRemainingBalance(applyForm.type) > 0 && (
                                <span className="text-amber-600 text-xs font-medium">
                                  (Low balance!)
                                </span>
                              )}
                          </div>
                        )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Half Day
                      </label>
                      <div className="flex items-center gap-3 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={applyForm.isHalfDay}
                            onChange={(e) =>
                              setApplyForm({
                                ...applyForm,
                                isHalfDay: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700">
                            Half Day
                          </span>
                        </label>
                        {applyForm.isHalfDay && (
                          <select
                            value={applyForm.halfDayType}
                            onChange={(e) =>
                              setApplyForm({
                                ...applyForm,
                                halfDayType: e.target.value,
                              })
                            }
                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                          >
                            <option value="first_half">First Half</option>
                            <option value="second_half">Second Half</option>
                          </select>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Start Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={applyForm.startDate}
                        onChange={(e) =>
                          setApplyForm({
                            ...applyForm,
                            startDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        End Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={applyForm.endDate}
                        onChange={(e) =>
                          setApplyForm({
                            ...applyForm,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        required
                      />
                    </div>
                  </div>
                  {applyForm.startDate && applyForm.endDate && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Total Days Requested:
                        </span>
                        <span className="font-semibold text-indigo-700">
                          {calculateDays(
                            applyForm.startDate,
                            applyForm.endDate,
                          )}{" "}
                          days
                        </span>
                      </div>
                      {applyForm.type !== "unpaid" &&
                        applyForm.type !== "other" && (
                          <>
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-gray-600">
                                Will be deducted from:
                              </span>
                              <span className="font-medium text-gray-700">
                                {getLeaveTypeLabel(applyForm.type)} Balance
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-gray-600">
                                Remaining after request:
                              </span>
                              <span
                                className={`font-semibold ${
                                  getRemainingBalance(applyForm.type) -
                                    calculateDays(
                                      applyForm.startDate,
                                      applyForm.endDate,
                                    ) <
                                  0
                                    ? "text-rose-600"
                                    : getRemainingBalance(applyForm.type) -
                                          calculateDays(
                                            applyForm.startDate,
                                            applyForm.endDate,
                                          ) <
                                        3
                                      ? "text-amber-600"
                                      : "text-emerald-600"
                                }`}
                              >
                                {getRemainingBalance(applyForm.type) -
                                  calculateDays(
                                    applyForm.startDate,
                                    applyForm.endDate,
                                  )}{" "}
                                days
                              </span>
                            </div>
                          </>
                        )}
                    </div>
                  )}
                </div>

                {/* Holiday & Off Days */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <AlertTriangleIcon size={14} className="text-amber-500" />
                    Holiday & Off Days
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Previous Day Off
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={applyForm.isPreviousDayOff}
                          onChange={(e) =>
                            setApplyForm({
                              ...applyForm,
                              isPreviousDayOff: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Next Day Off
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={applyForm.isNextDayOff}
                          onChange={(e) =>
                            setApplyForm({
                              ...applyForm,
                              isNextDayOff: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Government Holiday
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={applyForm.isGovernmentHoliday}
                          onChange={(e) =>
                            setApplyForm({
                              ...applyForm,
                              isGovernmentHoliday: e.target.checked,
                            })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Holiday Note
                      </label>
                      <input
                        type="text"
                        value={applyForm.holidayNote}
                        onChange={(e) =>
                          setApplyForm({
                            ...applyForm,
                            holidayNote: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        placeholder="Specify holiday details"
                      />
                    </div>
                  </div>
                </div>

                {/* Substitute */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <UserPlus size={14} className="text-blue-500" />
                    Substitute / Backup
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Select Substitute
                    </label>
                    <select
                      value={applyForm.substituteId}
                      onChange={(e) =>
                        setApplyForm({
                          ...applyForm,
                          substituteId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      <option value="">Select a substitute</option>
                      {getAvailableSubstitutes.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.fullName} ({sub.email}) -{" "}
                          {sub.departmentId?.name || "No Dept"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact & Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Phone size={14} className="text-green-500" />
                    Contact & Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Reason <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={applyForm.reason}
                        onChange={(e) =>
                          setApplyForm({ ...applyForm, reason: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                        placeholder="Please provide a reason for your leave..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Additional Details
                      </label>
                      <textarea
                        value={applyForm.additionalDetails}
                        onChange={(e) =>
                          setApplyForm({
                            ...applyForm,
                            additionalDetails: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                        placeholder="Any additional information..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Contact During Leave
                      </label>
                      <input
                        type="text"
                        value={applyForm.contactDuringLeave}
                        onChange={(e) =>
                          setApplyForm({
                            ...applyForm,
                            contactDuringLeave: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        placeholder="Phone number or email for contact"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          value={applyForm.emergencyContact.name}
                          onChange={(e) =>
                            setApplyForm({
                              ...applyForm,
                              emergencyContact: {
                                ...applyForm.emergencyContact,
                                name: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Emergency Contact Phone
                        </label>
                        <input
                          type="text"
                          value={applyForm.emergencyContact.phone}
                          onChange={(e) =>
                            setApplyForm({
                              ...applyForm,
                              emergencyContact: {
                                ...applyForm.emergencyContact,
                                phone: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileSignature size={14} className="text-indigo-500" />
                    Signature
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Signature Text
                      </label>
                      <input
                        type="text"
                        value={applyForm.signatureText}
                        onChange={(e) =>
                          setApplyForm({
                            ...applyForm,
                            signatureText: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        placeholder="Type your full name as signature"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Signature Image (Upload)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                      {signaturePreview && (
                        <div className="mt-2 p-2 border border-gray-200 rounded-lg">
                          <img
                            src={signaturePreview}
                            alt="Signature"
                            className="max-h-16 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        Submit Request
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================
          DELETE CONFIRMATION MODAL
          ============================================================ */}
      <AnimatePresence>
        {showDeleteConfirm && selectedLeave && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Delete Leave Request
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this leave request? This
                  action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteLeave}
                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-rose-600 to-rose-500 text-white rounded-xl hover:from-rose-700 hover:to-rose-600 transition-colors font-medium shadow-lg shadow-rose-500/25"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSelectedLeave(null);
                    }}
                    className="flex-1 text-gray-400 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
