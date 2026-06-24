"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  GitBranch,
  ChevronRight,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  Home,
  ArrowLeft,
  FolderTree,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Grid,
  List,
  Filter,
  Zap,
  Crown,
  Briefcase,
  User,
  Calendar,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";
import api from "@/lib/axios";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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

export default function HierarchyPage() {
  const { hasRole, user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/departments");
      if (response.data.success) {
        const depts = response.data.data;
        setAllDepartments(depts);

        // Build hierarchy
        const topLevel = depts.filter((d: any) => !d.parentDepartment);
        const withChildren = topLevel.map((dept: any) => ({
          ...dept,
          children: depts.filter(
            (d: any) => d.parentDepartment?._id === dept._id,
          ),
        }));
        setDepartments(withChildren);

        // Auto expand first level
        const initialExpanded: Record<string, boolean> = {};
        withChildren.forEach((dept: Department) => {
          initialExpanded[dept._id] = true;
        });
        setExpanded(initialExpanded);

        if (withChildren.length > 0) {
          setSelectedDepartment(withChildren[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

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
  const flattenDepartments = (depts: Department[], level = 0): any[] => {
    let result: any[] = [];
    depts.forEach((dept) => {
      result.push({ ...dept, level });
      if (dept.children) {
        result = result.concat(flattenDepartments(dept.children, level + 1));
      }
    });
    return result;
  };

  const flattenedDepartments = useMemo(() => {
    return flattenDepartments(departments);
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;
    const searchLower = searchTerm.toLowerCase();

    const filterRecursive = (depts: Department[]): Department[] => {
      return depts
        .map((dept) => {
          const matches =
            dept.name.toLowerCase().includes(searchLower) ||
            dept.code.toLowerCase().includes(searchLower) ||
            dept.description?.toLowerCase().includes(searchLower);

          const filteredChildren = dept.children
            ? filterRecursive(dept.children)
            : [];

          if (matches || filteredChildren.length > 0) {
            return { ...dept, children: filteredChildren };
          }
          return null;
        })
        .filter((dept) => dept !== null) as Department[];
    };
    return filterRecursive(departments);
  }, [departments, searchTerm]);

  const getTotalEmployees = (dept: Department): number => {
    let total = dept.employeeCount || 0;
    if (dept.children) {
      dept.children.forEach((child) => {
        total += getTotalEmployees(child);
      });
    }
    return total;
  };

  const stats = {
    totalDepartments: allDepartments.length,
    topLevelDepartments: departments.length,
    totalEmployees: allDepartments.reduce(
      (sum, d) => sum + (d.employeeCount || 0),
      0,
    ),
    activeDepartments: allDepartments.filter((d) => d.isActive).length,
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
            <AlertCircle className="w-10 h-10 text-rose-500" />
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
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative"
      >
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md group
            ${
              level === 0
                ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-sm"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => setSelectedDepartment(dept)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(dept._id);
            }}
            className={`p-1 rounded transition ${hasChildren ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100" : "text-gray-300 cursor-default"}`}
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              ))}
          </button>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              level === 0
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
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    dept.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {dept.isActive ? "Active" : "Inactive"}
                </span>
              )}
            </div>
            {dept.headOfDepartment && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <User size={10} />
                Head: {dept.headOfDepartment.fullName}
              </p>
            )}
            {dept.description && (
              <p className="text-xs text-gray-400 line-clamp-1">
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
              <span className="text-gray-400">members</span>
            </div>
            {dept.budget && (
              <div className="flex items-center gap-1">
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
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
            >
              <Eye size={14} />
            </Link>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {dept.children?.map((child) => (
              <DepartmentNode key={child._id} dept={child} level={level + 1} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

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
                Visual representation of department structure
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  setViewMode(viewMode === "tree" ? "list" : "tree")
                }
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                {viewMode === "tree" ? <List size={14} /> : <Grid size={14} />}
                {viewMode === "tree" ? "List View" : "Tree View"}
              </button>
              <button
                onClick={expandAll}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <ChevronDown size={14} />
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <ChevronUp size={14} />
                Collapse All
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
                  <p className="text-xs text-gray-500 mt-0.5">
                    Total Employees
                  </p>
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

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            />
          </motion.div>

          {/* Hierarchy Tree */}
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
                <FolderTree className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                No Departments Found
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No departments match your search"
                  : "Create your first department to get started"}
              </p>
            </motion.div>
          ) : viewMode === "tree" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              {filteredDepartments.map((dept) => (
                <DepartmentNode key={dept._id} dept={dept} level={0} />
              ))}
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
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Head
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {flattenedDepartments
                      .filter((dept) => {
                        if (!searchTerm) return true;
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          dept.name.toLowerCase().includes(searchLower) ||
                          dept.code.toLowerCase().includes(searchLower) ||
                          dept.description?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((dept, index) => (
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
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  dept.level === 0
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
                                  <p className="text-gray-400 text-xs line-clamp-1">
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
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                dept.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {dept.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/departments/${dept._id}`}
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

      <style jsx global>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
