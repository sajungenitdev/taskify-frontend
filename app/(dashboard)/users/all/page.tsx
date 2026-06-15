"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

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

  const filteredUsers = users.filter((userItem) => {
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      admin: "bg-red-500/20 text-red-400 border-red-500/30",
      hr_manager: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      dept_manager: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      project_manager: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      line_manager: "bg-green-500/20 text-green-400 border-green-500/30",
      employee: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    };
    return colors[role] || colors.employee;
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

  if (!canManageUsers) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-6 pe-0">
      <div className="w-full mx-auto space-y-6 px-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Users</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage and view all users in the system
            </p>
          </div>
          <div className="flex gap-3">
            {canCreateUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
              >
                <UserPlus size={16} />
                Add User
              </button>
            )}
            <Link
              href="/users/import"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <Upload size={16} />
              Import
            </Link>
            <Link
              href="/users/export"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <Download size={16} />
              Export
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Users</p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.isActive).length}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Active Users</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => !u.isActive).length}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Inactive Users</p>
              </div>
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <UserX className="w-5 h-5 text-rose-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {departments.length}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Departments</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
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
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
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
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
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
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                        User
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                        Role
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                        Department
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                        Last Login
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {currentUsers.map((userItem) => (
                      <tr
                        key={userItem._id}
                        className="hover:bg-slate-800/30 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {userItem.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                {userItem.fullName}
                              </p>
                              <p className="text-slate-400 text-xs">
                                {userItem.email}
                              </p>
                              <p className="text-slate-500 text-[10px]">
                                ID: {userItem.employeeId}
                              </p>
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
                            className={`px-2 py-1 text-xs rounded-full border ${getRoleBadgeColor(userItem.role)} ${canChangeRole ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                          >
                            {userItem.role.replace(/_/g, " ")}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">
                          {userItem.departmentId
                            ? (userItem.departmentId as any).name
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                userItem._id,
                                userItem.isActive,
                              )
                            }
                            className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                              userItem.isActive
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
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
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {userItem.lastLogin
                            ? new Date(userItem.lastLogin).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/users/${userItem._id}`}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 transition"
                            >
                              <Eye size={16} />
                            </Link>
                            {canDeleteUser && userItem._id !== user?._id && (
                              <button
                                onClick={() =>
                                  setShowDeleteConfirm(userItem._id)
                                }
                                className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No users found</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition ${
                        currentPage === page
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">
                  Create New User
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                >
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
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
                <label className="block text-sm text-slate-400 mb-1">
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
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
                  placeholder="Optional"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition disabled:opacity-50"
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
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Delete User</h2>
            </div>
            <div className="p-5">
              <p className="text-slate-300">
                Are you sure you want to delete this user? This action cannot be
                undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">
                Change User Role
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <select
                value={selectedRoleForUser}
                onChange={(e) => setSelectedRoleForUser(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-indigo-500 outline-none"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    handleChangeRole(showRoleModal, selectedRoleForUser)
                  }
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition"
                >
                  Update Role
                </button>
                <button
                  onClick={() => setShowRoleModal(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
