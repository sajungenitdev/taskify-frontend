"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  UserX,
  UserCheck,
  Calendar,
  Mail,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface InactiveUser {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  lastLogin?: string;
  createdAt: string;
  isActive: boolean;
}

export default function InactiveUsersPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canManage = hasRole(["super_admin", "admin", "hr_manager"]);

  useEffect(() => {
    if (!canManage) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canManage, router]);

  useEffect(() => {
    fetchInactiveUsers();
  }, []);

  const fetchInactiveUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      if (response.data.success) {
        const inactive = response.data.data.filter((u: any) => !u.isActive);
        setInactiveUsers(inactive);
      }
    } catch (error) {
      console.error("Error fetching inactive users:", error);
      toast.error("Failed to fetch inactive users");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId: string) => {
    setProcessingId(userId);
    try {
      await api.put(`/auth/users/${userId}`, { isActive: true });
      toast.success("User activated successfully");
      fetchInactiveUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to activate user");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user?"))
      return;
    setProcessingId(userId);
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success("User deleted successfully");
      fetchInactiveUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setProcessingId(null);
    }
  };

  if (!canManage) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Inactive Users</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage users with deactivated accounts
            </p>
          </div>
          <button
            onClick={fetchInactiveUsers}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-rose-400">
                  {inactiveUsers.length}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Inactive Users</p>
              </div>
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <UserX className="w-5 h-5 text-rose-400" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-400">0</p>
                <p className="text-xs text-slate-400 mt-0.5">Reactivated</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">0</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Permanently Deleted
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : inactiveUsers.length === 0 ? (
          <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-slate-800">
            <UserCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">
              No Inactive Users
            </h3>
            <p className="text-slate-400">All users are currently active</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                      User
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                      Role
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                      Deactivated On
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {inactiveUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-rose-400 text-xs font-bold">
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
                            <p className="text-slate-500 text-[10px]">
                              ID: {user.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">
                          {user.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleActivate(user._id)}
                            disabled={processingId === user._id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg flex items-center gap-1 transition"
                          >
                            {processingId === user._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserCheck size={12} />
                            )}
                            Activate
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            disabled={processingId === user._id}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-lg flex items-center gap-1 transition"
                          >
                            <XCircle size={12} />
                            Delete
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
      </div>
    </div>
  );
}
