"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  FolderKanban,
  Users,
  Calendar,
  Flag,
  Clock,
  Trash2,
  Plus,
  Loader2,
  FileSpreadsheet,
  FileJson,
  AlertTriangle,
  Edit2,
  Save,
  X,
  Home,
  HelpCircle,
  ChevronRight,
  Search,
  Filter,
  ArrowUpDown,
  Check,
  User,
  CalendarDays,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Mail,
  Building2,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ============ TYPES ============
interface Project {
  _id: string;
  name: string;
  code: string;
  description: string;
  departmentId: { _id: string; name: string } | string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface BulkTask {
  title: string;
  description: string;
  assignedTo: string;
  deadline: string;
  priority: "low" | "normal" | "high" | "urgent";
  estimatedHours: number;
  isApprovalRequired: boolean;
  evidenceRequired: boolean;
}

interface UploadResult {
  success: boolean;
  message: string;
  errors?: any[];
  data?: any[];
}

// ============ CONSTANTS ============
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "emerald" },
  { value: "normal", label: "Normal", color: "blue" },
  { value: "high", label: "High", color: "amber" },
  { value: "urgent", label: "Urgent", color: "rose" },
] as const;

const PRIORITY_COLORS = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  normal: "bg-blue-50 text-blue-700 border-blue-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  urgent: "bg-rose-50 text-rose-700 border-rose-200",
};

