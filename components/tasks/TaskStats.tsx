// components/tasks/TaskStats.tsx
import { motion } from "framer-motion";
import {
    Layers, Clock, Zap, Send, CheckCircle, AlertCircle, X
} from "lucide-react";
import { Stats } from "@/types/task";

interface TaskStatsProps {
    stats: Stats;
}

const statCards = [
    { label: "Total", key: "total", icon: Layers, color: "text-gray-700", bgColor: "bg-gray-50" },
    { label: "Pending", key: "pending", icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50" },
    { label: "In Progress", key: "inProgress", icon: Zap, color: "text-sky-600", bgColor: "bg-sky-50" },
    { label: "Submitted", key: "submitted", icon: Send, color: "text-purple-600", bgColor: "bg-purple-50" },
    { label: "Done", key: "completed", icon: CheckCircle, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { label: "Overdue", key: "overdue", icon: AlertCircle, color: "text-rose-600", bgColor: "bg-rose-50" },
    { label: "Rejected", key: "rejected", icon: X, color: "text-red-600", bgColor: "bg-red-50" },
];

export const TaskStats = ({ stats }: TaskStatsProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4"
        >
            {statCards.map((stat, idx) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`${stat.bgColor} rounded-2xl p-4 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                {stats[stat.key as keyof Stats] || 0}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-medium uppercase tracking-wider">
                                {stat.label}
                            </p>
                        </div>
                        <div
                            className={`w-9 h-9 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                        >
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                    </div>
                    <div className="mt-2 h-0.5 w-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                </motion.div>
            ))}
        </motion.div>
    );
};