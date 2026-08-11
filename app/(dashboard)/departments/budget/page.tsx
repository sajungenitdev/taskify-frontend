"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Download,
  Building2,
  AlertCircle,
  Loader2,
  Home,
} from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
    fiscalYear: string;
  };
  employeeCount: number;
  headOfDepartment?: { fullName: string };
  isActive: boolean;
}

export default function BudgetPage() {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"allocated" | "spent" | "utilization">("allocated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showInactive, setShowInactive] = useState(false);

  const canViewBudget = hasRole(["super_admin", "admin"]);

  /**
   * Concurrently fetch departments and users, matching records securely
   * across multiple schema keys to guarantee accurate headcount metrics.
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [deptRes, usersRes] = await Promise.all([
        api.get("/departments").catch(() => ({ data: { success: false, data: [] } })),
        api.get("/auth/users").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const rawDepts: Department[] = deptRes.data.success ? deptRes.data.data || [] : [];
      const users: any[] = usersRes.data.success ? usersRes.data.data || [] : [];

      // Process departments with multi-key user mapping fallbacks
      const processedDepts = rawDepts.map((dept) => {
        const deptId = String(dept._id || "").trim();
        const deptCode = String(dept.code || "").trim().toLowerCase();

        const members = users.filter((u) => {
          // Check all potential schema field variations for user department reference
          const userDeptField = u.department || u.departmentId || u.dept;
          if (!userDeptField) return false;

          let userDeptId = "";
          let userDeptCode = "";

          if (typeof userDeptField === "object" && userDeptField !== null) {
            userDeptId = String(userDeptField._id || userDeptField.id || "").trim();
            userDeptCode = String(userDeptField.code || "").trim().toLowerCase();
          } else {
            userDeptId = String(userDeptField).trim();
          }

          // Match securely by unique ID or department code tag
          return userDeptId === deptId || (userDeptCode && userDeptCode === deptCode);
        });

        const computedCount = members.length > 0 ? members.length : dept.employeeCount || 0;

        return {
          ...dept,
          employeeCount: computedCount,
          budget: dept.budget || { allocated: 0, spent: 0, currency: "USD", fiscalYear: "2026" },
        };
      });

      setDepartments(processedDepts);
    } catch (error) {
      console.error("Error syncing budget dataset:", error);
      toast.error("Failed to load department budgets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    const headers = ["Department", "Code", "Allocated", "Spent", "Remaining", "Utilization"];
    const rows = filteredDepartments.map((dept) => {
      const allocated = dept.budget?.allocated || 0;
      const spent = dept.budget?.spent || 0;
      const remaining = allocated - spent;
      const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
      return [
        dept.name,
        dept.code,
        allocated.toFixed(2),
        spent.toFixed(2),
        remaining.toFixed(2),
        utilization.toFixed(1) + "%",
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `budget_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Budget report exported successfully");
  };

  // Filter and sort departments directly (React Compiler handles automated memoization)
  const filteredDepartments = (() => {
    let filtered = [...departments];

    filtered = filtered.filter((dept) => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showInactive || dept.isActive !== false;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      switch (sortBy) {
        case "allocated":
          aVal = a.budget?.allocated || 0;
          bVal = b.budget?.allocated || 0;
          break;
        case "spent":
          aVal = a.budget?.spent || 0;
          bVal = b.budget?.spent || 0;
          break;
        case "utilization":
          aVal = a.budget?.allocated ? ((a.budget?.spent || 0) / a.budget.allocated) * 100 : 0;
          bVal = b.budget?.allocated ? ((b.budget?.spent || 0) / b.budget.allocated) * 100 : 0;
          break;
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  })();

  const totalBudget = departments.reduce((sum, d) => sum + (d.budget?.allocated || 0), 0);
  const totalSpent = departments.reduce((sum, d) => sum + (d.budget?.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const totalWorkforce = departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0);

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 90) return "bg-rose-500";
    if (utilization > 70) return "bg-amber-500";
    if (utilization > 50) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const getUtilizationTextColor = (utilization: number) => {
    if (utilization > 90) return "text-rose-600";
    if (utilization > 70) return "text-amber-600";
    if (utilization > 50) return "text-blue-600";
    return "text-emerald-600";
  };

  if (!canViewBudget) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-md w-full"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-sm">You lack administrative privileges to view financial budgets.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/dashboard" className="hover:text-slate-600 transition flex items-center gap-1">
            <Home size={13} /> Dashboard
          </Link>
          <ChevronRight size={13} />
          <Link href="/departments" className="hover:text-slate-600 transition">Departments</Link>
          <ChevronRight size={13} />
          <span className="text-slate-700">Financial Budgets</span>
        </div>

        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Budget & Financial Overview</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                    {departments.length}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Monitor departmental capital allocations, expenditure burn rates, and unit spending.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-xs cursor-pointer"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Allocated", val: `$${totalBudget.toLocaleString()}`, icon: DollarSign, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Total Spent", val: `$${totalSpent.toLocaleString()}`, icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Net Remaining", val: `$${totalRemaining.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Utilization Rate", val: `${utilizationRate.toFixed(1)}%`, icon: PieChart, color: getUtilizationTextColor(utilizationRate), bg: "bg-blue-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center font-bold`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-extrabold tracking-tight ${i === 3 ? stat.color : "text-slate-900"}`}>{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search departments by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-sm font-semibold outline-none cursor-pointer"
            >
              <option value="allocated">Sort by Allocated</option>
              <option value="spent">Sort by Spent</option>
              <option value="utilization">Sort by Utilization</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 rounded-2xl transition shadow-xs cursor-pointer font-bold text-xs"
              title="Toggle Sort Direction"
            >
              {sortOrder === "asc" ? "ASC" : "DESC"}
            </button>

            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${showInactive ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                }`}
            >
              <Filter size={14} />
              {showInactive ? "All Units" : "Active Only"}
            </button>
          </div>
        </div>

        {/* Budget Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-400">Loading fiscal datasets...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-xs max-w-lg mx-auto space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Financial Records</h3>
            <p className="text-slate-400 text-xs">No department budgets matched your query parameters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Sl</th>
                    <th className="px-6 py-4">Department Unit</th>
                    <th className="px-6 py-4 text-center">Allocated</th>
                    <th className="px-6 py-4 text-center">Spent</th>
                    <th className="px-6 py-4 text-center">Remaining</th>
                    <th className="px-6 py-4 text-center">Utilization Rate</th>
                    <th className="px-6 py-4 text-center">Staff Headcount</th>
                    <th className="px-6 py-4 text-center">Per Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredDepartments.map((dept, index) => {
                    const allocated = dept.budget?.allocated || 0;
                    const spent = dept.budget?.spent || 0;
                    const remaining = allocated - spent;
                    const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
                    const perEmployee = (dept.employeeCount || 0) > 0 ? allocated / dept.employeeCount : 0;

                    return (
                      <motion.tr
                        key={dept._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-slate-50/50 transition group"
                      >
                        <td className="text-center w-3">{index+1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-xs">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition">{dept.name}</p>
                              <p className="font-mono text-xs text-slate-400">{dept.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900">${allocated.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-600">${spent.toLocaleString()}</td>
                        <td className={`px-6 py-4 text-center font-extrabold ${remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          ${remaining.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${getUtilizationColor(utilization)}`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-extrabold w-12 text-center ${getUtilizationTextColor(utilization)}`}>
                              {utilization.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900">{dept.employeeCount || 0}</td>
                        <td className="px-6 py-4 text-center font-semibold text-slate-600">${perEmployee.toFixed(0)}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
                {/* Aggregate Summary Footer */}
                <tfoot className="bg-slate-50/70 border-t border-slate-100 text-sm font-bold text-slate-900">
                  <tr>
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4">Consolidated Totals</td>
                    <td className="px-6 py-4 text-center">${totalBudget.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">${totalSpent.toLocaleString()}</td>
                    <td className={`px-6 py-4 text-center ${totalRemaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      ${totalRemaining.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">{utilizationRate.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-center">{totalWorkforce}</td>
                    <td className="px-6 py-4 text-center">
                      ${departments.length > 0 ? (totalBudget / departments.length).toFixed(0) : 0}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}