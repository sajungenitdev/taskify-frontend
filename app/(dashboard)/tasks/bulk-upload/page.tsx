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

interface ValidationError {
  index: number;
  field: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: any[];
  successful: any[];
  failed: { index: number; task: any; error: string }[];
  total: number;
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

const STATUS_COLORS = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

// ============ COMPONENTS ============
const StatCard = ({
  icon: Icon,
  label,
  value,
  color = "blue",
  subtitle,
}: {
  icon: any;
  label: string;
  value: number | string;
  color?: "blue" | "emerald" | "rose" | "amber";
  subtitle?: string;
}) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colors[color]} flex items-center gap-4`}
    >
      <div className={`p-2 rounded-lg bg-white/50`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs opacity-80">{label}</p>
        {subtitle && <p className="text-xs opacity-60 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

const TaskRow = ({
  task,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onRemove,
  users,
  editData,
  setEditData,
}: any) => {
  const getUserName = (userId: string) => {
    const user = users.find((u: User) => u._id === userId);
    return user ? `${user.fullName} (${user.email})` : "Unknown User";
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="hover:bg-gray-50/80 transition-colors group"
    >
      <td className="px-4 py-3 text-sm text-gray-400 font-mono">
        #{index + 1}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <input
            type="text"
            value={editData?.title || ""}
            onChange={(e) =>
              setEditData((prev: any) => ({ ...prev, title: e.target.value }))
            }
            className="w-full min-w-[150px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="Task title"
            autoFocus
          />
        ) : (
          <div
            className="text-sm font-medium text-gray-800 truncate max-w-[180px]"
            title={task.title}
          >
            {task.title}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <input
            type="text"
            value={editData?.description || ""}
            onChange={(e) =>
              setEditData((prev: any) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="w-full min-w-[200px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="Description"
          />
        ) : (
          <div
            className="text-sm text-gray-600 truncate max-w-[230px]"
            title={task.description}
          >
            {task.description}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <select
            value={editData?.assignedTo || ""}
            onChange={(e) =>
              setEditData((prev: any) => ({
                ...prev,
                assignedTo: e.target.value,
              }))
            }
            className="w-full min-w-[150px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          >
            <option value="">Select user</option>
            {users.map((user: User) => (
              <option key={user._id} value={user._id}>
                {user.fullName} ({user.email})
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700">
              {getUserName(task.assignedTo)}
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <input
            type="date"
            value={editData?.deadline || ""}
            onChange={(e) =>
              setEditData((prev: any) => ({
                ...prev,
                deadline: e.target.value,
              }))
            }
            className="w-full min-w-[130px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-700">{task.deadline}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <select
            value={editData?.priority}
            onChange={(e) =>
              setEditData((prev: any) => ({
                ...prev,
                priority: e.target.value,
              }))
            }
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${PRIORITY_COLORS[task.priority]}`}
          >
            <Flag className="w-3 h-3" />
            {task.priority}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <input
            type="number"
            value={editData?.estimatedHours || 0}
            onChange={(e) =>
              setEditData((prev: any) => ({
                ...prev,
                estimatedHours: parseFloat(e.target.value) || 0,
              }))
            }
            className="w-20 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
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
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={onSave}
                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={onCancel}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onEdit(index)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRemove(index)}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
};

