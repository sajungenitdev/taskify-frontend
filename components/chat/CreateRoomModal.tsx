// components/chat/CreateRoomModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Hash,
    Briefcase,
    MessageSquare,
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
// AVATAR UTILITIES
// ============================================================
const getAvatarColor = (userId: string) => {
    const colors = [
        "bg-indigo-500",
        "bg-rose-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-purple-500",
        "bg-cyan-500",
        "bg-pink-500",
        "bg-teal-500",
        "bg-orange-500",
        "bg-blue-500",
        "bg-red-500",
        "bg-violet-500",
        "bg-fuchsia-500",
        "bg-lime-500",
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
};

const getInitials = (name: string) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
};

// ============================================================
// USER AVATAR COMPONENT
// ============================================================
const UserAvatar = ({ user, size = "w-8 h-8", textSize = "text-xs" }: { user: any; size?: string; textSize?: string }) => {
    if (user?.avatar) {
        return (
            <img
                src={user.avatar}
                alt={user.fullName}
                className={`${size} rounded-full object-cover`}
            />
        );
    }

    const color = getAvatarColor(user?._id || "default");
    return (
        <div className={`${size} rounded-full ${color} flex items-center justify-center text-white font-bold ${textSize}`}>
            {getInitials(user?.fullName)}
        </div>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateRoom: (data: {
        name: string;
        type: "channel" | "project" | "direct";
        description?: string;
        members: string[];
        projectId?: string;
    }) => Promise<void>;
}

export default function CreateRoomModal({
    isOpen,
    onClose,
    onCreateRoom,
}: CreateRoomModalProps) {
    const { user } = useAuth();
    const [roomName, setRoomName] = useState("");
    const [roomType, setRoomType] = useState<"channel" | "project" | "direct">("channel");
    const [description, setDescription] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch users & projects when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            fetchProjects();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users");
            if (response.data.success) {
                const filtered = response.data.data.filter((u: any) => u._id !== user?._id);
                setAllUsers(filtered);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get("/projects");
            if (response.data.success) {
                setProjects(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!roomName.trim()) {
            toast.error("Room name is required");
            return;
        }

        if (roomType === "project" && !selectedProjectId) {
            toast.error("Please select a project");
            return;
        }

        if (roomType === "direct" && selectedMembers.length === 0) {
            toast.error("Please select a user for direct message");
            return;
        }

        setSubmitting(true);
        try {
            await onCreateRoom({
                name: roomName.trim(),
                type: roomType,
                description: description.trim(),
                members: selectedMembers,
                projectId: roomType === "project" ? selectedProjectId : undefined,
            });
            resetForm();
        } catch (error) {
            // Error handled in parent
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setRoomName("");
        setRoomType("channel");
        setDescription("");
        setSelectedMembers([]);
        setSearchTerm("");
        setSelectedProjectId("");
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = allUsers.filter((u) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden shadow-2xl">
                {/* ============================================================
                    HEADER
                    ============================================================ */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">New Room</h2>
                            <p className="text-xs text-slate-400">Create a channel, project, or direct message</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* ============================================================
                    FORM
                    ============================================================ */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(92vh-80px)] space-y-4">
                    {/* --- Room Type --- */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Room Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { type: "channel", icon: Hash, label: "Channel" },
                                { type: "project", icon: Briefcase, label: "Project" },
                                { type: "direct", icon: MessageSquare, label: "Direct" },
                            ].map(({ type, icon: Icon, label }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setRoomType(type as typeof roomType)}
                                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition ${roomType === type
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700"
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- Project Selector --- */}
                    {roomType === "project" && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Select Project
                            </label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="">Choose a project...</option>
                                {projects.map((project) => (
                                    <option key={project._id} value={project._id}>
                                        {project.name} {project.code ? `(${project.code})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* --- Room Name --- */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Room Name
                        </label>
                        <input
                            type="text"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            placeholder={roomType === "project" ? "e.g. frontend-dev" : "e.g. general"}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            required
                        />
                    </div>

                    {/* --- Description --- */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                            Description <span className="font-normal text-slate-400">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this room about?"
                            rows={2}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white"
                        />
                    </div>

                    {/* --- Members --- */}
                    {(roomType === "channel" || roomType === "project") && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Add Members <span className="font-normal text-slate-400">(optional)</span>
                            </label>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                />
                            </div>
                            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-50">
                                {filteredUsers.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                        {searchTerm ? "No users found" : "Type to search users"}
                                    </div>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const isSelected = selectedMembers.includes(u._id);
                                        return (
                                            <div
                                                key={u._id}
                                                onClick={() => toggleMember(u._id)}
                                                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                                                    }`}
                                            >
                                                <UserAvatar user={u} size="w-9 h-9" textSize="text-sm" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">
                                                        {u.fullName}
                                                    </p>
                                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                                </div>
                                                {isSelected && (
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                                                        <Check className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {selectedMembers.length > 0 && (
                                <div className="mt-2 flex items-center gap-1.5">
                                    <span className="text-xs text-slate-500">
                                        {selectedMembers.length} member{selectedMembers.length > 1 ? "s" : ""} selected
                                    </span>
                                    <div className="flex -space-x-1">
                                        {selectedMembers.slice(0, 4).map((id) => {
                                            const u = allUsers.find((a) => a._id === id);
                                            return u ? <UserAvatar key={id} user={u} size="w-6 h-6" textSize="text-[8px]" /> : null;
                                        })}
                                        {selectedMembers.length > 4 && (
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-500 font-bold">
                                                +{selectedMembers.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Direct Message User --- */}
                    {roomType === "direct" && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                Select User
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedMembers[0] || ""}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setSelectedMembers([e.target.value]);
                                        }
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none"
                                >
                                    <option value="">Choose a user...</option>
                                    {allUsers.map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {u.fullName} • {u.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedMembers.length > 0 && (
                                <div className="mt-2 flex items-center gap-2">
                                    {(() => {
                                        const u = allUsers.find((a) => a._id === selectedMembers[0]);
                                        return u ? (
                                            <>
                                                <UserAvatar user={u} size="w-8 h-8" textSize="text-xs" />
                                                <span className="text-sm font-medium text-slate-700">{u.fullName}</span>
                                            </>
                                        ) : null;
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- Submit --- */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium transition flex items-center justify-center gap-2 mt-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                Create Room
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}