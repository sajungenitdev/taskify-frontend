"use client";
import { motion } from "framer-motion";
import {
History,
Activity,
Calendar,
RefreshCw,
User,
} from "lucide-react";
import type { Task } from "../../types/tasks";
import { formatDateTime } from "../../utils/formatters";

interface Props {
task: Task;
isTimerActive: boolean;
isTimerRunningForTask: boolean;
formatTimeShort: (s: number) => string;
timerSeconds: number;                 // total used seconds (parent decides meaning)
formatTime: (s: number) => string;
}

export function TaskHistoryCard({
task,
isTimerActive,
isTimerRunningForTask,
formatTimeShort,
timerSeconds,
formatTime,
}: Props) {
const hasTime = timerSeconds > 0;

const label = isTimerRunningForTask
    ? "Timer running"
    : isTimerActive
        ? "Timer paused"
        : "Total time used";

const dotClass = isTimerRunningForTask
    ? "bg-emerald-500 animate-pulse"
    : isTimerActive
        ? "bg-amber-500"
        : "bg-gray-400";

const valueClass = isTimerRunningForTask
    ? "text-emerald-600"
    : isTimerActive
        ? "text-amber-600"
        : "text-gray-700";

return (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white p-6"
    >
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            Task History
        </h3>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {/* Time row — always rendered when there's time to show */}
            {hasTime && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${dotClass}`} />
                        <span className="text-sm text-gray-700">{label}</span>
                    </div>
                    <span
                        className={`text-xs font-mono font-medium tabular-nums ${valueClass}`}
                    >
                        {formatTime ? formatTime(timerSeconds) : formatTimeShort(timerSeconds)}
                    </span>
                </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Status</span>
                </div>
                <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${task.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-700"
                                : task.status === "submitted"
                                    ? "bg-purple-100 text-purple-700"
                                    : task.status === "rejected"
                                        ? "bg-rose-100 text-rose-700"
                                        : task.status === "overdue"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-amber-100 text-amber-700"
                        }`}
                >
                    {task.status.replace("_", " ")}
                </span>
            </div>

            {/* Created */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Created</span>
                </div>
                <span className="text-xs text-gray-400">
                    {formatDateTime(task.createdAt)}
                </span>
            </div>

            {/* Last Updated */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Last Updated</span>
                </div>
                <span className="text-xs text-gray-400">
                    {formatDateTime(task.updatedAt)}
                </span>
            </div>

            {/* Assigned By */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Assigned By</span>
                </div>
                <span className="text-xs text-gray-400">
                    {task.assignedBy?.fullName || "Unknown"}
                </span>
            </div>
        </div>
    </motion.div>
);
}