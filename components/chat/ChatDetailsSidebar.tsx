// components/chat/ChatDetailsSidebar.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    FileText,
    Table,
    Link as LinkIcon,
    Check,
    Users,
    Crown,
    Shield,
    UserPlus,
    X,
    Search,
    UserMinus,
    Download,
    ExternalLink,
    Clock,
    MessageSquare,
    Loader2,
    MoreVertical,
    Trash2,
    Pin,
    Image as ImageIcon,
    FolderOpen,
    Link2,
    Edit,
    Save,
    Upload,
    Camera,
    File,
    AlertCircle,
    CheckCircle,
    User,
    Hash,
    Calendar,
    Settings,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import toast from "react-hot-toast";
import { format } from "date-fns";

// ============================================================
// TYPES
// ============================================================

interface Member {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
    onlineStatus?: string;
    role?: string;
}

interface PinnedItem {
    _id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    uploadedBy: {
        _id: string;
        fullName: string;
    };
    uploadedAt: string;
}

interface LinkedTask {
    _id: string;
    title: string;
    status: string;
    priority: string;
    assignedTo: {
        _id: string;
        fullName: string;
    };
    progress: number;
}

interface ChatDetailsSidebarProps {
    channelId?: string;
    members?: Member[];
    onlineCount?: number;
    onClose?: () => void;
    onChannelUpdated?: () => void;
    onChannelDeleted?: () => void;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const getInitials = (name: string) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
};

const getAvatarColor = (userId: string) => {
    const colors = [
        "bg-indigo-100 text-indigo-600",
        "bg-rose-100 text-rose-600",
        "bg-emerald-100 text-emerald-600",
        "bg-amber-100 text-amber-600",
        "bg-purple-100 text-purple-600",
        "bg-cyan-100 text-cyan-600",
        "bg-pink-100 text-pink-600",
        "bg-teal-100 text-teal-600",
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
};

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
};

