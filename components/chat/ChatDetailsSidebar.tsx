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
    UserCog,
    RefreshCw,
    Plus,
    ListTodo,
    CheckCircle2,
    Circle,
    AlertTriangle,
    Clock as ClockIcon,
    Sparkles,
    ArrowRight,
    Unlink,
    LogOut,
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
    messageId?: string;
    uploadedBy: {
        _id: string;
        fullName: string;
        avatar?: string;
    };
    uploadedAt: string;
}

interface LinkedTask {
    _id: string;
    taskId: string;
    title: string;
    status: string;
    priority: string;
    progress: number;
    assignedTo: {
        _id: string;
        fullName: string;
        avatar?: string;
    };
    linkedBy?: {
        _id: string;
        fullName: string;
    };
    linkedAt: string;
}

interface ChatDetailsSidebarProps {
    channelId?: string;
    members?: Member[];
    onlineCount?: number;
    onClose?: () => void;
    onChannelUpdated?: () => void;
    onChannelDeleted?: () => void;
    onPinnedMessageClick?: (messageId: string) => void;
    onPinnedUpdated?: () => void;
    onLeaveChannel?: () => void; // ✅ NEW: Callback when user leaves
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
    if (type === 'message') return <MessageSquare className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed': return 'text-emerald-600 bg-emerald-50';
        case 'in-progress': return 'text-blue-600 bg-blue-50';
        case 'pending': return 'text-amber-600 bg-amber-50';
        case 'blocked': return 'text-red-600 bg-red-50';
        case 'overdue': return 'text-rose-600 bg-rose-50';
        default: return 'text-slate-600 bg-slate-50';
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed': return <CheckCircle2 className="w-3 h-3" />;
        case 'in-progress': return <Loader2 className="w-3 h-3 animate-spin" />;
        case 'pending': return <ClockIcon className="w-3 h-3" />;
        case 'blocked': return <AlertTriangle className="w-3 h-3" />;
        case 'overdue': return <AlertCircle className="w-3 h-3" />;
        default: return <Circle className="w-3 h-3" />;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high': return 'text-red-600 bg-red-50 border-red-200';
        case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
        case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-200';
        default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
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
    onPinnedMessageClick,
    onPinnedUpdated,
    onLeaveChannel, // ✅ NEW
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
    const [leavingChannel, setLeavingChannel] = useState(false);

    // ============================================================
    // TASK LINKING STATE
    // ============================================================
    const [showLinkTask, setShowLinkTask] = useState(false);
    const [searchTasks, setSearchTasks] = useState("");
    const [availableTasks, setAvailableTasks] = useState<any[]>([]);
    const [loadingTasksSearch, setLoadingTasksSearch] = useState(false);
    const [linkingTask, setLinkingTask] = useState(false);
    const [unlinkingTask, setUnlinkingTask] = useState<string | null>(null);

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

    // Admin Management State
    const [makingAdmin, setMakingAdmin] = useState<string | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const taskSearchInputRef = useRef<HTMLInputElement>(null);

    // ============================================================
    // CHECK IF CHANNEL IS DIRECT MESSAGE
    // ============================================================
    const isDirectMessage = useCallback(() => {
        return channelInfo?.type === "direct";
    }, [channelInfo]);

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
                const memberList = response.data.data.members.map((m: any) => ({
                    ...m.userId,
                    role: m.role,
                }));
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
            const response = await api.get(`/channels/${channelId}/pinned`);
            if (response.data.success) {
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

    // ============================================================
    // FETCH LINKED TASKS
    // ============================================================
    const fetchLinkedTasks = useCallback(async () => {
        if (!channelId) return;
        try {
            setLoadingTasks(true);
            console.log("📌 [Sidebar] Fetching linked tasks for channel:", channelId);
            const response = await api.get(`/channels/${channelId}/tasks`);
            if (response.data.success) {
                setLinkedTasks(response.data.data || []);
                console.log(`📌 [Sidebar] Loaded ${response.data.data?.length || 0} linked tasks`);
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

    // ============================================================
    // FETCH AVAILABLE TASKS FOR LINKING
    // ============================================================
    const fetchAvailableTasks = useCallback(async () => {
        try {
            setLoadingTasksSearch(true);
            const response = await api.get("/tasks");
            if (response.data.success) {
                const tasks = response.data.data || [];
                const linkedTaskIds = linkedTasks.map(t => t.taskId);
                const available = tasks.filter((task: any) => !linkedTaskIds.includes(task._id));
                setAvailableTasks(available);
                console.log(`📌 [Sidebar] Found ${available.length} available tasks`);
            }
        } catch (error) {
            console.error("Error fetching available tasks:", error);
            setAvailableTasks([]);
        } finally {
            setLoadingTasksSearch(false);
        }
    }, [linkedTasks]);

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
    // LINK TASK
    // ============================================================

    const handleLinkTask = useCallback(async (taskId: string, task: any) => {
        if (!channelId) return;

        setLinkingTask(true);
        try {
            console.log("📌 [Sidebar] Linking task:", { taskId, task, channelId });

            const statusMap: Record<string, string> = {
                'overdue': 'overdue',
                'todo': 'pending',
                'doing': 'in-progress',
                'done': 'completed',
                'in-progress': 'in-progress',
                'pending': 'pending',
                'completed': 'completed',
                'blocked': 'blocked',
            };

            const mappedStatus = statusMap[task.status?.toLowerCase()] || 'pending';
            const mappedPriority = task.priority?.toLowerCase() || 'medium';

            const response = await api.post(`/channels/${channelId}/tasks`, {
                taskId: taskId,
                title: task.title,
                status: mappedStatus,
                priority: mappedPriority,
                progress: task.progress || 0,
                assignedTo: task.assignedTo ? {
                    _id: task.assignedTo._id || task.assignedTo,
                    fullName: task.assignedTo.fullName || "Unknown",
                } : null,
            });

            console.log("📌 [Sidebar] Link task response:", response.data);

            if (response.data.success) {
                toast.success("Task linked successfully");
                setShowLinkTask(false);
                setSearchTasks("");
                await fetchLinkedTasks();
                setAvailableTasks([]);
            } else {
                toast.error(response.data.message || "Failed to link task");
            }
        } catch (error: any) {
            console.error("❌ Error linking task:", error);
            console.error("❌ Error response:", error.response?.data);
            console.error("❌ Error status:", error.response?.status);

            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to link task. Please check if the backend endpoint is available.";
            toast.error(errorMessage);
        } finally {
            setLinkingTask(false);
        }
    }, [channelId, fetchLinkedTasks]);

    // ============================================================
    // UNLINK TASK
    // ============================================================
    const handleUnlinkTask = useCallback(async (taskId: string, taskTitle: string) => {
        if (!channelId) return;
        if (!confirm(`Are you sure you want to unlink "${taskTitle}"?`)) return;

        setUnlinkingTask(taskId);
        try {
            const response = await api.delete(`/channels/${channelId}/tasks/${taskId}`);

            if (response.data.success) {
                toast.success("Task unlinked successfully");
                fetchLinkedTasks();
            } else {
                toast.error(response.data.message || "Failed to unlink task");
            }
        } catch (error: any) {
            console.error("Error unlinking task:", error);
            toast.error(error.response?.data?.message || "Failed to unlink task");
        } finally {
            setUnlinkingTask(null);
        }
    }, [channelId, fetchLinkedTasks]);

    // ============================================================
    // MAKE ADMIN FUNCTION
    // ============================================================

    const handleMakeAdmin = useCallback(async (userId: string, fullName: string, isAdmin: boolean) => {
        if (!channelId) return;

        const action = isAdmin ? "remove admin from" : "make admin";
        if (!confirm(`Are you sure you want to ${action} "${fullName}"?`)) return;

        setMakingAdmin(userId);
        try {
            const response = await api.patch(`/channels/${channelId}/members/${userId}/role`);

            if (response.data.success) {
                toast.success(response.data.message || `User ${action} successfully`);
                await fetchChannelMembers();
            } else {
                toast.error(response.data.message || "Failed to update role");
            }
        } catch (error: any) {
            console.error("Error making admin:", error);
            toast.error(error.response?.data?.message || "Failed to update role");
        } finally {
            setMakingAdmin(null);
        }
    }, [channelId, fetchChannelMembers]);

    // ============================================================
    // LEAVE CHANNEL FUNCTION
    // ============================================================
    const handleLeaveChannel = useCallback(async () => {
        if (!channelId) return;
        
        const channelName = channelInfo?.name || "this channel";
        if (!confirm(`Are you sure you want to leave "${channelName}"?`)) return;

        setLeavingChannel(true);
        try {
            const response = await api.post(`/channels/${channelId}/leave`);
            
            if (response.data.success) {
                toast.success(`Left "${channelName}" successfully`);
                // ✅ Close sidebar
                onClose?.();
                // ✅ Refresh channel list (this will remove the channel from the list)
                onChannelUpdated?.();
                // ✅ Trigger channel deletion callback to clear the chat
                onChannelDeleted?.();
                // ✅ Call the leave callback to redirect to default view
                onLeaveChannel?.();
            } else {
                toast.error(response.data.message || "Failed to leave channel");
            }
        } catch (error: any) {
            console.error("Error leaving channel:", error);
            toast.error(error.response?.data?.message || "Failed to leave channel");
        } finally {
            setLeavingChannel(false);
        }
    }, [channelId, channelInfo, onClose, onChannelUpdated, onChannelDeleted, onLeaveChannel]);

    // ============================================================
    // REMOVE MEMBER FUNCTION (Admin only)
    // ============================================================
    const handleRemoveMember = useCallback(async (userId: string, fullName: string) => {
        if (!channelId) return;
        if (userId === user?._id) {
            // If trying to remove self, use leave channel instead
            handleLeaveChannel();
            return;
        }

        if (!confirm(`Are you sure you want to remove "${fullName}" from this channel?`)) return;

        try {
            const response = await api.delete(`/channels/${channelId}/members/${userId}`);
            if (response.data.success) {
                toast.success(`"${fullName}" removed from channel`);
                fetchChannelMembers();
                fetchAvailableUsers();
            }
        } catch (error: any) {
            console.error("Error removing member:", error);
            toast.error(error.response?.data?.message || "Failed to remove user");
        }
    }, [channelId, user?._id, fetchChannelMembers, fetchAvailableUsers, handleLeaveChannel]);

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

            const response = await api.put(`/channels/${channelId}`, {
                avatar: base64Data,
            });

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
            console.error("Error uploading avatar:", error);
            toast.error(error.response?.data?.message || "Failed to update avatar");
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
            console.error("Error removing avatar:", error);
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
            const response = await api.put(`/channels/${channelId}`, {
                name: editName.trim(),
                description: editDescription.trim(),
            });

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
            console.error("Error updating channel:", error);
            toast.error(error.response?.data?.message || "Failed to update channel");
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
    // ADD MEMBER
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

    // ============================================================
    // PINNED FILE MANAGEMENT
    // ============================================================

    const handleRemovePinnedFile = async (fileId: string) => {
        if (!channelId) return;

        try {
            const removedItem = pinnedItems.find(item => item._id === fileId);

            const response = await api.delete(`/channels/${channelId}/pinned/${fileId}`);

            if (response.data.success) {
                toast.success("Pinned item removed");
                setPinnedItems(prev => prev.filter(item => item._id !== fileId));

                if (removedItem?.type === 'message' && removedItem.messageId) {
                    console.log(`📌 Removing pinned message: ${removedItem.messageId}`);
                }

                if (onPinnedUpdated) {
                    onPinnedUpdated();
                }
            } else {
                toast.error(response.data.message || "Failed to remove pinned item");
            }
        } catch (error: any) {
            console.error("Error removing pinned file:", error);
            toast.error(error.response?.data?.message || "Failed to remove pinned item");
        }
    };

    // ============================================================
    // SOCKET EVENT LISTENERS
    // ============================================================

    useEffect(() => {
        if (!socket) return;

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

        const handleMemberUpdated = (data: any) => {
            if (data.channelId === channelId) {
                setMembers(prev => prev.map(m =>
                    m._id === data.userId ? { ...m, role: data.role } : m
                ));
                if (channelInfo) {
                    setChannelInfo((prev: any) => ({
                        ...prev,
                        members: prev.members?.map((m: any) =>
                            m.userId._id === data.userId ? { ...m, role: data.role } : m
                        )
                    }));
                }
            }
        };

        const handlePinnedUpdated = (data: any) => {
            if (data.channelId === channelId) {
                fetchPinnedItems();
            }
        };

        const handleTaskLinked = (data: any) => {
            if (data.channelId === channelId) {
                console.log("📌 [Sidebar] Task linked, refreshing tasks");
                fetchLinkedTasks();
            }
        };

        socket.on("channel:members_updated", handleMemberAdded);
        socket.on("channel:member_removed", handleMemberRemoved);
        socket.on("user:online", handleUserOnline);
        socket.on("user:offline", handleUserOffline);
        socket.on("channel:member_updated", handleMemberUpdated);
        socket.on("pinned:updated", handlePinnedUpdated);
        socket.on("task:linked", handleTaskLinked);

        return () => {
            socket.off("channel:members_updated", handleMemberAdded);
            socket.off("channel:member_removed", handleMemberRemoved);
            socket.off("user:online", handleUserOnline);
            socket.off("user:offline", handleUserOffline);
            socket.off("channel:member_updated", handleMemberUpdated);
            socket.off("pinned:updated", handlePinnedUpdated);
            socket.off("task:linked", handleTaskLinked);
        };
    }, [socket, channelId, fetchPinnedItems, fetchLinkedTasks]);

    // ============================================================
    // REFRESH DATA ON CHANNEL CHANGE
    // ============================================================

    useEffect(() => {
        if (channelId) {
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

    const isAdmin = useCallback(() => {
        if (!channelInfo || !user) return false;
        if (channelInfo.type === "direct") return false;
        return channelInfo.createdBy?._id === user._id ||
            channelInfo.members?.some((m: any) =>
                m.userId?._id === user._id && m.role === "admin"
            );
    }, [channelInfo, user]);

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
                    {/* ✅ Edit Button - Only for Admins (not direct messages) */}
                    {!isDirectMessage() && isAdmin() && (
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
                    )}

                    {/* ✅ Delete Button - Only for Admins (not direct messages) */}
                    {!isDirectMessage() && isAdmin() && (
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
                    )}

                    {/* Add Member Button - Only for Admins (not direct messages) */}
                    {!isDirectMessage() && isAdmin() && (
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
                    )}

                    {/* ✅ Leave Channel Button - Show for ALL non-direct channels (both admin and normal users) */}
                    {!isDirectMessage() && (
                        <button
                            onClick={handleLeaveChannel}
                            disabled={leavingChannel}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition text-slate-400 hover:text-red-600 disabled:opacity-50"
                            title="Leave channel"
                        >
                            {leavingChannel ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                        </button>
                    )}

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

            {/* Delete Confirmation Modal - Only for Admins */}
            {!isDirectMessage() && isAdmin() && showDeleteConfirm && (
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
                            {isEditing && !isDirectMessage() && isAdmin() ? (
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
                                    <p className="text-sm font-medium text-slate-800 truncate">
                                        {isDirectMessage() ? (
                                            <span className="flex items-center gap-2">
                                                <span>{members.find(m => m._id !== user?._id)?.fullName || "Direct Message"}</span>
                                                <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">Direct</span>
                                            </span>
                                        ) : (
                                            `# ${channelInfo.name}`
                                        )}
                                    </p>
                                    {channelInfo.description && !isDirectMessage() && (
                                        <p className="text-xs text-slate-400 truncate">{channelInfo.description}</p>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                        {isDirectMessage() ? (
                                            <span>Direct message with {members.find(m => m._id !== user?._id)?.fullName || "Unknown"}</span>
                                        ) : (
                                            `Created by ${channelInfo.createdBy?.fullName || "Unknown"}`
                                        )}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Add Member Section - Admin only */}
                {!isDirectMessage() && isAdmin() && showAddMember && (
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
                        <div className="space-y-1.5">
                            {members.map((member) => {
                                const isOnline = isUserOnline(member._id);
                                const isCreator = channelInfo?.createdBy?._id === member._id;
                                const isAdminUser = member.role === "admin" || isCreator;
                                const isCurrentUser = member._id === user?._id;
                                const canManage = isAdmin() && !isCurrentUser && !isCreator;

                                return (
                                    <div
                                        key={member._id}
                                        className="flex items-center justify-between group py-1.5 px-2 hover:bg-slate-50 rounded-lg transition"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {member.avatar ? (
                                                <img
                                                    src={member.avatar}
                                                    alt={member.fullName}
                                                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                                                />
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(member._id)} shrink-0`}>
                                                    {getInitials(member.fullName)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5 flex-wrap">
                                                    {member.fullName}
                                                    {member._id === user?._id && " (You)"}
                                                    {!isDirectMessage() && isCreator && (
                                                        <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                                            <Crown className="w-3 h-3" /> Creator
                                                        </span>
                                                    )}
                                                    {!isDirectMessage() && isAdminUser && !isCreator && (
                                                        <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                                                            <Shield className="w-3 h-3" /> Admin
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <div
                                                className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-300"}`}
                                            />

                                            {/* Make/Remove Admin Button - Admin only */}
                                            {!isDirectMessage() && canManage && (
                                                <button
                                                    onClick={() => handleMakeAdmin(member._id, member.fullName, isAdminUser)}
                                                    disabled={makingAdmin === member._id}
                                                    className={`p-1 rounded-lg transition-all duration-200 ${isAdminUser
                                                        ? 'text-amber-400 hover:text-amber-600 hover:bg-amber-50'
                                                        : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                                                        } opacity-0 group-hover:opacity-100`}
                                                    title={isAdminUser ? "Remove admin" : "Make admin"}
                                                >
                                                    {makingAdmin === member._id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : isAdminUser ? (
                                                        <UserMinus className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <UserCog className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}

                                            {/* Remove Member Button - Admin only (NOT for self) */}
                                            {!isDirectMessage() && canManage && !isAdminUser && (
                                                <button
                                                    onClick={() => handleRemoveMember(member._id, member.fullName)}
                                                    className="p-1 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500"
                                                    title={`Remove ${member.fullName}`}
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
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            PINNED FILES
                        </h4>
                        <button
                            onClick={fetchPinnedItems}
                            disabled={loadingPinned}
                            className="text-slate-400 hover:text-indigo-600 transition p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                            title="Refresh pinned files"
                        >
                            {loadingPinned ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>

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
                                <div
                                    key={item._id}
                                    className={`flex items-start gap-3 group p-2 rounded-lg transition ${item.type === 'message'
                                        ? 'cursor-pointer hover:bg-indigo-50/50 border border-transparent hover:border-indigo-200'
                                        : 'hover:bg-slate-50'
                                        }`}
                                    onClick={() => {
                                        if (item.type === 'message' && item.messageId && onPinnedMessageClick) {
                                            onPinnedMessageClick(item.messageId);
                                            if (window.innerWidth < 1024 && onClose) {
                                                onClose();
                                            }
                                        }
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                        {getFileIcon(item.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-medium text-slate-800 truncate">
                                                {item.name}
                                            </p>
                                            {item.type === 'message' && (
                                                <span className="text-[9px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                                    Pinned Message
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemovePinnedFile(item._id);
                                                }}
                                                className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            {item.uploadedBy.fullName} · {formatFileSize(item.size)}
                                        </p>
                                    </div>
                                    {item.type === 'message' && (
                                        <div className="text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                            <span>Jump to</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* LINKED TASKS Section */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                            LINKED TASKS
                        </h4>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => {
                                    setShowLinkTask(!showLinkTask);
                                    if (!showLinkTask) {
                                        fetchAvailableTasks();
                                        setTimeout(() => taskSearchInputRef.current?.focus(), 100);
                                    }
                                }}
                                className="p-1.5 hover:bg-indigo-50 rounded-lg transition text-slate-400 hover:text-indigo-600"
                                title="Link task"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={fetchLinkedTasks}
                                disabled={loadingTasks}
                                className="text-slate-400 hover:text-indigo-600 transition p-1 rounded hover:bg-slate-100 disabled:opacity-50"
                                title="Refresh tasks"
                            >
                                {loadingTasks ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Link Task Input */}
                    {showLinkTask && (
                        <div className="mb-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    ref={taskSearchInputRef}
                                    type="text"
                                    placeholder="Search tasks to link..."
                                    value={searchTasks}
                                    onChange={(e) => setSearchTasks(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                {loadingTasksSearch ? (
                                    <div className="flex justify-center py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                    </div>
                                ) : availableTasks
                                    .filter(task => task.title?.toLowerCase().includes(searchTasks.toLowerCase()))
                                    .length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-2">
                                        {searchTasks ? "No matching tasks found" : "No tasks available to link"}
                                    </p>
                                ) : (
                                    availableTasks
                                        .filter(task => task.title?.toLowerCase().includes(searchTasks.toLowerCase()))
                                        .map((task) => (
                                            <div
                                                key={task._id}
                                                className="flex items-center justify-between p-2 hover:bg-white rounded-lg cursor-pointer transition"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-slate-700 truncate font-medium">
                                                        {task.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${getStatusColor(task.status || 'pending')}`}>
                                                            {task.status || 'pending'}
                                                        </span>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${getPriorityColor(task.priority || 'medium')}`}>
                                                            {task.priority || 'medium'}
                                                        </span>
                                                        {task.assignedTo?.fullName && (
                                                            <span className="text-[9px] text-slate-400">
                                                                Assigned to: {task.assignedTo.fullName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleLinkTask(task._id, task)}
                                                    disabled={linkingTask}
                                                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 shrink-0 ml-2"
                                                >
                                                    {linkingTask ? "Linking..." : "Link"}
                                                </button>
                                            </div>
                                        ))
                                )}
                            </div>
                            <button
                                onClick={() => setShowLinkTask(false)}
                                className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Task List */}
                    {loadingTasks ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                        </div>
                    ) : linkedTasks.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 rounded-lg">
                            <ListTodo className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm text-slate-400">No linked tasks</p>
                            <p className="text-[10px] text-slate-400">Link tasks to track them in this channel</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {linkedTasks.map((task) => (
                                <div
                                    key={task._id || task.taskId}
                                    className="group p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-200 transition"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(task.status)}`}>
                                                    {getStatusIcon(task.status)} {task.status}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                                {task.progress > 0 && (
                                                    <span className="text-[10px] text-slate-500">
                                                        {task.progress}%
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-slate-800 truncate mt-1">
                                                {task.title}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 flex-wrap">
                                                {task.assignedTo?.fullName && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {task.assignedTo.fullName}
                                                    </span>
                                                )}
                                                {task.linkedBy?.fullName && (
                                                    <span className="flex items-center gap-1">
                                                        <Link2 className="w-3 h-3" />
                                                        Linked by {task.linkedBy.fullName}
                                                    </span>
                                                )}
                                                {task.linkedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(task.linkedAt), "MMM d, yyyy")}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Progress Bar */}
                                            {task.progress > 0 && (
                                                <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(task.progress, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleUnlinkTask(task.taskId, task.title)}
                                            disabled={unlinkingTask === task.taskId}
                                            className="p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-600 disabled:opacity-50 shrink-0"
                                            title="Unlink task"
                                        >
                                            {unlinkingTask === task.taskId ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Unlink className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </aside>
    );
}