"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Search,
  Filter,
  Users,
  Calendar,
  Mail,
  BadgeCheck,
  User,
  Shield,
  Building2,
  MoreVertical,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface PendingUser {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
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
  action: "approve" | "reject";
} | null;

export default function PendingApprovalsPage() {
  const { hasRole, user } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] =
    useState<ProcessingAction>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  const canApprove = hasRole(["super_admin", "admin", "hr_manager"]);

  // ============ FETCH FUNCTIONS (DECLARED FIRST) ============
  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      if (response.data.success) {
        const pending = response.data.data.filter((u: any) => !u.isActive);
        setPendingUsers(pending);
      }
    } catch (error) {
      console.error("Error fetching pending users:", error);
      toast.error("Failed to fetch pending users");
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ EFFECT HOOKS ============
  useEffect(() => {
    if (!canApprove) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canApprove, router]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  // ============ HANDLER FUNCTIONS ============
  const handleApprove = async (userId: string) => {
    setProcessingAction({ userId, action: "approve" });
    try {
      await api.put(`/auth/users/${userId}`, { isActive: true });
      toast.success("User approved successfully");
      await fetchPendingUsers();
      setShowUserDetails(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve user");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingAction({ userId, action: "reject" });
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success("User rejected and removed");
      await fetchPendingUsers();
      setShowUserDetails(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject user");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!confirm(`Approve all ${filteredUsers.length} pending users?`)) return;

    setProcessingAction({ userId: "bulk", action: "approve" });
    try {
      const promises = filteredUsers.map((user) =>
        api.put(`/auth/users/${user._id}`, { isActive: true }),
      );
      await Promise.all(promises);
      toast.success(`Approved ${filteredUsers.length} users`);
      await fetchPendingUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve users");
    } finally {
      setProcessingAction(null);
    }
  };

  // ============ HELPER FUNCTIONS ============
  const isProcessing = (userId: string, action: "approve" | "reject") => {
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

  // ============ FILTER LOGIC (Without useMemo to avoid compiler issues) ============
  const filteredUsers = (() => {
    // Filter by search term and role
    const filtered = pendingUsers.filter((userItem) => {
      const matchesSearch =
        userItem.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = !selectedRole || userItem.role === selectedRole;

      return matchesSearch && matchesRole;
    });

    // Sort by creation date (newest first)
    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  })();

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Get current page users
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
  if (!canApprove) return null;

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
                <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Pending Approvals
                </h1>
                {pendingUsers.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                    {pendingUsers.length}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                Review and approve new user registrations
              </p>
            </div>
            <div className="flex gap-3">
              {filteredUsers.length > 0 && (
                <button
                  onClick={handleBulkApprove}
                  disabled={processingAction?.userId === "bulk"}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {processingAction?.userId === "bulk" &&
                  processingAction?.action === "approve" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserCheck size={16} />
                  )}
                  Approve All ({filteredUsers.length})
                </button>
              )}
              <button
                onClick={fetchPendingUsers}
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
                  <p className="text-2xl font-bold text-amber-600">
                    {pendingUsers.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pending Approvals
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">0</p>
                  <p className="text-xs text-gray-500 mt-0.5">Approved Today</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-rose-600">0</p>
                  <p className="text-xs text-gray-500 mt-0.5">Rejected</p>
                </div>
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                  <UserX className="w-5 h-5 text-rose-500" />
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

          {/* Pending Users List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-1">
                No Pending Approvals
              </h3>
              <p className="text-gray-500">
                All user registrations have been processed
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <AnimatePresence>
                  {currentUsers.map((user, index) => {
                    const RoleIcon = getRoleIcon(user.role);
                    const isApproving = isProcessing(user._id, "approve");
                    const isRejecting = isProcessing(user._id, "reject");

                    return (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                              <span className="text-white font-bold text-lg">
                                {user.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-gray-800 font-semibold">
                                  {user.fullName}
                                </p>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getRoleBadgeColor(user.role)} flex items-center gap-1`}
                                >
                                  <RoleIcon size={10} />
                                  {user.role.replace(/_/g, " ")}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Mail size={12} className="text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {user.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <BadgeCheck
                                    size={12}
                                    className="text-gray-400"
                                  />
                                  <span className="text-xs text-gray-400">
                                    ID: {user.employeeId}
                                  </span>
                                </div>
                                {user.departmentId && (
                                  <div className="flex items-center gap-1">
                                    <Building2
                                      size={12}
                                      className="text-gray-400"
                                    />
                                    <span className="text-xs text-gray-400">
                                      {user.departmentId.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Calendar size={10} className="text-gray-400" />
                                <span className="text-[10px] text-gray-400">
                                  Requested: {formatDate(user.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetails(true);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleApprove(user._id)}
                              disabled={isApproving || isRejecting}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg flex items-center gap-2 transition shadow-sm disabled:opacity-50"
                            >
                              {isApproving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle size={16} />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user._id)}
                              disabled={isApproving || isRejecting}
                              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                            >
                              {isRejecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle size={16} />
                              )}
                              Reject
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-500">
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredUsers.length)} of{" "}
                    {filteredUsers.length} pending users
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
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">
                      {selectedUser.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {selectedUser.fullName}
                    </h2>
                    <p className="text-sm text-gray-500">User Details</p>
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
                    Requested At
                  </label>
                  <p className="text-gray-800">
                    {formatDate(selectedUser.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApprove(selectedUser._id)}
                  disabled={
                    isProcessing(selectedUser._id, "approve") ||
                    isProcessing(selectedUser._id, "reject")
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing(selectedUser._id, "approve") ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleReject(selectedUser._id)}
                  disabled={
                    isProcessing(selectedUser._id, "approve") ||
                    isProcessing(selectedUser._id, "reject")
                  }
                  className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing(selectedUser._id, "reject") ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Reject
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
