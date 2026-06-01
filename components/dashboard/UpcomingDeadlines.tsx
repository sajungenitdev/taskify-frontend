"use client";

import { Calendar, AlertTriangle } from "lucide-react";

interface UpcomingDeadlinesProps {
  tasks: {
    _id: string;
    title: string;
    deadline: string;
    priority: string;
  }[];
}

export default function UpcomingDeadlines({ tasks }: UpcomingDeadlinesProps) {
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
    return "text-emerald-400";
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 text-center">
        <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-semibold">Upcoming Deadlines</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-800">
        {tasks.slice(0, 5).map((task) => {
          const daysLeft = getDaysLeft(task.deadline);
          return (
            <div
              key={task._id}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-white text-sm font-medium">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={12} className="text-slate-500" />
                  <span className="text-xs text-slate-400">
                    {formatDate(task.deadline)}
                  </span>
                </div>
              </div>
              <div
                className={`text-sm font-semibold ${getUrgencyColor(daysLeft)}`}
              >
                {daysLeft < 0 ? "Overdue" : `${daysLeft}d left`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
