"use client";
import { motion } from "framer-motion";
import { TimerIcon } from "lucide-react";
import type { Task } from "../../types/tasks";

interface Props {
  task: Task;
  isTimerRunningForTask: boolean;
  isTimerActive: boolean;
  timerSeconds: number;
  formatTime: (s: number) => string;
}

export function TaskTimerCard({ task, isTimerRunningForTask, isTimerActive, timerSeconds, formatTime }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className={`bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border p-6 shadow-sm ${
        isTimerRunningForTask ? "border-indigo-300" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <TimerIcon size={16} className="text-indigo-600" />
          Timer Status
        </h3>
        {isTimerActive && (
          <span className={`text-xs font-medium ${isTimerRunningForTask ? "text-emerald-600" : "text-amber-600"}`}>
            {isTimerRunningForTask ? "● Running" : "● Paused"}
          </span>
        )}
      </div>

      <div className="text-center py-4">
        {isTimerActive ? (
          <div className="text-3xl font-mono font-bold text-indigo-700 tabular-nums">
            {formatTime(timerSeconds)}
          </div>
        ) : (
          <>
            <div className="text-3xl font-mono font-bold text-gray-400">
              {task.actualMinutes ? formatTime(task.actualMinutes * 60) : "--:--:--"}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {task.actualMinutes ? `${task.actualMinutes.toFixed(2)}m tracked` : "No timer active"}
            </p>
          </>
        )}
      </div>

      {task.actualMinutes && task.actualMinutes > 0 && !isTimerActive && (
        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-3 mt-2">
          Total tracked: {task.actualMinutes} minutes
        </div>
      )}
    </motion.div>
  );
}