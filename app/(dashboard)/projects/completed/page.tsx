"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Search,
  Eye,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Award,
  TrendingUp,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  managerId?: { _id: string; fullName: string };
  startDate: string;
  endDate: string;
  progress: number;
  completedAt?: string;
  tasksCount: number;
  completedTasks: number;
}

export default function CompletedProjectsPage() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const canManage = hasRole([
    "super_admin",
    "admin",
    "dept_manager",
    "project_manager",
  ]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/projects?status=completed");
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <FolderKanban className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-white">Access Denied</h2>
          <p className="text-slate-400 mt-1">
            You don't have permission to view this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/projects"
                className="text-slate-400 hover:text-white text-sm"
              >
                Projects
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-white text-sm">Completed</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Completed Projects
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              View successfully completed projects
            </p>
          </div>
          <button
            onClick={fetchProjects}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">{projects.length}</p>
            <p className="text-xs text-slate-400">Completed Projects</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">
              {projects.reduce((sum, p) => sum + p.completedTasks, 0)}
            </p>
            <p className="text-xs text-slate-400">Total Tasks Completed</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-2xl font-bold text-white">
              {Math.round(
                projects.reduce((sum, p) => sum + p.progress, 0) /
                  (projects.length || 1),
              )}
              %
            </p>
            <p className="text-xs text-slate-400">Average Completion Rate</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search completed projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProjects.map((project) => (
              <div
                key={project._id}
                className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 hover:border-emerald-500/30 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{project.name}</h3>
                    <p className="text-slate-500 text-xs">{project.code}</p>
                  </div>
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Completion Rate</span>
                    <span className="text-emerald-400">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      Completed:{" "}
                      {project.completedAt
                        ? new Date(project.completedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <Link
                    href={`/projects/${project._id}`}
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No completed projects found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === page
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
