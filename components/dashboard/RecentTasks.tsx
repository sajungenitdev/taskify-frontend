"use client";

import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Task {
  _id: string;
  title: string;
  priority: string;
  status: string;
  deadline: string;
  description?: string;
  assignedTo?: { fullName: string };
}

interface RecentTasksProps {
  tasks: Task[];
}

export default function RecentTasks({ tasks = [] }: RecentTasksProps) {
  const router = useRouter();

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      normal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-slate-800 text-slate-300",
      in_progress: "bg-sky-500/10 text-sky-400",
      submitted: "bg-purple-500/10 text-purple-400",
      completed: "bg-emerald-500/10 text-emerald-400",
      overdue: "bg-rose-500/10 text-rose-400",
      rejected: "bg-red-500/10 text-red-400",
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
    return `${diffDays} days left`;
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 text-center">
        <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-white font-medium">No tasks yet</h3>
        <p className="text-slate-400 text-sm mt-1">
          Tasks assigned to you will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Recent Tasks</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Your active and pending tasks
            </p>
          </div>
          <button
            onClick={() => router.push("/tasks/tasks-board")}
            className="text-xs cursor-pointer text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
          >
            View All
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
      <div className="divide-y divide-slate-800">
        {tasks.slice(0, 5).map((task) => (
          <div
            key={task._id}
            className="p-4 hover:bg-slate-800/30 transition-all cursor-pointer group"
            onClick={() => router.push(`/tasks/${task._id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-white text-sm font-medium mb-2 line-clamp-1">
                  {task.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}
                  >
                    {task.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(task.deadline)}
                  </span>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-600 group-hover:text-indigo-400 transition-colors"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
