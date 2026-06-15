"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  ArrowLeft,
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
  Eye,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

export default function BulkUploadPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<BulkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  );
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<BulkTask | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [authLoading, isAuthenticated, router]);

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
      const response = await api.get("/users");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    const fileName = file.name;
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;

      try {
        let tasksArray: any[] = [];

        if (fileName.endsWith(".json")) {
          const jsonData = JSON.parse(content);
          if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
            tasksArray = jsonData.tasks;
          } else if (Array.isArray(jsonData)) {
            tasksArray = jsonData;
          } else {
            toast.error(
              "JSON must be an array of tasks or have a 'tasks' array",
            );
            return;
          }
        } else if (fileName.endsWith(".csv")) {
          tasksArray = parseCSV(content);
        } else {
          toast.error("Please upload a JSON or CSV file");
          return;
        }

        if (tasksArray.length === 0) {
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
        toast.error(
          error.message || "Invalid file format. Please check the file.",
        );
      }
    };

    reader.readAsText(file);
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have headers and at least one data row");
    }

    const rawHeaders = lines[0].split(",").map((h) => h.trim().toLowerCase());

    // Map common column names to expected field names
    const headerMap: { [key: string]: string } = {
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
      priorities: "priority",

      estimatedhours: "estimatedHours",
      "estimated hours": "estimatedHours",
      hours: "estimatedHours",
      "est hours": "estimatedHours",

      isapprovalrequired: "isApprovalRequired",
      "approval required": "isApprovalRequired",
      "requires approval": "isApprovalRequired",

      evidencerequired: "evidenceRequired",
      "evidence required": "evidenceRequired",
      "requires evidence": "evidenceRequired",
    };

    const headers = rawHeaders.map((h) => headerMap[h] || h);
    console.log("Mapped Headers:", headers);

    const tasks = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      // Handle quoted values properly
      const values: string[] = [];
      let inQuote = false;
      let currentValue = "";

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === "," && !inQuote) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      const task: any = {};
      headers.forEach((header, index) => {
        let rawValue = values[index] || "";
        // Remove surrounding quotes
        rawValue = rawValue.replace(/^"|"$/g, "");

        let value: any = rawValue;

        // Only process if it's a string
        if (typeof value === "string") {
          const trimmedValue = value.trim();

          if (trimmedValue === "") {
            // Set defaults for empty values
            if (header === "estimatedHours") value = 0;
            else if (header === "priority") value = "normal";
            else if (header === "isApprovalRequired") value = false;
            else if (header === "evidenceRequired") value = false;
            else value = "";
          } else if (header === "estimatedHours") {
            const num = parseFloat(trimmedValue);
            value = isNaN(num) ? 0 : num;
          } else if (
            header === "isApprovalRequired" ||
            header === "evidenceRequired"
          ) {
            const lower = trimmedValue.toLowerCase();
            value = lower === "true" || lower === "yes" || lower === "1";
          } else if (header === "priority") {
            const lower = trimmedValue.toLowerCase();
            if (["low", "normal", "high", "urgent"].includes(lower)) {
              value = lower;
            } else {
              value = "normal";
            }
          } else {
            value = trimmedValue;
          }
        }

        task[header] = value;
      });

      tasks.push(task);
    }

    return tasks;
  };

  const validateAndSetTasks = (tasksData: any[]) => {
    const validTasks: BulkTask[] = [];
    const errors: ValidationError[] = [];

    for (let i = 0; i < tasksData.length; i++) {
      const task = tasksData[i];

      // Validate required fields
      if (!task.title || task.title.trim() === "") {
        errors.push({
          index: i,
          field: "title",
          message: `Task ${i + 1}: Title is required`,
        });
        continue;
      }
      if (!task.description || task.description.trim() === "") {
        errors.push({
          index: i,
          field: "description",
          message: `Task ${i + 1}: Description is required`,
        });
        continue;
      }
      if (!task.assignedTo || task.assignedTo.trim() === "") {
        errors.push({
          index: i,
          field: "assignedTo",
          message: `Task ${i + 1}: AssignedTo is required`,
        });
        continue;
      }
      if (!task.deadline || task.deadline.trim() === "") {
        errors.push({
          index: i,
          field: "deadline",
          message: `Task ${i + 1}: Deadline is required`,
        });
        continue;
      }

      // Validate date format
      const deadlineDate = new Date(task.deadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.push({
          index: i,
          field: "deadline",
          message: `Task ${i + 1}: Invalid deadline format. Use YYYY-MM-DD`,
        });
        continue;
      }

      // Validate assignedTo exists in users
      let assignedToId = task.assignedTo;
      const userByEmail = users.find((u) => u.email === task.assignedTo);
      const userById = users.find((u) => u._id === task.assignedTo);

      if (!userByEmail && !userById) {
        errors.push({
          index: i,
          field: "assignedTo",
          message: `Task ${i + 1}: Assigned user "${task.assignedTo}" not found`,
        });
        continue;
      }

      if (userByEmail) {
        assignedToId = userByEmail._id;
      }

      // Validate priority
      const validPriorities = ["low", "normal", "high", "urgent"];
      const priority = task.priority?.toLowerCase();
      if (priority && !validPriorities.includes(priority)) {
        errors.push({
          index: i,
          field: "priority",
          message: `Task ${i + 1}: Invalid priority. Use low, normal, high, or urgent`,
        });
        continue;
      }

      validTasks.push({
        title: task.title.trim(),
        description: task.description.trim(),
        assignedTo: assignedToId,
        deadline: task.deadline,
        priority: validPriorities.includes(priority)
          ? (priority as any)
          : "normal",
        estimatedHours: parseFloat(task.estimatedHours) || 0,
        isApprovalRequired:
          task.isApprovalRequired === true ||
          task.isApprovalRequired === "true",
        evidenceRequired:
          task.evidenceRequired === true || task.evidenceRequired === "true",
      });
    }

    setValidationErrors(errors);

    if (errors.length > 0) {
      toast.error(
        `${errors.length} validation error(s). Please check the table below.`,
      );
      errors.slice(0, 3).forEach((err) => toast.error(err.message));
    }

    if (validTasks.length > 0) {
      setTasks(validTasks);
      setShowPreview(true);
      toast.success(
        `Loaded ${validTasks.length} valid tasks. ${errors.length} tasks have errors.`,
      );
    } else if (errors.length > 0) {
      toast.error("No valid tasks found. Please fix the errors.");
    } else {
      toast.error("No valid tasks found. Please check the file format.");
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }

    if (tasks.length === 0) {
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
        setResult({
          success: true,
          message: response.data.message,
          data: response.data.data,
          successful: response.data.data || [],
          failed: [],
          total: tasks.length,
        });
        toast.success(response.data.message);

        // Auto redirect after 3 seconds
        setTimeout(() => {
          router.push("/tasks");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to upload tasks";
      toast.error(errorMessage);

      setResult({
        success: false,
        message: errorMessage,
        successful: [],
        failed: error.response?.data?.errors?.map(
          (err: any, index: number) => ({
            index,
            task: {},
            error: err.message || err,
          }),
        ) || [{ index: 0, task: {}, error: errorMessage }],
        total: tasks.length,
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = (format: "json" | "csv") => {
    const sampleUser = users[0]?.email || "user@example.com";
    const sampleDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const template = [
      {
        title: "Example Task Title",
        description:
          "This is an example task description. Replace with your actual task details.",
        assignedTo: sampleUser,
        deadline: sampleDate,
        priority: "normal",
        estimatedHours: 4,
        isApprovalRequired: false,
        evidenceRequired: false,
      },
      {
        title: "Another Task Example",
        description: "Complete the project documentation",
        assignedTo: sampleUser,
        deadline: sampleDate,
        priority: "high",
        estimatedHours: 8,
        isApprovalRequired: true,
        evidenceRequired: true,
      },
    ];

    if (format === "json") {
      const blob = new Blob([JSON.stringify(template, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "task-template.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("JSON template downloaded");
    } else {
      const headers = Object.keys(template[0]);
      const csvRows = [
        headers.join(","),
        ...template.map((task) =>
          headers
            .map((header) => {
              const value = task[header as keyof typeof task];
              if (
                typeof value === "string" &&
                (value.includes(",") || value.includes('"'))
              ) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(","),
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "task-template.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV template downloaded");
    }
  };

  const addEmptyTask = () => {
    setTasks([
      ...tasks,
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
    toast.success("New task added. Please fill in the details.");
  };

  const updateTask = (
    index: number,
    field: keyof BulkTask,
    value: string | number | boolean,
  ) => {
    setTasks((prevTasks) => {
      const updated = [...prevTasks];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeTask = (index: number) => {
    if (confirm("Are you sure you want to remove this task?")) {
      setTasks(tasks.filter((_, i) => i !== index));
      toast.success("Task removed");
    }
  };

  const startEditTask = (index: number) => {
    setEditingTask(index);
    setEditFormData({ ...tasks[index] });
  };

  const saveEditTask = (index: number) => {
    if (editFormData) {
      setTasks((prev) => {
        const updated = [...prev];
        updated[index] = editFormData;
        return updated;
      });
      setEditingTask(null);
      setEditFormData(null);
      toast.success("Task updated");
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditFormData(null);
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u._id === userId);
    return user ? `${user.fullName} (${user.email})` : "Unknown User";
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 animate-pulse" />
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-6 lg:p-8">
        <div className="w-full mx-auto space-y-6 px-5">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
          >
            <div>
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition group"
              >
                <ArrowLeft
                  size={16}
                  className="group-hover:-translate-x-1 transition"
                />
                Back to Tasks
              </Link>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Bulk Task Upload
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Upload multiple tasks at once using JSON or CSV format
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadTemplate("json")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all hover:scale-105"
              >
                <FileJson size={16} />
                JSON Template
              </button>
              <button
                onClick={() => downloadTemplate("csv")}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition-all hover:scale-105"
              >
                <FileSpreadsheet size={16} />
                CSV Template
              </button>
            </div>
          </motion.div>

          {/* Project Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-6"
          >
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Project <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name} ({project.code})
                  </option>
                ))}
              </select>
            </div>
            {projects.length === 0 && (
              <p className="text-amber-400 text-xs mt-2">
                ⚠️ No projects found. Please create a project first.
              </p>
            )}
          </motion.div>

          {/* Upload Area */}
          {!showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? "border-indigo-500 bg-indigo-500/10 scale-105"
                  : "border-slate-700 bg-slate-900/30 hover:border-indigo-500/50 hover:bg-slate-800/30"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload Tasks File
              </h3>
              <p className="text-slate-400 mb-4">
                Drag and drop a JSON or CSV file, or click to select
              </p>
              <input
                type="file"
                id="file-upload"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg cursor-pointer transition-all hover:scale-105"
              >
                <FileText size={16} />
                Choose File
              </label>
              <p className="text-xs text-slate-500 mt-4">
                Supported formats: JSON (.json) or CSV (.csv)
                <br />
                Maximum 100 tasks per upload
              </p>
            </motion.div>
          )}

          {/* Validation Errors Summary */}
          {validationErrors.length > 0 && !showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 rounded-xl border border-rose-500/20 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-rose-400 mb-2">
                    Validation Errors ({validationErrors.length})
                  </h3>
                  <ul className="space-y-1">
                    {validationErrors.slice(0, 5).map((err, idx) => (
                      <li key={idx} className="text-xs text-rose-300">
                        {err.message}
                      </li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li className="text-xs text-slate-400">
                        ... and {validationErrors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* Task Preview & Editor */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Task List ({tasks.length} tasks)
                    </h2>
                    <p className="text-sm text-slate-400">
                      Review and edit tasks before uploading
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addEmptyTask}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-2 transition"
                    >
                      <Plus size={14} />
                      Add Task
                    </button>
                    <button
                      onClick={() => {
                        setShowPreview(false);
                        setTasks([]);
                        setValidationErrors([]);
                        setResult(null);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition"
                    >
                      Upload New File
                    </button>
                  </div>
                </div>

                {/* Tasks Table */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead className="bg-slate-800/50 border-b border-slate-700">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                          #
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                          Title <span className="text-rose-400">*</span>
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                          Description <span className="text-rose-400">*</span>
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                          Assignee <span className="text-rose-400">*</span>
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                          Deadline <span className="text-rose-400">*</span>
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                          Priority
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">
                          Est. Hours
                        </th>
                        <th className="text-center px-4 py-3 text-xs text-slate-400 font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {tasks.map((task, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            {editingTask === index ? (
                              <input
                                type="text"
                                value={editFormData?.title || ""}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData!,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full min-w-[150px] px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                              />
                            ) : (
                              <div
                                className="text-white text-sm max-w-[200px] truncate"
                                title={task.title}
                              >
                                {task.title}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingTask === index ? (
                              <input
                                type="text"
                                value={editFormData?.description || ""}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData!,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full min-w-[200px] px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                              />
                            ) : (
                              <div
                                className="text-slate-300 text-sm max-w-[250px] truncate"
                                title={task.description}
                              >
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingTask === index ? (
                              <select
                                value={editFormData?.assignedTo || ""}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData!,
                                    assignedTo: e.target.value,
                                  })
                                }
                                className="w-full min-w-[150px] px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                              >
                                <option value="">Select user</option>
                                {users.map((user) => (
                                  <option key={user._id} value={user._id}>
                                    {user.fullName} ({user.email})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-white text-sm">
                                {getUserName(task.assignedTo)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingTask === index ? (
                              <input
                                type="date"
                                value={editFormData?.deadline || ""}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData!,
                                    deadline: e.target.value,
                                  })
                                }
                                className="w-full min-w-[120px] px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                              />
                            ) : (
                              <div className="text-white text-sm">
                                {task.deadline}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingTask === index ? (
                              <select
                                value={editFormData?.priority}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData!,
                                    priority: e.target.value as any,
                                  })
                                }
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                              >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                  task.priority === "urgent"
                                    ? "bg-rose-500/20 text-rose-400"
                                    : task.priority === "high"
                                      ? "bg-amber-500/20 text-amber-400"
                                      : task.priority === "normal"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-emerald-500/20 text-emerald-400"
                                }`}
                              >
                                <Flag size={10} />
                                {task.priority}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingTask === index ? (
                              <input
                                type="number"
                                value={editFormData?.estimatedHours || 0}
                                onChange={(e) =>
                                  setEditFormData({
                                    ...editFormData!,
                                    estimatedHours:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
                                step="0.5"
                              />
                            ) : (
                              <div className="flex items-center gap-1 text-white text-sm">
                                <Clock size={12} className="text-slate-500" />
                                {task.estimatedHours}h
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {editingTask === index ? (
                                <>
                                  <button
                                    onClick={() => saveEditTask(index)}
                                    className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition"
                                    title="Save"
                                  >
                                    <Save size={16} />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditTask(index)}
                                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition"
                                    title="Edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => removeTask(index)}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                                    title="Remove"
                                  >
                                    <Trash2 size={14} />
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

                {/* Upload Button */}
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      setTasks([]);
                    }}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={
                      uploading || tasks.length === 0 || !selectedProject
                    }
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload {tasks.length} Task
                        {tasks.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
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
                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border border-slate-700 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-4">
                  Upload Results
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                      <div>
                        <p className="text-2xl font-bold text-emerald-400">
                          {result.successful?.length ||
                            result.data?.length ||
                            0}
                        </p>
                        <p className="text-sm text-slate-400">Successful</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-rose-500/10 rounded-lg p-4 border border-rose-500/20">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-8 h-8 text-rose-400" />
                      <div>
                        <p className="text-2xl font-bold text-rose-400">
                          {result.failed?.length || 0}
                        </p>
                        <p className="text-sm text-slate-400">Failed</p>
                      </div>
                    </div>
                  </div>
                </div>

                {result.failed?.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h3 className="text-sm font-medium text-slate-400">
                      Errors:
                    </h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {result.failed.map((fail: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20"
                        >
                          <p className="text-sm text-rose-400">{fail.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setResult(null);
                      setShowPreview(false);
                      setTasks([]);
                      setSelectedProject("");
                      if (
                        result.successful?.length > 0 ||
                        result.data?.length > 0
                      ) {
                        router.push("/tasks");
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                  >
                    Done
                  </button>
                  {result.failed?.length > 0 && (
                    <button
                      onClick={() => {
                        setResult(null);
                      }}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
