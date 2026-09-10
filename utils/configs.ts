export const getPriorityConfig = (priority: string) => {
    const config = {
        low: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "🟢", label: "Low" },
        normal: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: "🔵", label: "Normal" },
        high: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: "🟠", label: "High" },
        urgent: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: "🔴", label: "Urgent" },
    };
    return config[priority as keyof typeof config] || config.normal;
};

export const getStatusConfig = (status: string) => {
    const config = {
        pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏳", label: "Pending" },
        in_progress: { color: "bg-sky-50 text-sky-700 border-sky-200", icon: "🔄", label: "In Progress" },
        submitted: { color: "bg-purple-50 text-purple-700 border-purple-200", icon: "📬", label: "Submitted" },
        completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✅", label: "Completed" },
        overdue: { color: "bg-rose-50 text-rose-700 border-rose-200", icon: "⚠️", label: "Overdue" },
        rejected: { color: "bg-red-50 text-red-700 border-red-200", icon: "❌", label: "Rejected" },
    };
    return config[status as keyof typeof config] || config.pending;
};