// components/tasks/DependencyEditor.tsx - COMPLETE FIXED VERSION (No infinite loop)

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    X,
    Plus,
    Trash2,
    GitBranch,
    AlertCircle,
    CheckCircle,
    Loader2,
    ArrowRight,
    Clock,
    Calendar,
    User,
    FolderKanban,
    Search,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Dependency {
    _id?: string;
    taskId: {
        _id: string;
        title: string;
        status: string;
        deadline: string;
    };
    type: "FS" | "SS" | "FF" | "SF";
    lag: number;
    addedAt?: string;
}

interface Task {
    _id: string;
    title: string;
    status: string;
    deadline: string;
    projectId?: {
        _id: string;
        name: string;
    };
    assignedTo?: {
        _id: string;
        fullName: string;
    };
}

interface DependencyEditorProps {
    taskId: string;
    isOpen: boolean;
    onClose: () => void;
    onDependencyUpdated: () => void;
}

const DEPENDENCY_TYPES = [
    { value: "FS", label: "Finish to Start (FS)", description: "Task B starts after Task A finishes" },
    { value: "SS", label: "Start to Start (SS)", description: "Task B starts when Task A starts" },
    { value: "FF", label: "Finish to Finish (FF)", description: "Task B finishes when Task A finishes" },
    { value: "SF", label: "Start to Finish (SF)", description: "Task B finishes when Task A starts" },
];

const STATUS_COLORS = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    in_progress: "bg-sky-100 text-sky-700 border-sky-200",
    submitted: "bg-purple-100 text-purple-700 border-purple-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    overdue: "bg-rose-100 text-rose-700 border-rose-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
};

const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        pending: "Pending",
        in_progress: "In Progress",
        submitted: "Submitted",
        completed: "Completed",
        overdue: "Overdue",
        rejected: "Rejected",
    };
    return labels[status] || status;
};

