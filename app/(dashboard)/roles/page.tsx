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
  ShieldCheck,
  Layers,
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
  role?: string;
  roles?: any[];
}

const PERMANENT_ROLES = [
  { name: "Super Admin", code: "SUPER_ADMIN", description: "Full system access with all permissions", level: 100, isSystemRole: true, isPermanent: true },
  { name: "Admin", code: "ADMIN", description: "Administrative access with system control", level: 90, isSystemRole: true, isPermanent: true },
  { name: "HR Manager", code: "HR_MANAGER", description: "Human resources management access", level: 80, isSystemRole: true, isPermanent: true },
  { name: "Department Manager", code: "DEPT_MANAGER", description: "Department-level management access", level: 70, isSystemRole: true, isPermanent: true },
  { name: "Project Manager", code: "PROJECT_MANAGER", description: "Project-specific management access", level: 65, isSystemRole: true, isPermanent: true },
  { name: "Line Manager", code: "LINE_MANAGER", description: "Team management access", level: 60, isSystemRole: true, isPermanent: true },
  { name: "Employee", code: "EMPLOYEE", description: "Standard corporate user access", level: 10, isSystemRole: true, isPermanent: true },
];

export default function RolesPage() {
  const { hasRole } = useAuth();
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
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes] = await Promise.all([
        api.get("/roles").catch(() => ({ data: { success: false, data: [] } })),
        api.get("/auth/users").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const fetchedUsers = usersRes.data.success ? usersRes.data.data || [] : [];
      setUsers(fetchedUsers);

      let fetchedRoles = rolesRes.data.success ? rolesRes.data.data || [] : [];
      if (fetchedRoles.length === 0) {
        for (const role of PERMANENT_ROLES) {
          await api.post("/roles", role).catch(() => { });
        }
        const freshResponse = await api.get("/roles").catch(() => ({ data: { data: PERMANENT_ROLES } }));
        fetchedRoles = freshResponse.data.data || PERMANENT_ROLES;
      }

      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0 && !selectedRole) {
        setSelectedRole(fetchedRoles[0]._id || "temp_0");
      }
    } catch (error) {
      console.error("Error initializing roles & users:", error);
      toast.error("Failed to synchronize role datasets");
      setRoles(PERMANENT_ROLES.map((r, i) => ({ ...r, _id: `temp_${i}`, permissions: [], createdAt: new Date().toISOString() })));
    } finally {
      setLoading(false);
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
        setNewRole({ name: "", code: "", description: "", level: 50, permissions: [] });
        initializeData();
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
        initializeData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleDeleteRole = async () => {
    if (!showDeleteConfirm) return;

    // Validation: Prevent deletion if users are currently assigned
    const assignedUsers = getUsersByRole(showDeleteConfirm.code, showDeleteConfirm.name);
    if (assignedUsers.length > 0) {
      toast.error(`Cannot delete role. ${assignedUsers.length} user(s) are currently assigned. Please remove or reassign them first.`);
      setShowDeleteConfirm(null);
      setDeleteConfirmName("");
      return;
    }

    if (deleteConfirmName !== showDeleteConfirm.name) {
      toast.error(`Please type "${showDeleteConfirm.name}" to confirm deletion`);
      return;
    }

    setDeletingRole(true);
    try {
      const response = await api.delete(`/roles/${showDeleteConfirm._id}`);
      if (response.data.success) {
        toast.success(`Role "${showDeleteConfirm.name}" deleted successfully`);
        setShowDeleteConfirm(null);
        setDeleteConfirmName("");
        initializeData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete role. Users may still be attached.");
    } finally {
      setDeletingRole(false);
    }
  };

  const getUsersByRole = (roleCode: string, roleName: string) => {
    return users.filter((u) => {
      const codeClean = roleCode.toLowerCase().trim();
      const nameClean = roleName.toLowerCase().trim();

      if (u.roles && Array.isArray(u.roles)) {
        const matchedInArray = u.roles.some((r: any) => {
          const rCode = String(r.code || r._id || "").toLowerCase().trim();
          const rName = String(r.name || "").toLowerCase().trim();
          return rCode === codeClean || rCode === nameClean || rName === nameClean;
        });
        if (matchedInArray) return true;
      }

      if (u.role) {
        const uRole = String(u.role).toLowerCase().trim();
        return uRole === codeClean || uRole === nameClean;
      }

      return false;
    });
  };

  const getUserRoleNames = (user: User): string => {
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles.map((r: any) => r.name || r.code).join(", ");
    }
    return user.role ? user.role.replace(/_/g, " ").toUpperCase() : "Standard User";
  };

  const rolesWithCounts = useMemo(() => {
    return roles.map((role) => ({
      ...role,
      userCount: getUsersByRole(role.code, role.name).length,
    }));
  }, [roles, users]);

  const selectedRoleData = rolesWithCounts.find((r) => r._id === selectedRole) || rolesWithCounts[0];

  const filteredRoles = rolesWithCounts.filter(
    (role) =>
      role.name.toLowerCase().includes(searchRoleTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchRoleTerm.toLowerCase())
  );

  const stats = useMemo(() => ({
    totalRoles: rolesWithCounts.length,
    permanentRoles: rolesWithCounts.filter((r) => r.isPermanent).length,
    customRoles: rolesWithCounts.filter((r) => !r.isPermanent).length,
    totalUsers: users.length,
  }), [rolesWithCounts, users]);

  const getRoleIcon = (roleName: string) => {
    if (roleName.includes("Super")) return Crown;
    if (roleName.includes("Admin")) return Shield;
    if (roleName.includes("HR")) return Users;
    if (roleName.includes("Manager")) return Briefcase;
    return ShieldCheck;
  };

  if (!canManageRoles) return null;

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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Role Management</h1>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {stats.totalRoles}
                  </span>
                </div>
                <p className="text-slate-500 text-sm font-medium">Configure organizational permissions, access tiers, and security levels.</p>
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
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Custom Role
            </button>

            <button
              onClick={initializeData}
              title="Refresh Roles"
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Roles", val: stats.totalRoles, icon: Shield, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Permanent System", val: stats.permanentRoles, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Custom Roles", val: stats.customRoles, icon: Layers, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "System Users", val: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
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

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles by name or system code..."
            value={searchRoleTerm}
            onChange={(e) => setSearchRoleTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-slate-800 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition shadow-xs"
          />
        </div>

        {/* Grid View */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role, index) => {
              const IconComp = getRoleIcon(role.name);
              const isSelected = selectedRole === role._id;

              return (
                <motion.div
                  key={role._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedRole(role._id)}
                  className={`bg-white rounded-3xl border transition duration-300 flex flex-col justify-between cursor-pointer overflow-hidden group ${isSelected ? "border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg" : "border-slate-100 shadow-xs hover:border-slate-200"
                    }`}
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition duration-300 shadow-xs">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        {role.isPermanent ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full">
                            Permanent
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-base tracking-tight">{role.name}</h3>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">{role.description || "No description specified."}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                      <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{role.code}</span>
                      <span>Level {role.level}</span>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Users size={14} className="text-slate-400" />
                      <span>{role.userCount || 0} Assigned Users</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRole(role);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                        title="Edit Role"
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
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Delete Role"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
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
                    <th className="px-6 py-4">Role Title</th>
                    <th className="px-6 py-4">System Code</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-center">Security Level</th>
                    <th className="px-6 py-4 text-center">Assigned Users</th>
                    <th className="px-6 py-4 text-center">Type</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredRoles.map((role) => (
                    <tr
                      key={role._id}
                      onClick={() => setSelectedRole(role._id)}
                      className="hover:bg-slate-50/50 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900">{role.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600">{role.code}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{role.description || "-"}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">{role.level}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-800">{role.userCount || 0}</td>
                      <td className="px-6 py-4 text-center">
                        {role.isPermanent ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-200">Permanent</span>
                        ) : (
                          <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">Custom</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          {!role.isPermanent && (
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(role);
                                setDeleteConfirmName("");
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
          </div>
        )}

        {/* Selected Role Members Section */}
        {selectedRoleData && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Members Assigned to {selectedRoleData.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Full directory of active accounts holding this security clearance.</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl self-start sm:self-auto">
                {getUsersByRole(selectedRoleData.code, selectedRoleData.name).length} Users Found
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {getUsersByRole(selectedRoleData.code, selectedRoleData.name).map((user) => (
                <Link
                  key={user._id}
                  href={`/users/${user._id}`}
                  className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{user.fullName}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 text-slate-600 font-bold">
                      {getUserRoleNames(user)}
                    </span>
                    <Eye size={16} className="text-slate-400 group-hover:text-indigo-600 transition" />
                  </div>
                </Link>
              ))}

              {getUsersByRole(selectedRoleData.code, selectedRoleData.name).length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No system users are currently assigned to this role.
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>

      {/* Modal: Create Role */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create Custom Role</h2>
                  <p className="text-xs text-slate-500 font-medium">Define access hierarchy and operational permissions</p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Role Name *</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                    placeholder="e.g., Regional Lead"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">System Code *</label>
                  <input
                    type="text"
                    value={newRole.code}
                    onChange={(e) => setNewRole({ ...newRole, code: e.target.value.toUpperCase().replace(/\s/g, "_") })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                    placeholder="e.g., REGIONAL_LEAD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition"
                    placeholder="Explain the scope of this role..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Security Tier Level</label>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Level {newRole.level}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={newRole.level}
                    onChange={(e) => setNewRole({ ...newRole, level: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleCreateRole}
                    disabled={creatingRole}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center gap-2"
                  >
                    {creatingRole && <Loader2 size={16} className="animate-spin" />}
                    Create Role
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
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

      {/* Modal: Edit Role */}
      <AnimatePresence>
        {showEditModal && editingRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Modify Role Settings</h2>
                  <p className="text-xs text-slate-500 font-medium">Update role metadata and access tiers</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Role Title</label>
                  <input
                    type="text"
                    value={editingRole.name}
                    onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={editingRole.description}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Security Tier Level</label>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Level {editingRole.level}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={editingRole.level}
                    onChange={(e) => setEditingRole({ ...editingRole, level: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleUpdateRole}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
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

      {/* Modal: Delete Confirmation */}
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
                <h2 className="text-lg font-bold text-slate-900">Delete Role "{showDeleteConfirm.name}"?</h2>
                <p className="text-slate-500 text-sm">
                  This action is permanent. Type the exact role name below to confirm deletion.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={`Type "${showDeleteConfirm.name}"`}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 outline-none transition"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeleteRole}
                  disabled={deletingRole || deleteConfirmName !== showDeleteConfirm.name}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-rose-600/20 text-sm disabled:opacity-40"
                >
                  {deletingRole ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition text-sm"
                >
                  Cancel
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