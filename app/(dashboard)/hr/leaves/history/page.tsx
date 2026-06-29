// app/hr/leave-history/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
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
  RefreshCw,
  User,
  Calendar as CalendarIcon,
  Eye,
  Loader2,
  Building2,
  Briefcase,
  UserCheck,
  FileText,
  Plus,
  Trash2,
  Check,
  X,
  MessageSquare,
  Ban,
  UserPlus,
  UsersRound,
  PieChart,
  CalendarDays,
  Home,
  ChevronRight as ChevronRightIcon,
  Star,
  Bell,
  Clock8,
  CalendarClock,
  Heart,
  Baby,
  CloudRain,
  Sun,
  Info,
  FileCheck,
  Download,
  Printer,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase as BriefcaseIcon,
  Shield,
  Crown,
  UserCog,
  MoreVertical,
  ChevronDown,
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
  rejectionReason?: string;
}

interface EmployeeLeaveSummary {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeIdNumber?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  totalLeavesTaken: number;
  totalLeavesPending: number;
  leaveBalances: {
    annual: { total: number; used: number; remaining: number };
    sick: { total: number; used: number; remaining: number };
    casual: { total: number; used: number; remaining: number };
    earned: { total: number; used: number; remaining: number };
    maternity: { total: number; used: number; remaining: number };
    paternity: { total: number; used: number; remaining: number };
    bereavement: { total: number; used: number; remaining: number };
    unpaid: { total: number; used: number; remaining: number };
    other: { total: number; used: number; remaining: number };
  };
  leaveHistory: LeaveRequest[];
}

interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
}

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

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

// Default leave balances per leave type
const DEFAULT_LEAVE_BALANCES: Record<string, number> = {
  annual: 16,
  sick: 16,
  casual: 16,
  earned: 16,
  maternity: 90,
  paternity: 15,
  bereavement: 5,
  unpaid: 0,
  other: 0,
};

