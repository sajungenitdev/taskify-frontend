"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Save,
  X,
  Loader2,
  AlertCircle,
  ChevronRight,
  Home,
  Users,
  DollarSign,
  MapPin,
  Clock,
  RefreshCw,
  Sparkles,
  Briefcase,
  Sliders,
  Check,
  ShieldAlert,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
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
    role: string;
  };
  employeeCount: number;
  budget?: {
    allocated: number;
    spent: number;
  };
  location?: string;
  settings?: {
    workStartTime: string;
    workEndTime: string;
    allowRemoteCheckIn: boolean;
    gracePeriodMinutes: number;
    breakDurationMinutes: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function EditDepartmentPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initialFormState = {
    name: "",
    code: "",
    description: "",
    headOfDepartment: "",
    location: "",
    budgetAllocated: 0,
    isActive: true,
    workStartTime: "09:00",
    workEndTime: "18:00",
    allowRemoteCheckIn: true,
    gracePeriodMinutes: 15,
    breakDurationMinutes: 60,
  };

  const [formData, setFormData] = useState(initialFormState);

  const canManage = hasRole(["super_admin", "admin", "hr_manager"]);

  // Detect dirty state (has the form changed from loaded data)
  const isDirty = useMemo(() => {
    if (!department) return false;
    return (
      formData.name !== (department.name || "") ||
      formData.code !== (department.code || "") ||
      formData.description !== (department.description || "") ||
      formData.headOfDepartment !== (department.headOfDepartment?._id || "") ||
      formData.location !== (department.location || "") ||
      formData.budgetAllocated !== (department.budget?.allocated || 0) ||
      formData.isActive !== (department.isActive ?? true) ||
      formData.workStartTime !==
        (department.settings?.workStartTime || "09:00") ||
      formData.workEndTime !== (department.settings?.workEndTime || "18:00") ||
      formData.allowRemoteCheckIn !==
        (department.settings?.allowRemoteCheckIn ?? true) ||
      formData.gracePeriodMinutes !==
        (department.settings?.gracePeriodMinutes ?? 15) ||
      formData.breakDurationMinutes !==
        (department.settings?.breakDurationMinutes ?? 60)
    );
  }, [formData, department]);

  useEffect(() => {
    if (!canManage) {
      router.push("/departments");
      return;
    }
    fetchData();
  }, [departmentId, canManage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch department details
      const deptRes = await api.get(`/departments/${departmentId}`);
      if (deptRes.data.success) {
        const dept = deptRes.data.data;
        setDepartment(dept);
        setFormData({
          name: dept.name || "",
          code: dept.code || "",
          description: dept.description || "",
          headOfDepartment: dept.headOfDepartment?._id || "",
          location: dept.location || "",
          budgetAllocated: dept.budget?.allocated || 0,
          isActive: dept.isActive !== undefined ? dept.isActive : true,
          workStartTime: dept.settings?.workStartTime || "09:00",
          workEndTime: dept.settings?.workEndTime || "18:00",
          allowRemoteCheckIn:
            dept.settings?.allowRemoteCheckIn !== undefined
              ? dept.settings.allowRemoteCheckIn
              : true,
          gracePeriodMinutes: dept.settings?.gracePeriodMinutes ?? 15,
          breakDurationMinutes: dept.settings?.breakDurationMinutes ?? 60,
        });
      } else {
        throw new Error(deptRes.data.message || "Failed to fetch department");
      }

      // Fetch users for head of department dropdown
      try {
        const usersRes = await api.get("/auth/users");
        if (usersRes.data.success) {
          setUsers(usersRes.data.data || []);
        }
      } catch (userError) {
        console.error("Error fetching users:", userError);
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load department data");
      toast.error(err.message || "Failed to load department data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Department name is required");
      return;
    }
    if (!formData.code.trim()) {
      toast.error("Department code is required");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/departments/${departmentId}`, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description,
        headOfDepartment: formData.headOfDepartment || null,
        location: formData.location,
        budgetAllocated: formData.budgetAllocated || 0,
        isActive: formData.isActive,
        settings: {
          workStartTime: formData.workStartTime,
          workEndTime: formData.workEndTime,
          allowRemoteCheckIn: formData.allowRemoteCheckIn,
          gracePeriodMinutes: formData.gracePeriodMinutes,
          breakDurationMinutes: formData.breakDurationMinutes,
        },
      });

      if (response.data.success) {
        toast.success("Department updated successfully");
        router.push(`/departments/${departmentId}`);
      } else {
        throw new Error(response.data.message || "Failed to update department");
      }
    } catch (err: any) {
      console.error("Error updating department:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update department",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/departments/${departmentId}`);
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 max-w-md w-full"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            You don't have sufficient privileges to edit department
            configurations.
          </p>
          <Link
            href="/departments"
            className="inline-flex items-center justify-center w-full px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all shadow-sm"
          >
            Return to Departments
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">
            Fetching department details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Failed to Load Department
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            {error || "The requested department could not be found or loaded."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={fetchData}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-200"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <Link
              href="/departments"
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition flex items-center justify-center"
            >
              Back to List
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs text-slate-500 font-medium overflow-x-auto pb-1"
        >
          <Link
            href="/dashboard"
            className="hover:text-slate-900 transition flex items-center gap-1.5 shrink-0"
          >
            <Home size={14} className="text-slate-400" />
            Dashboard
          </Link>
          <ChevronRight size={12} className="text-slate-300 shrink-0" />
          <Link
            href="/departments"
            className="hover:text-slate-900 transition shrink-0"
          >
            Departments
          </Link>
          <ChevronRight size={12} className="text-slate-300 shrink-0" />
          <Link
            href={`/departments/${departmentId}`}
            className="hover:text-slate-900 transition shrink-0 max-w-[150px] truncate"
          >
            {department.name}
          </Link>
          <ChevronRight size={12} className="text-slate-300 shrink-0" />
          <span className="text-indigo-600 font-semibold shrink-0">Edit</span>
        </motion.nav>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              type="button"
              className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl hover:bg-slate-100 transition text-slate-600 hover:text-slate-900 shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Edit Department
                  </h1>
                  {isDirty && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                      Unsaved changes
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Update configurations for{" "}
                  <span className="font-semibold text-slate-700">
                    {department.name}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Status Indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                formData.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  formData.isActive
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              />
              {formData.isActive ? "Active Department" : "Inactive"}
            </div>
          </div>
        </motion.div>

        {/* Form Form Layout */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-600">
                <Briefcase size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  General Details
                </h2>
                <p className="text-xs text-slate-500">
                  Set the core identification and details for this department
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  placeholder="e.g. Engineering & Product"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition font-mono uppercase"
                  placeholder="e.g. ENG"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition"
                  placeholder="Briefly describe the responsibilities and scope of this department..."
                />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Management & Operations */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100/50 flex items-center justify-center text-violet-600">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Management & Budget
                </h2>
                <p className="text-xs text-slate-500">
                  Assign leadership and manage operational capacity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Head of Department
                </label>
                <div className="relative">
                  <select
                    value={formData.headOfDepartment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        headOfDepartment: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition appearance-none"
                  >
                    <option value="">Unassigned</option>
                    {users
                      .filter((u) =>
                        [
                          "super_admin",
                          "admin",
                          "dept_manager",
                          "hr_manager",
                        ].includes(u.role),
                      )
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullName} ({u.role.replace(/_/g, " ")})
                        </option>
                      ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Department Status
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
                    formData.isActive
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        formData.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {formData.isActive
                      ? "Active Department"
                      : "Disabled / Inactive"}
                  </span>
                  <div
                    className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                      formData.isActive ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        formData.isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Allocated Budget (USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={formData.budgetAllocated || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budgetAllocated: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Office Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                    placeholder="e.g., Floor 3, Building A"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Attendance & Working Rules */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Attendance Rules
                </h2>
                <p className="text-xs text-slate-500">
                  Configure default working hours and remote policies
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Work Start
                </label>
                <input
                  type="time"
                  value={formData.workStartTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workStartTime: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Work End
                </label>
                <input
                  type="time"
                  value={formData.workEndTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workEndTime: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Grace Period (mins)
                </label>
                <input
                  type="number"
                  value={formData.gracePeriodMinutes || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gracePeriodMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  min="0"
                  max="60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Break Duration (mins)
                </label>
                <input
                  type="number"
                  value={formData.breakDurationMinutes || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakDurationMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                  min="0"
                  max="180"
                />
              </div>
            </div>

            {/* Remote Check-in Toggle Card */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-slate-900 block">
                  Allow Remote Check-in
                </span>
                <p className="text-xs text-slate-500">
                  Permit department staff to log attendance outside office
                  geofencing
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    allowRemoteCheckIn: !formData.allowRemoteCheckIn,
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  formData.allowRemoteCheckIn ? "bg-indigo-600" : "bg-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    formData.allowRemoteCheckIn
                      ? "translate-x-6"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </motion.div>

          {/* Sticky/Floating Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
