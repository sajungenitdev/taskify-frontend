// app/(dashboard)/settings/backup/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
    Database,
    Download,
    Upload,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Trash2,
    FileArchive,
    Plus,
    Loader2,
    Settings,
    Clock as ClockIcon,
    Save,
} from "lucide-react";
import api, { apiService } from "@/lib/axios";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================
interface Backup {
    _id: string;
    id: string;
    name: string;
    size: number;
    type: "full" | "partial" | "schema";
    status: "completed" | "failed" | "in_progress" | "pending";
    createdAt: string;
    completedAt?: string;
    filePath: string;
    fileName: string;
    collections: string[];
    createdBy: {
        _id: string;
        name: string;
        email: string;
    };
    metadata: {
        database: string;
        version: string;
        compression: string;
        duration: number;
    };
}

interface BackupStats {
    totalBackups: number;
    totalSize: number;
    lastBackup: string | null;
    successRate: number;
    backupsByStatus: Record<string, number>;
    backupsByType: Record<string, number>;
}

interface BackupSchedule {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    keepLast: number;
}

// ============================================================
// HELPERS
// ============================================================
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (date: string): string => {
    return new Date(date).toLocaleString();
};

const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    if (diff < 43200) return `${Math.floor(diff / 1440)}d ago`;
    return `${Math.floor(diff / 43200)}mo ago`;
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const BackupPage: React.FC = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(true);
    const [backups, setBackups] = useState<Backup[]>([]);
    const [stats, setStats] = useState<BackupStats | null>(null);
    const [schedule, setSchedule] = useState<BackupSchedule>({
        enabled: false,
        frequency: "daily",
        time: "02:00",
        keepLast: 7,
    });
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
    const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
    const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
    const [creatingBackup, setCreatingBackup] = useState<boolean>(false);
    const [restoringBackup, setRestoringBackup] = useState<boolean>(false);
    const [uploadingFile, setUploadingFile] = useState<boolean>(false);

    // ============================================================
    // FETCH DATA
    // ============================================================
    const fetchBackups = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<{
                backups: Backup[];
                stats: BackupStats;
                schedule: BackupSchedule;
            }>("/backup");

            if (response.success) {
                const mappedBackups = (response.data.backups || []).map(backup => ({
                    ...backup,
                    id: backup.id || backup._id,
                }));
                setBackups(mappedBackups);
                setStats(response.data.stats || null);
                if (response.data.schedule) {
                    setSchedule(response.data.schedule);
                }
            }
        } catch (error: any) {
            console.error("Error fetching backups:", error);
            toast.error(error.message || "Failed to load backups");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    // ============================================================
    // HANDLERS
    // ============================================================
    const handleCreateBackup = async (type: "full" | "partial" = "full") => {
        try {
            setCreatingBackup(true);
            const response = await apiService.post<{ backup: Backup }>("/backup", { type });
            if (response.success) {
                toast.success("Backup created successfully!");
                await fetchBackups();
            }
        } catch (error: any) {
            console.error("Error creating backup:", error);
            toast.error(error.message || "Failed to create backup");
        } finally {
            setCreatingBackup(false);
        }
    };

    const handleDownloadBackup = async (backupId: string) => {
        if (!backupId || backupId === "undefined") {
            toast.error("Invalid backup ID");
            return;
        }

        try {
            const toastId = toast.loading("Downloading backup...");

            // Use api directly to get full response with headers
            const response = await api.get(`/backup/${backupId}/download`, {
                responseType: "blob",
            });

            // Now response has headers
            if (!response.data || response.data.size === 0) {
                toast.dismiss(toastId);
                toast.error("Backup file is empty or corrupted");
                return;
            }

            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;

            // Access headers from response
            const contentDisposition = response.headers?.["content-disposition"];
            let filename = `backup-${new Date().toISOString().split("T")[0]}.zip`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match) filename = match[1];
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            toast.dismiss(toastId);
            toast.success("Backup downloaded successfully!");
        } catch (error: any) {
            toast.dismiss();
            console.error("Error downloading backup:", error);
            toast.error(error.message || "Failed to download backup");
        }
    };

    const handleDeleteBackup = async (backupId: string) => {
        if (!backupId || backupId === "undefined") {
            toast.error("Invalid backup ID");
            return;
        }
        if (!confirm("Are you sure you want to delete this backup?")) return;

        try {
            const response = await apiService.delete(`/backup/${backupId}`);
            if (response.success) {
                toast.success("Backup deleted successfully!");
                await fetchBackups();
            }
        } catch (error: any) {
            console.error("Error deleting backup:", error);
            toast.error(error.message || "Failed to delete backup");
        }
    };

    const handleRestoreBackup = async (backupId: string) => {
        if (!backupId || backupId === "undefined") {
            toast.error("Invalid backup ID");
            return;
        }
        if (!confirm("⚠️ Are you sure you want to restore this backup? This will overwrite current data!")) return;

        try {
            setRestoringBackup(true);
            const response = await apiService.post(`/backup/${backupId}/restore`);
            if (response.success) {
                toast.success("Backup restored successfully!");
                setShowRestoreModal(false);
                setSelectedBackup(null);
                await fetchBackups();
            }
        } catch (error: any) {
            console.error("Error restoring backup:", error);
            toast.error(error.message || "Failed to restore backup");
        } finally {
            setRestoringBackup(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploadingFile(true);
            const formData = new FormData();
            formData.append("backup", file);

            const response = await apiService.post<{ backup: Backup }>("/backup/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.success) {
                toast.success("Backup uploaded successfully!");
                await fetchBackups();
            }
        } catch (error: any) {
            console.error("Error uploading backup:", error);
            toast.error(error.message || "Failed to upload backup");
        } finally {
            setUploadingFile(false);
            event.target.value = "";
        }
    };

    const handleSaveSchedule = async () => {
        try {
            const response = await apiService.put("/backup/schedule", schedule);
            if (response.success) {
                toast.success("Backup schedule saved successfully!");
                setShowScheduleModal(false);
                await fetchBackups();
            }
        } catch (error: any) {
            console.error("Error saving schedule:", error);
            toast.error(error.message || "Failed to save schedule");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "failed":
                return <XCircle className="w-4 h-4 text-red-500" />;
            case "in_progress":
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "failed":
                return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "in_progress":
                return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            default:
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
        }
    };

    // ============================================================
    // RENDER LOADING
    // ============================================================
    if (loading && backups.length === 0) {
        return (
            <div className="p-6 container mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN RENDER
    // ============================================================
    return (
        <div className="p-4 md:p-6 container mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 md:p-8 mb-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                            <Database className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">Backup & Restore</h1>
                            <p className="text-emerald-100 text-sm">
                                Manage your database backups and restore points
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleCreateBackup("full")}
                            disabled={creatingBackup}
                            className="px-4 py-2 bg-white text-emerald-600 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                        >
                            {creatingBackup ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            {creatingBackup ? "Creating..." : "Create Backup"}
                        </button>
                        <label className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors cursor-pointer flex items-center gap-2 border border-white/20">
                            <Upload className="w-4 h-4" />
                            Upload Backup
                            <input
                                type="file"
                                accept=".zip,.sql,.json"
                                onChange={handleFileUpload}
                                disabled={uploadingFile}
                                className="hidden"
                            />
                        </label>
                        <button
                            onClick={fetchBackups}
                            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-emerald-100 text-xs">Total Backups</p>
                            <p className="text-white text-xl font-bold">{stats.totalBackups}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-emerald-100 text-xs">Total Size</p>
                            <p className="text-white text-xl font-bold">{formatFileSize(stats.totalSize)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-emerald-100 text-xs">Success Rate</p>
                            <p className="text-green-300 text-xl font-bold">{stats.successRate}%</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-emerald-100 text-xs">Last Backup</p>
                            <p className="text-white text-xl font-bold">
                                {stats.lastBackup ? formatRelativeTime(stats.lastBackup) : "Never"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Backup Schedule Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <ClockIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {schedule.enabled ? "Auto-backup enabled" : "Auto-backup disabled"}
                            </p>
                            {schedule.enabled && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {schedule.frequency} at {schedule.time} • keeping {schedule.keepLast} backups
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowScheduleModal(true)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Configure Schedule
                    </button>
                </div>
            </div>

            {/* Backups Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {backups.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                            <Database className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Backups Found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            Create your first backup to protect your data.
                        </p>
                        <button
                            onClick={() => handleCreateBackup("full")}
                            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Backup
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {backups.map((backup) => (
                                    <tr key={backup.id || backup._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <FileArchive className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {backup.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {backup.collections?.length || 0} collections
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${backup.type === "full"
                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                                : backup.type === "partial"
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                                                }`}>
                                                {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                            {formatFileSize(backup.size)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                                                {getStatusIcon(backup.status)}
                                                {backup.status.charAt(0).toUpperCase() + backup.status.slice(1).replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-900 dark:text-white">
                                                    {formatRelativeTime(backup.createdAt)}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatDate(backup.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownloadBackup(backup.id || backup._id)}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Download backup"
                                                >
                                                    <Download className="w-4 h-4 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBackup(backup);
                                                        setShowRestoreModal(true);
                                                    }}
                                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Restore backup"
                                                >
                                                    <Upload className="w-4 h-4 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBackup(backup.id || backup._id)}
                                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Delete backup"
                                                >
                                                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Restore Modal */}
            {showRestoreModal && selectedBackup && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Restore Backup?</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">This will overwrite current data</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Backup:</span> {selectedBackup.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Created:</span> {formatDate(selectedBackup.createdAt)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">Size:</span> {formatFileSize(selectedBackup.size)}
                                </p>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                                <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Warning: This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setShowRestoreModal(false);
                                    setSelectedBackup(null);
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRestoreBackup(selectedBackup.id || selectedBackup._id)}
                                disabled={restoringBackup}
                                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                            >
                                {restoringBackup ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {restoringBackup ? "Restoring..." : "Restore Backup"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                                <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Backup Schedule</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure automatic backups</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={schedule.enabled}
                                    onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                Enable Automatic Backups
                            </label>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Frequency
                                </label>
                                <select
                                    value={schedule.frequency}
                                    onChange={(e) => setSchedule({
                                        ...schedule,
                                        frequency: e.target.value as "daily" | "weekly" | "monthly"
                                    })}
                                    disabled={!schedule.enabled}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 transition-all"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Time (24h)
                                </label>
                                <input
                                    type="time"
                                    value={schedule.time}
                                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                                    disabled={!schedule.enabled}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Keep Last (# of backups)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={schedule.keepLast}
                                    onChange={(e) => setSchedule({
                                        ...schedule,
                                        keepLast: parseInt(e.target.value) || 7
                                    })}
                                    disabled={!schedule.enabled}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSchedule}
                                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Uploading indicator */}
            {uploadingFile && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Uploading Backup...
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            Please wait while your backup is uploaded
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackupPage;