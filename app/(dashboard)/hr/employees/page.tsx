// app/hr/employees/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Building2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  UserCheck,
  UserX,
  Eye,
  LayoutGrid,
  List,
  Crown,
  Shield,
  UserCog,
  User as UserIcon,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface Employee {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId?: string;
  departmentId?:
    | {
        _id: string;
        name: string;
        code: string;
      }
    | string;
  position?: string;
  phone?: string;
  location?: string;
  bio?: string;
  profilePhoto?: string;
  isActive: boolean;
  joinDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  employeeCount: number;
}

type ViewMode = "grid" | "table";

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-red-100 text-red-700 border-red-200",
  hr_manager: "bg-pink-100 text-pink-700 border-pink-200",
  dept_manager: "bg-blue-100 text-blue-700 border-blue-200",
  project_manager: "bg-indigo-100 text-indigo-700 border-indigo-200",
  line_manager: "bg-amber-100 text-amber-700 border-amber-200",
  employee: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  hr_manager: "HR Manager",
  dept_manager: "Department Manager",
  project_manager: "Project Manager",
  line_manager: "Line Manager",
  employee: "Employee",
};

const roleIcons: Record<string, any> = {
  super_admin: Crown,
  admin: Shield,
  hr_manager: UserCog,
  dept_manager: Building2,
  project_manager: Briefcase,
  line_manager: UserCheck,
  employee: UserIcon,
};

