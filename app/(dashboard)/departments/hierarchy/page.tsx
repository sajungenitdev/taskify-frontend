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
  GitCompare,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  ArrowBigRight,
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
  members?: any[];
}

interface FlattenedDepartment extends Department {
  level: number;
}

export default function HierarchyPage() {
  const { hasRole } = useAuth();
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list" | "compare">("tree");

  // Department Comparison States
  const [deptAId, setDeptAId] = useState<string>("");
  const [deptBId, setDeptBId] = useState<string>("");

  const canViewHierarchy = hasRole(["super_admin", "admin"]);

  /**
   * Recursively nest flat department records into hierarchical child nodes.
   */
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

  /**
   * Concurrently fetch departments and users, matching records securely
   * to guarantee accurate employee staff counts.
   */
  const fetchHierarchyData = useCallback(async () => {
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
        const deptId = String(dept._id || dept.id || "").trim();
        const deptCode = String(dept.code || "").trim().toLowerCase();

        const members = users.filter((u) => {
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

          return userDeptId === deptId || (userDeptCode && userDeptCode === deptCode);
        });

        const computedCount = members.length > 0 ? members.length : dept.employeeCount || 0;

        return {
          ...dept,
          members,
          employeeCount: computedCount,
          budget: dept.budget || { allocated: 0, spent: 0 },
        };
      });

      setAllDepartments(processedDepts);

      const hierarchyTree = buildTree(processedDepts, null);
      setDepartments(hierarchyTree);

      // Auto-expand all top-level and nested nodes by default
      const initialExpanded: Record<string, boolean> = {};
      const markAllExpanded = (nodes: Department[]) => {
        nodes.forEach((n) => {
          initialExpanded[n._id] = true;
          if (n.children && n.children.length > 0) {
            markAllExpanded(n.children);
          }
        });
      };
      markAllExpanded(hierarchyTree);
      setExpanded(initialExpanded);

      // Setup default comparison selections
      if (processedDepts.length >= 2) {
        setDeptAId(processedDepts[0]._id);
        setDeptBId(processedDepts[1]._id);
      } else if (processedDepts.length === 1) {
        setDeptAId(processedDepts[0]._id);
      }
    } catch (error) {
      console.error("Error fetching department hierarchy:", error);
      toast.error("Failed to load department tree analysis");
    } finally {
      setLoading(false);
    }
  }, [buildTree]);

  useEffect(() => {
    fetchHierarchyData();
  }, [fetchHierarchyData]);

  // Expand / Collapse Action Handlers
  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };


  // Flatten hierarchy tree for tabular list view
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

  // Recursive search filter for tree view
  const filteredDepartments = useMemo(() => {
    if (!searchTerm || searchTerm.trim() === "") return departments;
    const searchLower = searchTerm.toLowerCase().trim();

    const filterRecursive = (depts: Department[]): Department[] => {
      const result: Department[] = [];
      for (const dept of depts) {
        const matches =
          dept.name.toLowerCase().includes(searchLower) ||
          dept.code.toLowerCase().includes(searchLower) ||
          (dept.description && dept.description.toLowerCase().includes(searchLower));

        const filteredChildren = dept.children ? filterRecursive(dept.children) : [];

        if (matches || filteredChildren.length > 0) {
          result.push({
            ...dept,
            children: filteredChildren.length > 0 ? filteredChildren : dept.children,
          });
        }
      }
      return result;
    };

    return filterRecursive(departments);
  }, [departments, searchTerm]);

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

  // Aggregate total employee count including nested children branches
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
      totalEmployees: allDepartments.reduce((sum, d) => sum + (d.employeeCount || 0), 0),
      activeDepartments: allDepartments.filter((d) => d.isActive).length,
    }),
    [allDepartments, departments],
  );

  const selectedDeptA = useMemo(() => allDepartments.find((d) => d._id === deptAId), [allDepartments, deptAId]);
  const selectedDeptB = useMemo(() => allDepartments.find((d) => d._id === deptBId), [allDepartments, deptBId]);

  if (!canViewHierarchy) {
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
          <p className="text-slate-500 text-sm">You lack administrative privileges to view department hierarchies.</p>
        </motion.div>
      </div>
    );
  }

  /**
   * Recursive Component to render individual tree nodes.
   */
  const DepartmentNode = ({ dept, level = 0 }: { dept: Department; level: number }) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expanded[dept._id];
    const totalEmployees = getTotalEmployees(dept);

    return (
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative">
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 group ${level === 0
            ? "bg-linear-to-r from-indigo-50/60 to-purple-50/60 border-indigo-100 shadow-xs"
            : "bg-white border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md"
            }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(dept._id)}
                className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition shrink-0 shadow-xs cursor-pointer"
                title={isExpanded ? "Collapse Branch" : "Expand Branch"}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="text-blue-600"><ArrowBigRight size={14} /></span>
            )}

            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${level === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              }`}>
              <Building2 className="w-5 h-5" />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                <span className="text-[11px] font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {dept.code}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${dept.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-rose-50 text-rose-700 border border-rose-200/60"
                  }`}>
                  {dept.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {dept.headOfDepartment && (
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <User size={12} className="text-slate-400" />
                  Head: <strong className="text-slate-700">{dept.headOfDepartment.fullName}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="hidden sm:flex items-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-indigo-500" />
                <span className="font-bold text-slate-800">{totalEmployees}</span> Staff
              </div>
              {dept.budget && (
                <div className="flex items-center gap-1">
                  <span>Budget:</span>
                  <span className="font-bold text-slate-800">${(dept.budget.allocated || 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            <Link
              href={`/departments/${dept._id}`}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
              title="Inspect Unit"
            >
              <Eye size={16} />
            </Link>
          </div>
        </div>

        {/* Recursive Children Container */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2 border-l-2 border-indigo-100 ml-6 pl-3">
            {dept.children?.map((child) => (
              <DepartmentNode key={child._id} dept={child} level={level + 1} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const getComparisonPercentages = (valA: number = 0, valB: number = 0) => {
    const total = valA + valB;
    if (total === 0) return { pctA: 50, pctB: 50 };
    return {
      pctA: Math.round((valA / total) * 100),
      pctB: Math.round((valB / total) * 100),
    };
  };

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
          <span className="text-slate-700">Hierarchy & Analysis</span>
        </div>

        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <FolderTree className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Department Tree & Analytics</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {stats.totalDepartments}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Inspect organizational reporting lines, staff volume, and unit comparisons.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode("tree")}
                className={`p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1.5 ${viewMode === "tree" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tree</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1.5 ${viewMode === "list" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode("compare")}
                className={`p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1.5 ${viewMode === "compare" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compare</span>
              </button>
            </div>

            <button
              onClick={fetchHierarchyData}
              title="Refresh Tree"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Global Statistics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Units", val: stats.totalDepartments, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Top Level", val: stats.topLevelDepartments, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Workforce", val: stats.totalEmployees, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Operational", val: stats.activeDepartments, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center font-bold`}>
                  <stat.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Search Input Bar */}
        {viewMode !== "compare" && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter department hierarchy by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs"
            />
          </div>
        )}

        {/* Main Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-400">Constructing hierarchy tree...</p>
          </div>
        ) : viewMode === "compare" ? (
          /* COMPARISON MODE */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                Comparative Unit Analysis
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Department A</label>
                  <select
                    value={deptAId}
                    onChange={(e) => setDeptAId(e.target.value)}
                    className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-200 rounded-2xl text-slate-800 text-sm font-semibold outline-none cursor-pointer"
                  >
                    {allDepartments.map((d) => (
                      <option key={`a-${d._id}`} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Department B</label>
                  <select
                    value={deptBId}
                    onChange={(e) => setDeptBId(e.target.value)}
                    className="w-full px-4 py-3 bg-purple-50/50 border border-purple-200 rounded-2xl text-slate-800 text-sm font-semibold outline-none cursor-pointer"
                  >
                    {allDepartments.map((d) => (
                      <option key={`b-${d._id}`} value={d._id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedDeptA && selectedDeptB ? (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Comparative Ratios</h3>

                  {(() => {
                    const empA = selectedDeptA.employeeCount || 0;
                    const empB = selectedDeptB.employeeCount || 0;
                    const { pctA, pctB } = getComparisonPercentages(empA, empB);
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span className="text-indigo-600">{selectedDeptA.name}: {empA} Staff ({pctA}%)</span>
                          <span className="text-purple-600">{selectedDeptB.name}: {empB} Staff ({pctB}%)</span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div style={{ width: `${pctA}%` }} className="bg-indigo-600 h-full transition-all duration-500" />
                          <div style={{ width: `${pctB}%` }} className="bg-purple-600 h-full transition-all duration-500" />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[selectedDeptA, selectedDeptB].map((dept, idx) => (
                    <div key={dept._id} className={`bg-white rounded-3xl border-2 p-6 sm:p-8 shadow-xs space-y-4 ${idx === 0 ? "border-indigo-100" : "border-purple-100"
                      }`}>
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider ${idx === 0 ? "text-indigo-600" : "text-purple-600"}`}>
                            Department {idx === 0 ? "A" : "B"}
                          </span>
                          <h3 className="text-xl font-extrabold text-slate-900">{dept.name}</h3>
                        </div>
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                          {dept.code}
                        </span>
                      </div>

                      <div className="space-y-3 text-xs font-medium text-slate-600">
                        <div className="flex justify-between py-1.5 border-b border-slate-50">
                          <span>Unit Status</span>
                          <span className="font-bold text-slate-800">{dept.isActive ? "Active Operational" : "Inactive"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50">
                          <span>Unit Head</span>
                          <span className="font-bold text-slate-800">{dept.headOfDepartment?.fullName || "Unassigned"}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50">
                          <span>Staff Count</span>
                          <span className="font-bold text-slate-800">{dept.employeeCount || 0}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span>Budget Allocation</span>
                          <span className="font-bold text-slate-800">${(dept.budget?.allocated || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : viewMode === "tree" ? (
          /* TREE VIEW */
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-3">
            {filteredDepartments.map((dept) => (
              <DepartmentNode key={dept._id} dept={dept} level={0} />
            ))}
            {filteredDepartments.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs">No department nodes matched your search query.</div>
            )}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Department Title</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Unit Head</th>
                    <th className="px-6 py-4 text-center">Staff Count</th>
                    <th className="px-6 py-4 text-center">Hierarchy Depth</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredFlattenedDepartments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3" style={{ paddingLeft: `${dept.level * 20}px` }}>
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{dept.name}</p>
                            {dept.description && <p className="text-slate-400 text-xs line-clamp-1">{dept.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{dept.code}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{dept.headOfDepartment?.fullName || "Unassigned"}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900">{getTotalEmployees(dept)}</td>
                      <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">Level {dept.level}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${dept.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}>
                          {dept.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/departments/${dept._id}`}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition inline-block"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}