"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  departmentId: { _id: string; name: string };
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
  const [result, setResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<BulkTask | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
    // Try to parse the date in various formats
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const isFutureDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  // ============ FILE HANDLING ============
  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let tasksArray: any[] = [];

          if (file.name.endsWith(".json")) {
            const jsonData = JSON.parse(content);
            tasksArray =
              jsonData.tasks || (Array.isArray(jsonData) ? jsonData : []);
          } else if (file.name.endsWith(".csv")) {
            tasksArray = parseCSV(content);
          } else {
            toast.error("Please upload a JSON or CSV file");
            return;
          }

          // Log what we parsed
          // console.log("Parsed tasks:", tasksArray);

          if (!tasksArray.length) {
            toast.error("No tasks found in file");
            return;
          }

          if (tasksArray.length > 100) {
            toast.error("Maximum 100 tasks per bulk upload");
            return;
          }

          // Process and validate tasks
          const errors: string[] = [];
          const processedTasks = tasksArray.map((task, index) => {
            const taskNum = index + 1;

            // Map field names if they're using different names
            const title =
              task.title ||
              task["Task"] ||
              task["task"] ||
              task["Task Title"] ||
              task["task title"] ||
              "";
            const description =
              task.description ||
              task["Description"] ||
              task["desc"] ||
              task["Task Description"] ||
              "";
            const assignedTo =
              task.assignedTo ||
              task["AssignedTo"] ||
              task["assignedto"] ||
              task["Assigned To"] ||
              task["User"] ||
              task["user"] ||
              "";
            const deadline =
              task.deadline ||
              task["Deadline"] ||
              task["due"] ||
              task["Due Date"] ||
              task["date"] ||
              "";
            const priority = task.priority || task["Priority"] || "normal";
            const estimatedHours =
              task.estimatedHours ||
              task["EstimatedHours"] ||
              task["estimated"] ||
              task["Estimated"] ||
              task["Hours"] ||
              task["hours"] ||
              "0";
            const isApprovalRequired =
              task.isApprovalRequired ||
              task["IsApprovalRequired"] ||
              task["Approval Required"] ||
              task["approval"] ||
              "false";
            const evidenceRequired =
              task.evidenceRequired ||
              task["EvidenceRequired"] ||
              task["Evidence Required"] ||
              task["evidence"] ||
              "false";

            // Find user by email or ID
            let assignedUser = null;
            if (assignedTo) {
              assignedUser = users.find(
                (u) =>
                  u.email?.toLowerCase() === assignedTo.toLowerCase() ||
                  u._id === assignedTo,
              );
            }

            // Validate date - try to parse it
            let formattedDeadline = "";
            if (deadline) {
              // Try different date formats
              let date = null;

              // Try MM/DD/YYYY or M/D/YYYY
              if (deadline.includes("/")) {
                const parts = deadline.split("/");
                if (parts.length === 3) {
                  const month = parseInt(parts[0]) - 1;
                  const day = parseInt(parts[1]);
                  const year = parseInt(parts[2]);
                  date = new Date(year, month, day);
                }
              } else {
                // Try standard ISO format
                date = new Date(deadline);
              }

              if (date && !isNaN(date.getTime())) {
                formattedDeadline = date.toISOString().split("T")[0];
              } else {
                errors.push(
                  `Task ${taskNum}: Invalid date format "${deadline}"`,
                );
              }
            }

            // Validate user
            if (assignedTo && !assignedUser) {
              errors.push(`Task ${taskNum}: User "${assignedTo}" not found`);
            }

            // Parse boolean values
            const parseBoolean = (val: any): boolean => {
              if (typeof val === "boolean") return val;
              if (typeof val === "string") {
                const lower = val.toLowerCase();
                return (
                  lower === "true" ||
                  lower === "yes" ||
                  lower === "1" ||
                  lower === "t" ||
                  lower === "y"
                );
              }
              return false;
            };

            return {
              title: title.trim() || "",
              description: description.trim() || "",
              assignedTo: assignedUser?._id || assignedTo || "",
              deadline: formattedDeadline,
              priority: priority?.toLowerCase() || "normal",
              estimatedHours: parseFloat(estimatedHours) || 0,
              isApprovalRequired: parseBoolean(isApprovalRequired),
              evidenceRequired: parseBoolean(evidenceRequired),
            };
          });

          // Show validation errors
          if (errors.length > 0) {
            setValidationErrors(errors);
            toast.error(`${errors.length} validation error(s) found`);
          } else {
            setValidationErrors([]);
          }

          // Filter out tasks with missing required fields
          const validTasks = processedTasks.filter(
            (t) => t.title && t.description && t.assignedTo && t.deadline,
          );

          if (validTasks.length === 0) {
            toast.error("No valid tasks found. Please check the format.");
            // Log the first task to help debug
            // if (processedTasks.length > 0) {
            //   console.log("First task data:", processedTasks[0]);
            //   console.log("Expected format:", {
            //     title: "Task title",
            //     description: "Task description",
            //     assignedTo: "user@email.com",
            //     deadline: "2026-07-14",
            //     priority: "normal",
            //     estimatedHours: 4,
            //     isApprovalRequired: false,
            //     evidenceRequired: false,
            //   });
            // }
            return;
          }

          setTasks(validTasks);
          setShowPreview(true);
          toast.success(`Loaded ${validTasks.length} valid tasks! 🎉`);
        } catch (error: any) {
          console.error("File parse error:", error);
          toast.error(error.message || "Invalid file format");
        }
      };
      reader.readAsText(file);
    },
    [users],
  );

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
    [tasks],
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
    [editData],
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
    const invalidTasks = tasks.filter(
      (t) =>
        !t.title.trim() ||
        !t.description.trim() ||
        !t.assignedTo ||
        !t.deadline,
    );

    if (invalidTasks.length > 0) {
      toast.error(
        `Please fill in all required fields for ${invalidTasks.length} task(s)`,
      );
      return;
    }

    // Validate dates
    const invalidDates = tasks.filter(
      (t) => t.deadline && !isValidDate(t.deadline),
    );

    if (invalidDates.length > 0) {
      toast.error(`${invalidDates.length} task(s) have invalid date format`);
      return;
    }

    // Validate future dates
    const pastDates = tasks.filter(
      (t) => t.deadline && !isFutureDate(t.deadline),
    );

    if (pastDates.length > 0) {
      toast.error(`${pastDates.length} task(s) have deadlines in the past`);
      return;
    }

    setUploading(true);
    try {
      const projectId = selectedProject;

      // Prepare task data
      const taskData = tasks.map((t) => ({
        title: t.title.trim(),
        description: t.description.trim(),
        assignedTo: t.assignedTo,
        deadline: t.deadline,
        priority: t.priority,
        estimatedHours: t.estimatedHours,
        isApprovalRequired: t.isApprovalRequired,
        evidenceRequired: t.evidenceRequired,
      }));

      let response;

      if (projectId) {
        // Use project-specific bulk upload
        response = await api.post(`/tasks/project/${projectId}/bulk`, {
          tasks: taskData,
        });
      } else {
        // Use bulk upload without project
        response = await api.post("/tasks/bulk", {
          tasks: taskData,
        });
      }

      if (response.data.success) {
        const successful = response.data.data || [];
        setUploadedCount(successful.length);
        setShowSuccess(true);
        toast.success(`🎉 Successfully uploaded ${successful.length} tasks!`);
        setTimeout(() => {
          router.push("/tasks");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);

      let errorMessage = "Failed to upload tasks";
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (Array.isArray(errors)) {
          errorMessage = errors.join(". ");
        } else if (typeof errors === "object") {
          errorMessage = Object.values(errors).join(". ");
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
      setResult({
        success: false,
        message: errorMessage,
        errors: error.response?.data?.errors || [{ message: errorMessage }],
        total: tasks.length,
      });
    } finally {
      setUploading(false);
    }
  }, [selectedProject, tasks, router]);

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
                          typeof v === "string" &&
                          (v.includes(",") || v.includes(" "))
                            ? `"${v}"`
                            : v,
                        )
                        .join(","),
                    )
                    .join("\n"),
              ],
              { type: "text/csv" },
            );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `task-template.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} template downloaded`);
    },
    [users],
  );

  // ============ RESET ============
  const resetUpload = useCallback(() => {
    setTasks([]);
    setShowPreview(false);
    setResult(null);
    setShowSuccess(false);
    setUploadedCount(0);
    setSelectedProject("");
    setValidationErrors([]);
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

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8 container">
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
          <Link href="/tasks/tasks-board" className="hover:text-gray-700 transition">
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
              Upload multiple tasks at once using JSON or CSV format
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
            💡 Tasks can be uploaded without a project. They will be created as
            unassigned tasks.
          </p>
        </div>

        {/* Upload Area */}
        {!showPreview && !showSuccess && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all ${
              dragActive
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Choose File
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Supported: JSON (.json) or CSV (.csv) • Max 100 tasks
            </p>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && !showSuccess && (
          <div className="mt-4 bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-700">
                  Validation Errors ({validationErrors.length})
                </h3>
                <ul className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                  {validationErrors.slice(0, 10).map((err, idx) => (
                    <li key={idx} className="text-xs text-amber-600">
                      • {err}
                    </li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li className="text-xs text-gray-500">
                      ... and {validationErrors.length - 10} more errors
                    </li>
                  )}
                </ul>
                <button
                  onClick={() => setValidationErrors([])}
                  className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
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
                onClick={() => router.push("/tasks")}
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

        {/* Task Preview */}
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
                    Task List ({tasks.length} tasks)
                  </h2>
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
                  <table className="w-full min-w-[900px]">
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.map((task, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50/80 transition-colors group"
                        >
                          <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                            #{index + 1}
                          </td>
                          <td className="px-4 py-3">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={editData?.title || ""}
                                onChange={(e) =>
                                  setEditData((prev) =>
                                    prev
                                      ? { ...prev, title: e.target.value }
                                      : null,
                                  )
                                }
                                className="text-black w-full min-w-[150px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                placeholder="Task title"
                                autoFocus
                              />
                            ) : (
                              <div
                                className="text-sm font-medium text-gray-800 truncate max-w-[180px]"
                                title={task.title}
                              >
                                {task.title || (
                                  <span className="text-gray-400">(empty)</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIndex === index ? (
                              <input
                                type="text"
                                value={editData?.description || ""}
                                onChange={(e) =>
                                  setEditData((prev) =>
                                    prev
                                      ? { ...prev, description: e.target.value }
                                      : null,
                                  )
                                }
                                className="text-black w-full min-w-[200px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                placeholder="Description"
                              />
                            ) : (
                              <div
                                className="text-sm text-gray-600 truncate max-w-[230px]"
                                title={task.description}
                              >
                                {task.description || (
                                  <span className="text-gray-400">(empty)</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIndex === index ? (
                              <select
                                value={editData?.assignedTo || ""}
                                onChange={(e) =>
                                  setEditData((prev) =>
                                    prev
                                      ? { ...prev, assignedTo: e.target.value }
                                      : null,
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
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-700">
                                  {users.find((u) => u._id === task.assignedTo)
                                    ?.fullName || "Not assigned"}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIndex === index ? (
                              <input
                                type="date"
                                value={editData?.deadline || ""}
                                onChange={(e) =>
                                  setEditData((prev) =>
                                    prev
                                      ? { ...prev, deadline: e.target.value }
                                      : null,
                                  )
                                }
                                className="text-black w-full min-w-[130px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                min={new Date().toISOString().split("T")[0]}
                              />
                            ) : (
                              <div className="flex items-center gap-2 text-sm">
                                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-gray-700">
                                  {task.deadline || "Not set"}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIndex === index ? (
                              <select
                                value={editData?.priority || "normal"}
                                onChange={(e) =>
                                  setEditData((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          priority: e.target
                                            .value as BulkTask["priority"],
                                        }
                                      : null,
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
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                                  PRIORITY_COLORS[
                                    task.priority as keyof typeof PRIORITY_COLORS
                                  ] || PRIORITY_COLORS.normal
                                }`}
                              >
                                <Flag className="w-3 h-3" />
                                {task.priority || "normal"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIndex === index ? (
                              <input
                                type="number"
                                value={editData?.estimatedHours || 0}
                                onChange={(e) =>
                                  setEditData((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          estimatedHours:
                                            parseFloat(e.target.value) || 0,
                                        }
                                      : null,
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
                          <td className="px-4 py-3 text-center">
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
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => removeTask(index)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Total:{" "}
                    <strong className="text-gray-800">{tasks.length}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="w-4 h-4" />
                    Ready to upload
                  </span>
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
                    disabled={uploading}
                    className="px-6 py-2.5 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload All Tasks
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
                {result.errors?.length > 0 && (
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
                    onClick={resetUpload}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-sm"
                  >
                    Try Again
                  </button>
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
                💡 Tips for bulk upload
              </p>
              <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                <li>• Download the template to see the required format</li>
                <li>
                  • Use email addresses in the "assignedTo" column - we'll
                  auto-match them
                </li>
                <li>• All fields with * are required</li>
                <li>
                  • Deadline must be today or in the future (YYYY-MM-DD format)
                </li>
                <li>• Maximum 100 tasks per upload</li>
                <li>
                  • Project selection is optional - tasks can be created without
                  a project
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
