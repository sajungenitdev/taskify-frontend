// components/tasks/TaskListView.tsx
import { CheckSquare, Square, Star, Eye, Edit2, Trash2, Play, CalendarClock } from "lucide-react";
import Link from "next/link";
import { Task } from "@/types/task";
import { getPriorityConfig, getStatusConfig, formatDate } from "@/utils/task-helpers";

interface TaskListViewProps {
    tasks: Task[];
    user: any;
    canManage: boolean;
    selectedTasks: Set<string>;
    toggleTaskSelection: (taskId: string) => void;
    toggleAllTasks: () => void;
    onStatusChange: (taskId: string, status: string) => void;
    onEdit: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onStar: (taskId: string) => void;
    onViewDetails: (task: Task) => void;
    onStartTimer: (taskId: string) => void;
    onRequestExtension: (task: Task) => void;
    updatingStatus: string | null;
}

export const TaskListView = ({
    tasks,
    user,
    canManage,
    selectedTasks,
    toggleTaskSelection,
    toggleAllTasks,
    onEdit,
    onDelete,
    onStar,
    onViewDetails,
    onStartTimer,
    onRequestExtension,
}: TaskListViewProps) => {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50/80 to-indigo-50/80 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-4 py-3">
                                <button
                                    onClick={toggleAllTasks}
                                    className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-indigo-600 transition"
                                >
                                    {selectedTasks.size === tasks.length && selectedTasks.size > 0 ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <Square className="w-4 h-4" />
                                    )}
                                </button>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                            <th className="w-36 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="w-44 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="w-56 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                            <th className="w-36 text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tasks.map((task) => {
                            const isAssignee = task.assignedTo?._id === user?._id;
                            return (
                                <tr
                                    key={task._id}
                                    className={`hover:bg-indigo-50/30 transition-colors duration-200 ${selectedTasks.has(task._id)
                                            ? "bg-indigo-50/50 border-l-4 border-indigo-500"
                                            : ""
                                        }`}
                                >
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => toggleTaskSelection(task._id)}
                                            className="p-1 rounded-lg hover:bg-indigo-100 transition"
                                        >
                                            {selectedTasks.has(task._id) ? (
                                                <CheckSquare className="w-4 h-4 text-indigo-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => onStar(task._id)}
                                                className="text-gray-400 hover:text-amber-400 transition"
                                            >
                                                <Star
                                                    size={14}
                                                    className={task.isStarred ? "fill-amber-400 text-amber-400" : ""}
                                                />
                                            </button>
                                            <div>
                                                <p className="text-gray-800 text-sm font-medium hover:text-indigo-600 transition">
                                                    {task.title}
                                                </p>
                                                <p className="text-gray-400 text-xs line-clamp-1">{task.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityConfig(task.priority).color} shadow-sm`}
                                        >
                                            <span className="mr-1">{getPriorityConfig(task.priority).icon}</span>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusConfig(task.status).dot}`} />
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusConfig(task.status).color}`}>
                                                {getStatusConfig(task.status).icon} {task.status.replace("_", " ")}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                                                <span className="text-white text-[10px] font-bold">
                                                    {task.assignedTo?.fullName?.charAt(0) || "?"}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-600">{task.assignedTo?.fullName ?? "Unassigned"}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${new Date(task.deadline) < new Date() && task.status !== "completed"
                                                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                                                    : "bg-gray-50 text-gray-600 border border-gray-200"
                                                }`}
                                        >
                                            {formatDate(task.deadline)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => onViewDetails(task)}
                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            {canManage && (
                                                <>
                                                    <button
                                                        onClick={() => onEdit(task)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    {(user?.role === "super_admin" || user?.role === "admin") && (
                                                        <button
                                                            onClick={() => onDelete(task._id)}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {isAssignee && task.status !== "completed" &&
                                                task.status !== "submitted" &&
                                                task.status !== "rejected" && (
                                                    <button
                                                        onClick={() => onStartTimer(task._id)}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                        title="Start Timer"
                                                    >
                                                        <Play size={14} />
                                                    </button>
                                                )}
                                            <button
                                                onClick={() => onRequestExtension(task)}
                                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                                title="Request Extension"
                                            >
                                                <CalendarClock size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};