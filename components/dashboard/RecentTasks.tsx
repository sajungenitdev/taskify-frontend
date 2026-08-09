"use client";

import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

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

  // Memoize color functions to prevent recalculation
  const getPriorityColor = useMemo(() => {
    const colors = {
      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
      normal: "bg-blue-50 text-blue-700 border-blue-200",
      high: "bg-amber-50 text-amber-700 border-amber-200",
      urgent: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return (priority: string) =>
      colors[priority as keyof typeof colors] || colors.normal;
  }, []);

  const getStatusColor = useMemo(() => {
    const colors = {
      pending: "bg-gray-100 text-gray-700",
      in_progress: "bg-sky-50 text-sky-700",
      submitted: "bg-purple-50 text-purple-700",
      completed: "bg-emerald-50 text-emerald-700",
      overdue: "bg-rose-50 text-rose-700",
      rejected: "bg-red-50 text-red-700",
    };
    return (status: string) =>
      colors[status as keyof typeof colors] || colors.pending;
  }, []);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={10} className="text-emerald-500" />;
      case "overdue":
        return <AlertCircle size={10} className="text-rose-500" />;
      default:
        return <Clock size={10} className="text-gray-400" />;
    }
  };

  // Memoize displayed tasks
  const displayedTasks = useMemo(() => tasks.slice(0, 5), [tasks]);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center shadow-sm">
        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-gray-800 font-medium">No tasks yet</h3>
        <p className="text-gray-500 text-sm mt-1">
          Tasks assigned to you will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-800 font-semibold">Recent Tasks</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Your active and pending tasks
            </p>
          </div>
          <button
            onClick={() => router.push("/tasks/tasks-board")}
            className="text-xs cursor-pointer text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition font-medium"
          >
            View All
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {displayedTasks.map((task) => (
          <div
            key={task._id}
            className="p-4 hover:bg-gray-50 transition-all cursor-pointer group"
            onClick={() => router.push(`/tasks/${task._id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-800 text-sm font-medium mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {task.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(task.status)}`}
                  >
                    {getStatusIcon(task.status)}
                    {task.status.replace("_", " ").toUpperCase()}
                  </span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(task.deadline)}
                  </span>
                </div>
                {task.assignedTo && (
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Assigned to: {task.assignedTo.fullName}
                  </p>
                )}
              </div>
              <ArrowRight
                size={16}
                className="text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0 ml-2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