// ============ MAIN COMPONENT ============
export default function BulkUploadPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<BulkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<BulkTask | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch data
  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching projects:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        try {
          const meResponse = await api.get("/auth/me");
          if (meResponse.data.success) {
            setUsers([meResponse.data.data]);
          }
        } catch (meError) {
          console.error("Error fetching current user:", meError);
        }
      } else {
        console.error("Error fetching users:", error);
      }
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProjects, fetchUsers]);

  // ============ VALIDATION HELPERS ============
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const isFutureDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const getTaskErrors = (task: BulkTask): string[] => {
    const errs: string[] = [];
    if (!task.title?.trim()) errs.push("Title is missing");
    if (!task.description?.trim()) errs.push("Description is missing");

    if (!task.assignedTo) {
      errs.push("Assignee is missing");
    } else {
      const found = users.find(
        (u) =>
          u._id === task.assignedTo ||
          u.email?.toLowerCase() === task.assignedTo.toLowerCase()
      );
      if (!found) errs.push("Assignee not found");
    }

    if (!task.deadline) {
      errs.push("Deadline is missing");
    } else if (!isValidDate(task.deadline)) {
      errs.push("Invalid date format");
    } else if (!isFutureDate(task.deadline)) {
      errs.push("Deadline is in the past");
    }

    return errs;
  };

  // ============ FILE HANDLING ============
  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must have headers and data");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    return lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const values: string[] = [];
        let inQuote = false;
        let current = "";

        for (const char of line) {
          if (char === '"') inQuote = !inQuote;
          else if (char === "," && !inQuote) {
            values.push(current.trim());
            current = "";
          } else current += char;
        }
        values.push(current.trim());

        const task: any = {};
        headers.forEach((header, idx) => {
          const raw = values[idx]?.replace(/^"|"$/g, "") || "";
          task[header] = raw;
        });
        return task;
      });
  };

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let tasksArray: any[] = [];

          if (file.name.endsWith(".json")) {
            const jsonData = JSON.parse(content);
            tasksArray = jsonData.tasks || (Array.isArray(jsonData) ? jsonData : []);
          } else if (file.name.endsWith(".csv")) {
            tasksArray = parseCSV(content);
          } else {
            toast.error("Please upload a JSON or CSV file");
            return;
          }

          if (!tasksArray.length) {
            toast.error("No tasks found in file");
            return;
          }

          if (tasksArray.length > 100) {
            toast.error("Maximum 100 tasks per bulk upload");
            return;
          }

          const processedTasks = tasksArray.map((task) => {
            const title = task.title || task["Task"] || task["task"] || task["Task Title"] || task["task title"] || "";
            const description = task.description || task["Description"] || task["desc"] || task["Task Description"] || "";
            const assignedTo = task.assignedTo || task["AssignedTo"] || task["assignedto"] || task["Assigned To"] || task["User"] || task["user"] || "";
            const deadlineRaw = task.deadline || task["Deadline"] || task["due"] || task["Due Date"] || task["date"] || "";
            const priority = task.priority || task["Priority"] || "normal";
            const estimatedHours = parseFloat(task.estimatedHours || task["EstimatedHours"] || task["estimated"] || task["Estimated"] || task["Hours"] || task["hours"] || "0");

            const parseBoolean = (val: any): boolean => {
              if (typeof val === "boolean") return val;
              if (typeof val === "string") {
                const lower = val.toLowerCase();
                return lower === "true" || lower === "yes" || lower === "1" || lower === "t" || lower === "y";
              }
              return false;
            };

            const isApprovalRequired = parseBoolean(task.isApprovalRequired || task["IsApprovalRequired"] || task["Approval Required"] || task["approval"]);
            const evidenceRequired = parseBoolean(task.evidenceRequired || task["EvidenceRequired"] || task["Evidence Required"] || task["evidence"]);

            let assignedUserId = assignedTo;
            if (assignedTo) {
              const matchedUser = users.find(
                (u) =>
                  u.email?.toLowerCase() === assignedTo.toLowerCase() ||
                  u._id === assignedTo
              );
              if (matchedUser) {
                assignedUserId = matchedUser._id;
              }
            }

            let formattedDeadline = deadlineRaw;
            if (deadlineRaw && deadlineRaw.includes("/")) {
              const parts = deadlineRaw.split("/");
              if (parts.length === 3) {
                const month = parseInt(parts[0]) - 1;
                const day = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                  formattedDeadline = date.toISOString().split("T")[0];
                }
              }
            } else if (deadlineRaw) {
              const date = new Date(deadlineRaw);
              if (!isNaN(date.getTime())) {
                formattedDeadline = date.toISOString().split("T")[0];
              }
            }

            return {
              title: typeof title === "string" ? title.trim() : "",
              description: typeof description === "string" ? description.trim() : "",
              assignedTo: assignedUserId?.trim() || "",
              deadline: formattedDeadline || "",
              priority: (["low", "normal", "high", "urgent"].includes(priority?.toLowerCase())
                ? priority.toLowerCase()
                : "normal") as BulkTask["priority"],
              estimatedHours: estimatedHours || 0,
              isApprovalRequired: isApprovalRequired || false,
              evidenceRequired: evidenceRequired || false,
            };
          });

          setTasks(processedTasks);
          setShowPreview(true);
          toast.success(`Loaded ${processedTasks.length} tasks for review! 🔍`);
        } catch (error: any) {
          console.error("File parse error:", error);
          toast.error(error.message || "Invalid file format");
        }
      };
      reader.readAsText(file);
    },
    [users]
  );

  // ============ TASK OPERATIONS ============
  const addEmptyTask = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setTasks((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        assignedTo: "",
        deadline: today,
        priority: "normal",
        estimatedHours: 0,
        isApprovalRequired: false,
        evidenceRequired: false,
      },
    ]);
    setEditingIndex(tasks.length);
    setEditData(null);
  }, [tasks.length]);

  const removeTask = useCallback((index: number) => {
    if (window.confirm("Remove this task?")) {
      setTasks((prev) => prev.filter((_, i) => i !== index));
      toast.success("Task removed");
    }
  }, []);

  const startEdit = useCallback(
    (index: number) => {
      setEditingIndex(index);
      setEditData({ ...tasks[index] });
    },
    [tasks]
  );

  const saveEdit = useCallback(
    (index: number) => {
      if (editData) {
        setTasks((prev) => prev.map((t, i) => (i === index ? editData : t)));
        setEditingIndex(null);
        setEditData(null);
        toast.success("Task updated");
      }
    },
    [editData]
  );

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditData(null);
  }, []);

  // ============ UPLOAD ============
  const handleBulkUpload = useCallback(async () => {
    if (!tasks.length) {
      toast.error("No tasks to upload");
      return;
    }

    // Validate required fields
    for (let i = 0; i < tasks.length; i++) {
      const errs = getTaskErrors(tasks[i]);
      if (errs.length > 0) {
        toast.error(`Row #${i + 1} has validation errors: ${errs.join(", ")}`);
        return;
      }
    }

    setUploading(true);
    setResult(null);

    try {
      // Prepare task data
      const taskData = tasks.map((t) => {
        let assignedToId = t.assignedTo;
        const matchedUser = users.find(
          (u) =>
            u._id === t.assignedTo ||
            u.email?.toLowerCase() === t.assignedTo.toLowerCase()
        );
        if (matchedUser) {
          assignedToId = matchedUser._id;
        }

        const taskObj: any = {
          title: t.title.trim(),
          description: t.description.trim(),
          assignedTo: assignedToId,
          deadline: t.deadline,
          priority: t.priority || "normal",
          estimatedHours: t.estimatedHours || 0,
          isApprovalRequired: t.isApprovalRequired || false,
          evidenceRequired: t.evidenceRequired || false,
        };

        // Only add projectId if selected
        if (selectedProject) {
          taskObj.projectId = selectedProject;
        }

        return taskObj;
      });

      let response;

      if (selectedProject) {
        response = await api.post(`/tasks/project/${selectedProject}/bulk`, {
          tasks: taskData,
        });
      } else {
        response = await api.post("/tasks/bulk", {
          tasks: taskData,
        });
      }

      if (response.data.success) {
        const successful = response.data.data || response.data.tasks || [];
        const count = Array.isArray(successful) ? successful.length : 0;
        setUploadedCount(count);
        setShowSuccess(true);
        toast.success(`🎉 Successfully uploaded ${count} tasks!`);
        setTimeout(() => {
          router.push("/tasks/my");
        }, 3000);
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        setResult({
          success: false,
          message: error.response.data.message,
          errors: error.response.data.errors || [],
        });
      } else if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err: any) => err.message || err)
          .join(", ");
        toast.error(`Validation errors: ${errorMessages}`);
        setResult({
          success: false,
          message: "Validation errors",
          errors: error.response.data.errors,
        });
      } else {
        const errorMsg = error.message || "Failed to upload tasks. Please check your data and try again.";
        toast.error(errorMsg);
        setResult({
          success: false,
          message: errorMsg,
        });
      }
    } finally {
      setUploading(false);
    }
  }, [selectedProject, tasks, router, users]);

  // ============ DOWNLOAD TEMPLATE ============
  const downloadTemplate = useCallback(
    (format: "json" | "csv") => {
      const sampleDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const template = [
        {
          title: "Example Task",
          description: "Task description here",
          assignedTo: users.length > 0 ? users[0].email : "user@example.com",
          deadline: sampleDate,
          priority: "normal",
          estimatedHours: 4,
          isApprovalRequired: false,
          evidenceRequired: false,
        },
        {
          title: "Another Task",
          description: "Another task description",
          assignedTo: users.length > 0 ? users[0].email : "user@example.com",
          deadline: sampleDate,
          priority: "high",
          estimatedHours: 2,
          isApprovalRequired: true,
          evidenceRequired: false,
        },
      ];

      const blob =
        format === "json"
          ? new Blob([JSON.stringify(template, null, 2)], {
            type: "application/json",
          })
          : new Blob(
            [
              Object.keys(template[0]).join(",") +
              "\n" +
              template
                .map((row) =>
                  Object.values(row)
                    .map((v) =>
                      typeof v === "string" && (v.includes(",") || v.includes(" "))
                        ? `"${v}"`
                        : v
                    )
                    .join(",")
                )
                .join("\n"),
            ],
            { type: "text/csv" }
          );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `task-template.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} template downloaded`);
    },
    [users]
  );

  // ============ RESET ============
  const resetUpload = useCallback(() => {
    setTasks([]);
    setShowPreview(false);
    setResult(null);
    setShowSuccess(false);
    setUploadedCount(0);
    setSelectedProject("");
    setEditingIndex(null);
    setEditData(null);
  }, []);

  // ============ LOADING ============
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Calculate total validation errors across all loaded tasks
  const totalErrorsCount = tasks.reduce((acc, t) => acc + getTaskErrors(t).length, 0);

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 text-gray-500">
          <Link
            href="/dashboard"
            className="hover:text-gray-700 transition flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <Link href="tasks/tasks-board" className="hover:text-gray-700 transition">
            Tasks
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-gray-900 font-medium">Bulk Upload</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Upload className="w-7 h-7 text-emerald-500" />
              Bulk Task Upload
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Upload multiple tasks at once using JSON or CSV format and review/edit them before submission
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => downloadTemplate("json")}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <FileJson className="w-4 h-4" />
              JSON Template
            </button>
            <button
              onClick={() => downloadTemplate("csv")}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-xl flex items-center gap-2 transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV Template
            </button>
          </div>
        </div>

        {/* Project Selection - Optional */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project{" "}
            <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <div className="relative max-w-md">
            <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition cursor-pointer appearance-none"
            >
              <option value="">No Project (Unassigned)</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 Tasks can be uploaded without a project. They will be created as unassigned tasks.
          </p>
        </div>

        {/* Upload Area */}
        {!showPreview && !showSuccess && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all ${dragActive
                ? "border-indigo-400 bg-indigo-50 scale-[1.02]"
                : "border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
              }`}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const files = e.dataTransfer.files;
              if (files?.[0]) handleFile(files[0]);
            }}
          >
            <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Upload Tasks File
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Drag and drop a JSON or CSV file, or click to select
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={(e) => {
                const files = e.target.files;
                if (files?.[0]) handleFile(files[0]);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Choose File
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Supported: JSON (.json) or CSV (.csv) • Max 100 tasks
            </p>
          </div>
        )}

        {/* Success State */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 bg-white rounded-xl border border-emerald-200 p-8 text-center shadow-sm"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🎉 Upload Successful!
            </h2>
            <p className="text-gray-600 mb-1">
              Successfully uploaded <strong>{uploadedCount}</strong> task
              {uploadedCount !== 1 ? "s" : ""}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Redirecting to tasks page...
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => router.push("tasks/tasks-board")}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
              >
                View Tasks
              </button>
              <button
                onClick={resetUpload}
                className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
              >
                Upload More
              </button>
            </div>
          </motion.div>
        )}

        {/* Task Preview & Inline Correction Table */}
        <AnimatePresence>
          {showPreview && tasks.length > 0 && !showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 space-y-4"
            >
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    Review & Fix Loaded Tasks ({tasks.length})
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Rows highlighted with a warning need missing or invalid fields corrected before upload. Click edit on any row to fix.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={addEmptyTask}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-lg flex items-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                  <button
                    onClick={resetUpload}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px]">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          Title *
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          Description *
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          Assignee *
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          Deadline *
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          Priority
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          Hours
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          Status / Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.map((task, index) => {
                        const rowErrors = getTaskErrors(task);
                        const hasError = rowErrors.length > 0;

                        return (
                          <tr
                            key={index}
                            className={`transition-colors group ${hasError ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-gray-50/80"
                              }`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-400 font-mono align-top pt-4">
                              #{index + 1}
                            </td>
                            <td className="px-4 py-3 align-top pt-3">
                              {editingIndex === index ? (
                                <input
                                  type="text"
                                  value={editData?.title || ""}
                                  onChange={(e) =>
                                    setEditData((prev) =>
                                      prev ? { ...prev, title: e.target.value } : null
                                    )
                                  }
                                  className="text-black w-full min-w-[150px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                  placeholder="Task title"
                                  autoFocus
                                />
                              ) : (
                                <div>
                                  <div
                                    className={`text-sm font-medium truncate max-w-[180px] ${!task.title ? "text-rose-500 italic" : "text-gray-800"
                                      }`}
                                    title={task.title || "Missing title"}
                                  >
                                    {task.title || "Missing title"}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top pt-3">
                              {editingIndex === index ? (
                                <input
                                  type="text"
                                  value={editData?.description || ""}
                                  onChange={(e) =>
                                    setEditData((prev) =>
                                      prev ? { ...prev, description: e.target.value } : null
                                    )
                                  }
                                  className="text-black w-full min-w-[200px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                  placeholder="Description"
                                />
                              ) : (
                                <div
                                  className={`text-sm truncate max-w-[230px] ${!task.description ? "text-rose-500 italic" : "text-gray-600"
                                    }`}
                                  title={task.description || "Missing description"}
                                >
                                  {task.description || "Missing description"}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top pt-3">
                              {editingIndex === index ? (
                                <select
                                  value={editData?.assignedTo || ""}
                                  onChange={(e) =>
                                    setEditData((prev) =>
                                      prev ? { ...prev, assignedTo: e.target.value } : null
                                    )
                                  }
                                  className="text-black w-full min-w-[150px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                >
                                  <option value="">Select user</option>
                                  {users.map((u) => (
                                    <option key={u._id} value={u._id}>
                                      {u.fullName} ({u.email})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span
                                    className={
                                      !task.assignedTo ||
                                        !users.some((u) => u._id === task.assignedTo)
                                        ? "text-rose-500 italic truncate max-w-[140px]"
                                        : "text-gray-700 truncate max-w-[140px]"
                                    }
                                  >
                                    {users.find((u) => u._id === task.assignedTo)?.fullName ||
                                      task.assignedTo ||
                                      "Unassigned"}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top pt-3">
                              {editingIndex === index ? (
                                <input
                                  type="date"
                                  value={editData?.deadline || ""}
                                  onChange={(e) =>
                                    setEditData((prev) =>
                                      prev ? { ...prev, deadline: e.target.value } : null
                                    )
                                  }
                                  className="text-black w-full min-w-[130px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                />
                              ) : (
                                <div className="flex items-center gap-2 text-sm">
                                  <CalendarDays className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span
                                    className={
                                      !task.deadline || !isValidDate(task.deadline)
                                        ? "text-rose-500 italic"
                                        : "text-gray-700"
                                    }
                                  >
                                    {task.deadline || "Missing date"}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top pt-3">
                              {editingIndex === index ? (
                                <select
                                  value={editData?.priority || "normal"}
                                  onChange={(e) =>
                                    setEditData((prev) =>
                                      prev
                                        ? {
                                          ...prev,
                                          priority: e.target.value as BulkTask["priority"],
                                        }
                                        : null
                                    )
                                  }
                                  className="text-black w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                >
                                  {PRIORITY_OPTIONS.map((p) => (
                                    <option key={p.value} value={p.value}>
                                      {p.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${PRIORITY_COLORS[
                                    task.priority as keyof typeof PRIORITY_COLORS
                                    ] || PRIORITY_COLORS.normal
                                    }`}
                                >
                                  <Flag className="w-3 h-3" />
                                  {task.priority || "normal"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top pt-3">
                              {editingIndex === index ? (
                                <input
                                  type="number"
                                  value={editData?.estimatedHours || 0}
                                  onChange={(e) =>
                                    setEditData((prev) =>
                                      prev
                                        ? {
                                          ...prev,
                                          estimatedHours: parseFloat(e.target.value) || 0,
                                        }
                                        : null
                                    )
                                  }
                                  className="text-black w-20 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                  step="0.5"
                                  min="0"
                                />
                              ) : (
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  {task.estimatedHours}h
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center align-top pt-3">
                              <div className="flex flex-col items-center gap-1">
                                {hasError && editingIndex !== index && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium"
                                    title={rowErrors.join(", ")}
                                  >
                                    <AlertCircle className="w-3 h-3" />
                                    {rowErrors.length} issue{rowErrors.length > 1 ? "s" : ""}
                                  </span>
                                )}
                                <div className="flex items-center justify-center gap-1">
                                  {editingIndex === index ? (
                                    <>
                                      <button
                                        onClick={() => saveEdit(index)}
                                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                        title="Save"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => startEdit(index)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        title="Edit"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => removeTask(index)}
                                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                        title="Remove"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Total: <strong className="text-gray-800">{tasks.length}</strong>
                  </span>
                  {totalErrorsCount > 0 ? (
                    <span className="flex items-center gap-1 text-rose-600 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {totalErrorsCount} issue(s) require attention before uploading
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      All tasks are valid and ready to upload!
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={resetUpload}
                    className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={uploading || totalErrorsCount > 0}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload All Tasks ({tasks.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Result */}
        {result && !result.success && !showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-rose-50 rounded-xl border border-rose-200 p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-rose-700">
                  Upload Failed
                </h3>
                <p className="text-sm text-rose-600 mt-1">{result.message}</p>
                {result.errors && result.errors.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {result.errors.map((err: any, idx: number) => (
                      <li key={idx} className="text-xs text-rose-500">
                        • {err.message || err}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700">
                💡 Tips for bulk upload & interactive review
              </p>
              <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                <li>• All uploaded rows populate the preview table instantly—nothing is rejected upfront</li>
                <li>• Rows marked with warnings have missing or invalid data highlighted in red text</li>
                <li>• Click the edit icon on any row to update its values inline before clicking upload</li>
                <li>• Use email addresses in the "assignedTo" column to auto-match system users</li>
                <li>• Maximum 100 tasks per file upload</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}