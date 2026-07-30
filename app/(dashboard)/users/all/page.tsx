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
  Save,
  Key,
  Lock,
  EyeOff,
  Eye as EyeIcon,
  Layers,
  Plus,
  Minus,
  Info,
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
  isSystemRole: boolean;
  isPermanent?: boolean;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  phoneNumber?: string;
  role: string; // Legacy single role
  roles?: Role[]; // New multi-role support
  department?:
    | {
        _id: string;
        name: string;
        code: string;
      }
    | string
    | null;
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

export default function AllUsersPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    employeeId: "",
    role: "employee",
    departmentId: "",
    phoneNumber: "",
  });
  const [editFormData, setEditFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    role: "",
    departmentId: "",
    employeeId: "",
    isActive: true,
    position: "",
    location: "",
    bio: "",
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState<keyof User>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showMultiRoleModal, setShowMultiRoleModal] = useState<string | null>(
    null,
  );
  const [selectedRolesForUser, setSelectedRolesForUser] = useState<string[]>(
    [],
  );
  const [primaryRoleForUser, setPrimaryRoleForUser] = useState<string>("");
  const [updatingRoles, setUpdatingRoles] = useState(false);

  const canManageUsers = hasRole(["super_admin", "admin", "hr_manager"]);
  const canChangeRole = hasRole(["super_admin"]);
  const canDeleteUser = hasRole(["super_admin"]);
  const canCreateUser = hasRole(["super_admin", "admin", "hr_manager"]);
  const canEditUser = hasRole(["super_admin", "admin", "hr_manager"]);
  const canChangePassword = hasRole(["super_admin", "admin", "hr_manager"]);
  console.log(users, "users");
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

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await api.get("/roles");
      if (response.data.success) {
        setAllRoles(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
  }, [fetchUsers, fetchDepartments, fetchRoles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchDepartments(), fetchRoles()]);
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  // ============ MULTI-ROLE HANDLING ============
  const handleOpenMultiRoleModal = (userItem: User) => {
    setSelectedUser(userItem);
    const userRoles = userItem.roles?.map((r) => r._id) || [];
    setSelectedRolesForUser(userRoles);
    // Find primary role (legacy role)
    const primaryRole = allRoles.find(
      (r) => r.code.toLowerCase() === userItem.role,
    );
    setPrimaryRoleForUser(primaryRole?._id || userRoles[0] || "");
    setShowMultiRoleModal(userItem._id);
  };

  const handleToggleRoleSelection = (roleId: string) => {
    setSelectedRolesForUser((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleUpdateUserRoles = async () => {
    if (!selectedUser) return;

    if (selectedRolesForUser.length === 0) {
      toast.error("User must have at least one role");
      return;
    }

    setUpdatingRoles(true);
    try {
      const response = await api.put(`/roles/user/${selectedUser._id}/assign`, {
        roleIds: selectedRolesForUser,
        primaryRoleId: primaryRoleForUser || selectedRolesForUser[0],
      });

      if (response.data.success) {
        toast.success("Roles updated successfully");
        setShowMultiRoleModal(null);
        setSelectedUser(null);
        setSelectedRolesForUser([]);
        setPrimaryRoleForUser("");
        await fetchUsers();
      }
    } catch (error: any) {
      console.error("Error updating roles:", error);
      toast.error(error.response?.data?.message || "Failed to update roles");
    } finally {
      setUpdatingRoles(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createFormData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setCreating(true);
    try {
      // Prepare the data - match what the backend expects
      const userData = {
        fullName: createFormData.fullName,
        email: createFormData.email,
        password: createFormData.password,
        employeeId: createFormData.employeeId,
        role: createFormData.role || "employee",
        department: createFormData.departmentId || null,
        phoneNumber: createFormData.phoneNumber || null,
      };

      console.log("📝 Creating user with data:", userData);

      const response = await api.post("/auth/register", userData);

      console.log("📡 Response:", response.data);

      if (response.data.success) {
        toast.success("User created successfully");
        setShowCreateModal(false);
        // Reset form
        setCreateFormData({
          fullName: "",
          email: "",
          password: "",
          employeeId: "",
          role: "employee",
          departmentId: "",
          phoneNumber: "",
        });
        // Refresh the user list
        await fetchUsers();
      } else {
        throw new Error(response.data.message || "Failed to create user");
      }
    } catch (error: any) {
      console.error("❌ Create user error:", error);

      // Extract error message
      let errorMessage = "Failed to create user";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (userItem: User) => {
    setEditingUser(userItem);
    // Get department ID from either field
    const deptId =
      (userItem.department as any)?._id ||
      (userItem.departmentId as any)?._id ||
      userItem.department ||
      userItem.departmentId ||
      "";

    setEditFormData({
      fullName: userItem.fullName,
      email: userItem.email,
      phoneNumber: userItem.phoneNumber || "",
      role: userItem.role,
      departmentId: typeof deptId === "string" ? deptId : deptId?._id || "",
      employeeId: userItem.employeeId,
      isActive: userItem.isActive,
      position: (userItem as any).position || "",
      location: (userItem as any).location || "",
      bio: (userItem as any).bio || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (
      !editFormData.fullName ||
      !editFormData.email ||
      !editFormData.employeeId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setEditing(true);
    try {
      // Use 'department' instead of 'departmentId' to match backend
      const response = await api.put(`/auth/users/${editingUser._id}`, {
        fullName: editFormData.fullName,
        email: editFormData.email,
        phoneNumber: editFormData.phoneNumber,
        role: editFormData.role,
        department: editFormData.departmentId || null, // ← Changed to 'department'
        employeeId: editFormData.employeeId,
        isActive: editFormData.isActive,
        position: editFormData.position,
        location: editFormData.location,
        bio: editFormData.bio,
      });
      if (response.data.success) {
        toast.success("User updated successfully");
        setShowEditModal(false);
        setEditingUser(null);
        await fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setEditing(false);
    }
  };
  const handleOpenPasswordModal = (userItem: User) => {
    setSelectedUser(userItem);
    setPasswordData({
      newPassword: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

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
      const response = await api.post(
        `/auth/users/${selectedUser._id}/change-password`,
        {
          newPassword: passwordData.newPassword,
        },
      );
      if (response.data.success) {
        toast.success(
          `Password changed successfully for ${selectedUser.fullName}`,
        );
        setShowPasswordModal(false);
        setSelectedUser(null);
        setPasswordData({
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleViewUser = (userItem: User) => {
    setSelectedUser(userItem);
    setShowViewModal(true);
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

  // Get user's display roles (combine legacy role + roles array)
  const getUserDisplayRoles = (userItem: User): string => {
    if (userItem.roles && userItem.roles.length > 0) {
      return userItem.roles.map((r) => r.name).join(", ");
    }
    return userItem.role.replace(/_/g, " ") || "No Role";
  };

  const getUserRoleCodes = (userItem: User): string[] => {
    if (userItem.roles && userItem.roles.length > 0) {
      return userItem.roles.map((r) => r.code.toLowerCase());
    }
    return [userItem.role];
  };
  const filteredUsers = useMemo(() => {
    let filtered = users.filter((userItem) => {
      const matchesSearch =
        userItem.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

      const userRoles = getUserRoleCodes(userItem);
      const matchesRole = !selectedRole || userRoles.includes(selectedRole);

      // Check both department and departmentId
      const userDeptId =
        (userItem.department as any)?._id ||
        (userItem.departmentId as any)?._id ||
        userItem.department ||
        userItem.departmentId;
      const matchesDepartment =
        !selectedDepartment ||
        (userDeptId && userDeptId === selectedDepartment);

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
                        <button className="flex items-center gap-1 hover:text-gray-700">
                          Roles
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
                      const userRoles = userItem.roles || [];
                      const hasMultipleRoles = userRoles.length > 1;

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
                            <div className="flex flex-wrap gap-1">
                              {userRoles.length > 0 ? (
                                userRoles.slice(0, 2).map((role) => (
                                  <span
                                    key={role._id}
                                    className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getRoleBadgeColor(role.code.toLowerCase())}`}
                                  >
                                    {role.code.replace(/_/g, " ")}
                                  </span>
                                ))
                              ) : (
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getRoleBadgeColor(userItem.role)}`}
                                >
                                  {userItem.role.replace(/_/g, " ")}
                                </span>
                              )}
                              {userRoles.length > 2 && (
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full border bg-gray-100 text-gray-600">
                                  +{userRoles.length - 2}
                                </span>
                              )}
                              {hasMultipleRoles && (
                                <span className="px-1.5 py-0.5 text-[8px] font-medium rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600">
                                  Multi
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {(() => {
                                // Check if department exists and is an object with name
                                if (
                                  userItem.department &&
                                  typeof userItem.department === "object"
                                ) {
                                  // If it has a name property
                                  if ("name" in userItem.department) {
                                    return userItem.department.name;
                                  }
                                  // If it has a _id but no name (unlikely)
                                  if ("_id" in userItem.department) {
                                    return "Department";
                                  }
                                }
                                // Fallback to departmentId (for backward compatibility)
                                if (
                                  userItem.departmentId &&
                                  typeof userItem.departmentId === "object"
                                ) {
                                  if ("name" in userItem.departmentId) {
                                    return userItem.departmentId.name;
                                  }
                                }
                                return "-";
                              })()}
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
                              <button
                                onClick={() => handleViewUser(userItem)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="View User"
                              >
                                <Eye size={16} />
                              </button>
                              {canChangeRole && (
                                <button
                                  onClick={() =>
                                    handleOpenMultiRoleModal(userItem)
                                  }
                                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                  title="Manage Roles"
                                >
                                  <Layers size={16} />
                                </button>
                              )}
                              {canEditUser && (
                                <button
                                  onClick={() => handleEditUser(userItem)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="Edit User"
                                >
                                  <Edit2 size={16} />
                                </button>
                              )}
                              {canChangePassword && (
                                <button
                                  onClick={() =>
                                    handleOpenPasswordModal(userItem)
                                  }
                                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Change Password"
                                >
                                  <Key size={16} />
                                </button>
                              )}
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

      {/* ============ MULTI-ROLE MANAGEMENT MODAL ============ */}
      {showMultiRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Manage Roles
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedUser.fullName} - Select multiple roles
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMultiRoleModal(null);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Select Roles <span className="text-rose-500">*</span>
                </p>
                <div className="space-y-1 border border-gray-200 rounded-lg p-2">
                  {allRoles.map((role) => {
                    const isSelected = selectedRolesForUser.includes(role._id);
                    return (
                      <label
                        key={role._id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? "bg-indigo-50 hover:bg-indigo-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRoleSelection(role._id)}
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
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400">
                  {selectedRolesForUser.length} role(s) selected
                </p>
              </div>

              {selectedRolesForUser.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Primary Role
                    <span className="text-xs text-gray-400 ml-2">
                      (Default: first selected)
                    </span>
                  </p>
                  <select
                    value={primaryRoleForUser}
                    onChange={(e) => setPrimaryRoleForUser(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  >
                    {selectedRolesForUser.map((roleId) => {
                      const role = allRoles.find((r) => r._id === roleId);
                      return role ? (
                        <option key={roleId} value={roleId}>
                          {role.name} (Level {role.level})
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info
                    size={14}
                    className="text-blue-500 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-xs text-gray-600 font-medium">
                      Multiple Roles Support
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Users can have multiple roles. The primary role determines
                      the main role displayed in the UI.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleUpdateUserRoles}
                  disabled={updatingRoles || selectedRolesForUser.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {updatingRoles ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Roles
                </button>
                <button
                  onClick={() => {
                    setShowMultiRoleModal(null);
                    setSelectedUser(null);
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

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Edit User
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleUpdateUser}
              className="p-5 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
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
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      email: e.target.value,
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
                  value={editFormData.employeeId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      employeeId: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editFormData.phoneNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
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
                  value={editFormData.departmentId}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
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
                  Position
                </label>
                <input
                  type="text"
                  value={editFormData.position}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      position: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  placeholder="e.g. Senior Developer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      location: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  placeholder="e.g. New York, USA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={editFormData.isActive === true}
                      onChange={() =>
                        setEditFormData({ ...editFormData, isActive: true })
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={editFormData.isActive === false}
                      onChange={() =>
                        setEditFormData({ ...editFormData, isActive: false })
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editFormData.bio}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      bio: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition resize-none"
                  placeholder="Brief description about the user"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={editing}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                >
                  {editing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editing ? "Saving..." : "Update User"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
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

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  User Details
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* User Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white text-2xl font-bold">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedUser.fullName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(selectedUser.role)}`}
                    >
                      {selectedUser.role.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                        selectedUser.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {selectedUser.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-gray-400">
                      ID: {selectedUser.employeeId}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {selectedUser.email}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {selectedUser.phoneNumber || "Not provided"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {selectedUser.departmentId
                      ? (selectedUser.departmentId as any).name
                      : "Not assigned"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Position</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {(selectedUser as any).position || "Not specified"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {(selectedUser as any).location || "Not specified"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Last Login</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {selectedUser.lastLogin
                      ? new Date(selectedUser.lastLogin).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {(selectedUser as any).bio && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Bio</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {(selectedUser as any).bio}
                  </p>
                </div>
              )}

              {/* Created/Updated Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-500">Account Info</p>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>
                    Created:{" "}
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </span>
                  {selectedUser.updatedAt && (
                    <span>
                      Updated:{" "}
                      {new Date(selectedUser.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {canEditUser && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEditUser(selectedUser);
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit User
                  </button>
                )}
                {canChangePassword && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleOpenPasswordModal(selectedUser);
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <Key size={16} />
                    Change Password
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Change Password
                  </h2>
                  <p className="text-xs text-gray-500">
                    For {selectedUser.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                  setPasswordData({
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition pr-10"
                    placeholder="Enter new password (min 8 characters)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <EyeIcon size={18} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition pr-10"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              {passwordData.newPassword && passwordData.confirmPassword && (
                <div className="flex items-center gap-2">
                  {passwordData.newPassword === passwordData.confirmPassword ? (
                    <CheckCircle size={16} className="text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="text-rose-500" />
                  )}
                  <span
                    className={`text-sm ${passwordData.newPassword === passwordData.confirmPassword ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {passwordData.newPassword === passwordData.confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </span>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Key size={16} />
                  )}
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                    setPasswordData({
                      newPassword: "",
                      confirmPassword: "",
                    });
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
