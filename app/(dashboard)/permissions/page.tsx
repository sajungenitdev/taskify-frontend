"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Shield,
  Crown,
  Users,
  Building2,
  UserCheck,
  Briefcase,
  ChevronRight,
  CheckCircle,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  Lock,
  UserPlus,
  Search,
  RefreshCw,
  Grid,
  List,
  Info,
  Edit2,
  UserX,
  Star,
  Award,
  Zap,
  Sparkles,
  TrendingUp,
  ChevronDown,
  Check,
  UserCog,
  Layers,
  Key,
  Fingerprint,
  BadgeCheck,
  Settings,
  Globe,
  Mail,
  Phone,
  Calendar,
  Clock,
  ArrowRight,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Role {
  _id: string;
  name: string;
  code: string;
  description: string;
  level: number;
  permissions: string[];
  isSystemRole: boolean;
  isPermanent?: boolean;
  userCount?: number;
  createdAt: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  roles?: Role[];
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  employeeId?: string;
  isActive: boolean;
}

export default function PermissionsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [primaryRole, setPrimaryRole] = useState<string>("");
  const [assigningRole, setAssigningRole] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showUserDetail, setShowUserDetail] = useState<User | null>(null);
  const [removingRole, setRemovingRole] = useState(false);

  const canManagePermissions = hasRole(["super_admin", "admin"]);

  useEffect(() => {
    if (!canManagePermissions) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canManagePermissions, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes] = await Promise.all([
        api.get("/roles"),
        api.get("/auth/users"),
      ]);

      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = (user: User): Role[] => {
    if (user.roles && user.roles.length > 0) {
      return user.roles;
    }
    // Fallback: find role by code
    const role = roles.find((r) => r.code.toLowerCase() === user.role);
    return role ? [role] : [];
  };

  const getUserRoleNames = (user: User): string => {
    const userRoles = getUserRoles(user);
    return userRoles.map((r) => r.name).join(", ") || user.role || "No role";
  };

  const getPrimaryRoleName = (user: User): string => {
    if (user.roles && user.roles.length > 0) {
      const primary = user.roles.find((r) => r.code.toLowerCase() === user.role);
      return primary ? primary.name : user.roles[0].name;
    }
    return user.role || "No role";
  };

  const handleAssignRoles = async () => {
    if (!selectedUser || selectedRoles.length === 0) {
      toast.error("Please select a user and at least one role");
      return;
    }

    setAssigningRole(true);
    try {
      const response = await api.put(`/roles/user/${selectedUser._id}/assign`, {
        roleIds: selectedRoles,
        primaryRoleId: primaryRole || selectedRoles[0],
      });

      if (response.data.success) {
        toast.success(`Roles assigned to ${selectedUser.fullName} successfully`);
        setShowAssignModal(false);
        setSelectedUser(null);
        setSelectedRoles([]);
        setPrimaryRole("");
        fetchData();
      } else {
        toast.error(response.data.message || "Failed to assign roles");
      }
    } catch (error: any) {
      console.error("Assign roles error:", error);
      toast.error(error.response?.data?.message || "Failed to assign roles");
    } finally {
      setAssigningRole(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to remove "${roleName}" from this user?`)) {
      return;
    }

    setRemovingRole(true);
    try {
      const response = await api.delete(`/roles/user/${userId}/role/${roleId}`);
      if (response.data.success) {
        toast.success(`Role "${roleName}" removed successfully`);
        fetchData();
        if (showUserDetail) {
          const updatedUser = users.find((u) => u._id === userId);
          if (updatedUser) {
            setShowUserDetail(updatedUser);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove role");
    } finally {
      setRemovingRole(false);
    }
  };

  const handleSetPrimaryRole = async (userId: string, roleId: string) => {
    try {
      const user = users.find((u) => u._id === userId);
      if (!user) return;

      const role = roles.find((r) => r._id === roleId);
      if (!role) return;

      // Update the user's primary role
      const response = await api.put(`/auth/users/${userId}`, {
        role: role.code.toLowerCase(),
      });

      if (response.data.success) {
        toast.success(`Primary role updated to ${role.name}`);
        fetchData();
        if (showUserDetail) {
          const updatedUser = users.find((u) => u._id === userId);
          if (updatedUser) {
            setShowUserDetail(updatedUser);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update primary role");
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(term))
      );
    }

    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter((u) => {
        const userRoles = getUserRoles(u);
        return userRoles.some((r) => r._id === filterRole);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA: string = "";
      let compareB: string = "";

      if (sortBy === "name") {
        compareA = a.fullName;
        compareB = b.fullName;
      } else if (sortBy === "email") {
        compareA = a.email;
        compareB = b.email;
      } else if (sortBy === "role") {
        compareA = getPrimaryRoleName(a);
        compareB = getPrimaryRoleName(b);
      }

      return sortOrder === "asc" ? compareA.localeCompare(compareB) : compareB.localeCompare(compareA);
    });

    return filtered;
  }, [users, searchTerm, filterRole, sortBy, sortOrder]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    totalRoles: roles.length,
    usersWithMultipleRoles: users.filter((u) => u.roles && u.roles.length > 1).length,
    totalAssignments: users.reduce((acc, u) => acc + (u.roles?.length || 0), 0),
  };

  const getRoleColor = (roleName: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "text-purple-600",
      Admin: "text-red-600",
      "HR Manager": "text-pink-600",
      "Department Manager": "text-orange-600",
      "Project Manager": "text-cyan-600",
      "Line Manager": "text-green-600",
      Employee: "text-gray-500",
    };
    return colors[roleName] || "text-indigo-600";
  };

  const getRoleBgColor = (roleName: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "bg-purple-50",
      Admin: "bg-red-50",
      "HR Manager": "bg-pink-50",
      "Department Manager": "bg-orange-50",
      "Project Manager": "bg-cyan-50",
      "Line Manager": "bg-green-50",
      Employee: "bg-gray-50",
    };
    return colors[roleName] || "bg-indigo-50";
  };

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "bg-purple-100 text-purple-700 border-purple-200",
      Admin: "bg-red-100 text-red-700 border-red-200",
      "HR Manager": "bg-pink-100 text-pink-700 border-pink-200",
      "Department Manager": "bg-orange-100 text-orange-700 border-orange-200",
      "Project Manager": "bg-cyan-100 text-cyan-700 border-cyan-200",
      "Line Manager": "bg-green-100 text-green-700 border-green-200",
      Employee: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[roleName] || "bg-indigo-100 text-indigo-700 border-indigo-200";
  };

  if (!canManagePermissions) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Permission Management
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {stats.totalUsers}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Manage user permissions and role assignments
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition text-sm flex items-center gap-2 shadow-sm"
              >
                {viewMode === "grid" ? <List size={14} /> : <Grid size={14} />}
                {viewMode === "grid" ? "List View" : "Grid View"}
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedRoles([]);
                  setPrimaryRole("");
                  setShowAssignModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-indigo-500/20"
              >
                <UserPlus size={16} />
                Assign Permissions
              </button>
              <button
                onClick={fetchData}
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-5 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{stats.activeUsers}</p>
              <p className="text-xs text-gray-500 mt-0.5">Active Users</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-indigo-600">{stats.totalRoles}</p>
              <p className="text-xs text-gray-500 mt-0.5">Available Roles</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-amber-600">{stats.usersWithMultipleRoles}</p>
              <p className="text-xs text-gray-500 mt-0.5">Multi-Role Users</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-purple-600">{stats.totalAssignments}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Assignments</p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 items-start md:items-center"
          >
            <div className="relative flex-1 w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="all">All Roles</option>
                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "email" | "role")}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="role">Sort by Role</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition shadow-sm flex items-center gap-1"
              >
                {sortOrder === "asc" ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
            </div>
          </motion.div>

          {/* User Cards - Grid View */}
          {viewMode === "grid" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {filteredUsers.map((user, index) => {
                const userRoles = getUserRoles(user);
                const primaryRoleName = getPrimaryRoleName(user);

                return (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                            <span className="text-white font-bold text-sm">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-gray-800 font-semibold truncate">
                              {user.fullName}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setSelectedRoles(userRoles.map((r) => r._id));
                            setPrimaryRole(
                              userRoles.find((r) => r.code.toLowerCase() === user.role)?._id ||
                              (userRoles.length > 0 ? userRoles[0]._id : "")
                            );
                            setShowAssignModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>

                      {/* Role Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {userRoles.map((role) => (
                          <span
                            key={role._id}
                            className={`text-[10px] px-2 py-1 rounded-full border font-medium ${getRoleBadgeColor(role.name)}`}
                          >
                            {role.name}
                            {role._id ===
                              userRoles.find((r) => r.code.toLowerCase() === user.role)?._id && (
                              <span className="ml-1 text-[8px] text-amber-500">★</span>
                            )}
                          </span>
                        ))}
                        {userRoles.length === 0 && (
                          <span className="text-xs text-gray-400">No roles assigned</span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-3">
                          <span>{user.employeeId || "No ID"}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>
                            {user.department?.name || "No department"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          }`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-medium">
                            {userRoles.length} role{userRoles.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                      <button
                        onClick={() => setShowUserDetail(user)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition"
                      >
                        <Eye size={12} />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedRoles(userRoles.map((r) => r._id));
                          setPrimaryRole(
                            userRoles.find((r) => r.code.toLowerCase() === user.role)?._id ||
                            (userRoles.length > 0 ? userRoles[0]._id : "")
                          );
                          setShowAssignModal(true);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 transition"
                      >
                        <UserPlus size={12} />
                        Edit Permissions
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            // List View
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
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Primary Role
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => {
                      const userRoles = getUserRoles(user);
                      const primaryRoleName = getPrimaryRoleName(user);

                      return (
                        <tr key={user._id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                  {user.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-gray-800 font-medium text-sm">
                                  {user.fullName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {user.employeeId || "No ID"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {userRoles.map((role) => (
                                <span
                                  key={role._id}
                                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getRoleBadgeColor(role.name)}`}
                                >
                                  {role.name}
                                </span>
                              ))}
                              {userRoles.length === 0 && (
                                <span className="text-xs text-gray-400">No roles</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-gray-700">
                              {primaryRoleName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            }`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRoles(userRoles.map((r) => r._id));
                                  setPrimaryRole(
                                    userRoles.find((r) => r.code.toLowerCase() === user.role)?._id ||
                                    (userRoles.length > 0 ? userRoles[0]._id : "")
                                  );
                                  setShowAssignModal(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit permissions"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setShowUserDetail(user)}
                                className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition"
                                title="View details"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <UserX size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No users found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Permissions Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedUser ? `Edit Permissions - ${selectedUser.fullName}` : "Assign Permissions"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Select roles to assign to this user
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                    setSelectedRoles([]);
                    setPrimaryRole("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Selected User Info */}
                {selectedUser && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {selectedUser.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {selectedUser.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{selectedUser.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Select Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Select Roles <span className="text-rose-500">*</span>
                  </label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                      {roles.map((role) => {
                        const isSelected = selectedRoles.includes(role._id);
                        return (
                          <div
                            key={role._id}
                            onClick={() => {
                              if (role.isPermanent && !isSelected) {
                                setSelectedRoles((prev) => [...prev, role._id]);
                              } else if (!role.isPermanent) {
                                setSelectedRoles((prev) =>
                                  prev.includes(role._id)
                                    ? prev.filter((id) => id !== role._id)
                                    : [...prev, role._id]
                                );
                              } else {
                                // Permanent roles can only be deselected if user has more than one role
                                const currentRoles = selectedUser ? getUserRoles(selectedUser) : [];
                                if (currentRoles.length > 1) {
                                  setSelectedRoles((prev) =>
                                    prev.filter((id) => id !== role._id)
                                  );
                                } else {
                                  toast.error("User must have at least one role");
                                }
                              }
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-indigo-50 hover:bg-indigo-100"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {role.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {role.code} • Level {role.level}
                              </p>
                            </div>
                            {role.isPermanent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                Permanent
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {selectedRoles.length} role(s) selected
                  </p>
                </div>

                {/* Select Primary Role */}
                {selectedRoles.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Primary Role
                      <span className="text-xs text-gray-400 ml-2">
                        (Default: first selected)
                      </span>
                    </label>
                    <select
                      value={primaryRole}
                      onChange={(e) => setPrimaryRole(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    >
                      {selectedRoles.map((roleId) => {
                        const role = roles.find((r) => r._id === roleId);
                        return role ? (
                          <option key={roleId} value={roleId}>
                            {role.name} (Level {role.level})
                          </option>
                        ) : null;
                      })}
                    </select>
                  </div>
                )}

                {/* Info Message */}
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">
                        Multiple Roles Support
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Users can have multiple roles. The primary role determines the main role displayed in the UI.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAssignRoles}
                    disabled={
                      assigningRole ||
                      !selectedUser ||
                      selectedRoles.length === 0
                    }
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {assigningRole ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        {selectedUser ? "Update Permissions" : `Assign ${selectedRoles.length} Role${selectedRoles.length !== 1 ? "s" : ""}`}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedUser(null);
                      setSelectedRoles([]);
                      setPrimaryRole("");
                    }}
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

      {/* User Detail Modal */}
      <AnimatePresence>
        {showUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    User Details
                  </h2>
                  <p className="text-xs text-gray-500">
                    View and manage user permissions
                  </p>
                </div>
                <button
                  onClick={() => setShowUserDetail(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-white text-xl font-bold">
                      {showUserDetail.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800 truncate">
                      {showUserDetail.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{showUserDetail.email}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {showUserDetail.employeeId && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                          ID: {showUserDetail.employeeId}
                        </span>
                      )}
                      {showUserDetail.department && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                          {showUserDetail.department.name}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        showUserDetail.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {showUserDetail.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(showUserDetail);
                      const userRoles = getUserRoles(showUserDetail);
                      setSelectedRoles(userRoles.map((r) => r._id));
                      setPrimaryRole(
                        userRoles.find((r) => r.code.toLowerCase() === showUserDetail.role)?._id ||
                        (userRoles.length > 0 ? userRoles[0]._id : "")
                      );
                      setShowUserDetail(null);
                      setShowAssignModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                </div>

                {/* Roles Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Shield size={14} className="text-indigo-500" />
                    Assigned Roles
                  </h4>
                  <div className="space-y-2">
                    {getUserRoles(showUserDetail).map((role) => (
                      <div
                        key={role._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${getRoleBgColor(role.name)}`}>
                            <Shield size={14} className={getRoleColor(role.name)} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {role.name}
                              {role._id === getUserRoles(showUserDetail).find(
                                (r) => r.code.toLowerCase() === showUserDetail.role
                              )?._id && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                  Primary
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {role.code} • Level {role.level} • {role.isPermanent ? "Permanent" : "Custom"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!role.isPermanent && (
                            <button
                              onClick={() => handleRemoveRole(
                                showUserDetail._id,
                                role._id,
                                role.name
                              )}
                              disabled={removingRole}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {role._id !== getUserRoles(showUserDetail).find(
                            (r) => r.code.toLowerCase() === showUserDetail.role
                          )?._id && (
                            <button
                              onClick={() => handleSetPrimaryRole(showUserDetail._id, role._id)}
                              className="text-[10px] px-2 py-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition font-medium"
                            >
                              Set Primary
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {getUserRoles(showUserDetail).length === 0 && (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                        <UserX size={24} className="text-gray-300 mx-auto mb-1" />
                        <p className="text-gray-500 text-sm">No roles assigned</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Roles to Add */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Plus size={14} className="text-emerald-500" />
                    Available Roles to Add
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {roles
                      .filter((r) => !getUserRoles(showUserDetail).some((ur) => ur._id === r._id))
                      .map((role) => (
                        <button
                          key={role._id}
                          onClick={async () => {
                            const currentRoles = getUserRoles(showUserDetail);
                            const newRoleIds = [...currentRoles.map((r) => r._id), role._id];
                            setSelectedUser(showUserDetail);
                            setSelectedRoles(newRoleIds);
                            setPrimaryRole(
                              currentRoles.find((r) => r.code.toLowerCase() === showUserDetail.role)?._id ||
                              currentRoles[0]?._id ||
                              role._id
                            );
                            setShowUserDetail(null);
                            setShowAssignModal(true);
                          }}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition ${getRoleBadgeColor(role.name)} hover:shadow-md`}
                        >
                          + {role.name}
                        </button>
                      ))}
                    {roles.every((r) => getUserRoles(showUserDetail).some((ur) => ur._id === r._id)) && (
                      <p className="text-xs text-gray-400">All roles already assigned</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button
                  onClick={() => setShowUserDetail(null)}
                  className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(229, 231, 235, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}