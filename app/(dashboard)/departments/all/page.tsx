"use client";

import { useState, useEffect, useMemo } from "react";
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
  CheckCircle,
  XCircle,
  User,
  TrendingUp,
  UserPlus,
  UserMinus,
  CreditCard,
  HardDrive,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  Star,
  Award,
  Zap,
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
  };
  parentDepartment?: {
    _id: string;
    name: string;
    code: string;
  };
  employeeCount?: number;
  budget?: {
    allocated: number;
    spent: number;
  };
  assets?: {
    total: number;
    value: number;
  };
  settings?: {
    workStartTime: string;
    workEndTime: string;
    allowRemoteCheckIn: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  members?: User[];
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  profilePhoto?: string;
  phoneNumber?: string;
  location?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function AllDepartmentsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
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
  });

  const canManage = hasRole(["super_admin", "admin"]);
  const canEdit = hasRole(["super_admin", "admin"]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch departments
      const deptResponse = await api.get("/departments");
      const usersResponse = await api.get("/users");

      if (deptResponse.data.success) {
        const depts = deptResponse.data.data;

        // Get all users
        const users = usersResponse.data.success ? usersResponse.data.data : [];
        setAllUsers(users);

        // Map users to departments
        const departmentsWithMembers = depts.map((dept: any) => {
          const members = users.filter((u: any) => {
            if (u.department) {
              const deptId = typeof u.department === 'object' ? u.department._id : u.department;
              return deptId === dept._id || deptId === dept._id?.toString();
            }
            return false;
          });

          return {
            ...dept,
            members: members || [],
            employeeCount: members?.length || 0,
            budget: dept.budget || { allocated: 0, spent: 0 },
            assets: dept.assets || { total: 0, value: 0 },
          };
        });

        setDepartments(departmentsWithMembers);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/departments", formData);
      if (response.data.success) {
        toast.success("Department created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", code: "", description: "" });
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
      const response = await api.put(`/departments/${editingDept._id}`, formData);
      if (response.data.success) {
        toast.success("Department updated successfully");
        setShowCreateModal(false);
        setEditingDept(null);
        setFormData({ name: "", code: "", description: "" });
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
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const stats = {
    total: departments.length,
    employees: departments.reduce((sum, d) => sum + (d.employeeCount || 0), 0),
    budget: departments.reduce((sum, d) => sum + (d.budget?.allocated || 0), 0),
    assets: departments.reduce((sum, d) => sum + (d.assets?.total || 0), 0),
    active: departments.filter((d) => d.isActive).length,
    inactive: departments.filter((d) => !d.isActive).length,
  };

  if (!canManage) {
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view this page</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">All Departments</h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {departments.length}
                </span>
              </div>
              <p className="text-gray-500 text-sm">Manage and view all departments in the system</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                <TrendingUp size={14} />
                {showStats ? "Hide Stats" : "Show Stats"}
              </button>
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                {viewMode === "grid" ? <List size={14} /> : <Grid size={14} />}
                {viewMode === "grid" ? "List View" : "Grid View"}
              </button>
              {canEdit && (
                <button
                  onClick={() => {
                    setEditingDept(null);
                    setFormData({ name: "", code: "", description: "" });
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
                >
                  <Plus size={16} />
                  Add Department
                </button>
              )}
              <button
                onClick={fetchData}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Departments</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-indigo-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.employees}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Employees</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">${stats.budget.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Budget</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{stats.assets}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Assets</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Active</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-rose-600">{stats.inactive}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Inactive</p>
                  </div>
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-rose-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search and Sort */}
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
                placeholder="Search by name or code..."
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
                <option value="name">Sort by Name</option>
                <option value="code">Sort by Code</option>
                <option value="employeeCount">Sort by Members</option>
                <option value="budget">Sort by Budget</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-xl transition shadow-sm"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </motion.div>

          {/* Departments Grid/List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredDepartments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">No Departments Found</h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search terms" : "Create your first department to get started"}
              </p>
              {canEdit && !searchTerm && (
                <button
                  onClick={() => {
                    setEditingDept(null);
                    setFormData({ name: "", code: "", description: "" });
                    setShowCreateModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  <Plus size={16} className="inline mr-2" />
                  Add Department
                </button>
              )}
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {currentDepartments.map((dept, index) => {
                const memberCount = dept.members?.length || dept.employeeCount || 0;
                const budgetAmount = dept.budget?.allocated || 0;
                const assetCount = dept.assets?.total || 0;
                const members = dept.members || [];

                return (
                  <motion.div
                    key={dept._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-800">{dept.name}</h3>
                            <span className="text-xs font-mono text-gray-400">{dept.code}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${dept.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                        >
                          {dept.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {dept.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dept.description}</p>
                      )}
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-lg font-bold text-gray-700">{memberCount}</p>
                          <p className="text-[10px] text-gray-400">Members</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-lg font-bold text-gray-700">${budgetAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">Budget</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-lg font-bold text-gray-700">{assetCount}</p>
                          <p className="text-[10px] text-gray-400">Assets</p>
                        </div>
                      </div>

                      {/* Show Members Preview */}
                      {members.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 mb-1">Members ({members.length})</p>
                          <div className="flex -space-x-2 overflow-hidden">
                            {members.slice(0, 5).map((member) => (
                              <div
                                key={member._id}
                                className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center"
                                title={member.fullName}
                              >
                                <span className="text-[10px] font-bold text-indigo-600">
                                  {member.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            ))}
                            {members.length > 5 && (
                              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                                <span className="text-[8px] font-medium text-gray-600">+{members.length - 5}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {dept.headOfDepartment && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                          <User size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-600">Head: {dept.headOfDepartment.fullName}</span>
                        </div>
                      )}
                    </div>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <Link
                        href={`/departments/${dept._id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                      >
                        <Eye size={12} />
                        View Details
                      </Link>
                      {canEdit && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingDept(dept);
                              setFormData({
                                name: dept.name,
                                code: dept.code,
                                description: dept.description || "",
                              });
                              setShowCreateModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(dept._id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
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
                        <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-gray-700">
                          Department {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort("code")} className="flex items-center gap-1 hover:text-gray-700">
                          Code {sortBy === "code" && (sortOrder === "asc" ? "↑" : "↓")}
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Head</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort("employeeCount")} className="flex items-center gap-1 hover:text-gray-700">
                          Members {sortBy === "employeeCount" && (sortOrder === "asc" ? "↑" : "↓")}
                        </button>
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button onClick={() => handleSort("budget")} className="flex items-center gap-1 hover:text-gray-700">
                          Budget {sortBy === "budget" && (sortOrder === "asc" ? "↑" : "↓")}
                        </button>
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentDepartments.map((dept, index) => {
                      const memberCount = dept.members?.length || dept.employeeCount || 0;
                      const budgetAmount = dept.budget?.allocated || 0;
                      const assetCount = dept.assets?.total || 0;

                      return (
                        <motion.tr
                          key={dept._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm font-medium">{dept.name}</p>
                                {dept.description && (
                                  <p className="text-gray-400 text-xs line-clamp-1">{dept.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-600 rounded-lg border border-gray-200">
                              {dept.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {dept.headOfDepartment?.fullName || "Not Assigned"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm font-medium text-gray-700">{memberCount}</span>
                              {memberCount > 0 && (
                                <div className="flex -space-x-1">
                                  {dept.members?.slice(0, 3).map((member) => (
                                    <div
                                      key={member._id}
                                      className="w-5 h-5 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center"
                                      title={member.fullName}
                                    >
                                      <span className="text-[8px] font-bold text-indigo-600">
                                        {member.fullName.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  ))}
                                  {memberCount > 3 && (
                                    <div className="w-5 h-5 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                                      <span className="text-[8px] font-medium text-gray-600">+{memberCount - 3}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-700 font-medium">
                            ${budgetAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {assetCount}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${dept.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
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
                                <Eye size={16} />
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
                                      });
                                      setShowCreateModal(true);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(dept._id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between pt-4"
            >
              <p className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredDepartments.length)} of{" "}
                {filteredDepartments.length} departments
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm transition ${currentPage === pageNum
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal - Same as before */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {editingDept ? "Edit Department" : "Create Department"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingDept ? "Update department information" : "Add a new department"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDept(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={editingDept ? handleUpdate : handleCreate} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    placeholder="e.g., Software Engineering"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition font-mono"
                    placeholder="e.g., SWE"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition"
                    placeholder="Describe the department's purpose..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition shadow-sm"
                  >
                    {editingDept ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingDept(null);
                    }}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal - Same as before */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Delete Department</h2>
                    <p className="text-xs text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5">
                <p className="text-gray-600">
                  Are you sure you want to delete this department? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white py-2.5 rounded-lg transition shadow-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
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