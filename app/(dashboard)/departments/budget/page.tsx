"use client";

import { useEffect, useState, useMemo } from "react";
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
  Calendar,
  Building2,
  Users,
  AlertCircle,
  Loader2,
  Home,
  ArrowLeft,
  BarChart3,
  Percent,
  Wallet,
  CreditCard,
  Receipt,
  Eye,
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
  const [sortBy, setSortBy] = useState<"allocated" | "spent" | "utilization">(
    "allocated",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = [
      "Department",
      "Code",
      "Allocated",
      "Spent",
      "Remaining",
      "Utilization",
    ];
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

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Budget report downloaded");
  };

  // Calculate filtered departments without useMemo
  // The React Compiler will handle memoization automatically
  const filteredDepartments = (() => {
    // Create a copy of departments to avoid mutating the original
    let filtered = [...departments];

    // Apply filters
    filtered = filtered.filter((dept) => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = showInactive || dept.isActive !== false;
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: number;
      let bVal: number;
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
          aVal = a.budget?.allocated
            ? ((a.budget?.spent || 0) / a.budget.allocated) * 100
            : 0;
          bVal = b.budget?.allocated
            ? ((b.budget?.spent || 0) / b.budget.allocated) * 100
            : 0;
          break;
        default:
          aVal = 0;
          bVal = 0;
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  })();

  // Calculate totals
  const totalBudget = departments.reduce(
    (sum, d) => sum + (d.budget?.allocated || 0),
    0,
  );
  const totalSpent = departments.reduce(
    (sum, d) => sum + (d.budget?.spent || 0),
    0,
  );
  const totalRemaining = totalBudget - totalSpent;
  const utilizationRate =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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

  const getUtilizationBgColor = (utilization: number) => {
    if (utilization > 90) return "bg-rose-50";
    if (utilization > 70) return "bg-amber-50";
    if (utilization > 50) return "bg-blue-50";
    return "bg-emerald-50";
  };

  if (!hasRole(["super_admin", "admin"])) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            You don't have permission to view this page
          </p>
        </motion.div>
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
            <Link
              href="/departments/all"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              Departments
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">Budget</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Budget Overview
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                  {departments.length}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Department budget allocation and spending overview
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={fetchDepartments}
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${totalBudget.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${totalRemaining.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Utilization</p>
                  <p
                    className={`text-2xl font-bold ${getUtilizationTextColor(utilizationRate)}`}
                  >
                    {utilizationRate.toFixed(1)}%
                  </p>
                </div>
                <div
                  className={`w-10 h-10 ${getUtilizationBgColor(utilizationRate)} rounded-xl flex items-center justify-center`}
                >
                  <PieChart
                    className={`w-5 h-5 ${getUtilizationTextColor(utilizationRate)}`}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="allocated">Sort by Budget</option>
                <option value="spent">Sort by Spent</option>
                <option value="utilization">Sort by Utilization</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`px-3 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2 ${
                  showInactive
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Filter size={16} />
                {showInactive ? "All" : "Active Only"}
              </button>
            </div>
          </motion.div>

          {/* Budget Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                No Departments Found
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No departments match your search"
                  : "No budget data available"}
              </p>
            </motion.div>
          ) : (
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
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocated
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spent
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilization
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employees
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Per Employee
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDepartments.map((dept, index) => {
                      const allocated = dept.budget?.allocated || 0;
                      const spent = dept.budget?.spent || 0;
                      const remaining = allocated - spent;
                      const utilization =
                        allocated > 0 ? (spent / allocated) * 100 : 0;
                      const perEmployee =
                        dept.employeeCount > 0
                          ? allocated / dept.employeeCount
                          : 0;

                      return (
                        <motion.tr
                          key={dept._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-gray-50 transition group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm font-medium group-hover:text-emerald-600 transition">
                                  {dept.name}
                                </p>
                                <p className="text-gray-400 text-xs font-mono">
                                  {dept.code}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-800 font-medium">
                            ${allocated.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700">
                            ${spent.toLocaleString()}
                          </td>
                          <td
                            className={`px-6 py-4 text-right font-medium ${remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            ${remaining.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full transition-all duration-500 ${getUtilizationColor(utilization)}`}
                                  style={{
                                    width: `${Math.min(utilization, 100)}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={`text-xs font-medium w-12 text-right ${getUtilizationTextColor(utilization)}`}
                              >
                                {utilization.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-600">
                            {dept.employeeCount || 0}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            ${perEmployee.toFixed(0)}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                  {/* Footer with totals */}
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-700">
                        Total
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-gray-800">
                        ${totalBudget.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-gray-800">
                        ${totalSpent.toLocaleString()}
                      </td>
                      <td
                        className={`px-6 py-3 text-right text-sm font-semibold ${totalRemaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        ${totalRemaining.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                        {utilizationRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                        {departments.reduce(
                          (sum, d) => sum + (d.employeeCount || 0),
                          0,
                        )}
                      </td>
                      <td className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                        $
                        {departments.length > 0
                          ? (totalBudget / departments.length).toFixed(0)
                          : 0}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
