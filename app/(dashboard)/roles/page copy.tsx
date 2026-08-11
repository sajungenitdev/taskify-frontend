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
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  Lock,
  Search,
  RefreshCw,
  Grid,
  List,
  Edit2,
  UserX,
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
}

// Predefined permanent roles
const PERMANENT_ROLES = [
  {
    name: "Super Admin",
    code: "SUPER_ADMIN",
    description: "Full system access with all permissions",
    level: 100,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Admin",
    code: "ADMIN",
    description: "Administrative access with limited system control",
    level: 90,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "HR Manager",
    code: "HR_MANAGER",
    description: "Human resources management access",
    level: 80,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Department Manager",
    code: "DEPT_MANAGER",
    description: "Department-level management access",
    level: 70,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Project Manager",
    code: "PROJECT_MANAGER",
    description: "Project-specific management access",
    level: 65,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Line Manager",
    code: "LINE_MANAGER",
    description: "Team management access",
    level: 60,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Employee",
    code: "EMPLOYEE",
    description: "Basic user access",
    level: 10,
    isSystemRole: true,
    isPermanent: true,
  },
];

export default function RolesPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Role | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [searchRoleTerm, setSearchRoleTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [creatingRole, setCreatingRole] = useState(false);
  const [deletingRole, setDeletingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: "",
    code: "",
    description: "",
    level: 50,
    permissions: [] as string[],
  });

  const canManageRoles = hasRole(["super_admin", "admin"]);

  useEffect(() => {
    if (!canManageRoles) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canManageRoles, router]);

  useEffect(() => {
    initializeRoles();
    fetchUsers();
  }, []);

  const initializeRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/roles");
      if (response.data.success && response.data.data.length > 0) {
        const existingRoleCodes = response.data.data.map((r: Role) => r.code);
        const missingRoles = PERMANENT_ROLES.filter(
          (pr) => !existingRoleCodes.includes(pr.code),
        );

        if (missingRoles.length > 0) {
          for (const role of missingRoles) {
            await api.post("/roles", role);
          }
          toast.success(`${missingRoles.length} permanent roles added`);
        }
        setRoles(response.data.data);
        if (response.data.data.length > 0 && !selectedRole) {
          setSelectedRole(response.data.data[0]._id);
        }
      } else {
        for (const role of PERMANENT_ROLES) {
          await api.post("/roles", role);
        }
        const freshResponse = await api.get("/roles");
        setRoles(freshResponse.data.data);
        toast.success("Permanent system roles created");
      }
    } catch (error: any) {
      console.error("Error initializing roles:", error);
      const localRoles = PERMANENT_ROLES.map((role, index) => ({
        ...role,
        _id: `temp_${index}`,
        permissions: [],
        userCount: 0,
        createdAt: new Date().toISOString(),
      }));
      setRoles(localRoles);
      toast.error("Using local role data. API connection issue.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.code) {
      toast.error("Role name and code are required");
      return;
    }

    setCreatingRole(true);
    try {
      const response = await api.post("/roles", newRole);
      if (response.data.success) {
        toast.success(`Role "${newRole.name}" created successfully`);
        setShowCreateModal(false);
        setNewRole({
          name: "",
          code: "",
          description: "",
          level: 50,
          permissions: [],
        });
        initializeRoles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create role");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await api.put(`/roles/${editingRole._id}`, {
        name: editingRole.name,
        description: editingRole.description,
        level: editingRole.level,
      });
      if (response.data.success) {
        toast.success("Role updated successfully");
        setShowEditModal(false);
        setEditingRole(null);
        initializeRoles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteRole = async () => {
    if (!showDeleteConfirm) return;
    if (deleteConfirmName !== showDeleteConfirm.name) {
      toast.error(
        `Please type "${showDeleteConfirm.name}" to confirm deletion`,
      );
      return;
    }

    setDeletingRole(true);
    try {
      const response = await api.delete(`/roles/${showDeleteConfirm._id}`);
      if (response.data.success) {
        toast.success(`Role "${showDeleteConfirm.name}" deleted successfully`);
        setShowDeleteConfirm(null);
        setDeleteConfirmName("");
        initializeRoles();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete role");
    } finally {
      setDeletingRole(false);
    }
  };

  const getUsersByRole = (roleCode: string) => {
    return users.filter((u) => {
      if (u.roles) {
        return u.roles.some((r) => r.code === roleCode);
      }
      return u.role === roleCode.toLowerCase();
    });
  };

  const getUserRoleNames = (user: User): string => {
    if (user.roles && user.roles.length > 0) {
      return user.roles.map((r) => r.name).join(", ");
    }
    return user.role || "No role";
  };

  const rolesWithCounts = useMemo(() => {
    return roles.map((role) => ({
      ...role,
      userCount: getUsersByRole(role.code).length,
    }));
  }, [roles, users]);

  const selectedRoleData = rolesWithCounts.find((r) => r._id === selectedRole);

  const filteredRoles = rolesWithCounts.filter(
    (role) =>
      role.name.toLowerCase().includes(searchRoleTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchRoleTerm.toLowerCase()),
  );

  const stats = {
    totalRoles: rolesWithCounts.length,
    permanentRoles: rolesWithCounts.filter((r) => r.isPermanent).length,
    customRoles: rolesWithCounts.filter((r) => !r.isPermanent).length,
    totalUsers: users.length,
    totalAssignments: users.filter((u) => u.roles && u.roles.length > 0).length,
  };

  const getRoleIcon = (roleName: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      "Super Admin": <Crown className="w-5 h-5" />,
      Admin: <Shield className="w-5 h-5" />,
      "HR Manager": <Users className="w-5 h-5" />,
      "Department Manager": <Building2 className="w-5 h-5" />,
      "Project Manager": <Briefcase className="w-5 h-5" />,
      "Line Manager": <UserCheck className="w-5 h-5" />,
      Employee: <Users className="w-5 h-5" />,
    };
    return icons[roleName] || <Shield className="w-5 h-5" />;
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

  const getRoleBorderColor = (roleName: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "border-purple-200",
      Admin: "border-red-200",
      "HR Manager": "border-pink-200",
      "Department Manager": "border-orange-200",
      "Project Manager": "border-cyan-200",
      "Line Manager": "border-green-200",
      Employee: "border-gray-200",
    };
    return colors[roleName] || "border-indigo-200";
  };

  if (!canManageRoles) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading roles...</p>
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
                <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Role Management
                </h1>
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {stats.totalRoles}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Manage system roles and permissions
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
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm rounded-xl flex items-center gap-2 transition shadow-md shadow-emerald-500/20"
              >
                <Plus size={16} />
                Create Role
              </button>
              <button
                onClick={initializeRoles}
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
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-gray-800">
                {stats.totalRoles}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total Roles</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-amber-600">
                {stats.permanentRoles}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Permanent Roles</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">
                {stats.customRoles}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Custom Roles</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-cyan-600">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
            </div>
          </motion.div>

          {/* Role Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles by name or code..."
              value={searchRoleTerm}
              onChange={(e) => setSearchRoleTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition shadow-sm"
            />
          </motion.div>

          {/* Role Cards - Grid View */}
          {viewMode === "grid" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {filteredRoles.map((role, index) => (
                <motion.div
                  key={role._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedRole(role._id)}
                  className={`cursor-pointer rounded-2xl border transition-all duration-300 ${
                    selectedRole === role._id
                      ? `bg-white border-indigo-300 shadow-lg shadow-indigo-100 scale-[1.02]`
                      : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-[1.01]"
                  } overflow-hidden group shadow-sm`}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`p-3 rounded-xl ${getRoleBgColor(role.name)} border ${getRoleBorderColor(role.name)}`}
                      >
                        <div className={getRoleColor(role.name)}>
                          {getRoleIcon(role.name)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {role.isPermanent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            Permanent
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {role.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {role.description || "No description"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2 font-mono">
                      {role.code}
                    </p>
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {role.userCount || 0} users
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <div className="flex items-center gap-1">
                        <Lock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          Level {role.level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!role.isPermanent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(role);
                            setDeleteConfirmName("");
                          }}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <ChevronRight
                        size={16}
                        className={`text-gray-400 transition-transform duration-300 ${
                          selectedRole === role._id
                            ? "translate-x-1 text-indigo-600"
                            : "group-hover:translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
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
                        Role
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRoles.map((role) => (
                      <tr
                        key={role._id}
                        className="hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => setSelectedRole(role._id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1.5 rounded-lg ${getRoleBgColor(role.name)}`}
                            >
                              <div className={getRoleColor(role.name)}>
                                {getRoleIcon(role.name)}
                              </div>
                            </div>
                            <span className="text-gray-800 font-medium">
                              {role.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-500">
                          {role.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">
                          {role.description?.substring(0, 60)}
                          {role.description &&
                            role.description.length > 60 &&
                            "..."}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-800 font-medium">
                          {role.level}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700">
                          {role.userCount || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {role.isPermanent ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                              Permanent
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                              Custom
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRole(role);
                                setShowEditModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <Edit2 size={14} />
                            </button>
                            {!role.isPermanent && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(role);
                                  setDeleteConfirmName("");
                                }}
                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Selected Role Details */}
          {selectedRoleData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`bg-white rounded-2xl border ${getRoleBorderColor(selectedRoleData.name)} shadow-sm overflow-hidden`}
            >
              <div className={`p-6 ${getRoleBgColor(selectedRoleData.name)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-xl ${getRoleBgColor(selectedRoleData.name)} border ${getRoleBorderColor(selectedRoleData.name)}`}
                    >
                      <div className={getRoleColor(selectedRoleData.name)}>
                        {getRoleIcon(selectedRoleData.name)}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-800">
                          {selectedRoleData.name}
                        </h2>
                        {selectedRoleData.isPermanent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                            Permanent
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">
                        {selectedRoleData.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-600 font-medium">
                      Level {selectedRoleData.level}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200 font-mono text-gray-500">
                      {selectedRoleData.code}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users size={14} className="text-indigo-500" />
                  Users with this role ({selectedRoleData.userCount || 0})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {getUsersByRole(selectedRoleData.code).map((user) => (
                    <Link
                      key={user._id}
                      href={`/users/${user._id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs font-bold">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-800 text-sm font-medium">
                            {user.fullName}
                          </p>
                          <p className="text-gray-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                          {getUserRoleNames(user)}
                        </span>
                        <Eye
                          size={14}
                          className="text-gray-400 opacity-0 group-hover:opacity-100 transition"
                        />
                      </div>
                    </Link>
                  ))}
                  {getUsersByRole(selectedRoleData.code).length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                      <UserX size={32} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm font-medium">
                        No users assigned to this role
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Role Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-linear-to-r from-rose-50 to-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Delete Role
                    </h2>
                    <p className="text-xs text-gray-500">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(null);
                    setDeleteConfirmName("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-rose-700 font-medium">
                        Warning: Permanent Action
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        You are about to delete the role{" "}
                        <span className="text-gray-800 font-semibold">
                          "{showDeleteConfirm.name}"
                        </span>
                        .
                        {showDeleteConfirm.userCount &&
                          showDeleteConfirm.userCount > 0 && (
                            <span className="block mt-1 text-amber-600">
                              ⚠️ {showDeleteConfirm.userCount} user(s) currently
                              have this role. They will lose these permissions.
                            </span>
                          )}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Type{" "}
                    <span className="text-rose-600 font-mono">
                      {showDeleteConfirm.name}
                    </span>{" "}
                    to confirm deletion:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={`Type "${showDeleteConfirm.name}" here...`}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none font-mono transition"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleDeleteRole}
                    disabled={
                      deletingRole ||
                      deleteConfirmName !== showDeleteConfirm.name
                    }
                    className="flex-1 bg-linear-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {deletingRole ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Delete Permanently"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(null);
                      setDeleteConfirmName("");
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

      {/* Create Role Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-linear-to-r from-emerald-50 to-teal-50">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Create New Role
                  </h2>
                  <p className="text-xs text-gray-500">
                    Define a new custom role
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                    placeholder="e.g., Team Lead"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRole.code}
                    onChange={(e) =>
                      setNewRole({
                        ...newRole,
                        code: e.target.value.toUpperCase().replace(/\s/g, "_"),
                      })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition font-mono"
                    placeholder="e.g., TEAM_LEAD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none resize-none transition"
                    placeholder="Describe the role responsibilities..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Access Level (1-100)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={newRole.level}
                    onChange={(e) =>
                      setNewRole({
                        ...newRole,
                        level: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low Access</span>
                    <span className="text-emerald-600 font-medium">
                      Level {newRole.level}
                    </span>
                    <span>Full Access</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateRole}
                    disabled={creatingRole}
                    className="flex-1 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {creatingRole ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Create Role"
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
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

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditModal && editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Edit Role
                  </h2>
                  <p className="text-xs text-gray-500">
                    Update role information
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) =>
                      setEditingRole({ ...editingRole, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editingRole.description}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Access Level (1-100)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={editingRole.level}
                    onChange={(e) =>
                      setEditingRole({
                        ...editingRole,
                        level: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Low Access</span>
                    <span className="text-indigo-600 font-medium">
                      Level {editingRole.level}
                    </span>
                    <span>Full Access</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateRole}
                    className="flex-1 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-lg transition shadow-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
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