const LEAVE_TYPES = [
  "annual",
  "sick",
  "casual",
  "earned",
  "maternity",
  "paternity",
  "bereavement",
  "unpaid",
  "other",
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmployeeLeaveHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // State
  const [allLeaves, setAllLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<EmployeeLeaveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeLeaveSummary | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isAuthenticated) {
      fetchLeaveData();
    }
  }, [isAuthenticated]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLeaveData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);

      // Fetch all leave requests
      const response = await api.get("/leaves/all");

      if (response.data.success) {
        const leaves: LeaveRequest[] = response.data.data || [];
        setAllLeaves(leaves);

        // Process data to get employee summaries
        const summaries = processEmployeeLeaveData(leaves);
        setEmployees(summaries);

        // Extract unique departments for filter
        const deptSet = new Set<string>();
        summaries.forEach((emp) => {
          if (emp.departmentName) {
            deptSet.add(emp.departmentName);
          }
        });
        setDepartments(Array.from(deptSet));
      }
    } catch (error: any) {
      console.error("Error fetching leave data:", error);
      toast.error(
        error.response?.data?.message || "Failed to load employee leave data",
      );
      setAllLeaves([]);
      setEmployees([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const processEmployeeLeaveData = (
    leaves: LeaveRequest[],
  ): EmployeeLeaveSummary[] => {
    // Group leaves by employee
    const employeeMap = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        employeeEmail: string;
        employeeIdNumber?: string;
        departmentId?: string;
        departmentName?: string;
        position?: string;
        leaves: LeaveRequest[];
      }
    >();

    leaves.forEach((leave) => {
      const empId = leave.employeeId?._id || (leave.employeeId as string);

      if (!employeeMap.has(empId)) {
        const emp = leave.employeeId;
        employeeMap.set(empId, {
          employeeId: empId,
          employeeName:
            typeof emp === "object" ? emp?.fullName || "Unknown" : "Unknown",
          employeeEmail: typeof emp === "object" ? emp?.email || "" : "",
          employeeIdNumber:
            typeof emp === "object" ? emp?.employeeId : undefined,
          departmentId:
            typeof emp === "object" && emp?.departmentId
              ? typeof emp.departmentId === "object"
                ? emp.departmentId._id
                : emp.departmentId
              : undefined,
          departmentName:
            typeof emp === "object" && emp?.departmentId
              ? typeof emp.departmentId === "object"
                ? emp.departmentId.name
                : undefined
              : undefined,
          position: typeof emp === "object" ? emp?.position : undefined,
          leaves: [],
        });
      }

      employeeMap.get(empId)?.leaves.push(leave);
    });

    // Process each employee's data
    const summaries: EmployeeLeaveSummary[] = [];

    employeeMap.forEach((data) => {
      const { leaves, ...employeeInfo } = data;

      // Initialize balances with default values
      const balances: EmployeeLeaveSummary["leaveBalances"] = {
        annual: {
          total: DEFAULT_LEAVE_BALANCES.annual,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.annual,
        },
        sick: {
          total: DEFAULT_LEAVE_BALANCES.sick,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.sick,
        },
        casual: {
          total: DEFAULT_LEAVE_BALANCES.casual,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.casual,
        },
        earned: {
          total: DEFAULT_LEAVE_BALANCES.earned,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.earned,
        },
        maternity: {
          total: DEFAULT_LEAVE_BALANCES.maternity,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.maternity,
        },
        paternity: {
          total: DEFAULT_LEAVE_BALANCES.paternity,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.paternity,
        },
        bereavement: {
          total: DEFAULT_LEAVE_BALANCES.bereavement,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.bereavement,
        },
        unpaid: {
          total: DEFAULT_LEAVE_BALANCES.unpaid,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.unpaid,
        },
        other: {
          total: DEFAULT_LEAVE_BALANCES.other,
          used: 0,
          remaining: DEFAULT_LEAVE_BALANCES.other,
        },
      };

      let totalTaken = 0;
      let totalPending = 0;

      // Process each leave request
      leaves.forEach((leave) => {
        const type = leave.type as keyof typeof balances;
        if (balances[type]) {
          if (leave.status === "approved") {
            balances[type].used += leave.totalDays || 0;
            totalTaken += leave.totalDays || 0;
          } else if (leave.status === "pending") {
            totalPending += leave.totalDays || 0;
          }
        }
      });

      // Calculate remaining balances
      Object.keys(balances).forEach((key) => {
        const type = key as keyof typeof balances;
        balances[type].remaining = Math.max(
          0,
          balances[type].total - balances[type].used,
        );
      });

      summaries.push({
        employeeId: employeeInfo.employeeId,
        employeeName: employeeInfo.employeeName,
        employeeEmail: employeeInfo.employeeEmail,
        employeeIdNumber: employeeInfo.employeeIdNumber,
        departmentId: employeeInfo.departmentId,
        departmentName: employeeInfo.departmentName || "Unassigned",
        position: employeeInfo.position,
        totalLeavesTaken: totalTaken,
        totalLeavesPending: totalPending,
        leaveBalances: balances,
        leaveHistory: leaves.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      });
    });

    return summaries;
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

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

  const getLeaveTypeIcon = (type: string) => {
    return leaveTypeIcons[type] || Calendar;
  };

  const getLeaveTypeLabel = (type: string) => {
    return leaveTypeLabels[type] || type;
  };

  const getLeaveTypeColor = (type: string) => {
    return leaveTypeColors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusLabel = (status: string) => {
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  // ============================================================================
  // FILTERING
  // ============================================================================

  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employeeName.toLowerCase().includes(search) ||
          emp.employeeEmail.toLowerCase().includes(search) ||
          emp.employeeIdNumber?.toLowerCase().includes(search) ||
          emp.departmentName?.toLowerCase().includes(search),
      );
    }

    if (filterDepartment !== "all") {
      filtered = filtered.filter(
        (emp) => emp.departmentName === filterDepartment,
      );
    }

    return filtered;
  }, [employees, searchTerm, filterDepartment]);

  // ============================================================================
  // STATS
  // ============================================================================

  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalLeavesTaken = employees.reduce(
      (sum, emp) => sum + emp.totalLeavesTaken,
      0,
    );
    const totalLeavesPending = employees.reduce(
      (sum, emp) => sum + emp.totalLeavesPending,
      0,
    );
    const avgLeavesPerEmployee =
      totalEmployees > 0 ? Math.round(totalLeavesTaken / totalEmployees) : 0;

    return {
      totalEmployees,
      totalLeavesTaken,
      totalLeavesPending,
      avgLeavesPerEmployee,
    };
  }, [employees]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading employee leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <span className="text-gray-700 font-medium">
            Employee Leave History
          </span>
        </motion.div>

        {/* ============================================================
            HEADER
            ============================================================ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <Users className="w-7 h-7 text-indigo-500" />
              Employee Leave History
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              View and manage employee leave balances and history
              {refreshing && (
                <span className="text-xs text-indigo-500 animate-pulse ml-2">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Updating...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => {
                toast.success("Exporting employee leave data...");
              }}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-xl transition-all text-sm font-medium shadow-md shadow-indigo-500/25 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* ============================================================
            STATS CARDS
            ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.totalEmployees}
                </p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Total Employees
                </p>
              </div>
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
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
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalLeavesTaken}
                </p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Total Leaves Taken
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-blue-600" />
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
                <p className="text-2xl font-bold text-amber-600">
                  {stats.totalLeavesPending}
                </p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Pending Requests
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
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-4 shadow-md text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {stats.avgLeavesPerEmployee}
                </p>
                <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider">
                  Avg Leaves / Employee
                </p>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <PieChart className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
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
                placeholder="Search employees by name, email, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[160px]"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterDepartment("all");
                  fetchLeaveData();
                }}
                className="cursor-pointer px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                title="Reset filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>

        {/* ============================================================
            EMPLOYEE LIST
            ============================================================ */}
        {filteredEmployees.length > 0 ? (
          <div className="space-y-4">
            {filteredEmployees.map((employee, index) => (
              <motion.div
                key={employee.employeeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-md transition-all p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Employee Info */}
                  <div className="flex items-start gap-4 min-w-[200px]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-base font-bold flex-shrink-0">
                      {getInitials(employee.employeeName)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {employee.employeeName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {employee.employeeEmail}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {employee.employeeIdNumber && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            ID: {employee.employeeIdNumber}
                          </span>
                        )}
                        {employee.departmentName && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {employee.departmentName}
                          </span>
                        )}
                        {employee.position && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {employee.position}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Leave Summary */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">
                          {employee.totalLeavesTaken}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                          Taken
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-600">
                          {employee.totalLeavesPending}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                          Pending
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">
                          {Object.values(employee.leaveBalances).reduce(
                            (sum, b) => sum + b.remaining,
                            0,
                          )}
                        </p>
                        <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                          Available
                        </p>
                      </div>
                    </div>

                    {/* Quick Balance Overview */}
                    <div className="flex flex-wrap gap-1.5">
                      {LEAVE_TYPES.map((type) => {
                        const balance =
                          employee.leaveBalances[
                            type as keyof typeof employee.leaveBalances
                          ];
                        if (!balance || balance.total === 0) return null;
                        const Icon = getLeaveTypeIcon(type);
                        const isLow = balance.remaining < balance.total * 0.2;
                        const isCritical = balance.remaining === 0;

                        return (
                          <div
                            key={type}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
                              isCritical
                                ? "bg-red-50 border-red-200"
                                : isLow
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-gray-50 border-gray-200"
                            }`}
                            title={`${getLeaveTypeLabel(type)}: ${balance.remaining} remaining`}
                          >
                            <Icon
                              className={`w-3 h-3 ${isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-indigo-500"}`}
                            />
                            <span
                              className={`text-xs font-medium ${isCritical ? "text-red-500" : isLow ? "text-amber-500" : "text-gray-700"}`}
                            >
                              {balance.remaining}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowDetailsModal(true);
                      }}
                      className="cursor-pointer px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100/80">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No employees found
            </h3>
            <p className="text-gray-500 mt-1">
              {searchTerm || filterDepartment !== "all"
                ? "No employees match your filters"
                : "No employee data available"}
            </p>
          </div>
        )}
      </div>

      {/* ============================================================
          EMPLOYEE DETAILS MODAL
          ============================================================ */}
      <AnimatePresence>
        {showDetailsModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-5 flex justify-between items-start z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-lg font-bold">
                    {getInitials(selectedEmployee.employeeName)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedEmployee.employeeName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedEmployee.employeeEmail}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedEmployee.employeeIdNumber && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          ID: {selectedEmployee.employeeIdNumber}
                        </span>
                      )}
                      {selectedEmployee.departmentName && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {selectedEmployee.departmentName}
                        </span>
                      )}
                      {selectedEmployee.position && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {selectedEmployee.position}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="cursor-pointer p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Leave Balance Summary */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-500" />
                    Leave Balances
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {LEAVE_TYPES.map((type) => {
                      const balance =
                        selectedEmployee.leaveBalances[
                          type as keyof typeof selectedEmployee.leaveBalances
                        ];
                      if (!balance || balance.total === 0) return null;
                      const Icon = getLeaveTypeIcon(type);
                      const label = getLeaveTypeLabel(type);
                      const isLow = balance.remaining < balance.total * 0.2;
                      const isCritical = balance.remaining === 0;
                      const percentage =
                        balance.total > 0
                          ? (balance.used / balance.total) * 100
                          : 0;

                      return (
                        <div
                          key={type}
                          className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                        >
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
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            Used: {balance.used}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Leave History */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Leave History
                  </h3>
                  {selectedEmployee.leaveHistory &&
                  selectedEmployee.leaveHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Duration
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Days
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedEmployee.leaveHistory.map((leave) => (
                            <tr
                              key={leave._id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-4 py-2">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border ${getLeaveTypeColor(leave.type)}`}
                                >
                                  {getLeaveTypeLabel(leave.type)}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {formatDate(leave.startDate)} -{" "}
                                {formatDate(leave.endDate)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {leave.totalDays} days
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(leave.status)}`}
                                >
                                  {getStatusLabel(leave.status)}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {formatDate(leave.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-500">
                        No leave history available
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-700">
                      Total Taken
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedEmployee.totalLeavesTaken} days
                    </p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <p className="text-sm font-medium text-amber-700">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-amber-900">
                      {selectedEmployee.totalLeavesPending} days
                    </p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-xl">
                    <p className="text-sm font-medium text-emerald-700">
                      Available
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {Object.values(selectedEmployee.leaveBalances).reduce(
                        (sum, b) => sum + b.remaining,
                        0,
                      )}{" "}
                      days
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
