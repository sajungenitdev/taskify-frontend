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
  XCircle,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Role {
  id: string;
  name: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  permissions: string[];
  userCount?: number;
  isSystemRole?: boolean;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function RolesPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRoleForUser, setSelectedRoleForUser] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const canManageRoles = hasRole(["super_admin"]);

  useEffect(() => {
    if (!canManageRoles) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canManageRoles, router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const roles: Role[] = [
    {
      id: "super_admin",
      name: "Super Admin",
      label: "Super Admin",
      icon: <Crown className="w-5 h-5" />,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      description:
        "Full system access with all permissions. Can manage everything including users, roles, departments, and system settings.",
      userCount: users.filter((u) => u.role === "super_admin").length,
      isSystemRole: true,
      permissions: [
        "Full system access",
        "Manage all users",
        "Manage all departments",
        "Manage system settings",
        "View all reports",
        "Audit logs",
        "Manage roles",
        "Delete any data",
        "System backup and restore",
        "Configure integrations",
      ],
    },
    {
      id: "admin",
      name: "Admin",
      label: "Admin",
      icon: <Shield className="w-5 h-5" />,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      description:
        "Administrative access with limited system control. Can manage users, departments, and view reports.",
      userCount: users.filter((u) => u.role === "admin").length,
      isSystemRole: true,
      permissions: [
        "Manage users",
        "Manage departments",
        "View reports",
        "Manage settings",
        "Create tasks",
        "View all tasks",
        "Export data",
        "Manage announcements",
      ],
    },
    {
      id: "hr_manager",
      name: "HR Manager",
      label: "HR Manager",
      icon: <Users className="w-5 h-5" />,
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30",
      description:
        "Human resources management access. Can manage employees, attendance, leaves, and recruitment.",
      userCount: users.filter((u) => u.role === "hr_manager").length,
      isSystemRole: true,
      permissions: [
        "Manage employees",
        "Manage attendance",
        "Manage leaves",
        "View employee reports",
        "Process onboarding",
        "Manage recruitment",
        "View payroll data",
        "Manage training",
      ],
    },
    {
      id: "dept_manager",
      name: "Department Manager",
      label: "Dept Manager",
      icon: <Building2 className="w-5 h-5" />,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      description:
        "Department-level management access. Can manage team tasks, approve work, and view department reports.",
      userCount: users.filter((u) => u.role === "dept_manager").length,
      isSystemRole: true,
      permissions: [
        "Manage team tasks",
        "Approve tasks",
        "View team reports",
        "Manage department attendance",
        "Assign tasks",
        "Request resources",
        "View department KPI",
        "Manage team members",
      ],
    },
    {
      id: "project_manager",
      name: "Project Manager",
      label: "Project Manager",
      icon: <Briefcase className="w-5 h-5" />,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      description:
        "Project-specific management access. Can manage project tasks, assign members, and track progress.",
      userCount: users.filter((u) => u.role === "project_manager").length,
      isSystemRole: true,
      permissions: [
        "Manage project tasks",
        "Assign project members",
        "View project reports",
        "Approve submissions",
        "Track project progress",
        "Manage project budget",
        "Create project milestones",
      ],
    },
    {
      id: "line_manager",
      name: "Line Manager",
      label: "Line Manager",
      icon: <UserCheck className="w-5 h-5" />,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      description:
        "Team management access. Can assign daily tasks, review submissions, and provide feedback.",
      userCount: users.filter((u) => u.role === "line_manager").length,
      isSystemRole: true,
      permissions: [
        "Assign daily tasks",
        "Review submissions",
        "Provide feedback",
        "View direct reports",
        "Approve time off",
        "Track team productivity",
      ],
    },
    {
      id: "employee",
      name: "Employee",
      label: "Employee",
      icon: <Users className="w-5 h-5" />,
      color: "text-slate-400",
      bgColor: "bg-slate-500/10",
      borderColor: "border-slate-500/30",
      description:
        "Basic user access. Can view and manage own tasks, track time, and submit work.",
      userCount: users.filter((u) => u.role === "employee").length,
      isSystemRole: true,
      permissions: [
        "View own tasks",
        "Update own tasks",
        "Submit evidence",
        "View own KPI",
        "Request leave",
        "Track time",
        "View own reports",
        "Request extension",
      ],
    },
  ];

  const getUsersByRole = (roleId: string) => {
    return users.filter((u) => u.role === roleId);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleForUser) {
      toast.error("Please select both user and role");
      return;
    }

    try {
      await api.put(`/auth/users/${selectedUser}/role`, {
        role: selectedRoleForUser,
      });
      toast.success("Role assigned successfully");
      setShowAssignModal(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign role");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!canManageRoles) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const selectedRoleData = roles.find((r) => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Role Management</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage system roles and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl flex items-center gap-2 transition"
          >
            <Plus size={16} />
            Assign Role to User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`cursor-pointer rounded-xl p-3 border transition-all ${
                selectedRole === role.id
                  ? `${role.bgColor} ${role.borderColor} shadow-lg`
                  : "bg-slate-900/30 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`${role.bgColor} p-1.5 rounded-lg`}>
                  <div className={role.color}>{role.icon}</div>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{role.label}</p>
                  <p className="text-slate-400 text-[10px]">
                    {role.userCount || 0} users
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Details */}
          <div className="lg:col-span-2">
            {selectedRoleData ? (
              <div
                className={`bg-gradient-to-br ${selectedRoleData.bgColor} rounded-2xl border ${selectedRoleData.borderColor} p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-xl ${selectedRoleData.bgColor} border ${selectedRoleData.borderColor}`}
                  >
                    <div className={selectedRoleData.color}>
                      {selectedRoleData.icon}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedRoleData.name}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {selectedRoleData.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield size={14} className="text-indigo-400" />
                    Permissions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedRoleData.permissions.map((permission, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-slate-300"
                      >
                        <CheckCircle size={14} className="text-emerald-400" />
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users with this role */}
                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Users size={14} className="text-indigo-400" />
                    Users with this role ({selectedRoleData.userCount || 0})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getUsersByRole(selectedRoleData.id).map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {user.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm">
                              {user.fullName}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/users/${user._id}`}
                          className="text-slate-400 hover:text-indigo-400 transition"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>
                    ))}
                    {getUsersByRole(selectedRoleData.id).length === 0 && (
                      <p className="text-slate-500 text-sm text-center py-4">
                        No users assigned to this role
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/30 rounded-2xl border border-slate-800 p-12 text-center">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Select a role to view details</p>
              </div>
            )}
          </div>

          {/* Role Summary */}
          <div className="space-y-4">
            <div className="bg-slate-900/30 rounded-xl p-5 border border-slate-800">
              <h3 className="text-white font-semibold mb-3">
                Role Distribution
              </h3>
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full bg-${role.color.split("-")[1]}-500`}
                      />
                      <span className="text-slate-300 text-sm">
                        {role.label}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      {role.userCount || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/30 rounded-xl p-5 border border-slate-800">
              <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  <UserCheck size={14} />
                  Assign Role
                </button>
                <Link
                  href="/users/all"
                  className="w-full py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  <Users size={14} />
                  Manage Users
                </Link>
              </div>
            </div>

            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-400 font-medium">Note</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Role changes take effect immediately. Users will need to
                    refresh their session to see new permissions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">
                  Assign Role to User
                </h2>
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
                <label className="block text-sm text-slate-400 mb-2">
                  Select User
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none mb-2"
                  />
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value="">Select a user</option>
                    {filteredUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName} ({u.email}) - Current:{" "}
                        {u.role.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Select Role
                </label>
                <select
                  value={selectedRoleForUser}
                  onChange={(e) => setSelectedRoleForUser(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAssignRole}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition"
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
          </div>
        </div>
      )}
    </div>
  );
}
