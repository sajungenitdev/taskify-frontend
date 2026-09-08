// components/chat/CreateRoomModal.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    X,
    Hash,
    Briefcase,
    Loader2,
    Check,
    Search,
    UserPlus,
    Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import toast from "react-hot-toast";

// ============================================================
// TYPES
// ============================================================
export interface UserItem {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
}

export interface ProjectItem {
    _id: string;
    name: string;
    code?: string;
}

export interface CreateRoomPayload {
    name: string;
    type: "channel" | "project" | "direct";
    description?: string;
    members: string[];
    projectId?: string;
}

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateRoom: (data: CreateRoomPayload) => Promise<any>;
}

// ============================================================
// AVATAR UTILITIES
// ============================================================
const getAvatarColor = (userId: string = "") => {
    const colors = [
        "bg-indigo-500",
        "bg-rose-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-purple-500",
        "bg-cyan-500",
        "bg-pink-500",
        "bg-teal-500",
    ];
    const charSum = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
};

const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
};

const UserAvatar = ({
    user,
    size = "w-8 h-8",
    textSize = "text-xs",
}: {
    user: UserItem;
    size?: string;
    textSize?: string;
}) => {
    if (user?.avatar) {
        return (
            <img
                src={user.avatar}
                alt={user.fullName || "User"}
                className={`${size} rounded-full object-cover border border-slate-200 shrink-0`}
                loading="lazy"
            />
        );
    }

    return (
        <div
            className={`${size} rounded-full ${getAvatarColor(
                user?._id
            )} flex items-center justify-center text-white font-bold ${textSize} shrink-0 select-none shadow-2xs`}
        >
            {getInitials(user?.fullName)}
        </div>
    );
};

