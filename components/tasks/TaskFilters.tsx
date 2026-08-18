// components/tasks/TaskFilters.tsx
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ChevronRight } from "lucide-react";

interface TaskFiltersProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    filter: string;
    setFilter: (value: string) => void;
    sortBy: string;
    setSortBy: (value: any) => void;
    sortOrder: "asc" | "desc";
    setSortOrder: (value: "asc" | "desc") => void;
    showFilters: boolean;
    setShowFilters: (value: boolean) => void;
    resetFilters: () => void;
}

export const TaskFilters = ({
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showFilters,
    setShowFilters,
    resetFilters,
}: TaskFiltersProps) => {
    return (
        <>
            <div className="flex flex-wrap gap-3">
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search your tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-800 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-sm ${showFilters
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                            : "bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-600 hover:text-gray-800"
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    Filters
                    <ChevronRight size={14} className={showFilters ? "rotate-90" : ""} />
                </button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-wrap gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-sm">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="submitted">Submitted</option>
                                <option value="completed">Completed</option>
                                <option value="overdue">Overdue</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                            >
                                <option value="createdAt">Sort by Date</option>
                                <option value="deadline">Sort by Deadline</option>
                                <option value="priority">Sort by Priority</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 rounded-lg transition"
                            >
                                {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};