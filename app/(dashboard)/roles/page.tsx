"use client";

import { useState, useEffect } from "react";
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
}

// Predefined permanent roles
const PERMANENT_ROLES = [
  {
    name: "Super Admin",
    code: "SUPER_ADMIN",
    description:
      "Full system access with all permissions. This is a permanent system role.",
    level: 100,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Admin",
    code: "ADMIN",
    description:
      "Administrative access with limited system control. This is a permanent system role.",
    level: 90,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "HR Manager",
    code: "HR_MANAGER",
    description:
      "Human resources management access. This is a permanent system role.",
    level: 80,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Department Manager",
    code: "DEPT_MANAGER",
    description:
      "Department-level management access. This is a permanent system role.",
    level: 70,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Project Manager",
    code: "PROJECT_MANAGER",
    description:
      "Project-specific management access. This is a permanent system role.",
    level: 65,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Line Manager",
    code: "LINE_MANAGER",
    description: "Team management access. This is a permanent system role.",
    level: 60,
    isSystemRole: true,
    isPermanent: true,
  },
  {
    name: "Employee",
    code: "EMPLOYEE",
    description: "Basic user access. This is a permanent system role.",
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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Role | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRoleForUser, setSelectedRoleForUser] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
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

  const canManageRoles = hasRole(["super_admin"]);

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
        // Check if all permanent roles exist
        const existingRoleCodes = response.data.data.map((r: Role) => r.code);
        const missingRoles = PERMANENT_ROLES.filter(
          (pr) => !existingRoleCodes.includes(pr.code),
        );

        if (missingRoles.length > 0) {
          // Create missing permanent roles
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
        // Create all permanent roles
        for (const role of PERMANENT_ROLES) {
          await api.post("/roles", role);
        }
        const freshResponse = await api.get("/roles");
        setRoles(freshResponse.data.data);
        toast.success("Permanent system roles created");
      }
    } catch (error: any) {
      console.error("Error initializing roles:", error);
      // If API fails, use local roles
      const localRoles = PERMANENT_ROLES.map((role, index) => ({
        ...role,
        _id: `temp_${index}`,
        userCount: 0,
        createdAt: new Date().toISOString(),
      }));
      setRoles(localRoles);
      toast.warning("Using local role data. API connection issue.");
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

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleForUser) {
      toast.error("Please select both user and role");
      return;
    }

    try {
      const selectedRoleData = roles.find((r) => r._id === selectedRoleForUser);
      await api.put(`/auth/users/${selectedUser}/role`, {
        role: selectedRoleData?.code.toLowerCase(),
      });
      toast.success("Role assigned successfully");
      setShowAssignModal(false);
      setSelectedUser("");
      setSelectedRoleForUser("");
      fetchUsers();
      initializeRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign role");
    }
  };

  const getUsersByRole = (roleCode: string) => {
    return users.filter((u) => u.role === roleCode.toLowerCase());
  };

  const updateUserCounts = (rolesList: Role[]) => {
    return rolesList.map((role) => ({
      ...role,
      userCount: getUsersByRole(role.code).length,
    }));
  };

  const rolesWithCounts = updateUserCounts(roles);
  const selectedRoleData = rolesWithCounts.find((r) => r._id === selectedRole);

  const filteredRoles = rolesWithCounts.filter(
    (role) =>
      role.name.toLowerCase().includes(searchRoleTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchRoleTerm.toLowerCase()),
  );

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const stats = {
    totalRoles: rolesWithCounts.length,
    permanentRoles: rolesWithCounts.filter((r) => r.isPermanent).length,
    customRoles: rolesWithCounts.filter((r) => !r.isPermanent).length,
    totalUsers: users.length,
    totalAssignments: users.filter((u) => u.role).length,
  };

  const getRoleIcon = (roleName: string) => {
    const icons: Record<string, JSX.Element> = {
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
      "Super Admin": "text-purple-400",
      Admin: "text-red-400",
      "HR Manager": "text-pink-400",
      "Department Manager": "text-orange-400",
      "Project Manager": "text-cyan-400",
      "Line Manager": "text-green-400",
      Employee: "text-slate-400",
    };
    return colors[roleName] || "text-indigo-400";
  };

  const getRoleBgColor = (roleName: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "bg-purple-500/10",
      Admin: "bg-red-500/10",
      "HR Manager": "bg-pink-500/10",
      "Department Manager": "bg-orange-500/10",
      "Project Manager": "bg-cyan-500/10",
      "Line Manager": "bg-green-500/10",
      Employee: "bg-slate-500/10",
    };
    return colors[roleName] || "bg-indigo-500/10";
  };

  const getRoleBorderColor = (roleName: string) => {
    const colors: Record<string, string> = {
      "Super Admin": "border-purple-500/30",
      Admin: "border-red-500/30",
      "HR Manager": "border-pink-500/30",
      "Department Manager": "border-orange-500/30",
      "Project Manager": "border-cyan-500/30",
      "Line Manager": "border-green-500/30",
      Employee: "border-slate-500/30",
    };
    return colors[roleName] || "border-indigo-500/30";
  };

  if (!canManageRoles) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/admin"
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Admin
                </Link>
                <ChevronRight size={14} className="text-slate-600" />
                <span className="text-white text-sm">Role Management</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Role Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage system roles, permissions, and user assignments
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition text-sm flex items-center gap-2"
              >
                {viewMode === "grid" ? <List size={14} /> : <Grid size={14} />}
                {viewMode === "grid" ? "List View" : "Grid View"}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm rounded-xl flex items-center gap-2"
              >
                <Plus size={16} />
                Create Role
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm rounded-xl flex items-center gap-2"
              >
                <UserPlus size={16} />
                Assign Role
              </button>
              <button
                onClick={initializeRoles}
                className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700 text-white rounded-lg transition"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-2xl font-bold text-white">
                {stats.totalRoles}
              </p>
              <p className="text-xs text-slate-400">Total Roles</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-2xl font-bold text-amber-400">
                {stats.permanentRoles}
              </p>
              <p className="text-xs text-slate-400">Permanent Roles</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-2xl font-bold text-emerald-400">
                {stats.customRoles}
              </p>
              <p className="text-xs text-slate-400">Custom Roles</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-2xl font-bold text-cyan-400">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-slate-400">Total Users</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <p className="text-2xl font-bold text-purple-400">
                {stats.totalAssignments}
              </p>
              <p className="text-xs text-slate-400">Assignments</p>
            </div>
          </div>

          {/* Role Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search roles by name or code..."
              value={searchRoleTerm}
              onChange={(e) => setSearchRoleTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Role Cards - Grid View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredRoles.map((role, index) => (
                <motion.div
                  key={role._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedRole(role._id)}
                  className={`cursor-pointer rounded-2xl border transition-all duration-300 ${
                    selectedRole === role._id
                      ? `${getRoleBgColor(role.name)} ${getRoleBorderColor(role.name)} shadow-lg scale-[1.02]`
                      : "bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:scale-[1.01]"
                  } overflow-hidden group`}
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
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            Permanent
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {role.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {role.description || "No description"}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Code: {role.code}
                    </p>
                  </div>
                  <div className="p-4 border-t border-slate-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-400">
                          {role.userCount || 0} users
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      <div className="flex items-center gap-1">
                        <Lock size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-400">
                          Level {role.level}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(role);
                          setDeleteConfirmName("");
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight
                        size={16}
                        className={`text-slate-500 transition-transform duration-300 ${
                          selectedRole === role._id
                            ? "translate-x-1 text-indigo-400"
                            : "group-hover:translate-x-1"
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // List View
            <div className="bg-slate-900/30 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Code
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Description
                      </th>
                      <th className="text-center px-4 py-3 text-xs text-slate-400">
                        Level
                      </th>
                      <th className="text-center px-4 py-3 text-xs text-slate-400">
                        Users
                      </th>
                      <th className="text-center px-4 py-3 text-xs text-slate-400">
                        Type
                      </th>
                      <th className="text-center px-4 py-3 text-xs text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredRoles.map((role) => (
                      <tr
                        key={role._id}
                        className="hover:bg-slate-800/30 transition cursor-pointer"
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
                            <span className="text-white font-medium">
                              {role.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {role.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-400">
                          {role.description?.substring(0, 50)}...
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-white">
                          {role.level}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-white">
                          {role.userCount || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {role.isPermanent ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                              Permanent
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
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
                              className="p-1 text-slate-500 hover:text-indigo-400 transition"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(role);
                                setDeleteConfirmName("");
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Selected Role Details */}
          {selectedRoleData && (
            <div
              className={`bg-gradient-to-br ${getRoleBgColor(selectedRoleData.name)} rounded-2xl border ${getRoleBorderColor(selectedRoleData.name)} overflow-hidden`}
            >
              <div className="p-6">
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
                        <h2 className="text-xl font-bold text-white">
                          {selectedRoleData.name}
                        </h2>
                        {selectedRoleData.isPermanent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                            Permanent
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">
                        {selectedRoleData.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400">
                      Level {selectedRoleData.level}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400">
                      {selectedRoleData.code}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users size={14} className="text-indigo-400" />
                    Users with this role ({selectedRoleData.userCount || 0})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getUsersByRole(selectedRoleData.code).map((user) => (
                      <Link
                        key={user._id}
                        href={`/users/${user._id}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {user.fullName}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Eye
                          size={14}
                          className="text-slate-500 opacity-0 group-hover:opacity-100 transition"
                        />
                      </Link>
                    ))}
                    {getUsersByRole(selectedRoleData.code).length === 0 && (
                      <div className="text-center py-6">
                        <UserX
                          size={32}
                          className="text-slate-600 mx-auto mb-2"
                        />
                        <p className="text-slate-500 text-sm">
                          No users assigned
                        </p>
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          Assign a user →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Role Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-gradient-to-r from-rose-600/10 to-red-600/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Delete Role
                    </h2>
                    <p className="text-xs text-slate-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(null);
                    setDeleteConfirmName("");
                  }}
                  className="text-slate-500 hover:text-slate-300 transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-rose-500/10 rounded-lg p-4 border border-rose-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-rose-400 font-medium">
                        Warning: Permanent Action
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        You are about to delete the role{" "}
                        <span className="text-white font-semibold">
                          "{showDeleteConfirm.name}"
                        </span>
                        .
                        {showDeleteConfirm.userCount &&
                          showDeleteConfirm.userCount > 0 && (
                            <span className="block mt-1 text-amber-400">
                              ⚠️ {showDeleteConfirm.userCount} user(s) currently
                              have this role. They will lose these permissions.
                            </span>
                          )}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Type{" "}
                    <span className="text-rose-400 font-mono">
                      {showDeleteConfirm.name}
                    </span>{" "}
                    to confirm deletion:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    placeholder={`Type "${showDeleteConfirm.name}" here...`}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none font-mono"
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
                    className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Create New Role
                  </h2>
                  <p className="text-xs text-slate-400">
                    Define a new custom role
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Role Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                    placeholder="e.g., Team Lead"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Role Code <span className="text-rose-400">*</span>
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
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                    placeholder="e.g., TEAM_LEAD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none resize-none"
                    placeholder="Describe the role responsibilities..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
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
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Low Access</span>
                    <span className="text-indigo-400">
                      Level {newRole.level}
                    </span>
                    <span>Full Access</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateRole}
                    disabled={creatingRole}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-2 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creatingRole ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Create Role"
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Edit Role
                  </h2>
                  <p className="text-xs text-slate-400">
                    Update role information
                  </p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) =>
                      setEditingRole({ ...editingRole, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
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
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
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
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Low Access</span>
                    <span className="text-indigo-400">
                      Level {editingRole.level}
                    </span>
                    <span>Full Access</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateRole}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2 rounded-lg transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Role Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Assign Role to User
                  </h2>
                  <p className="text-xs text-slate-400">
                    Select a user and assign a new role
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Select User
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none mb-2"
                    />
                  </div>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select a user</option>
                    {filteredUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Select Role
                  </label>
                  <select
                    value={selectedRoleForUser}
                    onChange={(e) => setSelectedRoleForUser(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select a role</option>
                    {rolesWithCounts.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <Info
                      size={14}
                      className="text-amber-400 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-slate-400">
                      Role changes take effect immediately. The user will need
                      to refresh their session.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAssignRole}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2 rounded-lg transition"
                  >
                    Assign Role
                  </button>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