// ============================================================
// MAIN MODAL
// ============================================================
export default function CreateRoomModal({
    isOpen,
    onClose,
    onCreateRoom,
}: CreateRoomModalProps) {
    const { user } = useAuth();

    // Form States
    const [roomName, setRoomName] = useState("");
    const [roomType, setRoomType] = useState<"channel" | "project">("channel");
    const [description, setDescription] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");

    // Data States
    const [allUsers, setAllUsers] = useState<UserItem[]>([]);
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Reset form handler
    const resetForm = useCallback(() => {
        setRoomName("");
        setRoomType("channel");
        setDescription("");
        setSelectedMembers([]);
        setSelectedProjectId("");
        setSearchTerm("");
    }, []);

    // Fetch users and project lists on modal open
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        const loadDependencies = async () => {
            setLoadingData(true);
            try {
                const [usersRes, projectsRes] = await Promise.all([
                    api.get("/users").catch(() => ({ data: { success: false, data: [] } })),
                    api.get("/projects").catch(() => ({ data: { success: false, data: [] } })),
                ]);

                if (isMounted) {
                    if (usersRes.data?.success) {
                        const currentUserId = user?._id?.toString();
                        setAllUsers(
                            (usersRes.data.data || []).filter(
                                (u: UserItem) => u._id?.toString() !== currentUserId
                            )
                        );
                    }
                    if (projectsRes.data?.success) {
                        setProjects(projectsRes.data.data || []);
                    }
                }
            } catch (err) {
                console.error("Failed to load users or projects:", err);
            } finally {
                if (isMounted) setLoadingData(false);
            }
        };

        loadDependencies();
        return () => {
            isMounted = false;
        };
    }, [isOpen, user?._id]);

    // Fast member selection lookup
    const selectedMembersSet = useMemo(() => new Set(selectedMembers), [selectedMembers]);

    const toggleMember = useCallback((userId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    }, []);

    // Memoized user search filtering
    const filteredUsers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return allUsers;
        return allUsers.filter(
            (u) =>
                u.fullName?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term)
        );
    }, [allUsers, searchTerm]);

    // Auto-fill room slug when a project is selected
    const handleProjectSelect = (projectId: string) => {
        setSelectedProjectId(projectId);
        if (!projectId) return;

        const matchedProject = projects.find((p) => p._id === projectId);
        if (matchedProject && !roomName.trim()) {
            const generatedSlug = matchedProject.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            setRoomName(generatedSlug);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanName = roomName.trim();
        if (!cleanName) {
            toast.error("Channel name is required");
            return;
        }

        if (roomType === "project" && !selectedProjectId) {
            toast.error("Please select an associated project");
            return;
        }

        setSubmitting(true);
        try {
            await onCreateRoom({
                name: cleanName,
                type: roomType,
                description: description.trim(),
                members: selectedMembers,
                projectId: roomType === "project" ? selectedProjectId : undefined,
            });

            resetForm();
            onClose();
        } catch {
            // Error handled by the parent caller
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-2xs">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 tracking-tight">Create Channel</h2>
                            <p className="text-xs text-slate-400">Set up a space for team conversations or projects</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            onClose();
                        }}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Form Content */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
                    {/* Room Type Selector (Channel vs Project) */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Channel Type
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                {
                                    type: "channel" as const,
                                    icon: Hash,
                                    label: "Standard Channel",
                                    sub: "For general or team topics",
                                },
                                {
                                    type: "project" as const,
                                    icon: Briefcase,
                                    label: "Project Channel",
                                    sub: "Linked to a specific project",
                                },
                            ].map(({ type, icon: Icon, label, sub }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setRoomType(type)}
                                    className={`flex flex-col items-start p-3 rounded-2xl border-2 transition-all text-left cursor-pointer ${roomType === type
                                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-2xs"
                                        : "border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50/50"
                                        }`}
                                >
                                    <div
                                        className={`w-7 h-7 rounded-xl flex items-center justify-center mb-2 ${roomType === type
                                            ? "bg-indigo-600 text-white"
                                            : "bg-slate-100 text-slate-500"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold">{label}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">{sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Project Dropdown (Rendered only when type === 'project') */}
                    {roomType === "project" && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-150">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Associate Project <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => handleProjectSelect(e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-2xs transition"
                                required
                            >
                                <option value="">Select a project...</option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>
                                        {project.name} {project.code ? `(${project.code})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Channel Name */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Channel Name <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">
                                #
                            </span>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                                placeholder={roomType === "project" ? "e.g. mobile-app-dev" : "e.g. general-announcements"}
                                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-2xs transition font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Description <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this channel about?"
                            rows={2}
                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none bg-white shadow-2xs transition"
                        />
                    </div>

                    {/* Invite Members */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Add Members <span className="font-normal text-slate-400">({selectedMembers.length} selected)</span>
                            </label>
                            {selectedMembers.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedMembers([])}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {/* Selected Member Chips */}
                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2.5 p-2 bg-slate-50 border border-slate-200/60 rounded-2xl max-h-24 overflow-y-auto">
                                {selectedMembers.map((id) => {
                                    const targetUser = allUsers.find((u) => u._id === id);
                                    if (!targetUser) return null;
                                    return (
                                        <span
                                            key={id}
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-full text-[11px] font-medium shadow-2xs"
                                        >
                                            <UserAvatar user={targetUser} size="w-4 h-4" textSize="text-[8px]" />
                                            <span className="max-w-[100px] truncate">{targetUser.fullName}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleMember(id)}
                                                className="text-slate-400 hover:text-rose-500 transition"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* Member Search Bar */}
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search colleagues by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-2xs transition"
                            />
                        </div>

                        {/* Members List */}
                        <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                            {loadingData ? (
                                <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                    Loading members...
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-400">
                                    {searchTerm ? "No matching members found" : "No users available to add"}
                                </div>
                            ) : (
                                filteredUsers.map((u) => {
                                    const isSelected = selectedMembersSet.has(u._id);
                                    return (
                                        <div
                                            key={u._id}
                                            onClick={() => toggleMember(u._id)}
                                            className={`flex items-center justify-between px-3 py-2 cursor-pointer transition select-none ${isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                <UserAvatar user={u} size="w-7 h-7" textSize="text-xs" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-slate-800 truncate">{u.fullName}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                                </div>
                                            </div>

                                            <div
                                                className={`w-5 h-5 rounded-lg flex items-center justify-center border transition shrink-0 ${isSelected
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "border-slate-300 bg-white"
                                                    }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className=" flex justify-end items-center">
                        <div className="flex items-center gap-2 pt-2 w-2/4">
                            <button
                                type="button"
                                onClick={() => {
                                    resetForm();
                                    onClose();
                                }}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !roomName.trim()}
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Create</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}