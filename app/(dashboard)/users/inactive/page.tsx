"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  UserX,
  UserCheck,
  Calendar,
  Mail,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Users,
  BadgeCheck,
  Clock,
  ArrowUpDown,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Shield,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface InactiveUser {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  lastLogin?: string;
  createdAt: string;
  isActive: boolean;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  phoneNumber?: string;
}

type ProcessingAction = {
  userId: string;
  action: "activate" | "delete";
} | null;

export default function InactiveUsersPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] =
    useState<ProcessingAction>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [sortField, setSortField] = useState<keyof InactiveUser>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUser, setSelectedUser] = useState<InactiveUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const canManage = hasRole(["super_admin", "admin", "hr_manager"]);

  // ============ FETCH FUNCTIONS ============
  const fetchInactiveUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      if (response.data.success) {
        const inactive = response.data.data.filter((u: any) => !u.isActive);
        setInactiveUsers(inactive);
      }
    } catch (error) {
      console.error("Error fetching inactive users:", error);
      toast.error("Failed to fetch inactive users");
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ EFFECT HOOKS ============
  useEffect(() => {
    if (!canManage) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canManage, router]);

  useEffect(() => {
    fetchInactiveUsers();
  }, [fetchInactiveUsers]);

  // ============ HANDLER FUNCTIONS ============
  const handleActivate = async (userId: string) => {
    setProcessingAction({ userId, action: "activate" });
    try {
      await api.put(`/auth/users/${userId}`, { isActive: true });
      toast.success("User activated successfully");
      await fetchInactiveUsers();
      setShowUserDetails(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to activate user");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user?"))
      return;

    setProcessingAction({ userId, action: "delete" });
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success("User deleted successfully");
      await fetchInactiveUsers();
      setShowUserDetails(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBulkActivate = async () => {
    if (!confirm(`Activate all ${filteredUsers.length} inactive users?`))
      return;

    setProcessingAction({ userId: "bulk", action: "activate" });
    try {
      const promises = filteredUsers.map((user) =>
        api.put(`/auth/users/${user._id}`, { isActive: true }),
      );
      await Promise.all(promises);
      toast.success(`Activated ${filteredUsers.length} users`);
      await fetchInactiveUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to activate users");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSort = (field: keyof InactiveUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ============ HELPER FUNCTIONS ============
  const isProcessing = (userId: string, action: "activate" | "delete") => {
    return (
      processingAction?.userId === userId && processingAction?.action === action
    );
  };

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
      employee: User,
    };
    return icons[role] || User;
  };

  // ============ FILTER LOGIC ============
  const filteredUsers = (() => {
    let filtered = inactiveUsers.filter((user) => {
      const matchesSearch =
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !selectedRole || user.role === selectedRole;

      return matchesSearch && matchesRole;
    });

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  })();

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // ============ STATIC DATA ============
  const roles = [
    { value: "", label: "All Roles" },
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "hr_manager", label: "HR Manager" },
    { value: "dept_manager", label: "Department Manager" },
    { value: "project_manager", label: "Project Manager" },
    { value: "line_manager", label: "Line Manager" },
    { value: "employee", label: "Employee" },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============ PERMISSION CHECK ============
  if (!canManage) return null;

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
                <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                  <UserX className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Inactive Users
                </h1>
                {inactiveUsers.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 rounded-full border border-rose-200">
                    {inactiveUsers.length}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                Manage users with deactivated accounts
              </p>
            </div>
            <div className="flex gap-3">
              {filteredUsers.length > 0 && (
                <button
                  onClick={handleBulkActivate}
                  disabled={processingAction?.userId === "bulk"}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {processingAction?.userId === "bulk" &&
                  processingAction?.action === "activate" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserCheck size={16} />
                  )}
                  Activate All ({filteredUsers.length})
                </button>
              )}
              <button
                onClick={fetchInactiveUsers}
                disabled={loading}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
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
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-rose-600">
                    {inactiveUsers.length}
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
                  <p className="text-2xl font-bold text-emerald-600">0</p>
                  <p className="text-xs text-gray-500 mt-0.5">Reactivated</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Permanently Deleted
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
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
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("");
              }}
              className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <RefreshCw size={16} />
              Reset
            </button>
          </motion.div>

          {/* Inactive Users List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : inactiveUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">
                No Inactive Users
              </h3>
              <p className="text-gray-500">All users are currently active</p>
            </motion.div>
          ) : (
            <>
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
                            onClick={() => handleSort("createdAt")}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Deactivated On
                            <ArrowUpDown size={12} />
                          </button>
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentUsers.map((user, index) => {
                        const RoleIcon = getRoleIcon(user.role);
                        const isActivating = isProcessing(user._id, "activate");
                        const isDeleting = isProcessing(user._id, "delete");

                        return (
                          <motion.tr
                            key={user._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-gray-50 transition group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                                  <span className="text-white text-sm font-bold">
                                    {user.fullName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-gray-800 text-sm font-medium group-hover:text-rose-600 transition">
                                    {user.fullName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Mail size={10} className="text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {user.email}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <BadgeCheck
                                      size={10}
                                      className="text-gray-400"
                                    />
                                    <span className="text-[10px] text-gray-400">
                                      ID: {user.employeeId}
                                    </span>
                                    {user.phoneNumber && (
                                      <>
                                        <span className="text-gray-300">•</span>
                                        <Clock
                                          size={10}
                                          className="text-gray-400"
                                        />
                                        <span className="text-[10px] text-gray-400">
                                          {user.phoneNumber}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5 ${getRoleBadgeColor(user.role)}`}
                              >
                                <RoleIcon size={10} />
                                {user.role.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {formatDate(user.createdAt)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserDetails(true);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleActivate(user._id)}
                                  disabled={isActivating || isDeleting}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                                >
                                  {isActivating ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <UserCheck size={12} />
                                  )}
                                  Activate
                                </button>
                                <button
                                  onClick={() => handleDelete(user._id)}
                                  disabled={isActivating || isDeleting}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs rounded-lg flex items-center gap-1 transition disabled:opacity-50"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                  Delete
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredUsers.length)} of{" "}
                    {filteredUsers.length} inactive users
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
            </>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">
                      {selectedUser.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedUser.fullName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Inactive User Details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="text-gray-800">{selectedUser.fullName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Employee ID
                  </label>
                  <p className="text-gray-800">{selectedUser.employeeId}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">
                    Email
                  </label>
                  <p className="text-gray-800">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Role
                  </label>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(selectedUser.role)}`}
                  >
                    {selectedUser.role.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Department
                  </label>
                  <p className="text-gray-800">
                    {selectedUser.departmentId?.name || "Not assigned"}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">
                    Deactivated On
                  </label>
                  <p className="text-gray-800">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
                {selectedUser.phoneNumber && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500">
                      Phone
                    </label>
                    <p className="text-gray-800">{selectedUser.phoneNumber}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleActivate(selectedUser._id)}
                  disabled={
                    isProcessing(selectedUser._id, "activate") ||
                    isProcessing(selectedUser._id, "delete")
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing(selectedUser._id, "activate") ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck size={16} />
                  )}
                  Activate
                </button>
                <button
                  onClick={() => handleDelete(selectedUser._id)}
                  disabled={
                    isProcessing(selectedUser._id, "activate") ||
                    isProcessing(selectedUser._id, "delete")
                  }
                  className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing(selectedUser._id, "delete") ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
