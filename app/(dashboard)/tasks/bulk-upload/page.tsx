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
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

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

export default function BulkUploadPage() {
  const { user, isAuthenticated } = useAuth();
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

  // Allow all authenticated users - removed role check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
  }, [isAuthenticated, router]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/auth/users");
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
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

      if (fileName.endsWith(".json")) {
        try {
          const jsonData = JSON.parse(content);
          let tasksArray = jsonData;
          if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
            tasksArray = jsonData.tasks;
          } else if (!Array.isArray(jsonData)) {
            toast.error(
              "JSON must be an array of tasks or have a 'tasks' array",
            );
            return;
          }
          validateAndSetTasks(tasksArray);
        } catch (error) {
          toast.error("Invalid JSON file. Please check the format.");
          console.error("JSON parse error:", error);
        }
      } else if (fileName.endsWith(".csv")) {
        const tasksArray = parseCSV(content);
        validateAndSetTasks(tasksArray);
      } else {
        toast.error("Please upload a JSON or CSV file");
      }
    };

    reader.readAsText(file);
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      toast.error("CSV must have headers and at least one data row");
      return [];
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const tasks = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i]
        .split(",")
        .map((v) => v.trim().replace(/^"|"$/g, ""));
      const task: any = {};

      headers.forEach((header, index) => {
        const rawValue = values[index] || "";
        let value: string | boolean = rawValue;

        // Check the string value before converting to boolean
        if (rawValue.toLowerCase() === "true") {
          value = true;
        } else if (rawValue.toLowerCase() === "false") {
          value = false;
        }

        task[header] = value;
      });

      tasks.push(task);
    }

    return tasks;
  };

  const validateAndSetTasks = (tasksData: any[]) => {
    if (!tasksData || tasksData.length === 0) {
      toast.error("No tasks found in file");
      return;
    }

    if (tasksData.length > 100) {
      toast.error("Maximum 100 tasks per bulk upload");
      return;
    }

    const validTasks: BulkTask[] = [];
    const errors: string[] = [];

    for (let i = 0; i < tasksData.length; i++) {
      const task = tasksData[i];
      const taskErrors = [];

      if (!task.title || task.title.trim() === "") {
        taskErrors.push(`Task ${i + 1}: Title is required`);
      }
      if (!task.description || task.description.trim() === "") {
        taskErrors.push(`Task ${i + 1}: Description is required`);
      }
      if (!task.assignedTo || task.assignedTo.trim() === "") {
        taskErrors.push(`Task ${i + 1}: AssignedTo is required`);
      }
      if (!task.deadline || task.deadline.trim() === "") {
        taskErrors.push(`Task ${i + 1}: Deadline is required`);
      }

      // Validate that assignedTo exists in users
      if (task.assignedTo && task.assignedTo.trim() !== "") {
        const userExists = users.some(
          (u) => u._id === task.assignedTo || u.email === task.assignedTo,
        );
        if (!userExists) {
          taskErrors.push(
            `Task ${i + 1}: Assigned user "${task.assignedTo}" not found`,
          );
        }
      }

      if (taskErrors.length > 0) {
        errors.push(...taskErrors);
      } else {
        // Convert email to ID if needed
        let assignedToId = task.assignedTo;
        const userByEmail = users.find((u) => u.email === task.assignedTo);
        if (userByEmail) {
          assignedToId = userByEmail._id;
        }

        validTasks.push({
          title: task.title.trim(),
          description: task.description.trim(),
          assignedTo: assignedToId,
          deadline: task.deadline,
          priority: ["low", "normal", "high", "urgent"].includes(
            task.priority?.toLowerCase(),
          )
            ? (task.priority.toLowerCase() as any)
            : "normal",
          estimatedHours: parseFloat(task.estimatedHours) || 0,
          isApprovalRequired:
            task.isApprovalRequired === true ||
            task.isApprovalRequired === "true",
          evidenceRequired:
            task.evidenceRequired === true || task.evidenceRequired === "true",
        });
      }
    }

    if (errors.length > 0) {
      console.error("Validation errors:", errors);
      toast.error(
        `${errors.length} validation errors. Please fix and try again.`,
      );
      if (errors[0]) toast.error(errors[0]);
    }

    if (validTasks.length > 0) {
      setTasks(validTasks);
      setShowPreview(true);
      toast.success(`Loaded ${validTasks.length} valid tasks.`);
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
        setResult(response.data);
        toast.success(response.data.message);

        setTimeout(() => {
          router.push("/tasks");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload tasks");
      if (error.response?.data?.errors) {
        setResult({
          successful: [],
          failed: error.response.data.errors.map(
            (err: string, index: number) => ({
              index,
              task: {},
              error: err,
            }),
          ),
          total: 0,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = (format: "json" | "csv") => {
    const sampleUser = users[0]?.email || "user@example.com";

    const template = [
      {
        title: "Example Task Title",
        description:
          "This is an example task description. Replace with your actual task details.",
        assignedTo: sampleUser,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        priority: "normal",
        estimatedHours: 4,
        isApprovalRequired: false,
        evidenceRequired: false,
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
    setTasks(tasks.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400">Please login to access this page.</p>
          <Link
            href="/login"
            className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/tasks"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition"
            >
              <ArrowLeft size={16} />
              Back to Tasks
            </Link>
            <h1 className="text-2xl font-bold text-white">Bulk Task Upload</h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload multiple tasks at once using JSON or CSV format
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadTemplate("json")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <FileJson size={16} />
              JSON Template
            </button>
            <button
              onClick={() => downloadTemplate("csv")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
            >
              <FileSpreadsheet size={16} />
              CSV Template
            </button>
          </div>
        </div>

        {/* Project Selection */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Select Project <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
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
              No projects found. Please create a project first.
            </p>
          )}
        </div>

        {/* Upload Area */}
        {!showPreview && (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
              dragActive
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-slate-700 bg-slate-900/30"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Upload Tasks File
            </h3>
            <p className="text-slate-400 text-sm mb-4">
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg cursor-pointer transition"
            >
              <FileText size={16} />
              Choose File
            </label>
            <p className="text-xs text-slate-500 mt-4">
              Supported formats: JSON (.json) or CSV (.csv)
            </p>
          </div>
        )}

        {/* Task Preview & Editor */}
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Task List ({tasks.length} tasks)
                </h2>
                <p className="text-sm text-slate-400">
                  Review and edit tasks before uploading
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addEmptyTask}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg flex items-center gap-1 transition"
                >
                  <Plus size={14} />
                  Add Task
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setTasks([]);
                    setResult(null);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition"
                >
                  Upload New File
                </button>
              </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-slate-800/50 border-b border-slate-800">
                  <tr>
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
                <tbody className="divide-y divide-slate-800">
                  {tasks.map((task, index) => (
                    <tr
                      key={index}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) =>
                            updateTask(index, "title", e.target.value)
                          }
                          className="w-full min-w-[150px] px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                          placeholder="Enter task title"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={task.description}
                          onChange={(e) =>
                            updateTask(index, "description", e.target.value)
                          }
                          className="w-full min-w-[200px] px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                          placeholder="Enter description"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={task.assignedTo}
                          onChange={(e) =>
                            updateTask(index, "assignedTo", e.target.value)
                          }
                          className="w-full min-w-[150px] px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer"
                        >
                          <option value="">Select user</option>
                          {users.map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.fullName} ({user.email})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={task.deadline}
                          onChange={(e) =>
                            updateTask(index, "deadline", e.target.value)
                          }
                          className="w-full min-w-[120px] px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={task.priority}
                          onChange={(e) =>
                            updateTask(index, "priority", e.target.value as any)
                          }
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer"
                        >
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={task.estimatedHours}
                          onChange={(e) =>
                            updateTask(
                              index,
                              "estimatedHours",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                          step="0.5"
                          min="0"
                          placeholder="Hours"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeTask(index)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200"
                          title="Remove task"
                        >
                          <Trash2 size={16} />
                        </button>
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
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpload}
                disabled={uploading || tasks.length === 0 || !selectedProject}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload {tasks.length} Tasks
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Upload Results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">
                      {result.data?.length || result.successful?.length || 0}
                    </p>
                    <p className="text-sm text-slate-400">Successful</p>
                  </div>
                </div>
              </div>
              <div className="bg-rose-500/10 rounded-lg p-4 border border-rose-500/20">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-rose-400" />
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
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-400">Errors:</h3>
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

            <button
              onClick={() => {
                setResult(null);
                setShowPreview(false);
                setTasks([]);
                setSelectedProject("");
                if (result.data?.length > 0 || result.successful?.length > 0) {
                  router.push("/tasks");
                }
              }}
              className="mt-4 w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
