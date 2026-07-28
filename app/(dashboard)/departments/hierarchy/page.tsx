"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  ChevronRight,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Home,
  FolderTree,
  Eye,
  AlertCircle,
  Loader2,
  Grid,
  List,
  Crown,
  User,
  TrendingUp,
  GitCompare,
  DollarSign,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
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
  parentDepartment?: { _id: string; name: string; code: string };
  children?: Department[];
  employeeCount: number;
  headOfDepartment?: { _id: string; fullName: string; email: string };
  isActive: boolean;
  createdAt: string;
  budget?: { allocated: number; spent: number };
}

interface FlattenedDepartment extends Department {
  level: number;
}

export default function HierarchyPage() {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list" | "compare">("tree");
  const [, setSelectedDepartment] = useState<Department | null>(null);

  // Department Comparison States
  const [deptAId, setDeptAId] = useState<string>("");
  const [deptBId, setDeptBId] = useState<string>("");

  // Recursively build tree structure up to N levels deep
  const buildTree = useCallback(
    (depts: Department[], parentId: string | null = null): Department[] => {
      return depts
        .filter((dept) => {
          if (!parentId) return !dept.parentDepartment;
          return dept.parentDepartment?._id === parentId;
        })
        .map((dept) => ({
          ...dept,
          children: buildTree(depts, dept._id),
        }));
    },
    [],
  );

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/departments");
      if (response.data.success) {
        const depts: Department[] = response.data.data;
        setAllDepartments(depts);

        const hierarchyTree = buildTree(depts, null);
        setDepartments(hierarchyTree);

        // Auto-expand top-level departments
        const initialExpanded: Record<string, boolean> = {};
        hierarchyTree.forEach((dept) => {
          initialExpanded[dept._id] = true;
        });
        setExpanded(initialExpanded);

        if (depts.length >= 2) {
          setDeptAId(depts[0]._id);
          setDeptBId(depts[1]._id);
        } else if (depts.length === 1) {
          setDeptAId(depts[0]._id);
        }

        if (hierarchyTree.length > 0) {
          setSelectedDepartment(hierarchyTree[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  }, [buildTree]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    const expandRecursive = (depts: Department[]) => {
      depts.forEach((dept) => {
        allExpanded[dept._id] = true;
        if (dept.children) expandRecursive(dept.children);
      });
    };
    expandRecursive(departments);
    setExpanded(allExpanded);
    toast.success("All departments expanded");
  };

  const collapseAll = () => {
    setExpanded({});
    toast.success("All departments collapsed");
  };

  // Flatten hierarchy for list view
  const flattenDepartments = useCallback(
    (depts: Department[], level = 0): FlattenedDepartment[] => {
      let result: FlattenedDepartment[] = [];
      depts.forEach((dept) => {
        result.push({ ...dept, level });
        if (dept.children && dept.children.length > 0) {
          result = result.concat(flattenDepartments(dept.children, level + 1));
        }
      });
      return result;
    },
    [],
  );

  const flattenedDepartments = useMemo(() => {
    return flattenDepartments(departments);
  }, [departments, flattenDepartments]);

  // Filter tree view departments
  const filteredDepartments = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === '') return departments;

    const searchLower = searchTerm.toLowerCase().trim();

    const filterRecursive = (depts: Department[]): Department[] => {
      const result: Department[] = [];

      for (const dept of depts) {
        // Check if current department matches
        const matches =
          dept.name.toLowerCase().includes(searchLower) ||
          dept.code.toLowerCase().includes(searchLower) ||
          (dept.description && dept.description.toLowerCase().includes(searchLower));

        // Recursively filter children
        const filteredChildren = dept.children
          ? filterRecursive(dept.children)
          : [];

        // Include department if it matches OR has matching children
        if (matches || filteredChildren.length > 0) {
          result.push({
            ...dept,
            children: filteredChildren.length > 0 ? filteredChildren : dept.children
          });
        }
      }

      return result;
    };

    return filterRecursive(departments);
  }, [departments, searchTerm]);

  // Filter flattened departments for table view
  const filteredFlattenedDepartments = useMemo(() => {
    if (!searchTerm) return flattenedDepartments;
    const searchLower = searchTerm.toLowerCase();
    return flattenedDepartments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchLower) ||
        dept.code.toLowerCase().includes(searchLower) ||
        dept.description?.toLowerCase().includes(searchLower),
    );
  }, [flattenedDepartments, searchTerm]);

  const getTotalEmployees = useCallback((dept: Department): number => {
    let total = dept.employeeCount || 0;
    if (dept.children) {
      dept.children.forEach((child) => {
        total += getTotalEmployees(child);
      });
    }
    return total;
  }, []);

  const stats = useMemo(
    () => ({
      totalDepartments: allDepartments.length,
      topLevelDepartments: departments.length,
      totalEmployees: allDepartments.reduce(
        (sum, d) => sum + (d.employeeCount || 0),
        0,
      ),
      activeDepartments: allDepartments.filter((d) => d.isActive).length,
    }),
    [allDepartments, departments],
  );

  // Selected Department Objects for Comparison
  const selectedDeptA = useMemo(
    () => allDepartments.find((d) => d._id === deptAId),
    [allDepartments, deptAId],
  );
  const selectedDeptB = useMemo(
    () => allDepartments.find((d) => d._id === deptBId),
    [allDepartments, deptBId],
  );

  if (!hasRole(["super_admin", "admin"])) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-md w-full"
        >
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500 text-sm">
            You don't have permission to view this page
          </p>
        </motion.div>
      </div>
    );
  }

  const DepartmentNode = ({
    dept,
    level = 0,
  }: {
    dept: Department;
    level: number;
  }) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expanded[dept._id];
    const totalEmployees = getTotalEmployees(dept);

    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative"
      >
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md group ${level === 0
              ? "bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-indigo-200 shadow-sm"
              : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => setSelectedDepartment(dept)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(dept._id);
            }}
            className={`p-1 rounded transition ${hasChildren
                ? "text-gray-500 hover:text-gray-700 hover:bg-gray-200/60"
                : "text-gray-300 cursor-default"
              }`}
            aria-label="Toggle node"
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              ))}
          </button>

          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${level === 0
                ? "bg-gradient-to-br from-indigo-500 to-purple-500"
                : "bg-gray-100 border border-gray-200"
              }`}
          >
            <Building2
              className={`w-4 h-4 ${level === 0 ? "text-white" : "text-gray-500"}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-medium ${level === 0 ? "text-gray-800" : "text-gray-700"}`}
              >
                {dept.name}
              </span>
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {dept.code}
              </span>
              {dept.isActive !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${dept.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                >
                  {dept.isActive ? "Active" : "Inactive"}
                </span>
              )}
            </div>
            {dept.headOfDepartment && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <User size={10} />
                Head: {dept.headOfDepartment.fullName}
              </p>
            )}
            {dept.description && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {dept.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users size={12} className="text-indigo-400" />
              <span className="font-medium text-gray-700">
                {totalEmployees}
              </span>
              <span className="text-gray-400 hidden sm:inline">members</span>
            </div>
            {dept.budget && (
              <div className="hidden md:flex items-center gap-1">
                <span className="text-gray-400">Budget:</span>
                <span className="font-medium text-gray-700">
                  ${(dept.budget.allocated || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <Link
              href={`/departments/${dept._id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
            >
              <Eye size={14} />
            </Link>
          </div>
        </div>

        {/* Children Render Block */}
        {hasChildren && isExpanded && (
          <div className="mt-1.5 space-y-1.5 border-l-2 border-indigo-100 ml-4 pl-2">
            {dept.children?.map((child) => (
              <DepartmentNode key={child._id} dept={child} level={level + 1} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  // Helper calculation for visual comparison bar percentages
  const getComparisonPercentages = (valA: number = 0, valB: number = 0) => {
    const total = valA + valB;
    if (total === 0) return { pctA: 50, pctB: 50 };
    return {
      pctA: Math.round((valA / total) * 100),
      pctB: Math.round((valB / total) * 100),
    };
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
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
          <span className="text-gray-700 font-medium">Hierarchy</span>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <FolderTree className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                Department Hierarchy
              </h1>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                {stats.totalDepartments}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Visual representation and comparative view of department
              structures
            </p>
          </div>

          {/* View Mode Selectors */}
          <div className="flex flex-wrap gap-2">
            <div className="bg-white border border-gray-200 rounded-lg p-1 flex items-center shadow-sm">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${viewMode === "tree"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <Grid size={14} />
                Tree
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${viewMode === "list"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <List size={14} />
                List
              </button>
              <button
                onClick={() => setViewMode("compare")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${viewMode === "compare"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <GitCompare size={14} />
                Compare
              </button>
            </div>

            {viewMode === "tree" && (
              <>
                <button
                  onClick={expandAll}
                  className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-xs flex items-center gap-1 shadow-sm"
                >
                  <ChevronDown size={14} />
                  Expand
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-xs flex items-center gap-1 shadow-sm"
                >
                  <ChevronUp size={14} />
                  Collapse
                </button>
              </>
            )}

            <button
              onClick={fetchDepartments}
              className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              aria-label="Refresh departments"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>

        {/* Global Stats Cards */}
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
                  {stats.totalDepartments}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total Departments
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.topLevelDepartments}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Top Level</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.totalEmployees}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Total Employees</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.activeDepartments}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Active</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar (Shown only in Tree and List modes) */}
        {viewMode !== "compare" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            />
          </motion.div>
        )}

        {/* Content Views */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : viewMode === "compare" ? (
          /* COMPARISON TAB CONTENT */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Department Selectors Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
                Select Departments to Compare
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Department A Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
                    Department A
                  </label>
                  <select
                    value={deptAId}
                    onChange={(e) => setDeptAId(e.target.value)}
                    className="w-full p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-indigo-200 outline-none font-medium"
                  >
                    {allDepartments.map((dept) => (
                      <option key={`a-${dept._id}`} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department B Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-purple-600 uppercase tracking-wider">
                    Department B
                  </label>
                  <select
                    value={deptBId}
                    onChange={(e) => setDeptBId(e.target.value)}
                    className="w-full p-2.5 bg-purple-50/50 border border-purple-200 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-purple-200 outline-none font-medium"
                  >
                    {allDepartments.map((dept) => (
                      <option key={`b-${dept._id}`} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedDeptA && selectedDeptB ? (
              <div className="space-y-6">
                {/* Visual Comparative Metric Bar Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Metrics Breakdown Chart
                  </h3>

                  {/* Employee Count Comparison Bar */}
                  {(() => {
                    const empA = selectedDeptA.employeeCount || 0;
                    const empB = selectedDeptB.employeeCount || 0;
                    const { pctA, pctB } = getComparisonPercentages(empA, empB);

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-gray-600">
                          <span className="text-indigo-600 font-semibold">
                            {selectedDeptA.name}: {empA} Members ({pctA}%)
                          </span>
                          <span className="text-purple-600 font-semibold">
                            {selectedDeptB.name}: {empB} Members ({pctB}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${pctA}%` }}
                            className="bg-indigo-500 h-full transition-all duration-500"
                          />
                          <div
                            style={{ width: `${pctB}%` }}
                            className="bg-purple-500 h-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Budget Allocated Comparison Bar */}
                  {(() => {
                    const budA = selectedDeptA.budget?.allocated || 0;
                    const budB = selectedDeptB.budget?.allocated || 0;
                    const { pctA, pctB } = getComparisonPercentages(budA, budB);

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-gray-600">
                          <span className="text-indigo-600 font-semibold">
                            {selectedDeptA.name}: ${budA.toLocaleString()}{" "}
                            Budget ({pctA}%)
                          </span>
                          <span className="text-purple-600 font-semibold">
                            {selectedDeptB.name}: ${budB.toLocaleString()}{" "}
                            Budget ({pctB}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${pctA}%` }}
                            className="bg-indigo-400 h-full transition-all duration-500"
                          />
                          <div
                            style={{ width: `${pctB}%` }}
                            className="bg-purple-400 h-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Side-by-Side Detailed Property Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dept A Side Card */}
                  <div className="bg-white rounded-xl border-2 border-indigo-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                          Department A
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">
                          {selectedDeptA.name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-mono bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                        {selectedDeptA.code}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Status</span>
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          {selectedDeptA.isActive ? (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500"
                            />
                          ) : (
                            <XCircle size={14} className="text-rose-500" />
                          )}
                          {selectedDeptA.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Head of Dept</span>
                        <span className="font-medium text-gray-800">
                          {selectedDeptA.headOfDepartment?.fullName ||
                            "Not Assigned"}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Direct Employees</span>
                        <span className="font-medium text-gray-800">
                          {selectedDeptA.employeeCount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Parent Dept</span>
                        <span className="font-medium text-gray-800">
                          {selectedDeptA.parentDepartment?.name ||
                            "None (Top Level)"}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 flex items-center gap-1">
                          <DollarSign size={12} /> Allocated Budget
                        </span>
                        <span className="font-medium text-gray-800">
                          $
                          {(
                            selectedDeptA.budget?.allocated || 0
                          ).toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-2">
                        <span className="text-gray-500 text-xs block mb-1">
                          Sub-Departments:
                        </span>
                        {selectedDeptA.children &&
                          selectedDeptA.children.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedDeptA.children.map((child) => (
                              <span
                                key={child._id}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                              >
                                {child.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No sub-departments
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dept B Side Card */}
                  <div className="bg-white rounded-xl border-2 border-purple-100 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                      <div>
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                          Department B
                        </span>
                        <h3 className="text-xl font-bold text-gray-800">
                          {selectedDeptB.name}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-mono bg-purple-50 text-purple-700 rounded border border-purple-200">
                        {selectedDeptB.code}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Status</span>
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          {selectedDeptB.isActive ? (
                            <CheckCircle2
                              size={14}
                              className="text-emerald-500"
                            />
                          ) : (
                            <XCircle size={14} className="text-rose-500" />
                          )}
                          {selectedDeptB.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Head of Dept</span>
                        <span className="font-medium text-gray-800">
                          {selectedDeptB.headOfDepartment?.fullName ||
                            "Not Assigned"}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Direct Employees</span>
                        <span className="font-medium text-gray-800">
                          {selectedDeptB.employeeCount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Parent Dept</span>
                        <span className="font-medium text-gray-800">
                          {selectedDeptB.parentDepartment?.name ||
                            "None (Top Level)"}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500 flex items-center gap-1">
                          <DollarSign size={12} /> Allocated Budget
                        </span>
                        <span className="font-medium text-gray-800">
                          $
                          {(
                            selectedDeptB.budget?.allocated || 0
                          ).toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-2">
                        <span className="text-gray-500 text-xs block mb-1">
                          Sub-Departments:
                        </span>
                        {selectedDeptB.children &&
                          selectedDeptB.children.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedDeptB.children.map((child) => (
                              <span
                                key={child._id}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200"
                              >
                                {child.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No sub-departments
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">
                Please select two departments above to begin comparison.
              </div>
            )}
          </motion.div>
        ) : filteredDepartments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <FolderTree className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              No Departments Found
            </h3>
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? "No departments match your search terms."
                : "Create your first department to get started."}
            </p>
          </motion.div>
        ) : viewMode === "tree" ? (
          /* TREE VIEW CONTENT */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-2"
          >
            {filteredDepartments.map((dept) => (
              <DepartmentNode key={dept._id} dept={dept} level={0} />
            ))}
          </motion.div>
        ) : (
          /* LIST VIEW TABLE CONTENT */
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Head
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Members
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFlattenedDepartments.map((dept, index) => (
                    <motion.tr
                      key={dept._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setSelectedDepartment(dept)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${dept.level === 0
                                ? "bg-gradient-to-br from-indigo-500 to-purple-500"
                                : "bg-gray-100"
                              }`}
                          >
                            <Building2
                              className={`w-4 h-4 ${dept.level === 0 ? "text-white" : "text-gray-500"}`}
                            />
                          </div>
                          <div>
                            <p className="text-gray-800 text-sm font-medium">
                              {dept.name}
                            </p>
                            {dept.description && (
                              <p className="text-gray-400 text-xs truncate max-w-xs">
                                {dept.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded border border-gray-200">
                          {dept.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {dept.headOfDepartment?.fullName || "-"}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-700 font-medium">
                        {getTotalEmployees(dept)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        Level {dept.level}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${dept.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                        >
                          {dept.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/departments/${dept._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Eye size={14} />
                          </Link>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
