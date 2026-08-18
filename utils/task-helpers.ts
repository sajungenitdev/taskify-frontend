// utils/task-helpers.ts
import { Task } from "@/types/task";

export const getPriorityConfig = (priority: string) => {
  const config = {
    low: {
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "🟢",
      label: "Low",
      gradient: "from-emerald-400 to-emerald-600",
      bg: "bg-emerald-500/10",
      border: "border-emerald-200",
    },
    normal: {
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: "🔵",
      label: "Normal",
      gradient: "from-blue-400 to-blue-600",
      bg: "bg-blue-500/10",
      border: "border-blue-200",
    },
    high: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "🟠",
      label: "High",
      gradient: "from-amber-400 to-amber-600",
      bg: "bg-amber-500/10",
      border: "border-amber-200",
    },
    urgent: {
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: "🔴",
      label: "Urgent",
      gradient: "from-rose-400 to-rose-600",
      bg: "bg-rose-500/10",
      border: "border-rose-200",
    },
  };
  return config[priority as keyof typeof config] || config.normal;
};

export const getStatusConfig = (status: string) => {
  const config = {
    pending: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "⏳",
      label: "Pending",
      dot: "bg-amber-500",
      ring: "ring-amber-400",
    },
    in_progress: {
      color: "bg-sky-50 text-sky-700 border-sky-200",
      icon: "🔄",
      label: "In Progress",
      dot: "bg-sky-500",
      ring: "ring-sky-400",
    },
    submitted: {
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: "📬",
      label: "Submitted",
      dot: "bg-purple-500",
      ring: "ring-purple-400",
    },
    completed: {
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "✅",
      label: "Done",
      dot: "bg-emerald-500",
      ring: "ring-emerald-400",
    },
    overdue: {
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: "⚠️",
      label: "Overdue",
      dot: "bg-rose-500",
      ring: "ring-rose-400",
    },
    rejected: {
      color: "bg-red-50 text-red-700 border-red-200",
      icon: "❌",
      label: "Rejected",
      dot: "bg-red-500",
      ring: "ring-red-400",
    },
  };
  return config[status as keyof typeof config] || config.pending;
};

export const formatDate = (dateString: string) => {
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

export const formatDateTime = (dateString: string) => {
  if (!dateString) return "No date set";
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
};

export const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};