const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <Table className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ChatDetailsSidebar({
    channelId,
    members: externalMembers = [],
    onlineCount: externalOnlineCount = 0,
    onClose,
    onChannelUpdated,
    onChannelDeleted,
}: ChatDetailsSidebarProps) {
    const { user } = useAuth();
    const { socket } = useSocket();

    // State
    const [members, setMembers] = useState<Member[]>(externalMembers);
    const [onlineCount, setOnlineCount] = useState(externalOnlineCount);
    const [loading, setLoading] = useState(false);
    const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
    const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([]);
    const [loadingPinned, setLoadingPinned] = useState(false);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [channelInfo, setChannelInfo] = useState<any>(null);
    const [showAddMember, setShowAddMember] = useState(false);
    const [searchUsers, setSearchUsers] = useState("");
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [addingUser, setAddingUser] = useState(false);
    const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"members" | "pinned" | "tasks">("members");

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editingChannel, setEditingChannel] = useState(false);
    const [deletingChannel, setDeletingChannel] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Image Upload State
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // ============================================================
    // FETCH FUNCTIONS
    // ============================================================

    const fetchChannelDetails = useCallback(async () => {
        if (!channelId) return;
        try {
            const response = await api.get(`/channels/${channelId}`);
            if (response.data.success) {
                const data = response.data.data;
                setChannelInfo(data);
                setEditName(data.name || "");
                setEditDescription(data.description || "");
                setImagePreview(data.avatar || null);
            }
        } catch (error) {
            console.error("Error fetching channel details:", error);
        }
    }, [channelId]);

    const fetchChannelMembers = useCallback(async () => {
        if (!channelId) return;
        try {
            setLoading(true);
            const response = await api.get(`/channels/${channelId}/members`);
            if (response.data.success) {
                const memberList = response.data.data.members.map((m: any) => m.userId);
                setMembers(memberList);
                setOnlineCount(response.data.data.online || 0);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setLoading(false);
        }
    }, [channelId]);

    const fetchPinnedItems = useCallback(async () => {
        if (!channelId) return;
        try {
            setLoadingPinned(true);
            console.log("📌 [DetailsSidebar] Fetching pinned items for channel:", channelId);
            const response = await api.get(`/channels/${channelId}/pinned`);
            if (response.data.success) {
                console.log("📌 [DetailsSidebar] Pinned items fetched:", response.data.data?.length || 0);
                setPinnedItems(response.data.data || []);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setPinnedItems([]);
            } else {
                console.error("Error fetching pinned items:", error);
            }
        } finally {
            setLoadingPinned(false);
        }
    }, [channelId]);

    const fetchLinkedTasks = useCallback(async () => {
        if (!channelId) return;
        try {
            setLoadingTasks(true);
            const response = await api.get(`/channels/${channelId}/tasks`);
            if (response.data.success) {
                setLinkedTasks(response.data.data || []);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setLinkedTasks([]);
            } else {
                console.error("Error fetching linked tasks:", error);
            }
        } finally {
            setLoadingTasks(false);
        }
    }, [channelId]);

    const fetchAvailableUsers = useCallback(async () => {
        try {
            const response = await api.get("/users");
            if (response.data.success) {
                const existingIds = members.map(m => m._id);
                setAvailableUsers(
                    response.data.data.filter((u: any) =>
                        u._id !== user?._id && !existingIds.includes(u._id)
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, [members, user?._id]);

    // ============================================================
    // IMAGE UPLOAD - Base64
    // ============================================================

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        handleUploadAvatar(file);
    };

    const handleUploadAvatar = async (file: File) => {
        if (!channelId) return;

        setUploadingImage(true);
        try {
            const reader = new FileReader();
            const base64Data = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            console.log("📤 [Details] Uploading avatar...");

            const response = await api.put(`/channels/${channelId}`, {
                avatar: base64Data,
            });

            console.log("📥 [Details] Avatar upload response:", response.data);

            if (response.data.success) {
                toast.success("Channel avatar updated successfully");
                setChannelInfo((prev: any) => ({ ...prev, avatar: base64Data }));
                setImagePreview(base64Data);
                onChannelUpdated?.();
                fetchChannelDetails();
            } else {
                toast.error(response.data.message || "Failed to update avatar");
            }
        } catch (error: any) {
            console.error("❌ [Details] Error uploading avatar:", error);

            let errorMessage = "Failed to update avatar";

            if (error.response) {
                if (error.response.status === 403) {
                    errorMessage = "You don't have permission to change the avatar";
                } else if (error.response.status === 404) {
                    errorMessage = "Channel not found";
                } else {
                    errorMessage = error.response.data?.message || "Server error";
                }
            } else if (error.request) {
                errorMessage = "No response from server. Please check your connection.";
            } else {
                errorMessage = error.message || "Unknown error";
            }

            toast.error(errorMessage);
            setImagePreview(channelInfo?.avatar || null);
        } finally {
            setUploadingImage(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        }
    };

    const handleRemoveAvatar = async () => {
        if (!channelId) return;

        if (!confirm("Are you sure you want to remove the channel avatar?")) return;

        setUploadingImage(true);
        try {
            const response = await api.put(`/channels/${channelId}`, {
                avatar: null,
            });

            if (response.data.success) {
                toast.success("Channel avatar removed");
                setChannelInfo((prev: any) => ({ ...prev, avatar: null }));
                setImagePreview(null);
                onChannelUpdated?.();
                fetchChannelDetails();
            } else {
                toast.error(response.data.message || "Failed to remove avatar");
            }
        } catch (error: any) {
            console.error("❌ [Details] Error removing avatar:", error);
            toast.error(error.response?.data?.message || "Failed to remove avatar");
        } finally {
            setUploadingImage(false);
        }
    };

    // ============================================================
    // EDIT CHANNEL
    // ============================================================

    const handleEditChannel = async () => {
        if (!channelId || !editName.trim()) {
            toast.error("Channel name is required");
            return;
        }

        setEditingChannel(true);
        try {
            console.log("📤 [Details] Updating channel:", {
                channelId,
                name: editName.trim(),
                description: editDescription.trim(),
            });

            const response = await api.put(`/channels/${channelId}`, {
                name: editName.trim(),
                description: editDescription.trim(),
            });

            console.log("📥 [Details] Update response:", response.data);

            if (response.data.success) {
                toast.success("Channel updated successfully");
                setIsEditing(false);
                setChannelInfo(response.data.data);
                onChannelUpdated?.();
                fetchChannelDetails();

                if (response.data.data) {
                    setEditName(response.data.data.name);
                    setEditDescription(response.data.data.description || "");
                }
            } else {
                toast.error(response.data.message || "Failed to update channel");
            }
        } catch (error: any) {
            console.error("❌ [Details] Error updating channel:", error);

            let errorMessage = "Failed to update channel";

            if (error.response) {
                console.error("❌ [Details] Response data:", error.response.data);
                console.error("❌ [Details] Response status:", error.response.status);

                if (error.response.status === 403) {
                    errorMessage = "You don't have permission to edit this channel";
                } else if (error.response.status === 404) {
                    errorMessage = "Channel not found";
                } else if (error.response.status === 409) {
                    errorMessage = "Channel name already exists";
                } else {
                    errorMessage = error.response.data?.message || "Server error";
                }
            } else if (error.request) {
                errorMessage = "No response from server. Please check your connection.";
            } else {
                errorMessage = error.message || "Unknown error";
            }

            toast.error(errorMessage);
        } finally {
            setEditingChannel(false);
        }
    };

    // ============================================================
    // DELETE CHANNEL
    // ============================================================

    const handleDeleteChannel = async () => {
        if (!channelId) return;

        setDeletingChannel(true);
        try {
            const response = await api.delete(`/channels/${channelId}`);
            if (response.data.success) {
                toast.success("Channel deleted successfully");
                setShowDeleteConfirm(false);
                onChannelDeleted?.();
                onChannelUpdated?.();
                onClose?.();
            } else {
                toast.error(response.data.message || "Failed to delete channel");
            }
        } catch (error: any) {
            console.error("Error deleting channel:", error);
            toast.error(error.response?.data?.message || "Failed to delete channel");
        } finally {
            setDeletingChannel(false);
        }
    };

    // ============================================================
    // MEMBER MANAGEMENT
    // ============================================================

    const handleAddMember = async (userId: string) => {
        if (!channelId) return;

        try {
            setAddingUser(true);
            const response = await api.post(`/channels/${channelId}/invite`, {
                userIds: [userId],
            });

            if (response.data.success) {
                toast.success("User added to channel");
                setShowAddMember(false);
                fetchChannelMembers();
                fetchAvailableUsers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add user");
        } finally {
            setAddingUser(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!channelId) return;
        if (userId === user?._id) {
            toast.error("You cannot remove yourself");
            return;
        }

        if (!confirm("Are you sure you want to remove this user?")) return;

        try {
            const response = await api.delete(`/channels/${channelId}/members/${userId}`);
            if (response.data.success) {
                toast.success("User removed from channel");
                fetchChannelMembers();
                fetchAvailableUsers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to remove user");
        }
    };

    // ============================================================
    // PINNED FILE MANAGEMENT
    // ============================================================

    const handleRemovePinnedFile = async (fileId: string) => {
        if (!channelId) return;

        try {
            const response = await api.delete(`/channels/${channelId}/pinned/${fileId}`);
            if (response.data.success) {
                toast.success("File removed from pinned");
                setPinnedItems(prev => prev.filter(item => item._id !== fileId));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to remove file");
        }
    };

    // ============================================================
    // SOCKET EVENT LISTENERS
    // ============================================================

    useEffect(() => {
        if (!socket) return;

        console.log("🔌 [DetailsSidebar] Setting up socket listeners for channel:", channelId);

        const handleMemberAdded = (data: any) => {
            if (data.channelId === channelId) {
                setMembers(prev => [...prev, ...data.newMembers.map((m: any) => m.userId)]);
                setOnlineCount(prev => prev + data.newMembers.length);
                toast.success("New member joined");
            }
        };

        const handleMemberRemoved = (data: any) => {
            if (data.channelId === channelId) {
                setMembers(prev => prev.filter(m => m._id !== data.userId));
                setOnlineCount(prev => Math.max(0, prev - 1));
            }
        };

        const handleUserOnline = (data: any) => {
            setOnlineMembers(prev => [...prev, data.userId]);
            setMembers(prev => prev.map(m =>
                m._id === data.userId ? { ...m, onlineStatus: "online" } : m
            ));
        };

        const handleUserOffline = (data: any) => {
            setOnlineMembers(prev => prev.filter(id => id !== data.userId));
            setMembers(prev => prev.map(m =>
                m._id === data.userId ? { ...m, onlineStatus: "offline" } : m
            ));
        };

        // 🔥 FIXED: Force refresh pinned items when event is received
        const handlePinnedUpdated = (data: any) => {
            console.log("📌 [DetailsSidebar] Pinned updated event received:", data);
            console.log("📌 [DetailsSidebar] Current channelId:", channelId);

            // Always refresh pinned items regardless of channel match
            // The event is already scoped to the channel via io.to()
            if (channelId) {
                console.log("📌 [DetailsSidebar] Refreshing pinned items for channel:", channelId);
                fetchPinnedItems();
            }
        };

        socket.on("channel:members_updated", handleMemberAdded);
        socket.on("channel:member_removed", handleMemberRemoved);
        socket.on("user:online", handleUserOnline);
        socket.on("user:offline", handleUserOffline);
        socket.on("pinned:updated", handlePinnedUpdated);

        return () => {
            console.log("🧹 [DetailsSidebar] Cleaning up socket listeners");
            socket.off("channel:members_updated", handleMemberAdded);
            socket.off("channel:member_removed", handleMemberRemoved);
            socket.off("user:online", handleUserOnline);
            socket.off("user:offline", handleUserOffline);
            socket.off("pinned:updated", handlePinnedUpdated);
        };
    }, [socket, channelId, fetchPinnedItems]);

    // ============================================================
    // REFRESH DATA ON CHANNEL CHANGE
    // ============================================================

    useEffect(() => {
        if (channelId) {
            console.log("🔄 [DetailsSidebar] Channel changed, refreshing data for:", channelId);
            fetchChannelDetails();
            fetchChannelMembers();
            fetchPinnedItems();
            fetchLinkedTasks();
        }
    }, [channelId, fetchChannelDetails, fetchChannelMembers, fetchPinnedItems, fetchLinkedTasks]);

    // ============================================================
    // INITIAL FETCH FOR USERS
    // ============================================================

    useEffect(() => {
        fetchAvailableUsers();
    }, [fetchAvailableUsers]);

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================

    const isUserOnline = (userId: string) => {
        return onlineMembers.includes(userId) ||
            members.find(m => m._id === userId)?.onlineStatus === "online";
    };

    // ============================================================
    // NO CHANNEL SELECTED
    // ============================================================

    if (!channelId) {
        return (
            <aside className="w-full h-full bg-white flex flex-col items-center justify-center border-l border-slate-200">
                <div className="text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Select a channel to see details</p>
                </div>
            </aside>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <aside className="w-full h-full bg-white flex flex-col overflow-hidden border-l border-slate-200 select-none">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">Details</h3>
                    <span className="text-xs text-slate-400 shrink-0">({members.length})</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {/* Edit Button */}
                    <button
                        onClick={() => {
                            if (isEditing) {
                                handleEditChannel();
                            } else {
                                setIsEditing(true);
                                setEditName(channelInfo?.name || "");
                                setEditDescription(channelInfo?.description || "");
                            }
                        }}
                        disabled={editingChannel}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600 disabled:opacity-50"
                        title={isEditing ? "Save changes" : "Edit channel"}
                    >
                        {editingChannel ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isEditing ? (
                            <Save className="w-4 h-4 text-emerald-600" />
                        ) : (
                            <Edit className="w-4 h-4" />
                        )}
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={deletingChannel}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-600 disabled:opacity-50"
                        title="Delete channel"
                    >
                        {deletingChannel ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>

                    {/* Add Member Button */}
                    <button
                        onClick={() => {
                            setShowAddMember(!showAddMember);
                            if (!showAddMember) fetchAvailableUsers();
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
                        title="Add member"
                    >
                        <UserPlus className="w-4 h-4" />
                    </button>

                    {/* Close Button */}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600 lg:hidden"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Delete Channel</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-6">
                            Are you sure you want to delete <strong className="text-slate-800">#{channelInfo?.name}</strong>?
                            All messages and pinned files will be permanently removed.
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteChannel}
                                disabled={deletingChannel}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deletingChannel ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Channel
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Channel Info - with Image Upload */}
                {channelInfo && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        {/* Avatar with Upload */}
                        <div className="relative shrink-0 group">
                            {imagePreview || channelInfo.avatar ? (
                                <img
                                    src={imagePreview || channelInfo.avatar}
                                    alt={channelInfo.name}
                                    className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                                    <Hash className="w-6 h-6 text-indigo-600" />
                                </div>
                            )}

                            {/* Upload Overlay */}
                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={uploadingImage}
                                />
                                {uploadingImage ? (
                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-5 h-5 text-white" />
                                )}
                            </div>

                            {/* Remove Avatar Button */}
                            {(imagePreview || channelInfo.avatar) && (
                                <button
                                    onClick={handleRemoveAvatar}
                                    disabled={uploadingImage}
                                    className="absolute -top-1 -right-1 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition disabled:opacity-50"
                                    title="Remove avatar"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* Channel Info */}
                        <div className="min-w-0 flex-1">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-2 py-1 text-black border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                        placeholder="Channel name"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full px-2 py-1 text-black border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                        placeholder="Description"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400">Click Save to confirm changes</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-slate-800 truncate"># {channelInfo.name}</p>
                                    {channelInfo.description && (
                                        <p className="text-xs text-slate-400 truncate">{channelInfo.description}</p>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                        Created by {channelInfo.createdBy?.fullName || "Unknown"}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Add Member Section */}
                {showAddMember && (
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchUsers}
                                onChange={(e) => setSearchUsers(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                            {availableUsers
                                .filter(u => u.fullName?.toLowerCase().includes(searchUsers.toLowerCase()))
                                .map((user) => (
                                    <div
                                        key={user._id}
                                        className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={user.fullName}
                                                    className="w-7 h-7 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(user._id)}`}>
                                                    {getInitials(user.fullName)}
                                                </div>
                                            )}
                                            <span className="text-sm text-slate-700 truncate">{user.fullName}</span>
                                        </div>
                                        <button
                                            onClick={() => handleAddMember(user._id)}
                                            disabled={addingUser}
                                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
                                        >
                                            {addingUser ? "Adding..." : "Add"}
                                        </button>
                                    </div>
                                ))}
                            {availableUsers.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-2">No users available</p>
                            )}
                        </div>
                    </div>
                )}

                {/* MEMBERS Section */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            MEMBERS · {onlineCount} ONLINE
                        </h4>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => {
                                const isOnline = isUserOnline(member._id);
                                const isCreator = channelInfo?.createdBy?._id === member._id;

                                return (
                                    <div
                                        key={member._id}
                                        className="flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {member.avatar ? (
                                                <img
                                                    src={member.avatar}
                                                    alt={member.fullName}
                                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(member._id)} shrink-0`}>
                                                    {getInitials(member.fullName)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate">
                                                    {member.fullName}
                                                    {member._id === user?._id && " (You)"}
                                                </p>
                                                {isCreator && (
                                                    <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                                                        <Crown className="w-3 h-3" /> Creator
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div
                                                className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-300"
                                                    }`}
                                            />
                                            {member._id !== user?._id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member._id)}
                                                    className="p-1 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500"
                                                >
                                                    <UserMinus className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* PINNED FILES Section */}
                <section>
                    <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
                        PINNED FILES
                    </h4>

                    {loadingPinned ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        </div>
                    ) : pinnedItems.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 rounded-lg">
                            <Pin className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm text-slate-400">No pinned files</p>
                            <p className="text-[10px] text-slate-400">Pin important files for easy access</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pinnedItems.map((item) => (
                                <div key={item._id} className="flex items-start gap-3 group">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                        {getFileIcon(item.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-medium text-slate-800 truncate">
                                                {item.name}
                                            </p>
                                            <button
                                                onClick={() => handleRemovePinnedFile(item._id)}
                                                className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            {item.uploadedBy.fullName} · {formatFileSize(item.size)}
                                        </p>
                                    </div>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition shrink-0"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* LINKED TASKS Section */}
                <section>
                    <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">
                        LINKED TASKS
                    </h4>

                    {loadingTasks ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        </div>
                    ) : linkedTasks.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 rounded-lg">
                            <Link2 className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm text-slate-400">No linked tasks</p>
                            <p className="text-[10px] text-slate-400">Link tasks to this channel</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {linkedTasks.map((task) => {
                                const isCompleted = task.status === "completed";
                                return (
                                    <div
                                        key={task._id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border ${isCompleted
                                            ? "bg-emerald-50 border-emerald-100"
                                            : "bg-indigo-50 border-indigo-100"
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                                            }`}>
                                            {isCompleted ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <FileText className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-medium text-slate-800 truncate">
                                                {task.title}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {task.assignedTo?.fullName || "Unassigned"} ·
                                                <span className={`ml-1 font-medium ${isCompleted ? "text-emerald-600" : "text-indigo-600"
                                                    }`}>
                                                    {isCompleted ? "✓ Done" : "In Progress"}
                                                </span>
                                            </p>
                                        </div>
                                        {!isCompleted && (
                                            <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden shrink-0">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full"
                                                    style={{ width: `${task.progress || 0}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </aside>
    );
}