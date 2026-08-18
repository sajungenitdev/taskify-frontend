/**
 * @file HRDashboard.tsx
 * @description Modern, type-safe, and fully responsive Human Resources management dashboard.
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Users,
  UserPlus,
  BarChart3,
  Loader2,
  RefreshCw,
  ArrowRight,
  Building,
  Briefcase,
  Activity,
  PieChart,
  CalendarDays,
  Star,
  Crown,
  GanttChart,
  Eye,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import { subDays, formatDistanceToNow } from "date-fns";

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface DepartmentObject {
  _id?: string;
  name?: string;
  code?: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId?: string;
  department?: string | DepartmentObject;
  departmentId?: string;
  position?: string;
  isActive: boolean;
  profilePhoto?: string;
  phone?: string;
  address?: string;
  joiningDate?: string;
  createdAt: string;
  managerId?: string;
  managerName?: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  employeeCount: number;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newThisMonth: number;
  departments: number;
  avgEmployeesPerDept: number;
  growthRate: number;
  mostCommonRole: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ==========================================
// CONSTANTS & HELPERS
// ==========================================

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-indigo-50 text-indigo-700 border-indigo-200",
  hr_manager: "bg-pink-50 text-pink-700 border-pink-200",
  dept_manager: "bg-blue-50 text-blue-700 border-blue-200",
  project_manager: "bg-amber-50 text-amber-700 border-amber-200",
  line_manager: "bg-cyan-50 text-cyan-700 border-cyan-200",
  employee: "bg-gray-50 text-gray-700 border-gray-200",
};

const getDepartmentName = (dept: unknown): string => {
  if (!dept) return "Unassigned";
  if (typeof dept === "object" && dept !== null) {
    const d = dept as DepartmentObject;
    return d.name || d.code || "Unassigned";
  }
  return String(dept);
};

const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function HRDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [recentJoinees, setRecentJoinees] = useState<User[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<User[]>([]);

  const [roleDistribution, setRoleDistribution] = useState<Record<string, number>>({});
  const [departmentDistribution, setDepartmentDistribution] = useState<Record<string, number>>({});

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  /**
   * Fetch all necessary dashboard data from backend APIs
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [usersRes, deptRes] = await Promise.all([
        api.get("/auth/users"),
        api.get("/departments"),
      ]);

      const allUsers: User[] = usersRes.data.data || [];
      const allDepartments: Department[] = deptRes.data.data || [];

      setUsers(allUsers);
      setDepartments(allDepartments);

      // Stat Calculations
      const activeUsers = allUsers.filter((u) => u.isActive);
      const inactiveUsers = allUsers.filter((u) => !u.isActive);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = allUsers.filter(
        (u) => new Date(u.createdAt) >= firstDayOfMonth
      ).length;

      // Role breakdown
      const roles: Record<string, number> = {};
      allUsers.forEach((u) => {
        const role = u.role || "unknown";
        roles[role] = (roles[role] || 0) + 1;
      });
      setRoleDistribution(roles);

      // Department breakdown
      const deptCounts: Record<string, number> = {};
      allUsers.forEach((u) => {
        const dept = getDepartmentName(u.department);
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      setDepartmentDistribution(deptCounts);

      const mostCommonRole = Object.entries(roles).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      // Growth Rate (Last 30 days vs previous 30 days)
      const thirtyDaysAgo = subDays(now, 30);
      const sixtyDaysAgo = subDays(now, 60);
      const recentCount = allUsers.filter((u) => new Date(u.createdAt) >= thirtyDaysAgo).length;
      const prevCount = allUsers.filter(
        (u) => new Date(u.createdAt) >= sixtyDaysAgo && new Date(u.createdAt) < thirtyDaysAgo
      ).length;
      const growthRate = prevCount > 0 ? Math.round(((recentCount - prevCount) / prevCount) * 100) : 0;

      // Recent Joinees
      const recent = allUsers
        .filter((u) => new Date(u.createdAt) >= thirtyDaysAgo)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentJoinees(recent);

      // Upcoming Work Anniversaries / Dates
      const celebrations = allUsers
        .filter((u) => u.joiningDate)
        .sort((a, b) => {
          const aDate = new Date(a.joiningDate!);
          const bDate = new Date(b.joiningDate!);
          return aDate.getMonth() - bDate.getMonth() || aDate.getDate() - bDate.getDate();
        })
        .slice(0, 5);
      setUpcomingBirthdays(celebrations);

      setStats({
        totalEmployees: allUsers.length,
        activeEmployees: activeUsers.length,
        inactiveEmployees: inactiveUsers.length,
        newThisMonth,
        departments: allDepartments.length,
        avgEmployeesPerDept: allDepartments.length > 0 ? Math.round(allUsers.length / allDepartments.length) : 0,
        growthRate,
        mostCommonRole,
      });
    } catch (error: unknown) {
      const err = error as ApiError;
      toast.error(err.response?.data?.message || "Failed to load HR dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard data refreshed successfully!");
  };

  /**
   * Filtered list of users based on search string and selected dropdown criteria
   */
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === "all" || u.role === filterRole;
      const deptName = getDepartmentName(u.department);
      const matchesDepartment = filterDepartment === "all" || deptName === filterDepartment;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && u.isActive) ||
        (filterStatus === "inactive" && !u.isActive);

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterDepartment, filterStatus]);

  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.role))).filter(Boolean);
  }, [users]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(users.map((u) => getDepartmentName(u.department)))).filter(Boolean);
  }, [users]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Assembling HR metrics...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              HR Administration
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Comprehensive organization analytics, directory tracking, and workforce oversight.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link href="/users/create">
            <button className="px-4 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-medium transition shadow-md shadow-emerald-500/20 flex items-center gap-2">
              <UserPlus size={16} />
              Add Employee
            </button>
          </Link>
        </div>
      </motion.div>

      {/* Overview Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:border-gray-200 transition">
          <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
          <p className="text-xs font-medium text-gray-400 mt-0.5 uppercase tracking-wide">Total Staff</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <p className="text-2xl font-bold text-emerald-600">{stats.activeEmployees}</p>
          <p className="text-xs font-medium text-emerald-600/70 mt-0.5 uppercase tracking-wide">Active</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <p className="text-2xl font-bold text-rose-600">{stats.inactiveEmployees}</p>
          <p className="text-xs font-medium text-rose-600/70 mt-0.5 uppercase tracking-wide">Inactive</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-xs">
          <p className="text-2xl font-bold text-blue-600">{stats.newThisMonth}</p>
          <p className="text-xs font-medium text-blue-600/70 mt-0.5 uppercase tracking-wide">New (Month)</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <p className="text-2xl font-bold text-purple-600">{stats.departments}</p>
          <p className="text-xs font-medium text-purple-600/70 mt-0.5 uppercase tracking-wide">Departments</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-xs">
          <p className="text-2xl font-bold text-amber-600">
            {stats.growthRate > 0 ? `+${stats.growthRate}%` : `${stats.growthRate}%`}
          </p>
          <p className="text-xs font-medium text-amber-600/70 mt-0.5 uppercase tracking-wide">Growth Rate</p>
        </div>
      </motion.div>

      {/* Quick Action Navigation & Distribution Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6"
        >
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            Management Links
          </h3>
          <div className="space-y-2">
            {[
              { label: "View All Employees", desc: "Access full user directory", href: "/users", icon: Users, color: "text-indigo-500 bg-indigo-50" },
              { label: "Add New Employee", desc: "Onboard staff members", href: "/users/create", icon: UserPlus, color: "text-emerald-500 bg-emerald-50" },
              { label: "Manage Departments", desc: "Organize organizational units", href: "/departments", icon: Building, color: "text-purple-500 bg-purple-50" },
              { label: "KPI Performance Dashboard", desc: "Review grading and KPIs", href: "/kpi/dashboard", icon: BarChart3, color: "text-amber-500 bg-amber-50" },
              { label: "Task Management Suite", desc: "Track tasks and project items", href: "/tasks", icon: GanttChart, color: "text-rose-500 bg-rose-50" },
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/80 transition group border border-gray-100/60"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-600 transition">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-emerald-600 transition" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Role Distribution Chart / List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart size={16} className="text-purple-500" />
              Role Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(roleDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([role, count]) => (
                  <div key={role} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded-md font-medium border ${ROLE_COLORS[role] || ROLE_COLORS.employee}`}>
                        {role.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="font-bold text-gray-700">{count} staff</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${(count / stats.totalEmployees) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            Primary Role: <strong className="text-gray-700">{stats.mostCommonRole.replace("_", " ").toUpperCase()}</strong>
          </p>
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building size={16} className="text-blue-500" />
              Department Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(departmentDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([dept, count]) => (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 truncate max-w-[160px]">{dept}</span>
                      <span className="font-bold text-gray-700">{count} staff</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(count / stats.totalEmployees) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
            Average: <strong className="text-gray-700">{stats.avgEmployeesPerDept} employees</strong> per department
          </p>
        </motion.div>
      </div>

      {/* Recent Joinees & Upcoming Celebrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6"
        >
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-emerald-500" />
            Recent Onboarding
          </h3>
          {recentJoinees.length > 0 ? (
            <div className="space-y-3">
              {recentJoinees.map((employee) => (
                <div key={employee._id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {getInitials(employee.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{employee.fullName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Briefcase size={11} />
                        {employee.role?.replace("_", " ").toUpperCase()} • {getDepartmentName(employee.department)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      {formatDistanceToNow(new Date(employee.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No recent staff additions.</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6"
        >
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-amber-500" />
            Upcoming Work Anniversaries
          </h3>
          {upcomingBirthdays.length > 0 ? (
            <div className="space-y-3">
              {upcomingBirthdays.map((employee) => (
                <div key={employee._id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {getInitials(employee.fullName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{employee.fullName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Star size={11} className="text-amber-500" />
                        {getDepartmentName(employee.department)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      {formatDate(employee.joiningDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No anniversaries found.</p>
          )}
        </motion.div>
      </div>

      {/* Full Employee Directory Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-500" />
                Staff Directory
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filteredUsers.length} results
                </span>
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:bg-white outline-none transition"
                />
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.replace("_", " ").toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:bg-white outline-none transition cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Joined</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredUsers.slice(0, 10).map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                        {getInitials(employee.fullName)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{employee.fullName}</p>
                        <p className="text-xs text-gray-400">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[employee.role] || ROLE_COLORS.employee}`}>
                      {employee.role?.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {getDepartmentName(employee.department)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${employee.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                      {employee.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {formatDate(employee.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/users/${employee._id}`}>
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition">
                        <Eye size={16} />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 10 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-center">
            <Link
              href="/users"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5"
            >
              View all {filteredUsers.length} staff records <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}