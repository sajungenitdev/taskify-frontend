"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  Loader2,
  Users,
  Building2,
  Filter,
  ArrowLeft,
  FileJson,
  Info,
  Shield,
  Clock,
  UserCheck,
  UserX,
  CheckCircle2,
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
  const [exportType, setExportType] = useState<"users" | "departments">("users");
  const [format, setFormat] = useState<"csv" | "json">("csv");
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
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersRes, deptRes] = await Promise.all([
        api.get("/auth/users").catch(() => ({ data: { success: false, data: [] } })),
        api.get("/departments").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const users = usersRes.data.success ? usersRes.data.data || [] : [];
      const depts = deptRes.data.success ? deptRes.data.data || [] : [];

      setStats({
        totalUsers: users.length,
        totalDepartments: depts.length,
        activeUsers: users.filter((u: any) => u.isActive).length,
        inactiveUsers: users.filter((u: any) => !u.isActive).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Robust export handler with dynamic endpoint routing & client-side fallback
  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading("Preparing data stream...");

    try {
      const endpoint = exportType === "users" ? "/auth/users" : "/departments";
      const res = await api.get(endpoint);
      let dataToExport = res.data.success ? res.data.data || [] : [];

      // Apply client-side filters if exporting users
      if (exportType === "users") {
        if (filters.role) {
          dataToExport = dataToExport.filter((u: any) => u.role === filters.role);
        }
        if (filters.department) {
          dataToExport = dataToExport.filter((u: any) => {
            const uDeptId = typeof u.department === "object" ? u.department?._id : u.department;
            return uDeptId === filters.department;
          });
        }
        if (filters.status !== "all") {
          const targetActive = filters.status === "active";
          dataToExport = dataToExport.filter((u: any) => u.isActive === targetActive);
        }
      }

      if (dataToExport.length === 0) {
        toast.error("No records found matching current criteria.", { id: toastId });
        setExporting(false);
        return;
      }

      let blobData: Blob;
      let filename = `${exportType}_export_${new Date().toISOString().split("T")[0]}`;

      if (format === "json") {
        blobData = new Blob([JSON.stringify(dataToExport, null, 2)], {
          type: "application/json",
        });
        filename += ".json";
      } else {
        // Generate CSV format dynamically
        const keys = Object.keys(dataToExport[0] || {});
        const csvRows = [
          keys.join(","),
          ...dataToExport.map((row: any) =>
            keys
              .map((key) => {
                let val = row[key];
                if (typeof val === "object" && val !== null) {
                  val = val.fullName || val.name || val._id || JSON.stringify(val);
                }
                return `"${String(val ?? "").replace(/"/g, '""')}"`;
              })
              .join(",")
          ),
        ];
        blobData = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        filename += ".csv";
      }

      const url = window.URL.createObjectURL(blobData);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Successfully exported ${dataToExport.length} records!`, { id: toastId });
    } catch (error: any) {
      console.error("Export generation error:", error);
      toast.error(error.response?.data?.message || "Export pipeline failed. Please retry.", {
        id: toastId,
      });
    } finally {
      setExporting(false);
    }
  };

  const formatOptions = [
    { value: "csv", label: "CSV File", icon: FaFileCsv, desc: "Spreadsheet compatible" },
    { value: "json", label: "JSON Data", icon: FileJson, desc: "Structured raw object" },
  ];

  const userRoles = [
    { value: "", label: "All Roles" },
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "hr_manager", label: "HR Manager" },
    { value: "dept_manager", label: "Department Manager" },
    { value: "employee", label: "Employee" },
  ];

  const statusOptions = [
    { value: "all", label: "All Records", icon: Users },
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
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Data Export Center</h1>
                <p className="text-slate-500 text-sm font-medium">Extract system directories, user roles, and structural logs securely.</p>
              </div>
            </div>
          </div>
          <Link
            href="/users"
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs self-start sm:self-auto"
          >
            <ArrowLeft size={16} />
            Return to Directory
          </Link>
        </motion.div>

        {/* Analytics Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Users", val: stats.totalUsers, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Active Users", val: stats.activeUsers, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Inactive Users", val: stats.inactiveUsers, icon: UserX, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Departments", val: stats.totalDepartments, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center font-bold`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.val}</p>
            </div>
          ))}
        </motion.div>

        {/* Configuration Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Export Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download size={18} className="text-emerald-600" />
              Configuration Parameters
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Target Dataset</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportType("users")}
                    className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${exportType === "users"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    <Users size={16} />
                    Users Directory
                  </button>
                  <button
                    onClick={() => setExportType("departments")}
                    className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${exportType === "departments"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    <Building2 size={16} />
                    Departments
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">File Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {formatOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFormat(opt.value as any)}
                        className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${format === opt.value
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <Icon size={16} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Filter size={18} className="text-indigo-600" />
                Query Filters
              </h2>
              {getFilterCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  {getFilterCount} active
                </span>
              )}
            </div>

            <div className="space-y-4">
              {exportType === "users" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Role Scope</label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  >
                    {userRoles.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Department Division</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs font-semibold focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                >
                  <option value="">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} {d.code && `(${d.code})`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Account Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {statusOptions.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.value}
                        onClick={() => setFilters({ ...filters, status: s.value })}
                        className={`py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${filters.status === s.value
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <Icon size={12} />
                        {s.label.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Trigger Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-indigo-900 to-violet-900 rounded-3xl p-8 text-center text-white shadow-xl space-y-6"
        >
          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl font-extrabold tracking-tight">Ready to Export Dataset</h3>
            <p className="text-slate-300 text-xs font-medium">
              You are about to generate a {format.toUpperCase()} archive containing filtered {exportType} records from the active system workspace.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm inline-flex items-center gap-3 transition shadow-lg shadow-emerald-500/30 disabled:opacity-50 active:scale-95"
          >
            {exporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Export Stream...
              </>
            ) : (
              <>
                <Download size={18} />
                Download Export File
              </>
            )}
          </button>
        </motion.div>

        {/* System Security & Notice Footer */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs text-slate-500">
            <p className="font-bold text-slate-800 text-sm">Security & Compliance Notice</p>
            <p>
              All exported records are logged for auditing purposes. Ensure that downloaded datasets are handled according to internal data privacy policies. Large datasets download instantaneously via client memory compilation.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}