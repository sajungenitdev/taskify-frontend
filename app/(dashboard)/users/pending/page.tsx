"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface PendingUser {
  _id: string;
  fullName: string;
  email: string;
  employeeId: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

export default function PendingApprovalsPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canApprove = hasRole(["super_admin", "admin", "hr_manager"]);

  useEffect(() => {
    if (!canApprove) {
      toast.error("You don't have permission to access this page");
      router.push("/dashboard");
    }
  }, [canApprove, router]);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get("/auth/users");
      if (response.data.success) {
        const pending = response.data.data.filter((u: any) => !u.isActive);
        setPendingUsers(pending);
      }
    } catch (error) {
      console.error("Error fetching pending users:", error);
      toast.error("Failed to fetch pending users");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    try {
      await api.put(`/auth/users/${userId}`, { isActive: true });
      toast.success("User approved successfully");
      fetchPendingUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve user");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingId(userId);
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success("User rejected and removed");
      fetchPendingUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject user");
    } finally {
      setProcessingId(null);
    }
  };

  if (!canApprove) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-6 pe-0">
      <div className="w-full mx-auto space-y-6 px-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pending Approvals</h1>
            <p className="text-slate-400 text-sm mt-1">
              Review and approve new user registrations
            </p>
          </div>
          <button
            onClick={fetchPendingUsers}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-400">
                  {pendingUsers.length}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pending Approvals
                </p>
              </div>
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-400">0</p>
                <p className="text-xs text-slate-400 mt-0.5">Approved Today</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-rose-400">0</p>
                <p className="text-xs text-slate-400 mt-0.5">Rejected</p>
              </div>
              <div className="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                <UserX className="w-5 h-5 text-rose-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-slate-800">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">
              No Pending Approvals
            </h3>
            <p className="text-slate-400">
              All user registrations have been processed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div
                key={user._id}
                className="bg-slate-900/50 rounded-xl p-4 border border-slate-800"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <span className="text-amber-400 font-bold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{user.fullName}</p>
                      <p className="text-slate-400 text-sm">{user.email}</p>
                      <p className="text-slate-500 text-xs">
                        ID: {user.employeeId} • Role:{" "}
                        {user.role.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(user._id)}
                      disabled={processingId === user._id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                    >
                      {processingId === user._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(user._id)}
                      disabled={processingId === user._id}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                    >
                      {processingId === user._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