// ============ MAIN COMPONENT ============
export default function BulkUploadPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<BulkTask | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof BulkTask>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
      toast.error(error.response?.data?.message || "Failed to fetch projects");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      // Try to fetch all users first
      const response = await api.get("/users");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error: any) {
      // If access denied, try to get current user only
      if (error.response?.status === 403) {
        try {
          const meResponse = await api.get("/auth/me");
          if (meResponse.data.success) {
            setUsers([meResponse.data.data]);
            toast.info("Limited user list available");
          }
        } catch (meError) {
          console.error("Error fetching current user:", meError);
          toast.error("Failed to load user data");
        }
      } else {
        console.error("Error fetching users:", error);
        toast.error(error.response?.data?.message || "Failed to fetch users");
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

  // File handling
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) handleFile(files[0]);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) handleFile(files[0]);
    },
    [],
  );

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

          if (!tasksArray.length) {
            toast.error("No tasks found in file");
            return;
          }

          if (tasksArray.length > 100) {
            toast.error("Maximum 100 tasks per bulk upload");
            return;
          }

          validateAndSetTasks(tasksArray);
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

    const headerMap: Record<string, string> = {
      title: "title",
      "task title": "title",
      "task name": "title",
      name: "title",
      description: "description",
      "task description": "description",
      desc: "description",
      assignedto: "assignedTo",
      "assigned to": "assignedTo",
      assignee: "assignedTo",
      user: "assignedTo",
      "assigned user": "assignedTo",
      deadline: "deadline",
      "due date": "deadline",
      due: "deadline",
      date: "deadline",
      priority: "priority",
      estimatedhours: "estimatedHours",
      "estimated hours": "estimatedHours",
      hours: "estimatedHours",
      "est hours": "estimatedHours",
      isapprovalrequired: "isApprovalRequired",
      "approval required": "isApprovalRequired",
      evidencerequired: "evidenceRequired",
      "evidence required": "evidenceRequired",
    };

    const rawHeaders = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const headers = rawHeaders.map((h) => headerMap[h] || h);

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
          let value: any = raw;

          if (header === "estimatedHours") value = parseFloat(raw) || 0;
          else if (header === "priority") {
            const p = raw.toLowerCase();
            value = ["low", "normal", "high", "urgent"].includes(p)
              ? p
              : "normal";
          } else if (
            header === "isApprovalRequired" ||
            header === "evidenceRequired"
          ) {
            value = ["true", "yes", "1"].includes(raw.toLowerCase());
          } else value = raw;

          task[header] = value;
        });
        return task;
      });
  };

  const validateAndSetTasks = useCallback(
    (tasksData: any[]) => {
      const validTasks: BulkTask[] = [];
      const errors: ValidationError[] = [];

      tasksData.forEach((task, index) => {
        const errs: string[] = [];
        if (!task.title?.trim()) errs.push("Title is required");
        if (!task.description?.trim()) errs.push("Description is required");
        if (!task.assignedTo?.trim()) errs.push("AssignedTo is required");

        if (task.deadline) {
          const date = new Date(task.deadline);
          if (isNaN(date.getTime())) errs.push("Invalid deadline format");
        } else {
          errs.push("Deadline is required");
        }

        // Validate user
        if (task.assignedTo) {
          const exists = users.some(
            (u) => u._id === task.assignedTo || u.email === task.assignedTo,
          );
          if (!exists) errs.push(`User "${task.assignedTo}" not found`);
        }

        if (errs.length) {
          errors.push({
            index,
            field: "multiple",
            message: `Task ${index + 1}: ${errs.join(", ")}`,
          });
          return;
        }

        const user = users.find(
          (u) => u._id === task.assignedTo || u.email === task.assignedTo,
        );
        const priority = task.priority?.toLowerCase();

        validTasks.push({
          title: task.title.trim(),
          description: task.description.trim(),
          assignedTo: user?._id || task.assignedTo,
          deadline: task.deadline,
          priority: ["low", "normal", "high", "urgent"].includes(priority)
            ? priority
            : "normal",
          estimatedHours: parseFloat(task.estimatedHours) || 0,
          isApprovalRequired:
            task.isApprovalRequired === true ||
            task.isApprovalRequired === "true",
          evidenceRequired:
            task.evidenceRequired === true || task.evidenceRequired === "true",
        });
      });

      setValidationErrors(errors);
      if (errors.length) {
        toast.error(`${errors.length} validation error(s) found`);
      }

      if (validTasks.length) {
        setTasks(validTasks);
        setShowPreview(true);
        toast.success(`Loaded ${validTasks.length} valid tasks`);
      } else {
        toast.error("No valid tasks found");
      }
    },
    [users],
  );

  // Task operations
  const addEmptyTask = useCallback(() => {
    setTasks((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        assignedTo: "",
        deadline: "",
        priority: "normal",
        estimatedHours: 0,
        isApprovalRequired: false,
        evidenceRequired: false,
      },
    ]);
    setEditingIndex(tasks.length);
    setEditData(null);
    toast.success("New task added");
  }, [tasks.length]);

  const removeTask = useCallback((index: number) => {
    if (confirm("Remove this task?")) {
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

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term),
      );
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }

    filtered.sort((a, b) => {
      const aVal = a[sortField]?.toString().toLowerCase() || "";
      const bVal = b[sortField]?.toString().toLowerCase() || "";
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    return filtered;
  }, [tasks, searchTerm, filterPriority, sortField, sortDirection]);

  // Upload
  const handleBulkUpload = useCallback(async () => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }
    if (!tasks.length) {
      toast.error("No tasks to upload");
      return;
    }

    setUploading(true);
    try {
      const response = await api.post(
        `/tasks/project/${selectedProject}/bulk`,
        {
          tasks: tasks.map(
            ({
              title,
              description,
              assignedTo,
              deadline,
              priority,
              estimatedHours,
              isApprovalRequired,
              evidenceRequired,
            }) => ({
              title,
              description,
              assignedTo,
              deadline,
              priority,
              estimatedHours,
              isApprovalRequired,
              evidenceRequired,
            }),
          ),
        },
      );

      if (response.data.success) {
        const successful = response.data.data || [];
        setResult({
          success: true,
          message: response.data.message,
          successful,
          failed: [],
          total: tasks.length,
        });
        toast.success(`Successfully uploaded ${successful.length} tasks`);
        setTimeout(() => router.push("/tasks"), 2000);
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      const message = error.response?.data?.message || "Failed to upload tasks";
      toast.error(message);
      setResult({
        success: false,
        message,
        successful: [],
        failed: error.response?.data?.errors?.map((e: any, i: number) => ({
          index: i,
          task: {},
          error: e.message || e,
        })) || [{ index: 0, task: {}, error: message }],
        total: tasks.length,
      });
    } finally {
      setUploading(false);
    }
  }, [selectedProject, tasks, router]);

  // Download template
  const downloadTemplate = useCallback(
    (format: "json" | "csv") => {
      const sampleUser = users[0]?.email || "user@example.com";
      const sampleDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const template = [
        {
          title: "Example Task",
          description: "Task description",
          assignedTo: sampleUser,
          deadline: sampleDate,
          priority: "normal",
          estimatedHours: 4,
          isApprovalRequired: false,
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
                  Object.values(template[0])
                    .map((v) =>
                      typeof v === "string" && v.includes(",") ? `"${v}"` : v,
                    )
                    .join(","),
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

  // Reset
  const resetUpload = useCallback(() => {
    setTasks([]);
    setShowPreview(false);
    setValidationErrors([]);
    setResult(null);
    setSelectedProject("");
    setSearchTerm("");
    setFilterPriority("all");
  }, []);

  // Loading states
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/80">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
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
          <Link href="/tasks" className="hover:text-gray-700 transition">
            Tasks
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          <span className="text-gray-900 font-medium">Bulk Upload</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
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

        {/* Project Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project <span className="text-rose-500">*</span>
          </label>
          <div className="relative max-w-md">
            <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition cursor-pointer appearance-none"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {!projects.length && (
            <p className="text-amber-600 text-xs mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              No projects found. Please create a project first.
            </p>
          )}
        </div>

        {/* Upload Area */}
        {!showPreview && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-all ${
              dragActive
                ? "border-indigo-400 bg-indigo-50 scale-[1.02]"
                : "border-gray-300 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
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
              onChange={handleFileSelect}
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

        {/* Validation Errors */}
        {validationErrors.length > 0 && !showPreview && (
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-4 mt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-rose-700">
                  Validation Errors ({validationErrors.length})
                </h3>
                <ul className="mt-1 space-y-0.5">
                  {validationErrors.slice(0, 5).map((err, idx) => (
                    <li key={idx} className="text-xs text-rose-600">
                      {err.message}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li className="text-xs text-gray-500">
                      ... and {validationErrors.length - 5} more errors
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Task Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-6 space-y-4"
            >
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Task List ({tasks.length} tasks)
                  </h2>
                  <p className="text-sm text-gray-500">
                    Review and edit tasks before uploading
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
                    Upload New File
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  />
                </div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="all">All Priorities</option>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50/80 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assignee
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deadline
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTasks.map((task, index) => {
                        const originalIndex = tasks.indexOf(task);
                        return (
                          <TaskRow
                            key={originalIndex}
                            task={task}
                            index={originalIndex}
                            isEditing={editingIndex === originalIndex}
                            onEdit={startEdit}
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                            onRemove={removeTask}
                            users={users}
                            editData={editData}
                            setEditData={setEditData}
                          />
                        );
                      })}
                      {!filteredTasks.length && (
                        <tr>
                          <td
                            colSpan={8}
                            className="text-center py-8 text-gray-400"
                          >
                            {tasks.length
                              ? "No tasks match your filters"
                              : "No tasks to display"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stats & Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Total:{" "}
                    <strong className="text-gray-800">{tasks.length}</strong>
                  </span>
                  <span>
                    Valid:{" "}
                    <strong className="text-emerald-600">
                      {filteredTasks.length}
                    </strong>
                  </span>
                  {validationErrors.length > 0 && (
                    <span>
                      Errors:{" "}
                      <strong className="text-rose-600">
                        {validationErrors.length}
                      </strong>
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
                    disabled={uploading || !tasks.length || !selectedProject}
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
                        Upload {tasks.length} Task
                        {tasks.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Upload Results
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={CheckCircle}
                  label="Successful"
                  value={result.successful?.length || 0}
                  color="emerald"
                />
                <StatCard
                  icon={XCircle}
                  label="Failed"
                  value={result.failed?.length || 0}
                  color="rose"
                />
                <StatCard
                  icon={Users}
                  label="Total Tasks"
                  value={result.total || 0}
                  color="blue"
                />
                <StatCard
                  icon={Sparkles}
                  label="Status"
                  value={result.success ? "Completed" : "Failed"}
                  color={result.success ? "emerald" : "rose"}
                  subtitle={result.message}
                />
              </div>

              {result.failed?.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Errors:</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {result.failed.map((fail, idx) => (
                      <div
                        key={idx}
                        className="bg-rose-50 rounded-lg p-2.5 border border-rose-200"
                      >
                        <p className="text-sm text-rose-600">{fail.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (result.successful?.length > 0) {
                      router.push("/tasks");
                    } else {
                      resetUpload();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
                >
                  {result.successful?.length > 0 ? "View Tasks" : "Done"}
                </button>
                {result.failed?.length > 0 && (
                  <button
                    onClick={resetUpload}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition shadow-sm"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700">
                Need help with bulk upload?
              </p>
              <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
                <li>• Download the template to see the required format</li>
                <li>• Ensure all required fields (*) are filled</li>
                <li>• Assign users must exist in the system</li>
                <li>• Maximum 100 tasks per upload</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
