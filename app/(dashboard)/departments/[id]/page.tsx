"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: {
    _id: string;
    fullName: string;
    email: string;
  };
  employeeCount: number;
  budget?: {
    allocated: number;
    spent: number;
  };
  assets?: {
    total: number;
    value: number;
  };
  settings: {
    workStartTime: string;
    workEndTime: string;
    gracePeriodMinutes: number;
    breakDurationMinutes: number;
    allowRemoteCheckIn: boolean;
  };
  isActive: boolean;
  createdAt: string;
}

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit = hasRole(["super_admin", "admin"]);

  useEffect(() => {
    if (id) {
      fetchDepartment();
    }
  }, [id]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/departments/${id}`);
      if (response.data.success) {
        setDepartment(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching department:", error);
      toast.error("Failed to load department");
      router.push("/departments/all");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Department Not Found</h2>
          <Link href="/departments/all" className="mt-4 text-indigo-400 hover:text-indigo-300">
            ← Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 pe-0">
      <div className="w-full mx-auto space-y-6 px-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/departments/all" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{department.name}</h1>
            <p className="text-slate-400 text-sm mt-1">Department Details</p>
          </div>
          {canEdit && (
            <button className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-2">
              <Edit2 size={16} />
              Edit Department
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{department.employeeCount}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Employees</p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  ${(department.budget?.allocated || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Annual Budget</p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{department.assets?.total || 0}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total Assets</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{department.code}</p>
                <p className="text-xs text-slate-400 mt-0.5">Department Code</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h3 className="text-white font-semibold mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Department Name</span>
                <span className="text-white">{department.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Department Code</span>
                <span className="text-white font-mono">{department.code}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Head of Department</span>
                <span className="text-white">{department.headOfDepartment?.fullName || "Not Assigned"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${department.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                  {department.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="py-2">
                <span className="text-slate-400">Description</span>
                <p className="text-white mt-1">{department.description || "No description provided"}</p>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h3 className="text-white font-semibold mb-4">Working Hours</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Work Start Time</span>
                <span className="text-white">{department.settings?.workStartTime || "09:00"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Work End Time</span>
                <span className="text-white">{department.settings?.workEndTime || "18:00"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Grace Period</span>
                <span className="text-white">{department.settings?.gracePeriodMinutes || 15} minutes</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Break Duration</span>
                <span className="text-white">{department.settings?.breakDurationMinutes || 60} minutes</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Remote Check-in</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${department.settings?.allowRemoteCheckIn ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                  {department.settings?.allowRemoteCheckIn ? "Allowed" : "Not Allowed"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}