export default function DependencyEditor({
    taskId,
    isOpen,
    onClose,
    onDependencyUpdated,
}: DependencyEditorProps) {
    const [dependencies, setDependencies] = useState<Dependency[]>([]);
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [selectedType, setSelectedType] = useState<"FS" | "SS" | "FF" | "SF">("FS");
    const [lag, setLag] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [blockedTasks, setBlockedTasks] = useState<any[]>([]);

    // ✅ Use ref to prevent infinite loop
    const isFirstRender = useRef(true);

    // ✅ FIXED: fetchData function - no dependencies state in dependency array
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            console.log("🔍 Fetching dependencies for task:", taskId);

            // Fetch dependencies
            let depsRes;
            try {
                depsRes = await api.get(`/tasks/${taskId}/dependencies`);
                console.log("📋 Dependencies response:", depsRes.data);
            } catch (err: any) {
                console.log("⚠️ Dependencies API error:", err.response?.status);
                if (err.response?.status === 404) {
                    depsRes = { data: { success: true, data: { predecessors: [], dependents: [] } } };
                } else {
                    throw err;
                }
            }

            if (depsRes?.data?.success) {
                const data = depsRes.data.data || {};
                setDependencies(data.predecessors || []);
                setBlockedTasks(data.status?.blockedBy || []);
            }

            // ✅ Fetch ALL tasks (no status filter)
            console.log("🔍 Fetching all tasks for selection...");
            const tasksRes = await api.get('/tasks');

            if (tasksRes.data.success) {
                const allTasks = tasksRes.data.data || [];
                console.log(`📋 Found ${allTasks.length} total tasks`);

                // Get existing dependency IDs
                const existingIds = (depsRes?.data?.data?.predecessors || []).map(
                    (d: any) => d._id || d.taskId?._id
                );

                // Filter tasks
                const filtered = allTasks.filter((t: any) => {
                    const isSelf = t._id === taskId;
                    const isExisting = existingIds.includes(t._id);
                    const isCompleted = t.status === 'completed' || t.status === 'done';
                    const isRejected = t.status === 'rejected';
                    return !isSelf && !isExisting && !isCompleted && !isRejected;
                });

                console.log(`✅ Available for selection: ${filtered.length} tasks`);
                setAvailableTasks(filtered);
            }

        } catch (error: any) {
            console.error("❌ Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [taskId]); // ✅ Only taskId dependency, NOT dependencies

    // ✅ FIXED: useEffect - only run when isOpen changes
    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, fetchData]);

    // Add dependency
    const handleAddDependency = async () => {
        if (!selectedTaskId) {
            toast.error("Please select a task");
            return;
        }

        setAdding(true);
        try {
            console.log("🔗 Adding dependency:", {
                taskId,
                dependencyTaskId: selectedTaskId,
                type: selectedType,
                lag,
            });

            const response = await api.post(`/tasks/${taskId}/dependencies`, {
                dependencyTaskId: selectedTaskId,
                type: selectedType,
                lag: lag,
            });

            if (response.data.success) {
                toast.success("Dependency added successfully! 🔗");
                await fetchData(); // ✅ This will re-fetch but won't cause infinite loop
                onDependencyUpdated();
                setSelectedTaskId("");
                setSelectedType("FS");
                setLag(0);
                setSearchTerm("");
            }
        } catch (error: any) {
            console.error("❌ Error adding dependency:", error);
            const msg = error.response?.data?.message || "Failed to add dependency";
            toast.error(msg);

            if (msg.includes("circular")) {
                toast.error("🔄 Circular dependency detected! Please fix.");
            }
        } finally {
            setAdding(false);
        }
    };

    // Remove dependency
    const handleRemoveDependency = async (dependencyId: string) => {
        if (!confirm("Remove this dependency?")) return;

        setRemoving(dependencyId);
        try {
            const response = await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
            if (response.data.success) {
                toast.success("Dependency removed successfully");
                await fetchData(); // ✅ This will re-fetch but won't cause infinite loop
                onDependencyUpdated();
            }
        } catch (error: any) {
            console.error("Error removing dependency:", error);
            toast.error(error.response?.data?.message || "Failed to remove dependency");
        } finally {
            setRemoving(null);
        }
    };

    // Filter available tasks
    const filteredTasks = availableTasks.filter((task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.projectId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get blocked status
    const isBlocked = blockedTasks.length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-linear-to-r from-indigo-50/80 to-purple-50/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl">
                            <GitBranch className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Task Dependencies
                            </h2>
                            <p className="text-xs text-gray-500">
                                Manage task dependencies and relationships
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5 overflow-y-auto flex-1">
                    {/* Blocked Status */}
                    {isBlocked && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-rose-700">
                                        Task is Blocked! ⚠️
                                    </p>
                                    <p className="text-xs text-rose-600 mt-1">
                                        This task is blocked by the following dependencies:
                                    </p>
                                    <ul className="mt-2 space-y-1">
                                        {blockedTasks.map((task) => (
                                            <li
                                                key={task._id}
                                                className="flex items-center gap-2 text-xs text-rose-700 bg-rose-100 px-3 py-1.5 rounded-lg"
                                            >
                                                <AlertCircle className="w-3 h-3" />
                                                {task.title} ({getStatusLabel(task.status)})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Dependency */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-indigo-600" />
                            Add Dependency
                        </p>

                        <div className="space-y-3">
                            {/* Task Select */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Select Predecessor Task <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tasks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 text-black pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    />
                                </div>
                                <div className="relative mt-2">
                                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <select
                                        value={selectedTaskId}
                                        onChange={(e) => setSelectedTaskId(e.target.value)}
                                        className="w-full pl-9 text-black pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition appearance-none cursor-pointer"
                                        disabled={loading}
                                    >
                                        <option value="">{loading ? "Loading tasks..." : "Select a task..."}</option>
                                        {filteredTasks.map((task) => (
                                            <option key={task._id} value={task._id}>
                                                {task.title} ({getStatusLabel(task.status)})
                                                {task.projectId && ` - ${task.projectId.name}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {filteredTasks.length === 0 && !loading && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        No available tasks to add as dependency
                                    </p>
                                )}
                                {availableTasks.length > 0 && filteredTasks.length === 0 && searchTerm && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        No tasks match your search
                                    </p>
                                )}
                            </div>

                            {/* Dependency Type */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Dependency Type
                                    </label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value as any)}
                                        className="w-full px-4 text-black py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    >
                                        {DEPENDENCY_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Lag (days)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="365"
                                        value={lag}
                                        onChange={(e) => setLag(parseInt(e.target.value) || 0)}
                                        className="w-full text-black px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* Type Description */}
                            <p className="text-xs text-gray-400">
                                {DEPENDENCY_TYPES.find((t) => t.value === selectedType)?.description}
                            </p>

                            <button
                                onClick={handleAddDependency}
                                disabled={!selectedTaskId || adding}
                                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {adding ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Add Dependency
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Dependency List */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                            Current Dependencies ({dependencies.length})
                        </p>

                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                        ) : dependencies.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                                <GitBranch className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No dependencies yet</p>
                                <p className="text-xs text-gray-400">
                                    Add a dependency to create task relationships
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {dependencies.map((dep) => {
                                    // ✅ Safety check
                                    if (!dep || !dep.taskId || !dep.taskId._id) {
                                        return null;
                                    }

                                    return (
                                        <motion.div
                                            key={dep._id || dep.taskId._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 transition"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <GitBranch className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {dep.taskId.title || "Unknown Task"}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                                                        <span className={`px-2 py-0.5 rounded-full border ${STATUS_COLORS[dep.taskId.status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-600 border-gray-200"
                                                            }`}>
                                                            {getStatusLabel(dep.taskId.status) || "Unknown"}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <ArrowRight className="w-3 h-3" />
                                                            {dep.type || "FS"}
                                                        </span>
                                                        {dep.lag > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                +{dep.lag}d
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {dep.taskId.deadline ? new Date(dep.taskId.deadline).toLocaleDateString() : "No deadline"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveDependency(dep._id || dep.taskId._id)}
                                                disabled={removing === (dep._id || dep.taskId._id)}
                                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                                            >
                                                {removing === (dep._id || dep.taskId._id) ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}