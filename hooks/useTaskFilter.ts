// hooks/useTaskFilter.ts
import { useState, useMemo, useCallback } from "react";
import { Task } from "@/types/task";

export const useTaskFilter = (tasks: Task[]) => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (filter !== "all" && task.status !== filter) return false;
        if (
          searchTerm &&
          !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline") {
          return sortOrder === "asc"
            ? new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime()
            : new Date(b.deadline ?? 0).getTime() - new Date(a.deadline ?? 0).getTime();
        } else if (sortBy === "priority") {
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          return sortOrder === "asc"
            ? (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0)
            : (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        } else {
          return sortOrder === "asc"
            ? new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
            : new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        }
      });
  }, [tasks, filter, searchTerm, sortBy, sortOrder]);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  }, []);

  return {
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showFilters,
    setShowFilters,
    filteredTasks,
    resetFilters,
  };
};