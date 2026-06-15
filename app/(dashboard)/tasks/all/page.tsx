"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Calendar,
  Flag,
  Search,
  X,
  Eye,
  RefreshCw,
  Loader2,
  LayoutGrid,
  List,
  Upload,
  FolderKanban,
  Filter,
  Timer,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "in_progress" | "submitted" | "completed" | "overdue";
  deadline: string;
  estimatedHours: number;
  projectId?: { _id: string; name: string; code: string };
  assignedTo: { _id: string; fullName: string; email: string };
  assignedBy: { _id: string; fullName: string };
  createdAt: string;
}

export default function TaskBoardPage() {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  const canManageTasks = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
    "line_manager",
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get("/projects");
      if (response.data.success) setProjects(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tasks");
      if (response.data.success) {
        setTasks(response.data.data || []);
        if (response.data.stats) setStats(response.data.stats);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, {
        status: newStatus,
      });
      if (response.data.success) {
        toast.success(`Task moved to ${newStatus.replace("_", " ")}`);
        setTasks((prev) =>
          prev.map((task) =>
            task._id === taskId
              ? { ...task, status: newStatus as Task["status"] }
              : task,
          ),
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
      await fetchTasks();
    }
  };

  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(event.active.id as string);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    let targetStatus: string | null = null;
    const columnIds = [
      "pending",
      "in_progress",
      "submitted",
      "completed",
      "overdue",
    ];

    for (const colId of columnIds) {
      if (over.id === colId) {
        targetStatus = colId;
        break;
      }
    }

    if (!targetStatus) {
      const overTask = tasks.find((t) => t._id === over.id);
      if (overTask) targetStatus = overTask.status;
    }

    if (targetStatus && targetStatus !== activeTask.status) {
      await handleStatusChange(activeTask._id, targetStatus);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      !selectedPriority || task.priority === selectedPriority;
    const matchesProject =
      !selectedProject || task.projectId?._id === selectedProject;
    return matchesSearch && matchesPriority && matchesProject;
  });

  const columns = [
    {
      id: "pending",
      title: "To Do",
      icon: Clock,
      color: "amber",
      tasks: filteredTasks.filter((t) => t.status === "pending"),
    },
    {
      id: "in_progress",
      title: "In Progress",
      icon: CheckSquare,
      color: "sky",
      tasks: filteredTasks.filter((t) => t.status === "in_progress"),
    },
    {
      id: "submitted",
      title: "Review",
      icon: CheckCircle,
      color: "purple",
      tasks: filteredTasks.filter((t) => t.status === "submitted"),
    },
    {
      id: "completed",
      title: "Done",
      icon: CheckCircle,
      color: "emerald",
      tasks: filteredTasks.filter((t) => t.status === "completed"),
    },
    {
      id: "overdue",
      title: "Overdue",
      icon: AlertCircle,
      color: "rose",
      tasks: filteredTasks.filter((t) => t.status === "overdue"),
    },
  ];

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-500/10 text-emerald-400",
      normal: "bg-blue-500/10 text-blue-400",
      high: "bg-amber-500/10 text-amber-400",
      urgent: "bg-rose-500/10 text-rose-400",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-amber-500/10 text-amber-400",
      in_progress: "bg-sky-500/10 text-sky-400",
      submitted: "bg-purple-500/10 text-purple-400",
      completed: "bg-emerald-500/10 text-emerald-400",
      overdue: "bg-rose-500/10 text-rose-400",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays}d`;
  };

  const getActiveTask = () => tasks.find((task) => task._id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="ps-8 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
        {/* Header Section - Fixed height */}
        <div className="shrink-0 p-4 lg:p-6 space-y-4 border-b border-slate-800/50">
          {/* Title and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Task Board
              </h1>
              <p className="text-slate-400 text-sm">
                Drag and drop tasks between columns
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-800/50 rounded-xl p-0.5">
                <button
                  onClick={() => setView("kanban")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    view === "kanban"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span>Kanban</span>
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all ${
                    view === "list"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <List size={14} />
                  <span>List</span>
                </button>
              </div>
              {canManageTasks && (
                <>
                  <Link href="/tasks/bulk-upload">
                    <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg flex items-center gap-1">
                      <Upload size={14} />
                      <span>Bulk</span>
                    </button>
                  </Link>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Create</span>
                  </button>
                </>
              )}
              <button
                onClick={fetchTasks}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Stats - Row of cards */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Total", value: stats.total, color: "indigo" },
              { label: "Pending", value: stats.pending, color: "amber" },
              { label: "Progress", value: stats.inProgress, color: "sky" },
              { label: "Done", value: stats.completed, color: "emerald" },
              { label: "Overdue", value: stats.overdue, color: "rose" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-900/50 rounded-xl p-3 border border-slate-800"
              >
                <p className={`text-xl font-bold text-${stat.color}-400`}>
                  {stat.value}
                </p>
                <p className="text-[10px] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 bg-slate-800/50 rounded-lg flex items-center gap-1 text-slate-400 hover:text-white text-sm"
            >
              <Filter size={12} />
              Filters
            </button>
            {showFilters && (
              <>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="">All Projects</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="">All Priority</option>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedPriority("");
                    setSelectedProject("");
                  }}
                  className="px-3 py-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-white text-sm"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Kanban Board - Takes remaining space, no scroll */}
        {view === "kanban" && (
          <div className="flex-1 min-h-0 p-4 lg:p-6 pt-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 h-full">
                {columns.map((column) => (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    tasks={column.tasks}
                    getPriorityColor={getPriorityColor}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onTaskClick={setSelectedTask}
                    activeId={activeId}
                  />
                ))}
              </div>

              <DragOverlay dropAnimation={{ duration: 200 }}>
                {activeId ? (
                  <div className="bg-linear-to-br from-indigo-800 to-indigo-900 rounded-lg p-3 border-2 border-indigo-500 shadow-2xl w-[320px] opacity-95">
                    {(() => {
                      const task = getActiveTask();
                      if (!task) return null;
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                          <h4 className="text-white text-sm font-medium mb-1">
                            {task.title}
                          </h4>
                          <p className="text-slate-300 text-xs line-clamp-2 mb-2">
                            {task.description}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-indigo-700/50">
                            <div className="flex items-center gap-1">
                              <div className="w-5 h-5 rounded-full bg-indigo-400 flex items-center justify-center">
                                <span className="text-white text-[8px] font-bold">
                                  {task.assignedTo?.fullName?.charAt(0) || "?"}
                                </span>
                              </div>
                              <span className="text-[9px] text-indigo-200">
                                {task.assignedTo?.fullName?.split(" ")[0] ||
                                  "Unassigned"}
                              </span>
                            </div>
                            {task.deadline && (
                              <div className="flex items-center gap-0.5">
                                <Calendar
                                  size={8}
                                  className="text-indigo-300"
                                />
                                <span className="text-[8px] text-indigo-200">
                                  {formatDate(task.deadline)}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {/* List View */}
        {view === "list" && (
          <div className="flex-1 overflow-auto p-4 lg:p-6 pt-2">
            <div className="bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Task
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Priority
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Assignee
                      </th>
                      <th className="text-left px-4 py-3 text-xs text-slate-400">
                        Deadline
                      </th>
                      <th className="text-center px-4 py-3 text-xs text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredTasks.slice(0, 100).map((task) => (
                      <tr
                        key={task._id}
                        className="hover:bg-slate-800/30 cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">
                            {task.title}
                          </p>
                          <p className="text-slate-500 text-xs line-clamp-1">
                            {task.description}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {task.assignedTo?.fullName?.split(" ")[0] || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-400">
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="p-1 text-slate-500 hover:text-indigo-400">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No tasks found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        {selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onStatusChange={handleStatusChange}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        )}

        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={fetchTasks}
        />
      </div>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  tasks,
  getPriorityColor,
  getStatusColor,
  formatDate,
  onTaskClick,
  activeId,
}: any) {
  const { setNodeRef } = useSortable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-[340px] h-full flex flex-col bg-slate-900/40 rounded-xl border border-slate-800 backdrop-blur-sm transition-all duration-200 ${
        activeId ? "ring-1 ring-indigo-500/50" : ""
      }`}
    >
      {/* Column Header */}
      <div
        className={`shrink-0 p-3 border-b border-slate-800 bg-linear-to-r from-${column.color}-500/10 to-transparent rounded-t-xl`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-lg bg-${column.color}-500/20`}>
              <column.icon size={12} className={`text-${column.color}-400`} />
            </div>
            <h3 className="text-sm font-semibold text-white">{column.title}</h3>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full bg-${column.color}-500/20 text-${column.color}-400`}
            >
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Column Tasks - No scroll, just fill height */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        <SortableContext
          items={tasks.map((t: Task) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task: Task) => (
            <TaskCard
              key={task._id}
              task={task}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
              formatDate={formatDate}
              onTaskClick={onTaskClick}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs border-2 border-dashed border-slate-700 rounded-lg">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  getPriorityColor,
  getStatusColor,
  formatDate,
  onTaskClick,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick(task)}
      className="bg-linear-to-br from-slate-800 to-slate-900/80 rounded-lg p-3 border border-slate-700 hover:border-indigo-500/50 transition-all cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}
        >
          {task.priority.toUpperCase()}
        </span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded-full ${getStatusColor(task.status)}`}
        >
          {task.status.replace("_", " ")}
        </span>
        {task.estimatedHours > 0 && (
          <div className="flex items-center gap-0.5 text-[9px] text-slate-500">
            <Timer size={8} />
            <span>{task.estimatedHours}h</span>
          </div>
        )}
      </div>

      <h4 className="text-white text-sm font-medium mb-1 line-clamp-2">
        {task.title}
      </h4>
      <p className="text-slate-400 text-xs line-clamp-2 mb-2">
        {task.description}
      </p>

      {task.projectId && (
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
            <FolderKanban size={8} />
            <span className="truncate max-w-[100px]">
              {task.projectId.name}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">
              {task.assignedTo?.fullName?.charAt(0) || "?"}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 truncate max-w-[80px]">
            {task.assignedTo?.fullName?.split(" ")[0] || "Unassigned"}
          </span>
        </div>
        {task.deadline && (
          <div className="flex items-center gap-0.5">
            <Calendar size={8} className="text-slate-500" />
            <span
              className={`text-[8px] ${formatDate(task.deadline) === "Overdue" ? "text-rose-400" : "text-slate-500"}`}
            >
              {formatDate(task.deadline)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Task Details Modal
function TaskDetailsModal({
  task,
  onClose,
  onStatusChange,
  getPriorityColor,
  getStatusColor,
}: any) {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    await onStatusChange(task._id, newStatus);
    setUpdating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}
            >
              {task.priority.toUpperCase()}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}
            >
              {task.status.replace("_", " ").toUpperCase()}
            </span>
          </div>
          <p className="text-slate-300 text-sm">{task.description}</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Assignee:</span>
              <span className="text-white">
                {task.assignedTo?.fullName || "Unassigned"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Deadline:</span>
              <span className="text-white">
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Hours:</span>
              <span className="text-white">{task.estimatedHours}h</span>
            </div>
          </div>
          <div className="flex gap-2 pt-3">
            <select
              value={task.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updating}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
