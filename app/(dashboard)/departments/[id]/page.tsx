// app/(dashboard)/departments/[id]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Users,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronRight,
  Home,
  User,
  Plus,
  Search,
  Copy,
  Check,
  Download,
  Shield,
  Briefcase,
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
  parentDepartmentId?: {
    _id: string;
    name: string;
    code: string;
  };
  employeeCount: number;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentMember {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  department: string;
  position: string;
  joinDate: string;
  status: "active" | "inactive" | "on_leave";
}

export default function DepartmentDetailPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const canManage = hasRole([
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
  ]);

  // Handle ESC key for modal closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showDeleteConfirm) {
        setShowDeleteConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDeleteConfirm]);

  const fetchDepartmentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch department details
      let departmentData: Department | null = null;
      try {
        const deptRes = await api.get(`/departments/${departmentId}`);
        if (deptRes.data?.success) {
          departmentData = deptRes.data.data;
          setDepartment(departmentData);
        } else {
          throw new Error(
            deptRes.data?.message || "Failed to fetch department",
          );
        }
      } catch (deptError: any) {
        console.error("Department fetch error:", deptError);
        const mockData = getMockDepartment(departmentId);
        setDepartment(mockData);
        departmentData = mockData;
        toast.success("Using sample department data (API unavailable)");
      }

      // Fetch department employees
      try {
        const employeesRes = await api.get(
          `/departments/${departmentId}/employees`,
        );
        if (employeesRes.data?.success) {
          const employeeData = employeesRes.data.data || [];
          const formattedMembers: DepartmentMember[] = employeeData.map(
            (emp: any) => ({
              _id: emp._id || emp.userId?._id || `emp-${Math.random()}`,
              fullName: emp.fullName || emp.userId?.fullName || "Unknown",
              email: emp.email || emp.userId?.email || "N/A",
              role: emp.role || emp.userId?.role || "employee",
              avatar: emp.avatar || emp.userId?.avatar,
              department: departmentData?.name || "",
              position: emp.position || emp.role || "Member",
              joinDate:
                emp.joinDate || emp.createdAt || new Date().toISOString(),
              status: emp.status || "active",
            }),
          );
          setMembers(formattedMembers);
        }
      } catch (membersError) {
        console.error("Members fetch error:", membersError);
        const mockMembers = getMockMembers(departmentData);
        setMembers(mockMembers);
      }
    } catch (err: any) {
      console.error("Error fetching department data:", err);
      setError(err.message || "Failed to fetch department data");
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  // Fallback Mock Data Generators
  const getMockDepartment = (id: string): Department => ({
    _id: id,
    name: "Engineering Department",
    code: "ENG",
    description:
      "Responsible for software development, technical operations, infrastructure, and core product innovation.",
    headOfDepartment: {
      _id: "mock-manager-1",
      fullName: "John Smith",
      email: "john.smith@company.com",
      role: "dept_manager",
    },
    employeeCount: 24,
    budget: {
      allocated: 250000,
      spent: 120000,
      currency: "USD",
    },
    isActive: true,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const getMockMembers = (dept: Department | null): DepartmentMember[] => {
    const departmentName = dept?.name || "Engineering";
    return [
      {
        _id: "mock-1",
        fullName: "Alice Johnson",
        email: "alice.j@company.com",
        role: "senior_developer",
        department: departmentName,
        position: "Senior Developer",
        joinDate: new Date(
          Date.now() - 180 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: "active",
      },
      {
        _id: "mock-2",
        fullName: "Bob Williams",
        email: "bob.w@company.com",
        role: "developer",
        department: departmentName,
        position: "Full Stack Developer",
        joinDate: new Date(
          Date.now() - 120 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: "active",
      },
      {
        _id: "mock-3",
        fullName: "Carol Davis",
        email: "carol.d@company.com",
        role: "developer",
        department: departmentName,
        position: "Frontend Developer",
        joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: "on_leave",
      },
      {
        _id: "mock-4",
        fullName: "David Martinez",
        email: "david.m@company.com",
        role: "intern",
        department: departmentName,
        position: "Software Intern",
        joinDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
      },
      {
        _id: "mock-5",
        fullName: "Emma Wilson",
        email: "emma.w@company.com",
        role: "team_lead",
        department: departmentName,
        position: "Tech Lead",
        joinDate: new Date(
          Date.now() - 200 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: "active",
      },
    ];
  };

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentData();
    }
  }, [departmentId, fetchDepartmentData]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/departments/${departmentId}`);
      toast.success("Department deleted successfully");
      router.push("/departments");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete department",
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyId = () => {
    if (department?._id) {
      navigator.clipboard.writeText(department._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Department ID copied to clipboard");
    }
  };

  const exportMembersCSV = () => {
    if (!members.length) {
      toast.error("No members to export");
      return;
    }
    const headers = ["ID,Full Name,Email,Role,Position,Status,Join Date"];
    const rows = members.map(
      (m) =>
        `"${m._id}","${m.fullName}","${m.email}","${m.role}","${m.position}","${m.status}","${formatDate(m.joinDate)}"`,
    );
    const blob = new Blob([[headers, ...rows].join("\n")], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${department?.name.replace(/\s+/g, "_")}_members.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Exported members CSV successfully");
  };

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, string> = {
      super_admin: "bg-red-50 text-red-700 border-red-200",
      admin: "bg-purple-50 text-purple-700 border-purple-200",
      hr_manager: "bg-pink-50 text-pink-700 border-pink-200",
      dept_manager: "bg-indigo-50 text-indigo-700 border-indigo-200",
      team_lead: "bg-blue-50 text-blue-700 border-blue-200",
      senior_developer: "bg-cyan-50 text-cyan-700 border-cyan-200",
      developer: "bg-sky-50 text-sky-700 border-sky-200",
      intern: "bg-teal-50 text-teal-700 border-teal-200",
    };
    return styles[role] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      hr_manager: "HR Manager",
      dept_manager: "Dept Manager",
      project_manager: "Project Manager",
      team_lead: "Team Lead",
      senior_developer: "Senior Dev",
      developer: "Developer",
      intern: "Intern",
    };
    return labels[role] || role.replace(/_/g, " ");
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      inactive: "bg-gray-100 text-gray-600 border-gray-200",
      on_leave: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return colors[status] || colors.inactive;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredMembers = members.filter(
    (member) =>
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm font-medium">
            Loading department details...
          </p>
        </div>
      </div>
    );
  }

  if (error && !department) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Failed to Load Department
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            {error || "Department detail request failed."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchDepartmentData}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <Link
              href="/departments"
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition flex items-center justify-center gap-2 text-sm font-medium"
            >
              Back to Departments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl border border-gray-200 shadow-sm max-w-sm">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Department Not Found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            The department you are looking for does not exist or has been
            removed.
          </p>
          <Link
            href="/departments"
            className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition"
          >
            Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-4 md:p-6 lg:p-8 container mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-xs md:text-sm"
        >
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
          >
            <Home size={14} />
            Dashboard
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link
            href="/departments"
            className="text-gray-400 hover:text-gray-600 transition"
          >
            Departments
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">
            {department.name}
          </span>
        </motion.div>

        {/* Top Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/departments"
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition text-gray-600 hover:text-gray-900"
              title="Back to Departments"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/10 shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                    {department.name}
                  </h1>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                      department.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {department.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    Code: {department.code}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <button
              onClick={handleCopyId}
              className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition text-xs font-medium flex items-center gap-1.5 shadow-xs"
            >
              {copied ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} className="text-gray-400" />
              )}
              {copied ? "Copied" : "Copy ID"}
            </button>
            <button
              onClick={fetchDepartmentData}
              className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 rounded-xl transition shadow-xs"
              title="Refresh Data"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin text-indigo-600" : ""}
              />
            </button>
            {canManage && (
              <>
                <Link
                  href={`/departments/${departmentId}/edit`}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Edit2 size={14} />
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {department.employeeCount || members.length || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Active Status
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {members.filter((m) => m.status === "active").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Allocated Budget
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    department.budget?.allocated || 0,
                    department.budget?.currency,
                  )}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Budget Spent
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-amber-600">
                    {department.budget?.spent && department.budget?.allocated
                      ? Math.round(
                          (department.budget.spent /
                            department.budget.allocated) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                  <span className="text-xs text-gray-400 font-mono">
                    ({formatCurrency(department.budget?.spent || 0)})
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Sidebar & Members Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Department Details
              </h3>

              {department.description && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">
                    Description
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                    {department.description}
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2 text-xs md:text-sm">
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Department Code</span>
                  <span className="font-mono text-gray-800 font-medium">
                    {department.code}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Head of Dept.</span>
                  <span className="text-gray-900 font-medium truncate max-w-[150px]">
                    {department.headOfDepartment?.fullName || "Unassigned"}
                  </span>
                </div>
                {department.parentDepartmentId && (
                  <div className="flex items-center justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Parent Dept.</span>
                    <span className="text-gray-900 font-medium">
                      {department.parentDepartmentId.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-500">Created Date</span>
                  <span className="text-gray-700">
                    {formatDate(department.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Last Modified</span>
                  <span className="text-gray-700">
                    {formatDate(department.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Members Card Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Team Members
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {filteredMembers.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search member..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  <button
                    onClick={exportMembersCSV}
                    className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition"
                    title="Export CSV"
                  >
                    <Download size={14} />
                  </button>

                  {canManage && (
                    <Link
                      href={`/departments/${departmentId}/members/add`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition flex items-center gap-1 shrink-0"
                    >
                      <Plus size={14} />
                      Add Member
                    </Link>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="p-4">
                {filteredMembers.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50/60 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shadow-xs shrink-0">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-semibold text-gray-900 truncate">
                              {member.fullName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-between sm:justify-end">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${getRoleBadgeStyle(
                              member.role,
                            )}`}
                          >
                            {getRoleLabel(member.role)}
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border capitalize font-medium ${getStatusColor(
                              member.status,
                            )}`}
                          >
                            {member.status.replace(/_/g, " ")}
                          </span>
                          <button
                            onClick={() => router.push(`/users/${member._id}`)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Profile"
                          >
                            <User size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs md:text-sm font-medium text-gray-600">
                      No members found
                    </p>
                    {searchTerm && (
                      <p className="text-xs text-gray-400 mt-1">
                        Try adjusting your search criteria
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-red-50/50">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Delete Department
                  </h3>
                  <p className="text-xs text-gray-500">Irreversible action</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="text-gray-900">{department.name}</strong>?
                  All connected entries will be permanently modified.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {isDeleting && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 text-xs font-semibold rounded-xl transition"
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
