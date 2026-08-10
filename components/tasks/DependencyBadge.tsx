// components/tasks/DependencyBadge.tsx
"use client";

import { useState, useEffect } from "react";
import { GitBranch, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import api from "@/lib/axios";

interface DependencyBadgeProps {
    taskId: string;
    onClick?: () => void;
}

export default function DependencyBadge({ taskId, onClick }: DependencyBadgeProps) {
    const [loading, setLoading] = useState(true);
    const [hasDependencies, setHasDependencies] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await api.get(`/tasks/${taskId}/dependencies`);
                if (response.data.success) {
                    const data = response.data.data;
                    const predecessors = data?.predecessors || [];
                    const stats = data?.stats || {};
                    setHasDependencies(predecessors.length > 0);
                    setIsBlocked(stats.isBlocked || false);
                    setCount(predecessors.length);
                }
            } catch (error) {
                console.error("Error fetching dependency status:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, [taskId]);

    if (loading) {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px]">...</span>
            </div>
        );
    }

    if (!hasDependencies) {
        return null;
    }

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all hover:scale-105 ${isBlocked
                    ? "bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200"
                    : "bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200"
                }`}
        >
            {isBlocked ? (
                <AlertCircle className="w-3 h-3" />
            ) : (
                <GitBranch className="w-3 h-3" />
            )}
            {count} dep{count > 1 ? "s" : ""}
            {isBlocked && " ⚠️"}
        </button>
    );
}