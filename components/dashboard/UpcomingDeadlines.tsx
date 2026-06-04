"use client";

import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface Task {
  _id: string;
  title: string;
  deadline: string;
  priority: string;
  status?: string;
}

interface UpcomingDeadlinesProps {
  tasks?: Task[];
}

export default function UpcomingDeadlines({
  tasks = [],
}: UpcomingDeadlinesProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDaysLeft = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays;
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft < 0) return "text-rose-400";
    if (daysLeft <= 2) return "text-amber-400";
    if (daysLeft <= 5) return "text-sky-400";
    return "text-emerald-400";
  };

  const getUrgencyText = (daysLeft: number) => {
    if (daysLeft < 0) return "Overdue";
    if (daysLeft === 0) return "Today";
    if (daysLeft === 1) return "Tomorrow";
    return `${daysLeft} days left`;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: "bg-emerald-500/10 text-emerald-400",
      normal: "bg-blue-500/10 text-blue-400",
      high: "bg-amber-500/10 text-amber-400",
      urgent: "bg-rose-500/10 text-rose-400",
    };
    return badges[priority as keyof typeof badges] || badges.normal;
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 text-center">
        <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No upcoming deadlines</p>
        <p className="text-slate-500 text-xs mt-1">
          Complete tasks to see deadlines here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-semibold">Upcoming Deadlines</h3>
          <span className="text-xs text-slate-500 ml-auto">
            {tasks.length} tasks
          </span>
        </div>
      </div>
      <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
        {tasks.slice(0, 5).map((task) => {
          const daysLeft = getDaysLeft(task.deadline);
          const urgencyColor = getUrgencyColor(daysLeft);
          const urgencyText = getUrgencyText(daysLeft);

          return (
            <div
              key={task._id}
              onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
              className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-all cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${getPriorityBadge(task.priority)}`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                  <p className="text-white text-sm font-medium truncate">
                    {task.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={12} className="text-slate-500" />
                  <span className="text-xs text-slate-400">
                    {formatDate(task.deadline)}
                  </span>
                </div>
              </div>
              <div className={`text-sm font-semibold ${urgencyColor} ml-3`}>
                {urgencyText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
