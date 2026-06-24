"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Building2,
  Filter,
  Calendar,
  ArrowLeft,
  FileJson,
  // FileCsv,
  Settings,
  Info,
  ChevronRight,
  Shield,
  Mail,
  Phone,
  Briefcase,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import Link from "next/link";
import { FaFileCsv } from "react-icons/fa";

export default function ExportPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("users");
  const [format, setFormat] = useState("csv");
  const [filters, setFilters] = useState({
    role: "",
    department: "",
    status: "all",
    dateRange: "all",
  });
  const [departments, setDepartments] = useState<
    { _id: string; name: string; code: string }[]
  >([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });

  const canExport = hasRole(["super_admin", "admin", "hr_manager"]);

  useEffect(() => {
    if (!canExport) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canExport, router]);

  useEffect(() => {
    fetchDepartments();
    fetchStats();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/auth/users");
      if (response.data.success) {
        const users = response.data.data || [];
        setStats({
          totalUsers: users.length,
          totalDepartments: departments.length,
          activeUsers: users.filter((u: any) => u.isActive).length,
          inactiveUsers: users.filter((u: any) => !u.isActive).length,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append("type", exportType);
      params.append("format", format);
      if (filters.role) params.append("role", filters.role);
      if (filters.department) params.append("department", filters.department);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.dateRange !== "all")
        params.append("dateRange", filters.dateRange);

      const response = await api.get(`/users/export?${params.toString()}`, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      let filename = `${exportType}_export_${new Date().toISOString().split("T")[0]}.${format === "csv" ? "csv" : "json"}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Export completed: ${filename}`);
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(
        error.response?.data?.message || "Export failed. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };

  const formatOptions = [
    {
      value: "csv",
      label: "CSV",
      icon: FaFileCsv,
      description: "Comma-separated values",
    },
    {
      value: "json",
      label: "JSON",
      icon: FileJson,
      description: "JavaScript Object Notation",
    },
  ];

  const userRoles = [
    { value: "", label: "All Roles" },
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "hr_manager", label: "HR Manager" },
    { value: "dept_manager", label: "Department Manager" },
    { value: "project_manager", label: "Project Manager" },
    { value: "line_manager", label: "Line Manager" },
    { value: "employee", label: "Employee" },
  ];

  const dateRanges = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status", icon: Users },
    { value: "active", label: "Active Only", icon: UserCheck },
    { value: "inactive", label: "Inactive Only", icon: UserX },
  ];

  const getFilterCount = useMemo(() => {
    let count = 0;
    if (filters.role) count++;
    if (filters.department) count++;
    if (filters.status !== "all") count++;
    if (filters.dateRange !== "all") count++;
    return count;
  }, [filters]);

  if (!canExport) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Export Data
                </h1>
              </div>
              <p className="text-gray-500 text-sm">
                Export user and department data in various formats
              </p>
            </div>
            <Link
              href="/users/all"
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <ArrowLeft size={16} />
              Back to Users
            </Link>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalUsers}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.activeUsers}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Active Users</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-rose-600">
                    {stats.inactiveUsers}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Inactive Users</p>
                </div>
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                  <UserX className="w-5 h-5 text-rose-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalDepartments}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Departments</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Download size={18} className="text-emerald-500" />
                Export Options
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setExportType("users")}
                      className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        exportType === "users"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <Users size={18} />
                      Users
                    </button>
                    <button
                      onClick={() => setExportType("departments")}
                      className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        exportType === "departments"
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <Building2 size={18} />
                      Departments
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {formatOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFormat(option.value)}
                          className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                            format === option.value
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <Icon size={18} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters({ ...filters, dateRange: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    {dateRanges.map((range) => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Filter size={18} className="text-indigo-500" />
                  Filters
                </h2>
                {getFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                    {getFilterCount} active
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {exportType === "users" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={filters.role}
                      onChange={(e) =>
                        setFilters({ ...filters, role: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      {userRoles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {exportType === "users" ? "Department" : "Filter by"}
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) =>
                      setFilters({ ...filters, department: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} {dept.code && `(${dept.code})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            setFilters({ ...filters, status: option.value })
                          }
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                            filters.status === option.value
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <Icon size={12} />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Export Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Info size={18} className="text-indigo-500" />
              Export Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">Data Type</p>
                <p className="text-sm font-medium text-gray-800 capitalize mt-0.5">
                  {exportType}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">Format</p>
                <p className="text-sm font-medium text-gray-800 uppercase mt-0.5">
                  {format}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">Date Range</p>
                <p className="text-sm font-medium text-gray-800 capitalize mt-0.5">
                  {dateRanges.find((r) => r.value === filters.dateRange)
                    ?.label || "All Time"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500">Active Filters</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">
                  {getFilterCount}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Export Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-8 text-center"
          >
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl inline-flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 text-base font-medium"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Export...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Export Now
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-4 max-w-2xl mx-auto">
              {exportType === "users"
                ? "Export includes: Full Name, Email, Employee ID, Role, Department, Status, Last Login, Join Date, Phone Number"
                : "Export includes: Department Name, Code, Description, Head of Department, Employee Count, Status, Created At"}
            </p>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 rounded-xl p-4 border border-blue-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Export Information
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Large exports may take a few moments to process. The file will
                  be downloaded automatically once ready. For best results, use
                  filters to narrow down the data. Maximum export size is 100MB.
                </p>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Clock size={12} />
                    <span>Processes in real-time</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Shield size={12} />
                    <span>Secure download</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <FileText size={12} />
                    <span>Formatted data</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
