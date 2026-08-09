"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Calendar,
  Filter,
  Users,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Settings,
  Loader2,
  Home,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Briefcase,
  Database,
  File,
  Zap,
  Shield,
  Crown,
  User,
  Mail,
  Phone,
  CalendarDays,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  Rocket,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaFileCsv } from "react-icons/fa";

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  formats: Array<{ value: string; label: string; icon: any }>;
  fields: Array<{ value: string; label: string }>;
}

interface ExportHistory {
  id: string;
  name: string;
  type: string;
  format: string;
  date: string;
  status: "completed" | "processing" | "failed";
  size: string;
  url?: string;
}

export default function ExportReportsPage() {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedType, setSelectedType] = useState("tasks");
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [dateRange, setDateRange] = useState<
    "all" | "week" | "month" | "quarter" | "year"
  >("month");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [fileName, setFileName] = useState("");
  const [emailReport, setEmailReport] = useState(false);
  const [scheduleReport, setScheduleReport] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [departments, setDepartments] = useState<
    { _id: string; name: string }[]
  >([]);
  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);

  const canExport = hasRole([
    "super_admin",
    "admin",
    "hr_manager",
    "dept_manager",
    "project_manager",
  ]);

  const exportOptions: ExportOption[] = [
    {
      id: "tasks",
      name: "Tasks Report",
      description:
        "Export all task data including status, priority, and assignments",
      icon: CheckSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      formats: [
        { value: "csv", label: "CSV", icon: FaFileCsv },
        { value: "json", label: "JSON", icon: FileJson },
        { value: "excel", label: "Excel", icon: FileSpreadsheet },
      ],
      fields: [
        { value: "title", label: "Task Title" },
        { value: "description", label: "Description" },
        { value: "status", label: "Status" },
        { value: "priority", label: "Priority" },
        { value: "deadline", label: "Deadline" },
        { value: "assignedTo", label: "Assigned To" },
        { value: "assignedBy", label: "Assigned By" },
        { value: "project", label: "Project" },
        { value: "department", label: "Department" },
        { value: "estimatedHours", label: "Estimated Hours" },
        { value: "actualMinutes", label: "Actual Minutes" },
        { value: "createdAt", label: "Created Date" },
        { value: "updatedAt", label: "Updated Date" },
      ],
    },
    {
      id: "projects",
      name: "Projects Report",
      description: "Export project data with budgets, progress, and team info",
      icon: FolderKanban,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      formats: [
        { value: "csv", label: "CSV", icon: FaFileCsv },
        { value: "json", label: "JSON", icon: FileJson },
        { value: "excel", label: "Excel", icon: FileSpreadsheet },
      ],
      fields: [
        { value: "name", label: "Project Name" },
        { value: "code", label: "Project Code" },
        { value: "description", label: "Description" },
        { value: "status", label: "Status" },
        { value: "priority", label: "Priority" },
        { value: "manager", label: "Project Manager" },
        { value: "department", label: "Department" },
        { value: "startDate", label: "Start Date" },
        { value: "endDate", label: "End Date" },
        { value: "budget", label: "Budget" },
        { value: "progress", label: "Progress" },
        { value: "tasksCount", label: "Tasks Count" },
        { value: "completedTasks", label: "Completed Tasks" },
        { value: "teamMembers", label: "Team Members" },
        { value: "createdAt", label: "Created Date" },
      ],
    },
    {
      id: "users",
      name: "Users Report",
      description:
        "Export user data including roles, departments, and activity",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      formats: [
        { value: "csv", label: "CSV", icon: FaFileCsv },
        { value: "json", label: "JSON", icon: FileJson },
        { value: "excel", label: "Excel", icon: FileSpreadsheet },
      ],
      fields: [
        { value: "fullName", label: "Full Name" },
        { value: "email", label: "Email" },
        { value: "employeeId", label: "Employee ID" },
        { value: "role", label: "Role" },
        { value: "department", label: "Department" },
        { value: "phoneNumber", label: "Phone Number" },
        { value: "isActive", label: "Status" },
        { value: "lastLogin", label: "Last Login" },
        { value: "createdAt", label: "Created Date" },
      ],
    },
    {
      id: "departments",
      name: "Departments Report",
      description: "Export department data including employees and budgets",
      icon: Building2,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      formats: [
        { value: "csv", label: "CSV", icon: FaFileCsv },
        { value: "json", label: "JSON", icon: FileJson },
        { value: "excel", label: "Excel", icon: FileSpreadsheet },
      ],
      fields: [
        { value: "name", label: "Department Name" },
        { value: "code", label: "Department Code" },
        { value: "description", label: "Description" },
        { value: "head", label: "Head of Department" },
        { value: "employeeCount", label: "Employee Count" },
        { value: "budget", label: "Budget" },
        { value: "createdAt", label: "Created Date" },
      ],
    },
    {
      id: "performance",
      name: "Performance Report",
      description: "Export employee performance metrics and ratings",
      icon: TrendingUp,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      formats: [
        { value: "csv", label: "CSV", icon: FaFileCsv },
        { value: "json", label: "JSON", icon: FileJson },
        { value: "excel", label: "Excel", icon: FileSpreadsheet },
      ],
      fields: [
        { value: "employee", label: "Employee" },
        { value: "department", label: "Department" },
        { value: "tasksCompleted", label: "Tasks Completed" },
        { value: "tasksAssigned", label: "Tasks Assigned" },
        { value: "completionRate", label: "Completion Rate" },
        { value: "onTimeRate", label: "On-Time Rate" },
        { value: "averageRating", label: "Average Rating" },
        { value: "points", label: "Performance Points" },
        { value: "rank", label: "Rank" },
      ],
    },
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!canExport) {
      toast.error("You don't have permission to export reports");
      router.push("/dashboard");
      return;
    }
    fetchDepartments();
    fetchProjects();
    fetchExportHistory();
  }, [isAuthenticated, isLoading, canExport]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchExportHistory = async () => {
    try {
      // Mock history data - replace with actual API call when available
      setExportHistory([
        {
          id: "1",
          name: "Tasks Report",
          type: "tasks",
          format: "csv",
          date: new Date().toISOString(),
          status: "completed",
          size: "2.4 MB",
        },
        {
          id: "2",
          name: "Users Report",
          type: "users",
          format: "json",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
          size: "1.8 MB",
        },
        {
          id: "3",
          name: "Projects Report",
          type: "projects",
          format: "excel",
          date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          status: "processing",
          size: "-",
        },
      ]);
    } catch (error) {
      console.error("Error fetching export history:", error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Build export parameters
      const params = new URLSearchParams();
      params.append("type", selectedType);
      params.append("format", selectedFormat);
      params.append("dateRange", dateRange);
      if (selectedDepartment) params.append("department", selectedDepartment);
      if (selectedProject) params.append("project", selectedProject);
      if (selectedStatus) params.append("status", selectedStatus);
      if (selectedFields.length > 0)
        params.append("fields", selectedFields.join(","));
      params.append("includeHeaders", String(includeHeaders));
      if (fileName) params.append("fileName", fileName);

      // Determine which endpoint to use based on selected type
      let endpoint = "";
      switch (selectedType) {
        case "tasks":
          endpoint = "/tasks/export";
          break;
        case "projects":
          endpoint = "/projects/export";
          break;
        case "users":
          endpoint = "/auth/users/export";
          break;
        case "departments":
          endpoint = "/departments/export";
          break;
        case "performance":
          endpoint = "/performance/export";
          break;
        default:
          endpoint = "/tasks/export";
      }

      const response = await api.get(`${endpoint}?${params.toString()}`, {
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const extension =
        selectedFormat === "csv"
          ? "csv"
          : selectedFormat === "json"
            ? "json"
            : "xlsx";
      const downloadName =
        fileName ||
        `${selectedType}_report_${new Date().toISOString().split("T")[0]}.${extension}`;
      link.download = downloadName;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`Report exported successfully as ${downloadName}`);

      // Update export history
      await fetchExportHistory();
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error(error.response?.data?.message || "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const handleScheduleExport = async () => {
    toast.success(`Report scheduled to run ${scheduleFrequency}ly`);
  };

  const handleSelectAllFields = () => {
    const currentOption = exportOptions.find((opt) => opt.id === selectedType);
    if (currentOption) {
      if (selectedFields.length === currentOption.fields.length) {
        setSelectedFields([]);
      } else {
        setSelectedFields(currentOption.fields.map((f) => f.value));
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const currentOption = exportOptions.find((opt) => opt.id === selectedType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canExport) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="container mx-auto space-y-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm"
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
              href="/reports"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              Reports
            </Link>
            <ChevronRight size={14} className="text-gray-300" />
            <span className="text-gray-700 font-medium">Export Reports</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                  Export Reports
                </h1>
              </div>
              <p className="text-gray-500 text-sm">
                Export data in various formats with custom filters
              </p>
            </div>
            <button
              onClick={fetchExportHistory}
              className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition shadow-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </motion.div>

          {/* Export Options Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          >
            {exportOptions.map((option, idx) => {
              const Icon = option.icon;
              const isSelected = selectedType === option.id;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => {
                    setSelectedType(option.id);
                    setSelectedFields([]);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
                    isSelected
                      ? `${option.borderColor} ${option.bgColor} ring-2 ring-offset-2 ring-${option.color}`
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${option.bgColor}`}>
                      <Icon className={`w-5 h-5 ${option.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">
                        {option.name}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Selected
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Export Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Panel - Settings */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Settings size={16} className="text-gray-400" />
                  Export Settings
                </h2>

                {/* Format Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    File Format
                  </label>
                  <div className="flex gap-2">
                    {currentOption?.formats.map((format) => {
                      const FormatIcon = format.icon;
                      return (
                        <button
                          key={format.value}
                          onClick={() => setSelectedFormat(format.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                            selectedFormat === format.value
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <FormatIcon size={14} />
                          {format.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Date Range
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {["all", "week", "month", "quarter", "year"].map(
                      (range) => (
                        <button
                          key={range}
                          onClick={() => setDateRange(range as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                            dateRange === range
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {range === "all" ? "All Time" : range}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* Advanced Filters */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition"
                >
                  <Filter size={14} />
                  Advanced Filters
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-3 overflow-hidden"
                    >
                      {/* Department Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Department
                        </label>
                        <select
                          value={selectedDepartment}
                          onChange={(e) =>
                            setSelectedDepartment(e.target.value)
                          }
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        >
                          <option value="">All Departments</option>
                          {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Project Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Project
                        </label>
                        <select
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        >
                          <option value="">All Projects</option>
                          {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Status
                        </label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                        >
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fields Selection */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText size={16} className="text-gray-400" />
                    Select Fields
                  </h2>
                  <button
                    onClick={handleSelectAllFields}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {selectedFields.length === currentOption?.fields.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {currentOption?.fields.map((field) => (
                    <label
                      key={field.value}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.value)}
                        onChange={() => {
                          if (selectedFields.includes(field.value)) {
                            setSelectedFields(
                              selectedFields.filter((f) => f !== field.value),
                            );
                          } else {
                            setSelectedFields([...selectedFields, field.value]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">
                        {field.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {selectedFields.length} of {currentOption?.fields.length}{" "}
                  fields selected
                </p>
              </div>
            </div>

            {/* Right Panel - Options & Export */}
            <div className="space-y-4">
              {/* File Name */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <File size={16} className="text-gray-400" />
                  File Options
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder={`${selectedType}_report`}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Leave empty for auto-generated name
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeHeaders}
                      onChange={() => setIncludeHeaders(!includeHeaders)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Include Column Headers
                    </span>
                  </label>
                </div>
              </div>

              {/* Schedule & Email */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CalendarDays size={16} className="text-gray-400" />
                  Schedule & Email
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailReport}
                      onChange={() => setEmailReport(!emailReport)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Email report to me
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleReport}
                      onChange={() => setScheduleReport(!scheduleReport)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      Schedule recurring report
                    </span>
                  </label>
                  {scheduleReport && (
                    <div className="flex gap-2 mt-2">
                      {["daily", "weekly", "monthly"].map((freq) => (
                        <button
                          key={freq}
                          onClick={() => setScheduleFrequency(freq as any)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                            scheduleFrequency === freq
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={scheduleReport ? handleScheduleExport : handleExport}
                disabled={exporting}
                className="w-full py-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-medium transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              >
                {exporting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Exporting...
                  </>
                ) : scheduleReport ? (
                  <>
                    <CalendarDays size={16} />
                    Schedule Report
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export Report
                  </>
                )}
              </button>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Format:</span>
                  <span className="text-gray-700 font-medium uppercase">
                    {selectedFormat}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Fields:</span>
                  <span className="text-gray-700 font-medium">
                    {selectedFields.length || "All"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-500">Date Range:</span>
                  <span className="text-gray-700 font-medium capitalize">
                    {dateRange}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Export History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                Export History
              </h3>
              <span className="text-xs text-gray-400">
                {exportHistory.length} exports
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Export Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exportHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.type === "tasks" && (
                            <CheckSquare className="w-4 h-4 text-indigo-500" />
                          )}
                          {item.type === "projects" && (
                            <FolderKanban className="w-4 h-4 text-emerald-500" />
                          )}
                          {item.type === "users" && (
                            <Users className="w-4 h-4 text-purple-500" />
                          )}
                          {item.type === "departments" && (
                            <Building2 className="w-4 h-4 text-amber-500" />
                          )}
                          {item.type === "performance" && (
                            <TrendingUp className="w-4 h-4 text-rose-500" />
                          )}
                          <span className="text-sm text-gray-800 font-medium">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 uppercase">
                        {item.format}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(item.status)}
                          <span
                            className={`text-xs font-medium ${
                              item.status === "completed"
                                ? "text-emerald-600"
                                : item.status === "processing"
                                  ? "text-amber-600"
                                  : "text-rose-600"
                            }`}
                          >
                            {item.status.charAt(0).toUpperCase() +
                              item.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {item.size}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.status === "completed" && (
                          <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                            <Download size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {exportHistory.length === 0 && (
              <div className="text-center py-8">
                <Database className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No export history</p>
                <p className="text-xs text-gray-400">
                  Your exports will appear here
                </p>
              </div>
            )}
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-50 rounded-xl p-4 border border-blue-200"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-700">Export Tips</p>
                <ul className="text-xs text-blue-600 mt-1 space-y-1">
                  <li>• Large exports may take a few moments to process</li>
                  <li>• Select specific fields to reduce file size</li>
                  <li>• Use filters to narrow down data before exporting</li>
                  <li>• Scheduled reports will be sent to your email</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

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
