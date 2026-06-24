"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Download,
  Upload,
  Search,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Building2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  X,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Clock,
  BadgeCheck,
  UserCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  phoneNumber?: string;
  role: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

export default function AllUsersPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showStatus, setShowStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [showRoleModal, setShowRoleModal] = useState<string | null>(null);
  const [selectedRoleForUser, setSelectedRoleForUser] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    employeeId: "",
    role: "employee",
    departmentId: "",
    phoneNumber: "",
  });
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState<keyof User>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const canManageUsers = hasRole(["super_admin", "admin", "hr_manager"]);
  const canChangeRole = hasRole(["super_admin"]);
  const canDeleteUser = hasRole(["super_admin"]);
  const canCreateUser = hasRole(["super_admin", "admin", "hr_manager"]);

  // Check permission
  useEffect(() => {
    if (!canManageUsers) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canManageUsers, router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [fetchUsers, fetchDepartments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchDepartments()]);
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !createFormData.fullName ||
      !createFormData.email ||
      !createFormData.password ||
      !createFormData.employeeId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (createFormData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setCreating(true);
    try {
      const response = await api.post("/auth/register", createFormData);
      if (response.data.success) {
        toast.success("User created successfully");
        setShowCreateModal(false);
        setCreateFormData({
          fullName: "",
          email: "",
          password: "",
          employeeId: "",
          role: "employee",
          departmentId: "",
          phoneNumber: "",
        });
        await fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success("User deleted successfully");
      await fetchUsers();
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/auth/users/${userId}`, { isActive: !currentStatus });
      toast.success(
        `User ${!currentStatus ? "activated" : "deactivated"} successfully`,
      );
      await fetchUsers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      toast.success("User role updated successfully");
      await fetchUsers();
      setShowRoleModal(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = users.filter((userItem) => {
      const matchesSearch =
        userItem.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !selectedRole || userItem.role === selectedRole;
      const matchesDepartment =
        !selectedDepartment ||
        (userItem.departmentId &&
          (userItem.departmentId as any)._id === selectedDepartment);
      const matchesStatus =
        showStatus === "all" ||
        (showStatus === "active" && userItem.isActive) ||
        (showStatus === "inactive" && !userItem.isActive);

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    users,
    searchTerm,
    selectedRole,
    selectedDepartment,
    showStatus,
    sortField,
    sortDirection,
  ]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-700 border-purple-200",
      admin: "bg-red-100 text-red-700 border-red-200",
      hr_manager: "bg-pink-100 text-pink-700 border-pink-200",
      dept_manager: "bg-orange-100 text-orange-700 border-orange-200",
      project_manager: "bg-cyan-100 text-cyan-700 border-cyan-200",
      line_manager: "bg-green-100 text-green-700 border-green-200",
      employee: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[role] || colors.employee;
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, any> = {
      super_admin: Shield,
      admin: Shield,
      hr_manager: Users,
      dept_manager: Building2,
      project_manager: Users,
      line_manager: UserCheck,
      employee: UserCircle,
    };
    return icons[role] || UserCircle;
  };

  const roles = [
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "hr_manager", label: "HR Manager" },
    { value: "dept_manager", label: "Department Manager" },
    { value: "project_manager", label: "Project Manager" },
    { value: "line_manager", label: "Line Manager" },
    { value: "employee", label: "Employee" },
  ];

  const totalActive = users.filter((u) => u.isActive).length;
  const totalInactive = users.filter((u) => !u.isActive).length;

  if (!canManageUsers) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  All Users
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {users.length}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Manage and view all users in the system
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {canCreateUser && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
                >
                  <UserPlus size={16} />
                  Add User
                </button>
              )}
              <Link
                href="/users/import"
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
              >
                <Upload size={16} />
                Import
              </Link>
              <Link
                href="/users/export"
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
              >
                <Download size={16} />
                Export
              </Link>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
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
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {users.length}
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
                    {totalActive}
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
                    {totalInactive}
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
                    {departments.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Departments</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <select
                value={showStatus}
                onChange={(e) => setShowStatus(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRole("");
                  setSelectedDepartment("");
                  setShowStatus("all");
                }}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
              >
                <RefreshCw size={16} />
                Reset
              </button>
            </div>
          </motion.div>

          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
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
                        <button
                          onClick={() => handleSort("fullName")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          User
                          <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("role")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Role
                          <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("departmentId")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Department
                          <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("isActive")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Status
                          <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort("lastLogin")}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          Last Login
                          <ArrowUpDown size={12} />
                        </button>
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentUsers.map((userItem, index) => {
                      const RoleIcon = getRoleIcon(userItem.role);
                      return (
                        <motion.tr
                          key={userItem._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-gray-50 transition group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                <span className="text-white text-sm font-bold">
                                  {userItem.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-gray-800 text-sm font-medium group-hover:text-indigo-600 transition">
                                  {userItem.fullName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Mail size={10} className="text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {userItem.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <BadgeCheck
                                    size={10}
                                    className="text-gray-400"
                                  />
                                  <span className="text-[10px] text-gray-400">
                                    ID: {userItem.employeeId}
                                  </span>
                                  {userItem.phoneNumber && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <Phone
                                        size={10}
                                        className="text-gray-400"
                                      />
                                      <span className="text-[10px] text-gray-400">
                                        {userItem.phoneNumber}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedRoleForUser(userItem.role);
                                setShowRoleModal(userItem._id);
                              }}
                              disabled={!canChangeRole}
                              className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5 ${getRoleBadgeColor(userItem.role)} ${canChangeRole ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                            >
                              <RoleIcon size={10} />
                              {userItem.role.replace(/_/g, " ")}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {userItem.departmentId
                                ? (userItem.departmentId as any).name
                                : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                handleToggleStatus(
                                  userItem._id,
                                  userItem.isActive,
                                )
                              }
                              className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 transition ${
                                userItem.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                              }`}
                            >
                              {userItem.isActive ? (
                                <CheckCircle size={10} />
                              ) : (
                                <XCircle size={10} />
                              )}
                              {userItem.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {userItem.lastLogin
                                  ? new Date(
                                      userItem.lastLogin,
                                    ).toLocaleDateString()
                                  : "Never"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/users/${userItem._id}`}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="View User"
                              >
                                <Eye size={16} />
                              </Link>
                              {canDeleteUser && userItem._id !== user?._id && (
                                <button
                                  onClick={() =>
                                    setShowDeleteConfirm(userItem._id)
                                  }
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              <button
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition opacity-0 group-hover:opacity-100"
                                title="More"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No users found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try adjusting your filters or search terms
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredUsers.length)} of{" "}
                    {filteredUsers.length} users
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
                          className={`px-3 py-2 rounded-lg text-sm transition ${
                            currentPage === pageNum
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Create New User
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={createFormData.fullName}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password * (min 8 characters)
                </label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  value={createFormData.employeeId}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      employeeId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={createFormData.role}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      role: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={createFormData.departmentId}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      departmentId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="">No Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={createFormData.phoneNumber}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 shadow-sm"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Create User"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-gray-200 bg-rose-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Delete User
                </h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-600">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-lg transition shadow-sm"
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

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Change User Role
                </h2>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select New Role
              </label>
              <select
                value={selectedRoleForUser}
                onChange={(e) => setSelectedRoleForUser(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    handleChangeRole(showRoleModal, selectedRoleForUser)
                  }
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition shadow-sm"
                >
                  Update Role
                </button>
                <button
                  onClick={() => setShowRoleModal(null)}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
