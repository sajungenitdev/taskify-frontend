// app/(dashboard)/users/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserX,
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
  ArrowUpDown,
  Mail,
  Phone,
  Clock,
  BadgeCheck,
  Save,
  Key,
  EyeOff,
  Eye as EyeIcon,
  Layers,
  Info,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================
// TYPES
// ============================================================
interface Role {
  _id: string;
  name: string;
  code: string;
  description: string;
  level: number;
  isSystemRole: boolean;
  isPermanent?: boolean;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  phoneNumber?: string;
  role: string;
  roles?: Role[];
  department?: {
    _id: string;
    name: string;
    code: string;
  } | string | null;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  } | null;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  bio?: string;
  position?: string;
  location?: string;
  profilePhoto?: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  employeeId: string;
  role: string;
  departmentId: string;
  phoneNumber: string;
}

interface EditUserData {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  departmentId: string;
  employeeId: string;
  isActive: boolean;
  position: string;
  location: string;
  bio: string;
}

// ============================================================
// CONSTANTS
// ============================================================
const ROLES = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "dept_manager", label: "Department Manager" },
  { value: "project_manager", label: "Project Manager" },
  { value: "line_manager", label: "Line Manager" },
  { value: "employee", label: "Employee" },
];

const ROLE_BADGE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-50 text-purple-700 border-purple-200",
  admin: "bg-rose-50 text-rose-700 border-rose-200",
  hr_manager: "bg-pink-50 text-pink-700 border-pink-200",
  dept_manager: "bg-amber-50 text-amber-700 border-amber-200",
  project_manager: "bg-cyan-50 text-cyan-700 border-cyan-200",
  line_manager: "bg-emerald-50 text-emerald-700 border-emerald-200",
  employee: "bg-slate-100 text-slate-700 border-slate-200",
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function AllUsersPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();

  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [showStatus, setShowStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  // Modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [showMultiRoleModal, setShowMultiRoleModal] = useState<boolean>(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordData, setPasswordData] = useState({ newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedRolesForUser, setSelectedRolesForUser] = useState<string[]>([]);
  const [primaryRoleForUser, setPrimaryRoleForUser] = useState<string>("");

  // Forms
  const [createFormData, setCreateFormData] = useState<CreateUserData>({
    fullName: "", email: "", password: "", employeeId: "", role: "employee", departmentId: "", phoneNumber: "",
  });

  const [editFormData, setEditFormData] = useState<EditUserData>({
    fullName: "", email: "", phoneNumber: "", role: "", departmentId: "", employeeId: "", isActive: true, position: "", location: "", bio: "",
  });

  // Action Loading States
  const [creating, setCreating] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingRoles, setUpdatingRoles] = useState<boolean>(false);

  // Sorting
  const [sortField, setSortField] = useState<keyof User>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Permissions
  const canManageUsers = hasRole(["super_admin", "admin", "hr_manager"]);
  const canChangeRole = hasRole(["super_admin"]);
  const canDeleteUser = hasRole(["super_admin"]);
  const canCreateUser = hasRole(["super_admin", "admin", "hr_manager"]);
  const canEditUser = hasRole(["super_admin", "admin", "hr_manager"]);
  const canChangePassword = hasRole(["super_admin", "admin", "hr_manager"]);

  useEffect(() => {
    if (!canManageUsers) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canManageUsers, router]);

  // ============================================================
  // API FETCHERS
  // ============================================================
  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get("/users");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    }
  }, []);

  const fetchDepartments = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  }, []);

  const fetchRoles = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get("/roles");
      if (response.data.success) {
        setAllRoles(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchDepartments(), fetchRoles()]);
      setLoading(false);
    };
    if (canManageUsers) {
      loadInitialData();
    }
  }, [canManageUsers, fetchUsers, fetchDepartments, fetchRoles]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchDepartments(), fetchRoles()]);
    setRefreshing(false);
    toast.success("Directory synchronized successfully");
  };

  // ============================================================
  // CRUD ACTIONS
  // ============================================================
  const handleCreateUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!createFormData.fullName || !createFormData.email || !createFormData.password || !createFormData.employeeId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        ...createFormData,
        department: createFormData.departmentId || null,
        phoneNumber: createFormData.phoneNumber || null,
      };

      const response = await api.post("/auth/admin/create-user", payload);
      if (response.data.success) {
        toast.success("User account created successfully");
        setShowCreateModal(false);
        setCreateFormData({ fullName: "", email: "", password: "", employeeId: "", role: "employee", departmentId: "", phoneNumber: "" });
        await fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create user account");
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (userItem: User): void => {
    setEditingUser(userItem);
    const deptId = (userItem.department as any)?._id || (userItem.departmentId as any)?._id || userItem.department || userItem.departmentId || "";
    setEditFormData({
      fullName: userItem.fullName,
      email: userItem.email,
      phoneNumber: userItem.phoneNumber || "",
      role: userItem.role,
      departmentId: typeof deptId === "string" ? deptId : deptId?._id || "",
      employeeId: userItem.employeeId,
      isActive: userItem.isActive,
      position: userItem.position || "",
      location: userItem.location || "",
      bio: userItem.bio || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingUser) return;

    setEditing(true);
    try {
      const response = await api.put(`/users/${editingUser._id}`, {
        ...editFormData,
        department: editFormData.departmentId || null,
      });

      if (response.data.success) {
        toast.success("User profile updated successfully");
        setShowEditModal(false);
        setEditingUser(null);
        await fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User profile deleted");
      await fetchUsers();
      setShowDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean): Promise<void> => {
    try {
      await api.put(`/users/${userId}`, { isActive: !currentStatus });
      toast.success(`Account status updated to ${!currentStatus ? "Active" : "Inactive"}`);
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleChangePassword = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.post(`/users/${selectedUser._id}/change-password`, { newPassword: passwordData.newPassword });
      if (response.data.success) {
        toast.success(`Password successfully updated for ${selectedUser.fullName}`);
        setShowPasswordModal(false);
        setSelectedUser(null);
        setPasswordData({ newPassword: "", confirmPassword: "" });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenMultiRoleModal = (userItem: User): void => {
    setSelectedUser(userItem);
    const userRoles = userItem.roles?.map((r) => r._id) || [];
    setSelectedRolesForUser(userRoles);
    const primaryRole = allRoles.find((r) => r.code.toLowerCase() === userItem.role);
    setPrimaryRoleForUser(primaryRole?._id || userRoles[0] || "");
    setShowMultiRoleModal(true);
  };

  const handleUpdateUserRoles = async (): Promise<void> => {
    if (!selectedUser || selectedRolesForUser.length === 0) {
      toast.error("User must retain at least one assigned role");
      return;
    }

    setUpdatingRoles(true);
    try {
      const response = await api.put(`/roles/user/${selectedUser._id}/assign`, {
        roleIds: selectedRolesForUser,
        primaryRoleId: primaryRoleForUser || selectedRolesForUser[0],
      });

      if (response.data.success) {
        toast.success("Security clearance roles updated");
        setShowMultiRoleModal(false);
        setSelectedUser(null);
        await fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update roles");
    } finally {
      setUpdatingRoles(false);
    }
  };

  // ============================================================
  // HELPERS & MEMOIZED LISTS
  // ============================================================
  const handleSort = (field: keyof User): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getDepartmentName = (userItem: User): string => {
    if (userItem.department && typeof userItem.department === "object" && "name" in userItem.department) {
      return userItem.department.name;
    }
    if (userItem.departmentId && typeof userItem.departmentId === "object" && "name" in userItem.departmentId) {
      return userItem.departmentId.name;
    }
    return "Unassigned";
  };

  const filteredUsers = useMemo(() => {
    let filtered = users.filter((u) => {
      const matchesSearch =
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

      const userRoles = u.roles ? u.roles.map((r) => r.code.toLowerCase()) : [u.role];
      const matchesRole = !selectedRole || userRoles.includes(selectedRole);

      const userDeptId = (u.department as any)?._id || (u.departmentId as any)?._id || u.department || u.departmentId;
      const matchesDepartment = !selectedDepartment || (userDeptId && String(userDeptId) === selectedDepartment);

      const matchesStatus = showStatus === "all" || (showStatus === "active" && u.isActive) || (showStatus === "inactive" && !u.isActive);

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    });

    filtered.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [users, searchTerm, selectedRole, selectedDepartment, showStatus, sortField, sortDirection]);

  const totalActive = useMemo(() => users.filter((u) => u.isActive).length, [users]);
  const totalInactive = useMemo(() => users.filter((u) => !u.isActive).length, [users]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (!canManageUsers) return null;

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
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">User Directory</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {users.length}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Manage workforce accounts, administrative clearance roles, and departments.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canCreateUser && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
              >
                <UserPlus size={16} /> Add Account
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs cursor-pointer"
              title="Refresh Directory"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-indigo-600" : ""} />
            </button>
          </div>
        </motion.div>

        {/* Analytics Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Workforce", val: users.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Active Accounts", val: totalActive, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Deactivated", val: totalInactive, icon: UserX, color: "text-rose-600", bg: "bg-rose-50" },
            { label: "Divisions", val: departments.length, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
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

        {/* Search & Filter Controls Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, corporate email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="">All Divisions</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>

            <select
              value={showStatus}
              onChange={(e) => setShowStatus(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-700 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={() => { setSearchTerm(""); setSelectedRole(""); setSelectedDepartment(""); setShowStatus("all"); }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-400">Loading directory records...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">
                      <button onClick={() => handleSort("fullName")} className="flex items-center gap-1 hover:text-slate-700 cursor-pointer">
                        Employee Details <ArrowUpDown size={12} />
                      </button>
                    </th>
                    <th className="px-6 py-4">Security Roles</th>
                    <th className="px-6 py-4">Division</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {currentUsers.map((userItem, index) => {
                    const userRoles = userItem.roles || [];

                    return (
                      <motion.tr
                        key={userItem._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-slate-50/50 transition"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                              {userItem.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-0.5">
                              <p className="font-bold text-slate-900 text-sm">{userItem.fullName}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                <span className="flex items-center gap-1"><Mail size={11} /> {userItem.email}</span>
                                <span>•</span>
                                <span>ID: {userItem.employeeId}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {userRoles.length > 0 ? (
                              userRoles.map((r) => (
                                <span key={r._id} className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${ROLE_BADGE_COLORS[r.code.toLowerCase()] || ROLE_BADGE_COLORS.employee}`}>
                                  {r.name}
                                </span>
                              ))
                            ) : (
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${ROLE_BADGE_COLORS[userItem.role] || ROLE_BADGE_COLORS.employee}`}>
                                {userItem.role.replace(/_/g, " ").toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">{getDepartmentName(userItem)}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(userItem._id, userItem.isActive)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${userItem.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                          >
                            {userItem.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {userItem.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                          {userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleDateString() : "Never"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedUser(userItem); setShowViewModal(true); }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                              title="View Profile"
                            >
                              <Eye size={15} />
                            </button>
                            {canChangeRole && (
                              <button
                                onClick={() => handleOpenMultiRoleModal(userItem)}
                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                                title="Manage Roles"
                              >
                                <Layers size={15} />
                              </button>
                            )}
                            {canEditUser && (
                              <button
                                onClick={() => handleEditUser(userItem)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                                title="Edit Account"
                              >
                                <Edit2 size={15} />
                              </button>
                            )}
                            {canChangePassword && (
                              <button
                                onClick={() => { setSelectedUser(userItem); setShowPasswordModal(true); }}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                title="Change Password"
                              >
                                <Key size={15} />
                              </button>
                            )}
                            {canDeleteUser && userItem._id !== user?._id && (
                              <button
                                onClick={() => setShowDeleteConfirm(userItem._id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                title="Delete Account"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs">No users matched your search filters.</div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-xs font-medium text-slate-500">
                <span>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition shadow-xs cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-3 py-1 font-bold text-slate-700">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition shadow-xs cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============================================================
          MODALS SECTION (Create, View, Edit, Password, Roles, Delete)
          ============================================================ */}

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add New User</h2>
                  <p className="text-xs text-slate-500 font-medium">Create a new organizational user account</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={createFormData.fullName}
                    onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={createFormData.employeeId}
                    onChange={(e) => setCreateFormData({ ...createFormData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white outline-none transition"
                    placeholder="EMP-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Initial Role</label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Division Department</label>
                  <select
                    value={createFormData.departmentId}
                    onChange={(e) => setCreateFormData({ ...createFormData, departmentId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {creating && <Loader2 size={16} className="animate-spin" />} Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Edit User Account</h2>
                  <p className="text-xs text-slate-500 font-medium">Modify account profile and credentials</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.employeeId}
                    onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Primary Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none cursor-pointer"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Department</label>
                  <select
                    value={editFormData.departmentId}
                    onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold outline-none cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={editing}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {editing && <Loader2 size={16} className="animate-spin" />} Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Change Credentials</h2>
                  <p className="text-xs text-slate-500 font-medium">Update password for {selectedUser.fullName}</p>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 outline-none"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 outline-none"
                    placeholder="Re-enter password"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={changingPassword || passwordData.newPassword !== passwordData.confirmPassword}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-amber-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {changingPassword && <Loader2 size={16} className="animate-spin" />} Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Multi-Role Management Modal */}
      <AnimatePresence>
        {showMultiRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Security Clearance Roles</h2>
                  <p className="text-xs text-slate-500 font-medium">Assign multi-role clearances for {selectedUser.fullName}</p>
                </div>
                <button onClick={() => setShowMultiRoleModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  {allRoles.map((role) => {
                    const isSelected = selectedRolesForUser.includes(role._id);
                    return (
                      <label
                        key={role._id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${isSelected ? "bg-indigo-50/60 border-indigo-300 shadow-xs" : "bg-white border-slate-200/80 hover:border-slate-300"
                          }`}
                        onClick={() => {
                          setSelectedRolesForUser((prev) =>
                            prev.includes(role._id) ? prev.filter((id) => id !== role._id) : [...prev, role._id]
                          );
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{role.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{role.code} • Level {role.level}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleUpdateUserRoles}
                    disabled={updatingRoles || selectedRolesForUser.length === 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {updatingRoles && <Loader2 size={16} className="animate-spin" />} Save Clearances
                  </button>
                  <button
                    onClick={() => setShowMultiRoleModal(false)}
                    className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View User Modal */}
      <AnimatePresence>
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedUser.fullName}</h2>
                    <p className="text-xs text-slate-400 font-mono">ID: {selectedUser.employeeId}</p>
                  </div>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs font-medium text-slate-600">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div><span>Email:</span><p className="font-bold text-slate-900">{selectedUser.email}</p></div>
                  <div><span>Phone:</span><p className="font-bold text-slate-900">{selectedUser.phoneNumber || "N/A"}</p></div>
                  <div><span>Division:</span><p className="font-bold text-slate-900">{getDepartmentName(selectedUser)}</p></div>
                  <div><span>Status:</span><p className="font-bold text-emerald-600">{selectedUser.isActive ? "Active Account" : "Inactive"}</p></div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => { setShowViewModal(false); handleEditUser(selectedUser); }}
                    className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
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
                <h2 className="text-lg font-bold text-slate-900">Delete User Account?</h2>
                <p className="text-slate-500 text-sm">This action is permanent and will completely remove the user from the organization directory.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-rose-600/20 text-sm cursor-pointer"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}