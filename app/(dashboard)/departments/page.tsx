"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  X,
  Users,
  DollarSign,
  FolderKanban,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  CheckCircle2,
  XCircle,
  User,
  Briefcase,
  TrendingUp,
  ShieldAlert,
  ArrowUpDown,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: {
    _id: string;
    fullName: string;
    email: string;
    role?: string;
  };
  employeeCount: number;
  budget?: {
    allocated: number;
    spent: number;
  };
  assets?: {
    total: number;
    value: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  location?: string;
  members?: User[];
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId: string;
  department: any;
  isActive: boolean;
}

export default function AllDepartmentsPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // Optimized for 3x3 grids
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "code" | "employeeCount" | "budget">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showStats, setShowStats] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    budgetAllocated: 0,
    location: "",
  });

  const canManage = hasRole(["super_admin", "admin", "hr_manager", "dept_manager"]);
  const canEdit = hasRole(["super_admin", "admin", "hr_manager"]);

  // Concurrently fetch departments and users to guarantee live employee counts across navigations
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [deptResponse, usersResponse] = await Promise.all([
        api.get("/departments").catch(() => ({ data: { success: false, data: [] } })),
        api.get("/users").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      let rawDepts = [];
      if (deptResponse.data.success) {
        rawDepts = deptResponse.data.data || [];
      } else {
        rawDepts = getMockDepartments();
      }

      const users: User[] = usersResponse.data.success ? usersResponse.data.data || [] : [];

      const processedDepts = rawDepts.map((dept: any) => {
        const deptId = String(dept._id || dept.id || "").trim();

        // Match members dynamically by ID or fallback
        const members = users.filter((u) => {
          if (!u.department) return false;
          let userDeptId = "";
          if (typeof u.department === "object" && u.department !== null) {
            userDeptId = String(u.department._id || u.department.id || "").trim();
          } else {
            userDeptId = String(u.department).trim();
          }
          return userDeptId === deptId;
        });

        return {
          ...dept,
          members,
          employeeCount: members.length > 0 ? members.length : dept.employeeCount || 0,
          budget: dept.budget || { allocated: 0, spent: 0 },
          assets: dept.assets || { total: 0, value: 0 },
        };
      });

      setDepartments(processedDepts);
    } catch (error) {
      console.error("Error synchronizing department datasets:", error);
      toast.error("Failed to load departments data");
      setDepartments(getMockDepartments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getMockDepartments = (): Department[] => [
    {
      _id: "1",
      name: "Software Engineering",
      code: "SWE",
      description: "Responsible for software development and technical innovation",
      headOfDepartment: {
        _id: "h1",
        fullName: "John Smith",
        email: "john.smith@company.com",
        role: "dept_manager",
      },
      employeeCount: 24,
      budget: { allocated: 250000, spent: 120000 },
      assets: { total: 15, value: 450000 },
      isActive: true,
      createdAt: new Date().toISOString(),
      location: "Floor 3, Building A",
    },
    {
      _id: "2",
      name: "Marketing",
      code: "MKT",
      description: "Brand management and marketing campaigns",
      headOfDepartment: {
        _id: "h2",
        fullName: "Sarah Johnson",
        email: "sarah.j@company.com",
        role: "dept_manager",
      },
      employeeCount: 12,
      budget: { allocated: 150000, spent: 80000 },
      assets: { total: 8, value: 120000 },
      isActive: true,
      createdAt: new Date().toISOString(),
      location: "Floor 2, Building A",
    },
    {
      _id: "3",
      name: "Human Resources",
      code: "HR",
      description: "Talent management and employee relations",
      headOfDepartment: {
        _id: "h3",
        fullName: "Michael Brown",
        email: "michael.b@company.com",
        role: "hr_manager",
      },
      employeeCount: 8,
      budget: { allocated: 100000, spent: 60000 },
      assets: { total: 5, value: 50000 },
      isActive: true,
      createdAt: new Date().toISOString(),
      location: "Floor 1, Building B",
    },
  ];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/departments", {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        budget: formData.budgetAllocated || 0,
        location: formData.location,
      });
      if (response.data.success) {
        toast.success("Department created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", code: "", description: "", budgetAllocated: 0, location: "" });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create department");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    try {
      const response = await api.put(`/departments/${editingDept._id}`, {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        budget: formData.budgetAllocated || 0,
        location: formData.location,
      });
      if (response.data.success) {
        toast.success("Department updated successfully");
        setShowCreateModal(false);
        setEditingDept(null);
        setFormData({ name: "", code: "", description: "", budgetAllocated: 0, location: "" });
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update department");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/departments/${id}`);
      toast.success("Department deleted successfully");
      setShowDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete department");
    }
  };

  const handleSort = (field: "name" | "code" | "employeeCount" | "budget") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredDepartments = useMemo(() => {
    let filtered = departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];
      if (sortBy === "budget") {
        aVal = a.budget?.allocated || 0;
        bVal = b.budget?.allocated || 0;
      }
      if (typeof aVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [departments, searchTerm, sortBy, sortOrder]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepartments = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  const stats = useMemo(
    () => ({
      total: departments.length,
      employees: departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0),
      budget: departments.reduce((sum, d) => sum + (d.budget?.allocated || 0), 0),
      assets: departments.reduce((sum, d) => sum + (d.assets?.total || 0), 0),
      active: departments.filter((d) => d.isActive).length,
      inactive: departments.filter((d) => !d.isActive).length,
    }),
    [departments]
  );

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl max-w-md w-full"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-sm">You lack structural privileges to view administrative departments.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 antialiased">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Departments</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {departments.length}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Manage structural units, staffing allocations, and enterprise divisions.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-2 border ${showStats
                  ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
            >
              <TrendingUp className="w-4 h-4" />
              {showStats ? "Hide Analytics" : "Show Analytics"}
            </button>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1.5 ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1.5 ${viewMode === "list" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {canEdit && (
              <button
                onClick={() => {
                  setEditingDept(null);
                  setFormData({ name: "", code: "", description: "", budgetAllocated: 0, location: "" });
                  setShowCreateModal(true);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Department
              </button>
            )}

            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Analytics Summary Cards */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              {[
                { label: "Total Units", val: stats.total, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Active Staff", val: stats.employees, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Total Budget", val: `$${stats.budget.toLocaleString()}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Assigned Assets", val: stats.assets, icon: FolderKanban, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Operational", val: stats.active, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Inactive", val: stats.inactive, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                    <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center font-bold`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xl font-extrabold text-slate-800 tracking-tight">{stat.val}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Sorting Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by department name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="code">Sort by Code</option>
              <option value="employeeCount">Sort by Staff Count</option>
              <option value="budget">Sort by Allocation Budget</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 rounded-2xl transition shadow-xs"
              title="Toggle Sort Direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-400">Loading department structures...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-xs max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800">No Departments Discovered</h3>
              <p className="text-slate-400 text-sm">
                {searchTerm ? "No structural units matched your filter query." : "Initialize your workspace by registering a new department."}
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentDepartments.map((dept, index) => {
              const memberCount = dept.employeeCount || 0;
              const budgetAmount = dept.budget?.allocated || 0;
              const assetCount = dept.assets?.total || 0;
              const members = dept.members || [];

              return (
                <motion.div
                  key={dept._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-xl hover:border-slate-200/80 transition duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition duration-300 shadow-xs">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug tracking-tight">{dept.name}</h3>
                          <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md mt-1 inline-block">
                            {dept.code}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full ${dept.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                      >
                        {dept.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {dept.description && (
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{dept.description}</p>
                    )}

                    {/* Quick Metric Badges */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50/80 p-2.5 rounded-xl text-center border border-slate-100">
                        <p className="text-slate-800 font-extrabold text-sm">{memberCount}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase">Staff</p>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl text-center border border-slate-100">
                        <p className="text-slate-800 font-extrabold text-sm">${budgetAmount.toLocaleString()}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase">Budget</p>
                      </div>
                      <div className="bg-slate-50/80 p-2.5 rounded-xl text-center border border-slate-100">
                        <p className="text-slate-800 font-extrabold text-sm">{assetCount}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase">Assets</p>
                      </div>
                    </div>

                    {/* Meta data: Head & Location */}
                    <div className="space-y-1.5 pt-1 text-xs text-slate-500 font-medium">
                      {dept.headOfDepartment?.fullName && (
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-slate-400" />
                          <span>Head: <strong className="text-slate-700">{dept.headOfDepartment.fullName}</strong></span>
                        </div>
                      )}
                      {dept.location && (
                        <div className="flex items-center gap-2">
                          <Briefcase size={13} className="text-slate-400" />
                          <span>{dept.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Team Members Avatar Stack */}
                    {members.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex -space-x-2">
                          {members.slice(0, 4).map((member) => (
                            <div
                              key={member._id}
                              className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700 shadow-xs"
                              title={member.fullName}
                            >
                              {member.fullName.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {members.length > 4 && (
                            <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-xs">
                              +{members.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Assigned Team</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/departments/${dept._id}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Analytics
                    </Link>

                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingDept(dept);
                            setFormData({
                              name: dept.name,
                              code: dept.code,
                              description: dept.description || "",
                              budgetAllocated: dept.budget?.allocated || 0,
                              location: dept.location || "",
                            });
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                          title="Edit Unit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(dept._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Delete Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List Table View */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Department Unit</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Unit Head</th>
                    <th className="px-6 py-4 text-center">Staff Members</th>
                    <th className="px-6 py-4 text-right">Budget</th>
                    <th className="px-6 py-4 text-center">Location</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {currentDepartments.map((dept) => {
                    const memberCount = dept.employeeCount || 0;
                    const budgetAmount = dept.budget?.allocated || 0;

                    return (
                      <tr key={dept._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold shrink-0 shadow-xs">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{dept.name}</p>
                              {dept.description && <p className="text-slate-400 text-xs line-clamp-1">{dept.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200/60 font-bold">
                            {dept.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-semibold">
                          {dept.headOfDepartment?.fullName || "Unassigned"}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900">{memberCount}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">${budgetAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center text-xs text-slate-500">{dept.location || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${dept.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-rose-50 text-rose-700 border border-rose-200/60"
                              }`}
                          >
                            {dept.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/departments/${dept._id}`}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            {canEdit && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingDept(dept);
                                    setFormData({
                                      name: dept.name,
                                      code: dept.code,
                                      description: dept.description || "",
                                      budgetAllocated: dept.budget?.allocated || 0,
                                      location: dept.location || "",
                                    });
                                    setShowCreateModal(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(dept._id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs font-medium text-slate-400">
              Showing range <span className="font-bold text-slate-700">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-bold text-slate-700">{Math.min(indexOfLastItem, filteredDepartments.length)}</span> of{" "}
              <span className="font-bold text-slate-700">{filteredDepartments.length}</span> records
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create / Update Department */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{editingDept ? "Modify Department" : "Register Department"}</h2>
                  <p className="text-xs text-slate-500 font-medium">Specify enterprise organizational parameters</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingDept ? handleUpdate : handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Department Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50/55 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                    placeholder="e.g., Core Engineering & Infrastructure"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Unit Code Tag <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-slate-50/55 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                    placeholder="e.g., ENG-01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description Scope</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50/55 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition"
                    placeholder="Outline the operational charter of this division..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Budget (USD)</label>
                    <input
                      type="number"
                      value={formData.budgetAllocated}
                      onChange={(e) => setFormData({ ...formData, budgetAllocated: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-slate-50/55 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Location Room</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50/55 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                      placeholder="e.g., Floor 3, Building A"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm"
                  >
                    {editingDept ? "Save Changes" : "Create Unit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-5"
            >
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">Delete Department Unit?</h2>
                <p className="text-slate-500 text-sm">
                  This action is permanent and unrecoverable. Associated system mappings and constraints may be affected.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-rose-600/20 text-sm"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}