export default function EmployeesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "employee",
    departmentId: "",
    position: "",
    phone: "",
    location: "",
    bio: "",
    isActive: true,
  });

  const isHR =
    user?.role === "hr_manager" ||
    user?.role === "admin" ||
    user?.role === "super_admin";

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [isAuthenticated]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Use the correct endpoint - /users or /users/users depending on your route setup
      const response = await api.get("/users");

      if (response.data.success) {
        setEmployees(response.data.data || []);
      } else {
        // If API returns success: false, use fallback
        setEmployees(getFallbackEmployees());
        toast.error("Using sample employee data");
      }
    } catch (error: any) {
      console.error("Error fetching employees:", error);

      // Check if it's a 404 or connection error
      if (error.response?.status === 404) {
        // Try alternative endpoint
        try {
          const altResponse = await api.get("/users/users");
          if (altResponse.data.success) {
            setEmployees(altResponse.data.data || []);
            return;
          }
        } catch (altError) {
          console.error("Alternative endpoint also failed:", altError);
        }
      }

      // Use fallback data
      setEmployees(getFallbackEmployees());

      // Show appropriate message
      if (error.response?.status === 401) {
        toast.error("Authentication required. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view employees.");
      } else if (error.response?.status === 404) {
        toast.error("Employee API not found. Showing sample data.");
      } else {
        toast.error("Failed to load employees. Showing sample data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments(getFallbackDepartments());
      }
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      setDepartments(getFallbackDepartments());
    }
  };

  // ============================================================================
  // FALLBACK DATA
  // ============================================================================

  const getFallbackEmployees = (): Employee[] => {
    const names = [
      "John Doe",
      "Jane Smith",
      "Michael Johnson",
      "Emily Brown",
      "David Wilson",
      "Sarah Martinez",
      "James Anderson",
      "Lisa Taylor",
      "Robert Thomas",
      "Maria Garcia",
    ];
    const roles = [
      "employee",
      "employee",
      "employee",
      "hr_manager",
      "dept_manager",
      "employee",
      "project_manager",
      "employee",
      "line_manager",
      "employee",
    ];
    const depts = [
      "Engineering",
      "Marketing",
      "Sales",
      "HR",
      "Finance",
      "Operations",
      "IT",
      "Support",
    ];

    return names.map((name, index) => ({
      _id: `emp${String(index + 1).padStart(3, "0")}`,
      fullName: name,
      email: `${name.toLowerCase().replace(" ", ".")}@company.com`,
      role: roles[index % roles.length],
      employeeId: `EMP${String(index + 1).padStart(3, "0")}`,
      departmentId: {
        _id: `dept${(index % 4) + 1}`,
        name: depts[index % depts.length],
        code: depts[index % depts.length].substring(0, 3).toUpperCase(),
      },
      position: [
        "Senior Developer",
        "Marketing Manager",
        "Sales Lead",
        "HR Specialist",
        "Finance Analyst",
      ][index % 5],
      phone: `+1 555-${String(100 + index * 2).padStart(3, "0")}-${String(1000 + index * 3).padStart(4, "0")}`,
      location: ["New York", "London", "Sydney", "Toronto", "Singapore"][
        index % 5
      ],
      bio: `${name} is a dedicated professional with over ${5 + (index % 10)} years of experience.`,
      isActive: index % 4 !== 0,
      joinDate: new Date(
        Date.now() - (100 + index * 50) * 24 * 60 * 60 * 1000,
      ).toISOString(),
      createdAt: new Date(
        Date.now() - (100 + index * 50) * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  const getFallbackDepartments = (): Department[] => {
    return [
      { _id: "dept1", name: "Engineering", code: "ENG", employeeCount: 15 },
      { _id: "dept2", name: "Marketing", code: "MKT", employeeCount: 10 },
      { _id: "dept3", name: "Sales", code: "SAL", employeeCount: 12 },
      { _id: "dept4", name: "HR", code: "HR", employeeCount: 8 },
      { _id: "dept5", name: "Finance", code: "FIN", employeeCount: 6 },
      { _id: "dept6", name: "Operations", code: "OPS", employeeCount: 9 },
      { _id: "dept7", name: "IT", code: "IT", employeeCount: 7 },
      { _id: "dept8", name: "Support", code: "SUP", employeeCount: 5 },
    ];
  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        ...formData,
        password: "Temp@123",
      });
      if (response.data.success) {
        toast.success("Employee created successfully!");
        setShowCreateModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (error: any) {
      console.error("Error creating employee:", error);
      toast.error(error.response?.data?.message || "Failed to create employee");
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const response = await api.put(
        `/users/${selectedEmployee._id}`,
        formData,
      );
      if (response.data.success) {
        toast.success("Employee updated successfully!");
        setShowEditModal(false);
        setSelectedEmployee(null);
        resetForm();
        fetchEmployees();
      }
    } catch (error: any) {
      console.error("Error updating employee:", error);
      toast.error(error.response?.data?.message || "Failed to update employee");
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      const response = await api.delete(`/users/${selectedEmployee._id}`);
      if (response.data.success) {
        toast.success("Employee deleted successfully");
        setShowDeleteConfirm(false);
        setSelectedEmployee(null);
        fetchEmployees();
      }
    } catch (error: any) {
      console.error("Error deleting employee:", error);
      toast.error(error.response?.data?.message || "Failed to delete employee");
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      role: "employee",
      departmentId: "",
      position: "",
      phone: "",
      location: "",
      bio: "",
      isActive: true,
    });
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    const deptId =
      typeof employee.departmentId === "object"
        ? employee.departmentId?._id
        : employee.departmentId;
    setFormData({
      fullName: employee.fullName,
      email: employee.email,
      role: employee.role,
      departmentId: deptId || "",
      position: employee.position || "",
      phone: employee.phone || "",
      location: employee.location || "",
      bio: employee.bio || "",
      isActive: employee.isActive,
    });
    setShowEditModal(true);
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDepartmentName = (deptId: any) => {
    if (!deptId) return "N/A";
    if (typeof deptId === "object") return deptId.name || "N/A";
    const dept = departments.find((d) => d._id === deptId);
    return dept?.name || "N/A";
  };

  // ============================================================================
  // FILTERING & STATS
  // ============================================================================

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase());

      const deptId =
        typeof emp.departmentId === "object"
          ? emp.departmentId?._id
          : emp.departmentId;
      const matchesDepartment =
        filterDepartment === "all" || deptId === filterDepartment;

      const matchesRole = filterRole === "all" || emp.role === filterRole;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" ? emp.isActive : !emp.isActive);

      return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
    });
  }, [employees, searchTerm, filterDepartment, filterRole, filterStatus]);

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.isActive).length,
      inactive: employees.filter((e) => !e.isActive).length,
      departments: departments.length,
    }),
    [employees, departments],
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent flex items-center gap-3">
              <Users className="w-7 h-7 text-indigo-500" />
              Employees
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1 h-1 rounded-full bg-indigo-400"></span>
              Manage and organize your workforce
            </p>
          </div>
          {isHR && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="group flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 font-medium"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              Add Employee
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md hover:border-indigo-200/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-linear-to-br from-indigo-50 to-indigo-100/50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md hover:border-emerald-200/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-linear-to-br from-emerald-50 to-emerald-100/50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md hover:border-rose-200/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-linear-to-br from-rose-50 to-rose-100/50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <UserX className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.inactive}
                </p>
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 p-5 hover:shadow-md hover:border-purple-200/50 transition-all duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-linear-to-br from-purple-50 to-purple-100/50 rounded-xl group-hover:scale-110 transition-transform duration-200">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.departments}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[160px]"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[140px]"
              >
                <option value="all">All Roles</option>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-black px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterDepartment("all");
                  setFilterRole("all");
                  setFilterStatus("all");
                  fetchEmployees();
                }}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white shadow-sm text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Employees Display */}
        {filteredEmployees.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmployees.map((employee) => {
                const RoleIcon = roleIcons[employee.role] || UserIcon;
                const roleColor =
                  roleColors[employee.role] ||
                  "bg-gray-100 text-gray-700 border-gray-200";
                const isCurrentUser = employee._id === user?._id;

                return (
                  <div
                    key={employee._id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-xl hover:border-indigo-200/50 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-lg font-bold shrink-0">
                              {getInitials(employee.fullName)}
                            </div>
                            {employee.isActive ? (
                              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                            ) : (
                              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gray-400 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate flex items-center gap-1.5">
                              {employee.fullName}
                              {isCurrentUser && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-500 truncate">
                              {employee.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1 shrink-0 ${roleColor}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleLabels[employee.role] || employee.role}
                        </span>
                      </div>

                      {employee.position && (
                        <p className="mt-3 text-sm text-gray-600 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                          {employee.position}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
                        {employee.employeeId && (
                          <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                            <span className="text-xs font-medium">ID:</span>
                            {employee.employeeId}
                          </span>
                        )}
                        {employee.departmentId && (
                          <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                            <Building2 className="w-3 h-3" />
                            {getDepartmentName(employee.departmentId)}
                          </span>
                        )}
                        {employee.joinDate && (
                          <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3 h-3" />
                            {formatDate(employee.joinDate)}
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEmployeeDetail(true);
                          }}
                          className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Profile
                        </button>
                        {isHR && (
                          <>
                            <button
                              onClick={() => openEditModal(employee)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-linear-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Join Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredEmployees.map((employee) => {
                      const RoleIcon = roleIcons[employee.role] || UserIcon;
                      const roleColor =
                        roleColors[employee.role] ||
                        "bg-gray-100 text-gray-700 border-gray-200";
                      const isCurrentUser = employee._id === user?._id;

                      return (
                        <tr
                          key={employee._id}
                          className="hover:bg-indigo-50/30 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                                {getInitials(employee.fullName)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 flex items-center gap-1.5">
                                  {employee.fullName}
                                  {isCurrentUser && (
                                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {employee.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                              <Building2 className="w-3 h-3" />
                              {getDepartmentName(employee.departmentId)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${roleColor}`}
                            >
                              <RoleIcon className="w-3 h-3" />
                              {roleLabels[employee.role] || employee.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${
                                employee.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-50 text-gray-600 border-gray-200"
                              }`}
                            >
                              {employee.isActive ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Active
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(
                              employee.joinDate || employee.createdAt,
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setShowEmployeeDetail(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {isHR && (
                                <>
                                  <button
                                    onClick={() => openEditModal(employee)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit Employee"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedEmployee(employee);
                                      setShowDeleteConfirm(true);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete Employee"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100/80">
            <div className="w-20 h-20 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No employees found
            </h3>
            <p className="text-gray-500 mt-1">
              {isHR
                ? "Add your first employee to get started"
                : "No employees match your filters"}
            </p>
            {isHR && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                Add Employee
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================
          MODALS - Create, Edit, Delete, Detail
          ============================================================ */}
      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Add New Employee
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateEmployee}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    >
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Position / Job Title
                    </label>
                    <input
                      type="text"
                      placeholder="Enter position"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Enter location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Bio / Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter bio or notes"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none text-gray-800"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25"
                  >
                    Create Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Edit Employee
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleUpdateEmployee}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    >
                      {Object.entries(roleLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Department
                    </label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departmentId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Position
                    </label>
                    <input
                      type="text"
                      placeholder="Enter position"
                      value={formData.position}
                      onChange={(e) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Enter location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.isActive ? "active" : "inactive"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isActive: e.target.value === "active",
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors text-gray-800"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Bio / Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter bio or notes"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors resize-none text-gray-800"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25"
                  >
                    Update Employee
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEmployee(null);
                      resetForm();
                    }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-linear-to-br from-rose-50 to-rose-100 rounded-xl">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delete Employee
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <strong>{selectedEmployee.fullName}</strong>? This action cannot
                be undone and all associated data will be removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteEmployee}
                  className="flex-1 px-4 py-2.5 bg-linear-to-r from-rose-600 to-rose-500 text-white rounded-xl hover:from-rose-700 hover:to-rose-600 transition-colors font-medium shadow-lg shadow-rose-500/25"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedEmployee(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showEmployeeDetail && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 text-2xl font-bold shrink-0">
                    {getInitials(selectedEmployee.fullName)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      {selectedEmployee.fullName}
                      {selectedEmployee._id === user?._id && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </h2>
                    <p className="text-gray-500">{selectedEmployee.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEmployeeDetail(false);
                    setSelectedEmployee(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Role
                  </h3>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const RoleIcon =
                        roleIcons[selectedEmployee.role] || UserIcon;
                      const roleColor =
                        roleColors[selectedEmployee.role] ||
                        "bg-gray-100 text-gray-700 border-gray-200";
                      return (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${roleColor}`}
                        >
                          <RoleIcon className="w-4 h-4" />
                          {roleLabels[selectedEmployee.role] ||
                            selectedEmployee.role}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Status
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full border ${
                      selectedEmployee.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {selectedEmployee.isActive ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                        Inactive
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Department
                  </h3>
                  <p className="text-gray-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    {getDepartmentName(selectedEmployee.departmentId)}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Position
                  </h3>
                  <p className="text-gray-800 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    {selectedEmployee.position || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Employee ID
                  </h3>
                  <p className="text-gray-800">
                    {selectedEmployee.employeeId || "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Join Date
                  </h3>
                  <p className="text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatDate(
                      selectedEmployee.joinDate || selectedEmployee.createdAt,
                    )}
                  </p>
                </div>
                {selectedEmployee.phone && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Phone
                    </h3>
                    <p className="text-gray-800 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selectedEmployee.phone}
                    </p>
                  </div>
                )}
                {selectedEmployee.location && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Location
                    </h3>
                    <p className="text-gray-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selectedEmployee.location}
                    </p>
                  </div>
                )}
              </div>

              {selectedEmployee.bio && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Bio / Notes
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {selectedEmployee.bio}
                  </p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowEmployeeDetail(false);
                    setSelectedEmployee(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
                >
                  Close
                </button>
                {isHR && (
                  <button
                    onClick={() => {
                      setShowEmployeeDetail(false);
                      openEditModal(selectedEmployee);
                    }}
                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-colors font-medium shadow-lg shadow-indigo-500/25"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit Employee
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
