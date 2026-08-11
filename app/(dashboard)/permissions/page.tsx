"use client";

import { useState, useEffect, useMemo } from "react";
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
  Edit2,
  UserX,
  Key,
  Layers,
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
  const { hasRole } = useAuth();
  const router = useRouter();

  // State Management
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [primaryRole, setPrimaryRole] = useState<string>("");
  const [assigningRole, setAssigningRole] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showUserDetail, setShowUserDetail] = useState<User | null>(null);
  const [removingRole, setRemovingRole] = useState(false);

  // Access Control Verification
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

  /**
   * Synchronize system roles and user directories concurrently.
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes] = await Promise.all([
        api.get("/roles").catch(() => ({ data: { success: false, data: [] } })),
        api.get("/auth/users").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data || []);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching permissions dataset:", error);
      toast.error("Failed to load permission matrices");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retrieve active role objects mapped to a given user.
   */
  const getUserRoles = (user: User): Role[] => {
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles;
    }
    const role = roles.find((r) => r.code.toLowerCase() === user.role?.toLowerCase());
    return role ? [role] : [];
  };

  const getPrimaryRoleName = (user: User): string => {
    const userRoles = getUserRoles(user);
    if (userRoles.length > 0) {
      const primary = userRoles.find((r) => r.code.toLowerCase() === user.role?.toLowerCase());
      return primary ? primary.name : userRoles[0].name;
    }
    return user.role ? user.role.replace(/_/g, " ").toUpperCase() : "Unassigned";
  };

  /**
   * Commit role assignments and security tiers to backend.
   */
  const handleAssignRoles = async () => {
    if (!selectedUser || selectedRoles.length === 0) {
      toast.error("Please select a user and at least one role");
      return;
    }

    setAssigningRole(true);
    const toastId = toast.loading("Updating user security assignments...");
    try {
      const response = await api.put(`/roles/user/${selectedUser._id}/assign`, {
        roleIds: selectedRoles,
        primaryRoleId: primaryRole || selectedRoles[0],
      });

      if (response.data.success) {
        toast.success(`Roles assigned to ${selectedUser.fullName} successfully`, { id: toastId });
        setSelectedUser(null);
        setSelectedRoles([]);
        setPrimaryRole("");
        fetchData();
      } else {
        toast.error(response.data.message || "Failed to assign roles", { id: toastId });
      }
    } catch (error: any) {
      console.error("Assign roles error:", error);
      toast.error(error.response?.data?.message || "Failed to commit security updates", { id: toastId });
    } finally {
      setAssigningRole(false);
    }
  };

  /**
   * Revoke a specific role assignment from a user account.
   */
  const handleRemoveRole = async (userId: string, roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to revoke "${roleName}" from this user?`)) {
      return;
    }

    setRemovingRole(true);
    try {
      const response = await api.delete(`/roles/user/${userId}/role/${roleId}`);
      if (response.data.success) {
        toast.success(`Role "${roleName}" revoked successfully`);
        fetchData();
        if (showUserDetail) {
          const updatedUser = users.find((u) => u._id === userId);
          if (updatedUser) setShowUserDetail(updatedUser);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to revoke role assignment");
    } finally {
      setRemovingRole(false);
    }
  };

  /**
   * Promote a role to primary status.
   */
  const handleSetPrimaryRole = async (userId: string, roleId: string) => {
    try {
      const role = roles.find((r) => r._id === roleId);
      if (!role) return;

      const response = await api.put(`/auth/users/${userId}`, {
        role: role.code.toLowerCase(),
      });

      if (response.data.success) {
        toast.success(`Primary role updated to ${role.name}`);
        fetchData();
        if (showUserDetail) {
          const updatedUser = users.find((u) => u._id === userId);
          if (updatedUser) setShowUserDetail(updatedUser);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update primary role assignment");
    }
  };

  // Filter and sort user directory
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fullName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(term))
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter((u) => {
        const userRoles = getUserRoles(u);
        return userRoles.some((r) => r._id === filterRole);
      });
    }

    filtered.sort((a, b) => {
      let compareA = "";
      let compareB = "";

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
  }, [users, searchTerm, filterRole, sortBy, sortOrder, roles]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    totalRoles: roles.length,
    usersWithMultipleRoles: users.filter((u) => (u.roles?.length || 0) > 1).length,
    totalAssignments: users.reduce((acc, u) => acc + (u.roles?.length || 1), 0),
  }), [users, roles]);

  const getRoleBadgeColor = (roleName: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "bg-purple-50 text-purple-700 border-purple-200",
      Admin: "bg-rose-50 text-rose-700 border-rose-200",
      "HR Manager": "bg-pink-50 text-pink-700 border-pink-200",
      "Department Manager": "bg-amber-50 text-amber-700 border-amber-200",
      "Project Manager": "bg-cyan-50 text-cyan-700 border-cyan-200",
      "Line Manager": "bg-emerald-50 text-emerald-700 border-emerald-200",
      Employee: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return colors[roleName] || "bg-indigo-50 text-indigo-700 border-indigo-200";
  };

  const getRoleBgColor = (roleName: string) => {
    if (roleName.includes("Super")) return "bg-purple-50 text-purple-600";
    if (roleName.includes("Admin")) return "bg-rose-50 text-rose-600";
    if (roleName.includes("HR")) return "bg-pink-50 text-pink-600";
    return "bg-indigo-50 text-indigo-600";
  };

  if (!canManagePermissions) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-medium text-slate-400">Loading access control lists...</p>
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
                <Key className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Permission Management</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {stats.totalUsers}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Assign enterprise security tiers, map roles, and manage user clearances.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total Accounts", val: stats.totalUsers, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Active Clearance", val: stats.activeUsers, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Role Registry", val: stats.totalRoles, icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Multi-Role", val: stats.usersWithMultipleRoles, icon: Layers, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Assignments", val: stats.totalAssignments, icon: Key, color: "text-purple-600", bg: "bg-purple-50" },
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

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs cursor-pointer"
            >
              <option value="all">All Security Roles</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-sm font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="role">Sort by Primary Role</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-3 bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 rounded-2xl transition shadow-xs"
              title="Toggle Sort Order"
            >
              {sortOrder === "asc" ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </button>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u, index) => {
              const userRoles = getUserRoles(u);

              return (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-xl hover:border-slate-200/80 transition duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-indigo-600 group-hover:text-white transition duration-300">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug tracking-tight">{u.fullName}</h3>
                          <p className="text-slate-400 text-xs truncate max-w-[180px]">{u.email}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-full ${u.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-rose-50 text-rose-700 border border-rose-200/60"
                        }`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Role Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                      {userRoles.map((role) => (
                        <span
                          key={role._id}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getRoleBadgeColor(role.name)}`}
                        >
                          {role.name}
                        </span>
                      ))}
                      {userRoles.length === 0 && (
                        <span className="text-xs text-slate-400 italic font-medium">No clearance assigned</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
                      <span>{u.employeeId || "No ID Tag"}</span>
                      <span>{u.department?.name || "General Unit"}</span>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setShowUserDetail(u)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition"
                    >
                      <Eye size={14} />
                      Inspect Profile
                    </button>

                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setSelectedRoles(userRoles.map((r) => r._id));
                        setPrimaryRole(userRoles[0]?._id || "");
                      }}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    >
                      <UserPlus size={13} />
                      Configure Roles
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List View Table */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Account Holder</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Assigned Roles</th>
                    <th className="px-6 py-4 text-center">Primary Tier</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredUsers.map((u) => {
                    const userRoles = getUserRoles(u);

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{u.fullName}</p>
                              <p className="text-xs text-slate-400">{u.employeeId || "No ID"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-xs">{u.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {userRoles.map((role) => (
                              <span key={role._id} className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadgeColor(role.name)}`}>
                                {role.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-900">{getPrimaryRoleName(u)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${u.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" : "bg-rose-50 text-rose-700 border border-rose-200/60"
                            }`}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setShowUserDetail(u)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setSelectedRoles(userRoles.map((r) => r._id));
                                setPrimaryRole(userRoles[0]?._id || "");
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                              title="Edit Permissions"
                            >
                              <UserPlus size={16} />
                            </button>
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

        {filteredUsers.length === 0 && (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-xs max-w-lg mx-auto space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <UserX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Users Discovered</h3>
            <p className="text-slate-400 text-xs">No accounts matched your search queries or security filters.</p>
          </div>
        )}

      </div>

      {/* Modal: Configure / Assign User Roles */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Manage User Permissions</h2>
                  <p className="text-xs text-slate-500 font-medium">Configuring access for {selectedUser.fullName}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Snapshot */}
                <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedUser.fullName}</p>
                    <p className="text-xs text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Role Checklist */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Authorized Roles</label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {roles.map((role) => {
                      const isChecked = selectedRoles.includes(role._id);

                      return (
                        <div
                          key={role._id}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedRoles(selectedRoles.filter((id) => id !== role._id));
                              if (primaryRole === role._id) setPrimaryRole("");
                            } else {
                              setSelectedRoles([...selectedRoles, role._id]);
                              if (!primaryRole) setPrimaryRole(role._id);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${isChecked ? "bg-indigo-50/60 border-indigo-300 shadow-xs" : "bg-white border-slate-200/80 hover:border-slate-300"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                              }`}>
                              {isChecked && <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{role.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{role.code} • Level {role.level}</p>
                            </div>
                          </div>

                          {isChecked && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryRole(role._id);
                              }}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${primaryRole === role._id
                                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                              {primaryRole === role._id ? "Primary Role" : "Set Primary"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleAssignRoles}
                    disabled={assigningRole}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2"
                  >
                    {assigningRole && <Loader2 size={16} className="animate-spin" />}
                    Save Security Permissions
                  </button>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Detailed User Profile & Active Clearance */}
      <AnimatePresence>
        {showUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">User Security Profile</h2>
                  <p className="text-xs text-slate-500 font-medium">Active clearance assignments & audit info</p>
                </div>
                <button onClick={() => setShowUserDetail(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-xs shrink-0">
                    {showUserDetail.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-900 text-base truncate">{showUserDetail.fullName}</h3>
                    <p className="text-xs text-slate-400 truncate">{showUserDetail.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono bg-white text-black px-2 py-0.5 rounded border border-slate-200">ID: {showUserDetail.employeeId || "N/A"}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${showUserDetail.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                        {showUserDetail.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Shield size={14} className="text-indigo-600" />
                    Assigned Clearances ({getUserRoles(showUserDetail).length})
                  </h4>

                  <div className="space-y-2">
                    {getUserRoles(showUserDetail).map((role) => {
                      const isPrimary = role.code.toLowerCase() === showUserDetail.role?.toLowerCase();

                      return (
                        <div key={role._id} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-xs">
                              {role.level}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                {role.name}
                                {isPrimary && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-md font-bold shadow-xs">Primary</span>}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">{role.code}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!role.isPermanent && (
                              <button
                                onClick={() => handleRemoveRole(showUserDetail._id, role._id, role.name)}
                                disabled={removingRole}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                                title="Revoke Role"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            {!isPrimary && (
                              <button
                                onClick={() => handleSetPrimaryRole(showUserDetail._id, role._id)}
                                className="px-2.5 py-1 text-[10px] font-bold bg-white text-indigo-600 border border-slate-200 hover:bg-indigo-50 rounded-lg transition shadow-xs"
                              >
                                Make Primary
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {getUserRoles(showUserDetail).length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">No active roles attached to this account.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setShowUserDetail(null)}
                  className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm shadow-xs"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
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