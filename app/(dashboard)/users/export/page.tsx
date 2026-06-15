"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

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
  });
  const [departments, setDepartments] = useState<
    { _id: string; name: string }[]
  >([]);

  const canExport = hasRole(["super_admin", "admin", "hr_manager"]);

  useEffect(() => {
    if (!canExport) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canExport, router]);

  useEffect(() => {
    fetchDepartments();
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append("type", exportType);
      params.append("format", format);
      if (filters.role) params.append("role", filters.role);
      if (filters.department) params.append("department", filters.department);
      if (filters.status !== "all") params.append("status", filters.status);

      const response = await api.get(`/users/export?${params.toString()}`, {
        responseType: "blob",
      });

      // Get filename from Content-Disposition header or use default
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

  if (!canExport) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-6 pe-0">
      <div className="container mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Export Data</h1>
          <p className="text-slate-400 text-sm mt-1">
            Export user and department data in various formats
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Options */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Download size={18} className="text-indigo-400" />
              Export Options
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Data Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportType("users")}
                    className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      exportType === "users"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <Users size={18} />
                    Users
                  </button>
                  <button
                    onClick={() => setExportType("departments")}
                    className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      exportType === "departments"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <Building2 size={18} />
                    Departments
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  File Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat("csv")}
                    className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      format === "csv"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <FileSpreadsheet size={18} />
                    CSV
                  </button>
                  <button
                    onClick={() => setFormat("json")}
                    className={`px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      format === "json"
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    <Database size={18} />
                    JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Filter size={18} className="text-indigo-400" />
              Filters (Optional)
            </h2>

            <div className="space-y-5">
              {exportType === "users" && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Role
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) =>
                      setFilters({ ...filters, role: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                  >
                    <option value="">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="dept_manager">Department Manager</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="line_manager">Line Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  {exportType === "users" ? "Department" : "Filter by"}
                </label>
                <select
                  value={filters.department}
                  onChange={(e) =>
                    setFilters({ ...filters, department: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Export Summary */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
          <h3 className="text-md font-semibold text-white mb-3">
            Export Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Data Type:</span>
              <span className="text-white font-medium capitalize">
                {exportType}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Format:</span>
              <span className="text-white font-medium uppercase">{format}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Filters Applied:</span>
              <span className="text-white">
                {filters.role ||
                filters.department ||
                filters.status !== "all" ? (
                  <span className="text-emerald-400">Yes</span>
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-2xl border border-indigo-500/20 p-6 text-center">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl inline-flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
          >
            {exporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Export...
              </>
            ) : (
              <>
                <Download size={18} />
                Export Now
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-4">
            {exportType === "users"
              ? "Export includes: Full Name, Email, Employee ID, Role, Department, Status, Last Login, Join Date"
              : "Export includes: Department Name, Code, Description, Head of Department, Employee Count, Status"}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-400 font-medium">
                Export Information
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Large exports may take a few moments to process. The file will
                be downloaded automatically once ready. For best results, use
                filters to narrow down the data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
