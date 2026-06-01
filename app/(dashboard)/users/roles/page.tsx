"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Shield,
  Crown,
  Users,
  Building2,
  UserCheck,
  Briefcase,
  ChevronRight,
} from "lucide-react";

const roles = [
  {
    id: "super_admin",
    name: "Super Admin",
    icon: Crown,
    color: "from-purple-600 to-pink-600",
    description: "Full system access with all permissions",
    permissions: [
      "Manage all users",
      "Manage all departments",
      "Manage system settings",
      "View all reports",
      "Audit logs",
      "Manage roles",
      "Delete any data",
    ],
  },
  {
    id: "admin",
    name: "Admin",
    icon: Shield,
    color: "from-blue-600 to-cyan-600",
    description: "Administrative access with limited system control",
    permissions: [
      "Manage users",
      "Manage departments",
      "View reports",
      "Manage settings",
      "Create tasks",
    ],
  },
  {
    id: "hr_manager",
    name: "HR Manager",
    icon: Users,
    color: "from-emerald-600 to-teal-600",
    description: "Human resources management access",
    permissions: [
      "Manage employees",
      "Manage attendance",
      "Manage leaves",
      "View employee reports",
      "Process onboarding",
    ],
  },
  {
    id: "dept_manager",
    name: "Department Manager",
    icon: Building2,
    color: "from-orange-600 to-red-600",
    description: "Department-level management access",
    permissions: [
      "Manage team tasks",
      "Approve tasks",
      "View team reports",
      "Manage department attendance",
      "Assign tasks",
    ],
  },
  {
    id: "project_manager",
    name: "Project Manager",
    icon: Briefcase,
    color: "from-cyan-600 to-blue-600",
    description: "Project-specific management access",
    permissions: [
      "Manage project tasks",
      "Assign project members",
      "View project reports",
      "Approve submissions",
    ],
  },
  {
    id: "line_manager",
    name: "Line Manager",
    icon: UserCheck,
    color: "from-indigo-600 to-purple-600",
    description: "Team management access",
    permissions: [
      "Assign daily tasks",
      "Review submissions",
      "Provide feedback",
      "View direct reports",
    ],
  },
  {
    id: "employee",
    name: "Employee",
    icon: Users,
    color: "from-slate-600 to-slate-700",
    description: "Basic user access",
    permissions: [
      "View own tasks",
      "Update own tasks",
      "Submit evidence",
      "View own KPI",
      "Request leave",
    ],
  },
];

export default function RolesPage() {
  const { hasRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  if (!hasRole(["super_admin", "admin"])) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">
            You don't have permission to view this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Roles & Permissions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage system roles and their access permissions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-1 space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full p-4 rounded-xl border transition-all text-left ${
                  selectedRole === role.id
                    ? `bg-gradient-to-r ${role.color} border-transparent`
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-r ${role.color} flex items-center justify-center`}
                  >
                    <role.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${selectedRole === role.id ? "text-white" : "text-white"}`}
                    >
                      {role.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {role.description}
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 ${selectedRole === role.id ? "text-white" : "text-slate-500"}`}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Permissions Details */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              (() => {
                const role = roles.find((r) => r.id === selectedRole);
                if (!role) return null;
                return (
                  <div
                    className={`bg-gradient-to-br ${role.color} rounded-2xl p-6 text-white`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <role.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{role.name}</h2>
                        <p className="text-white/80 text-sm">
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-3">
                        Permissions:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {role.permissions.map((permission, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm text-white/90"
                          >
                            <CheckCircle className="w-4 h-4 text-white/70" />
                            {permission}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-slate-800">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  Select a role to view its permissions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add missing import
import { CheckCircle } from "lucide-react";
