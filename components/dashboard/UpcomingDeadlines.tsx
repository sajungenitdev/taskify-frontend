"use client";

import { Calendar, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
    if (daysLeft < 0) return "text-rose-600 bg-rose-50";
    if (daysLeft <= 2) return "text-amber-600 bg-amber-50";
    if (daysLeft <= 5) return "text-sky-600 bg-sky-50";
    return "text-emerald-600 bg-emerald-50";
  };

  const getUrgencyText = (daysLeft: number) => {
    if (daysLeft < 0) return "Overdue";
    if (daysLeft === 0) return "Today";
    if (daysLeft === 1) return "Tomorrow";
    return `${daysLeft}d`;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: "bg-emerald-50 text-emerald-700 border-emerald-200",
      normal: "bg-blue-50 text-blue-700 border-blue-200",
      high: "bg-amber-50 text-amber-700 border-amber-200",
      urgent: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return badges[priority as keyof typeof badges] || badges.normal;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <AlertTriangle size={10} className="text-rose-500" />;
      case "high":
        return <AlertTriangle size={10} className="text-amber-500" />;
      default:
        return <Clock size={10} className="text-gray-400" />;
    }
  };

  // Memoize sorted tasks
  const sortedTasks = useMemo(
    () =>
      [...tasks]
        .sort(
          (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
        )
        .slice(0, 5),
    [tasks],
  );

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center shadow-sm">
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-600 text-sm font-medium">
          No upcoming deadlines
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Complete tasks to see deadlines here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-gray-800 font-semibold">Upcoming Deadlines</h3>
          <span className="text-xs text-gray-500 ml-auto bg-gray-100 px-2 py-0.5 rounded-full">
            {tasks.length} tasks
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto custom-scrollbar">
        {sortedTasks.map((task) => {
          const daysLeft = getDaysLeft(task.deadline);
          const urgencyColor = getUrgencyColor(daysLeft);
          const urgencyText = getUrgencyText(daysLeft);

          return (
            <div
              key={task._id}
              onClick={() => router.push(`/tasks/${task._id}`)}
              className="p-4 hover:bg-gray-50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${getPriorityBadge(task.priority)} flex items-center gap-1`}
                    >
                      {getPriorityIcon(task.priority)}
                      {task.priority.toUpperCase()}
                    </span>
                    {task.status && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {task.status.replace("_", " ").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800 text-sm font-medium truncate group-hover:text-indigo-600 transition-colors">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${urgencyColor}`}
                  >
                    {urgencyText}
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
