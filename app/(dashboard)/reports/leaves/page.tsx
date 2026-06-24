"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  RefreshCw,
  Loader2,
  Home,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Eye,
  X,
  CalendarPlus,
  Umbrella,
  HeartPulse,
  Baby,
  UsersRound,
  Stethoscope,
  Wallet,
  Award,
  Trash2,
  User,
  Briefcase,
  Building2,
  Mail,
  Phone,
  UserPlus,
  FileSignature,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  CalendarClock,
  FileText,
  Info,
  Check,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ==================== INTERFACES ====================

interface LeaveRequest {
  _id: string;
  employeeId: {
    _id: string;
    fullName: string;
    email: string;
    employeeId: string;
  };
  employeeName: string;
  employeeEmail: string;
  employeeRole: string;
  employeeJoinDate: string;
  departmentId?: { _id: string; name: string; code: string } | null;
  departmentName?: string;
  type:
    | "casual"
    | "earned"
    | "sick"
    | "maternity"
    | "paternity"
    | "unpaid"
    | "other";
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType: "first_half" | "second_half" | null;
  isPreviousDayOff: boolean;
  isNextDayOff: boolean;
  isGovernmentHoliday: boolean;
  holidayNote: string;
  substituteId: { _id: string; fullName: string; email: string };
  substituteName: string;
  substituteEmail: string;
  substituteApproved: boolean;
  contactDuringLeave: string;
  emergencyContact: { name: string; phone: string; relation: string };
  reason: string;
  additionalDetails: string;
  signature: string;
  signatureText: string;
  signedAt: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvedBy: { _id: string; fullName: string; email: string };
  approvedByName: string;
  approvedAt: string;
  rejectionReason: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

interface LeaveBalance {
  used: {
    casual: number;
    earned: number;
    sick: number;
    maternity: number;
    paternity: number;
    unpaid: number;
    other: number;
  };
  entitlements: {
    casual: number;
    earned: number;
    sick: number;
    maternity: number;
    paternity: number;
    unpaid: number;
    other: number;
  };
  remaining: {
    casual: number;
    earned: number;
    sick: number;
    maternity: number;
    paternity: number;
    unpaid: number;
    other: number;
  };
}

interface Substitute {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId?: { _id: string; name: string };
}

// ==================== CONSTANTS ====================

const LEAVE_TYPES = [
  {
    value: "casual",
    label: "Casual Leave",
    icon: Umbrella,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    value: "earned",
    label: "Earned Leave",
    icon: Award,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    value: "sick",
    label: "Sick Leave",
    icon: Stethoscope,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  {
    value: "maternity",
    label: "Maternity Leave",
    icon: Baby,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  {
    value: "paternity",
    label: "Paternity Leave",
    icon: UsersRound,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
  },
  {
    value: "unpaid",
    label: "Unpaid Leave",
    icon: Wallet,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    value: "other",
    label: "Other Leave",
    icon: CalendarClock,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
];

const LEAVE_STATUS = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: X,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: AlertCircle,
  },
};

// ==================== COMPONENT ====================

export default function LeavesPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();

  // State
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [substitutes, setSubstitutes] = useState<Substitute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const canViewAll = hasRole(["super_admin", "admin", "hr_manager"]);
  const isEmployee = !canViewAll;

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    type: "casual",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
    halfDayType: "first_half",
    isPreviousDayOff: false,
    isNextDayOff: false,
    isGovernmentHoliday: false,
    holidayNote: "",
    substituteId: "",
    contactDuringLeave: "",
    additionalDetails: "",
    signatureText: "",
    emergencyContact: {
      name: "",
      phone: "",
      relation: "",
    },
  });

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (showApplyModal) {
      fetchSubstitutes();
    }
  }, [showApplyModal]);

  // ==================== API CALLS ====================

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        api.get("/leaves/my-leaves"),
        api.get("/leaves/balances"),
      ]);

      if (leavesRes.data.success) {
        setLeaves(leavesRes.data.data || []);
      }
      if (balanceRes.data.success) {
        setBalance(balanceRes.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching leave data:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch leave data",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSubstitutes = async () => {
    try {
      const response = await api.get("/leaves/substitutes");
      if (response.data.success) {
        setSubstitutes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching substitutes:", error);
    }
  };

  // ==================== HANDLERS ====================

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates
    if (!applyForm.startDate || !applyForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    if (start > end) {
      toast.error("Start date cannot be after end date");
      return;
    }

    if (!applyForm.reason.trim()) {
      toast.error("Please provide a reason for leave");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the data - department is optional
      const requestData = {
        ...applyForm,
        departmentId: user?.departmentId?._id || null,
        departmentName: user?.departmentId?.name || "Unassigned",
        signature: signaturePreview,
      };

      const response = await api.post("/leaves", requestData);

      if (response.data.success) {
        toast.success("Leave request submitted successfully");
        setShowApplyModal(false);
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      console.error("Leave application error:", error);

      // Show specific error message
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit leave request. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;

    setIsDeleting(true);
    try {
      const response = await api.delete(`/leaves/${leaveId}`);
      if (response.data.success) {
        toast.success("Leave request cancelled");
        fetchData();
        setShowDetailsModal(false);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to cancel leave request",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSignaturePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setApplyForm({
      type: "casual",
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
      halfDayType: "first_half",
      isPreviousDayOff: false,
      isNextDayOff: false,
      isGovernmentHoliday: false,
      holidayNote: "",
      substituteId: "",
      contactDuringLeave: "",
      additionalDetails: "",
      signatureText: "",
      emergencyContact: {
        name: "",
        phone: "",
        relation: "",
      },
    });
    setSignaturePreview(null);
  };

  // ==================== HELPERS ====================

  const getStatusBadge = (status: string) => {
    const config =
      LEAVE_STATUS[status as keyof typeof LEAVE_STATUS] || LEAVE_STATUS.pending;
    return config;
  };

  const getTypeConfig = (type: string) => {
    return LEAVE_TYPES.find((t) => t.value === type) || LEAVE_TYPES[0];
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==================== FILTERS & PAGINATION ====================

  const filteredLeaves = useMemo(() => {
    let filtered = leaves;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.reason.toLowerCase().includes(search) ||
          l.type.toLowerCase().includes(search) ||
          l.employeeName.toLowerCase().includes(search),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((l) => l.status === statusFilter);
    }

    return filtered;
  }, [leaves, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const paginatedLeaves = filteredLeaves.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const stats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
    cancelled: leaves.filter((l) => l.status === "cancelled").length,
  };

  // ==================== RENDER ====================

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading your leaves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
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
            <span className="text-gray-700 font-medium">My Leaves</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  My Leaves
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {leaves.length}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Manage your leave requests and balances
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
              >
                <CalendarPlus size={16} />
                Apply Leave
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-5 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
              <p className="text-2xl font-bold text-amber-600">
                {stats.pending}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Pending</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">
                {stats.approved}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Approved</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm">
              <p className="text-2xl font-bold text-rose-600">
                {stats.rejected}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Rejected</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-gray-600">
                {stats.cancelled}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Cancelled</p>
            </div>
          </motion.div>

          {/* Leave Balance */}
          {balance && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Wallet size={16} className="text-indigo-500" />
                Leave Balance
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {LEAVE_TYPES.map((type) => {
                  const Icon = type.icon;
                  const remaining =
                    balance.remaining[
                      type.value as keyof typeof balance.remaining
                    ] || 0;
                  const used =
                    balance.used[type.value as keyof typeof balance.used] || 0;
                  const total =
                    balance.entitlements[
                      type.value as keyof typeof balance.entitlements
                    ] || 0;

                  return (
                    <div
                      key={type.value}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50 text-center"
                    >
                      <div
                        className={`p-1.5 rounded-lg ${type.bgColor} inline-block`}
                      >
                        <Icon className={`w-4 h-4 ${type.color}`} />
                      </div>
                      <p className="text-lg font-bold text-gray-800">
                        {remaining}
                      </p>
                      <p className="text-[10px] text-gray-500">{type.label}</p>
                      <p className="text-[8px] text-gray-400">
                        Used: {used}/{total}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reason or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm ${
                showFilters
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Filter size={14} />
              Filters
              {showFilters ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </motion.div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Leave Type
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                      onChange={(e) => {
                        // Add filter logic here
                      }}
                    >
                      <option value="all">All Types</option>
                      {LEAVE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Date Range
                    </label>
                    <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition">
                      <option value="all">All Time</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="quarter">This Quarter</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setShowFilters(false);
                      }}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Leaves Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied On
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLeaves.map((leave, idx) => {
                    const statusConfig = getStatusBadge(leave.status);
                    const StatusIcon = statusConfig.icon;
                    const typeConfig = getTypeConfig(leave.type);
                    const TypeIcon = typeConfig.icon;

                    return (
                      <motion.tr
                        key={leave._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => {
                          setSelectedLeave(leave);
                          setShowDetailsModal(true);
                        }}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${typeConfig.bgColor} ${typeConfig.borderColor} ${typeConfig.color}`}
                          >
                            <TypeIcon size={10} />
                            {leave.type.charAt(0).toUpperCase() +
                              leave.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                          {leave.totalDays} {leave.isHalfDay ? "(Half)" : ""}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{formatDate(leave.startDate)}</div>
                          <div className="text-xs text-gray-400">
                            to {formatDate(leave.endDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
                          {leave.reason}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit mx-auto ${statusConfig.color}`}
                          >
                            <StatusIcon size={10} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                          {formatDate(leave.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeave(leave);
                                setShowDetailsModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                            {leave.status === "pending" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLeave(leave._id);
                                }}
                                disabled={isDeleting}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Cancel Request"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredLeaves.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  No leave requests found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Apply for a leave to get started
                </p>
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition"
                >
                  <CalendarPlus size={16} className="inline mr-2" />
                  Apply for Leave
                </button>
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredLeaves.length)} of{" "}
                {filteredLeaves.length} entries
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== APPLY LEAVE MODAL ==================== */}
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
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="p-5 space-y-4">
                {/* Personal Information Section */}
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

                {/* Leave Details Section */}
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
                        onChange={(e) =>
                          setApplyForm({ ...applyForm, type: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        required
                      >
                        {LEAVE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
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
                </div>

                {/* Holiday & Off Days Section */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" />
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

                {/* Substitute Section */}
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
                      {substitutes.map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.fullName} ({sub.email}) -{" "}
                          {sub.departmentId?.name || "No Dept"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact & Details Section */}
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

                {/* Signature Section */}
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
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
                    onClick={() => setShowApplyModal(false)}
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

      {/* ==================== LEAVE DETAILS MODAL ==================== */}
      <AnimatePresence>
        {showDetailsModal && selectedLeave && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Leave Details
                    </h2>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadge(selectedLeave.status).color}`}
                    >
                      {getStatusBadge(selectedLeave.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Submitted on {formatDateTime(selectedLeave.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Employee Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Employee</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {selectedLeave.employeeName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedLeave.employeeEmail}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Department</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {selectedLeave.departmentName || "Not Assigned"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {selectedLeave.employeeRole
                        ?.replace(/_/g, " ")
                        .toUpperCase() || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Join Date</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {formatDate(selectedLeave.employeeJoinDate)}
                    </p>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Leave Type</p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border inline-block mt-0.5 ${getTypeConfig(selectedLeave.type).bgColor} ${getTypeConfig(selectedLeave.type).borderColor} ${getTypeConfig(selectedLeave.type).color}`}
                    >
                      {getTypeConfig(selectedLeave.type).label}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Total Days</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {selectedLeave.totalDays}{" "}
                      {selectedLeave.isHalfDay
                        ? `(${selectedLeave.halfDayType?.replace("_", " ") || "Half Day"})`
                        : ""}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {formatDate(selectedLeave.startDate)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">End Date</p>
                    <p className="text-gray-800 font-medium mt-0.5">
                      {formatDate(selectedLeave.endDate)}
                    </p>
                  </div>
                </div>

                {/* Holiday Info */}
                {(selectedLeave.isPreviousDayOff ||
                  selectedLeave.isNextDayOff ||
                  selectedLeave.isGovernmentHoliday) && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium">
                      Holiday Information
                    </p>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {selectedLeave.isPreviousDayOff && (
                        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Previous Day Off
                        </span>
                      )}
                      {selectedLeave.isNextDayOff && (
                        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Next Day Off
                        </span>
                      )}
                      {selectedLeave.isGovernmentHoliday && (
                        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Government Holiday
                        </span>
                      )}
                      {selectedLeave.holidayNote && (
                        <span className="text-xs text-amber-700">
                          Note: {selectedLeave.holidayNote}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Substitute */}
                {selectedLeave.substituteName && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium">
                      Substitute
                    </p>
                    <p className="text-blue-800 font-medium mt-0.5">
                      {selectedLeave.substituteName}
                    </p>
                    <p className="text-xs text-blue-600">
                      {selectedLeave.substituteEmail}
                    </p>
                    <p className="text-xs text-blue-600">
                      Status:{" "}
                      {selectedLeave.substituteApproved
                        ? "Approved ✅"
                        : "Pending ⏳"}
                    </p>
                  </div>
                )}

                {/* Reason & Details */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs text-gray-500">Reason</p>
                  <p className="text-gray-700 text-sm mt-0.5">
                    {selectedLeave.reason}
                  </p>
                </div>

                {selectedLeave.additionalDetails && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Additional Details</p>
                    <p className="text-gray-700 text-sm mt-0.5">
                      {selectedLeave.additionalDetails}
                    </p>
                  </div>
                )}

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedLeave.contactDuringLeave && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500">
                        Contact During Leave
                      </p>
                      <p className="text-gray-700 text-sm mt-0.5">
                        {selectedLeave.contactDuringLeave}
                      </p>
                    </div>
                  )}
                  {selectedLeave.emergencyContact?.name && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500">Emergency Contact</p>
                      <p className="text-gray-700 text-sm mt-0.5">
                        {selectedLeave.emergencyContact.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {selectedLeave.emergencyContact.phone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Signature */}
                {(selectedLeave.signature || selectedLeave.signatureText) && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs text-gray-500">Signature</p>
                    {selectedLeave.signature && (
                      <img
                        src={selectedLeave.signature}
                        alt="Signature"
                        className="max-h-12 mt-1 object-contain"
                      />
                    )}
                    {selectedLeave.signatureText && (
                      <p className="text-gray-700 text-sm mt-0.5 font-medium">
                        {selectedLeave.signatureText}
                      </p>
                    )}
                    {selectedLeave.signedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Signed on {formatDateTime(selectedLeave.signedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Approval / Rejection Info */}
                {selectedLeave.status === "approved" &&
                  selectedLeave.approvedByName && (
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <p className="text-xs text-emerald-600 font-medium">
                        Approved By
                      </p>
                      <p className="text-emerald-800 font-medium mt-0.5">
                        {selectedLeave.approvedByName}
                      </p>
                      <p className="text-xs text-emerald-600">
                        On {formatDateTime(selectedLeave.approvedAt)}
                      </p>
                    </div>
                  )}

                {selectedLeave.status === "rejected" &&
                  selectedLeave.rejectionReason && (
                    <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
                      <p className="text-xs text-rose-600 font-medium">
                        Rejection Reason
                      </p>
                      <p className="text-rose-800 text-sm mt-0.5">
                        {selectedLeave.rejectionReason}
                      </p>
                    </div>
                  )}

                {/* Actions */}
                {selectedLeave.status === "pending" && (
                  <button
                    onClick={() => handleDeleteLeave(selectedLeave._id)}
                    disabled={isDeleting}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Cancel Request
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
