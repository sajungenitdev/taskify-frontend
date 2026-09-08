// components/chat/ChatDetailsSidebar.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    FileText,
    Table,
    Users,
    Crown,
    Shield,
    UserPlus,
    X,
    Search,
    UserMinus,
    MessageSquare,
    Loader2,
    Trash2,
    Pin,
    Image as ImageIcon,
    Edit2,
    Save,
    Camera,
    File as FileIcon,
    AlertCircle,
    Hash,
    Calendar,
    UserCog,
    RefreshCw,
    Plus,
    ListTodo,
    CheckCircle2,
    Circle,
    AlertTriangle,
    Clock as ClockIcon,
    Unlink,
    LogOut,
    User as UserIcon,
    Link2,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import toast from "react-hot-toast";
import { format } from "date-fns";

// ============================================================
// TYPES
// ============================================================

export interface Member {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
    onlineStatus?: string;
    role?: string;
}

export interface PinnedItem {
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

export interface LinkedTask {
    _id: string;
    taskId: string;
    title: string;
    status: string;
    priority: string;
    progress: number;
    assignedTo?: {
        _id: string;
        fullName: string;
        avatar?: string;
    } | null;
    linkedBy?: {
        _id: string;
        fullName: string;
    } | null;
    linkedAt: string;
}

export interface ChannelInfo {
    _id: string;
    name: string;
    description?: string;
    avatar?: string | null;
    type?: "group" | "direct" | "broadcast";
    createdBy?: {
        _id: string;
        fullName: string;
    };
    members?: Array<{
        userId: { _id: string; fullName?: string; avatar?: string } | string;
        role?: string;
    }>;
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
    onLeaveChannel?: () => void;
}

interface GenericConfirmModalState {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive?: boolean;
    isLoading?: boolean;
    onConfirm: () => Promise<void>;
}

// ============================================================
// UTILITIES & ENUM SANITIZERS
// ============================================================

const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
};

const getAvatarColor = (userId: string = "") => {
    const colors = [
        "bg-indigo-100 text-indigo-700 border-indigo-200",
        "bg-rose-100 text-rose-700 border-rose-200",
        "bg-emerald-100 text-emerald-700 border-emerald-200",
        "bg-amber-100 text-amber-700 border-amber-200",
        "bg-purple-100 text-purple-700 border-purple-200",
        "bg-cyan-100 text-cyan-700 border-cyan-200",
        "bg-pink-100 text-pink-700 border-pink-200",
        "bg-teal-100 text-teal-700 border-teal-200",
    ];
    const charCodeTotal = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeTotal % colors.length];
};

const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes < 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4 text-rose-500" />;
    if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv"))
        return <Table className="w-4 h-4 text-emerald-600" />;
    if (type === "message") return <MessageSquare className="w-4 h-4 text-amber-500" />;
    return <FileIcon className="w-4 h-4 text-slate-500" />;
};

const sanitizePriority = (priority?: string): string => {
    const p = (priority || "").toLowerCase().trim();
    switch (p) {
        case "urgent":
            return "urgent";
        case "high":
            return "high";
        case "low":
            return "low";
        case "medium":
        case "normal":
        default:
            return "medium";
    }
};

const sanitizeStatus = (status?: string): string => {
    const s = (status || "").toLowerCase().trim();
    switch (s) {
        case "completed":
        case "done":
            return "completed";
        case "in-progress":
        case "doing":
            return "in-progress";
        case "blocked":
            return "blocked";
        case "overdue":
            return "overdue";
        case "pending":
        case "todo":
        default:
            return "pending";
    }
};

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case "completed":
        case "done":
            return "text-emerald-700 bg-emerald-50 border-emerald-200";
        case "in-progress":
        case "doing":
            return "text-blue-700 bg-blue-50 border-blue-200";
        case "pending":
        case "todo":
            return "text-amber-700 bg-amber-50 border-amber-200";
        case "blocked":
            return "text-red-700 bg-red-50 border-red-200";
        case "overdue":
            return "text-rose-700 bg-rose-50 border-rose-200";
        default:
            return "text-slate-700 bg-slate-100 border-slate-200";
    }
};

const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
        case "completed":
        case "done":
            return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
        case "in-progress":
        case "doing":
            return <Loader2 className="w-3 h-3 animate-spin text-blue-600" />;
        case "pending":
        case "todo":
            return <ClockIcon className="w-3 h-3 text-amber-600" />;
        case "blocked":
            return <AlertTriangle className="w-3 h-3 text-red-600" />;
        case "overdue":
            return <AlertCircle className="w-3 h-3 text-rose-600" />;
        default:
            return <Circle className="w-3 h-3 text-slate-400" />;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case "urgent":
            return "text-rose-700 bg-rose-50 border-rose-200";
        case "high":
            return "text-red-700 bg-red-50 border-red-200";
        case "medium":
        case "normal":
            return "text-amber-700 bg-amber-50 border-amber-200";
        case "low":
            return "text-emerald-700 bg-emerald-50 border-emerald-200";
        default:
            return "text-slate-600 bg-slate-100 border-slate-200";
    }
};

const normalizeId = (item: any): string => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (item._id) return item._id.toString();
    if (item.userId) return normalizeId(item.userId);
    return item.toString();
};

// ============================================================
// COMPONENT
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
    onLeaveChannel,
}: ChatDetailsSidebarProps) {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();

    const currentUserId = normalizeId(user?._id);

    // Core States
    const [members, setMembers] = useState<Member[]>(externalMembers);
    const [onlineCount, setOnlineCount] = useState<number>(externalOnlineCount);
    const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
    const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);

    // Pinned Items & Linked Tasks
    const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
    const [loadingPinned, setLoadingPinned] = useState<boolean>(false);
    const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([]);
    const [loadingTasks, setLoadingTasks] = useState<boolean>(false);

    // Search & Task Linking
    const [showLinkTask, setShowLinkTask] = useState<boolean>(false);
    const [searchTasks, setSearchTasks] = useState<string>("");
    const [availableTasks, setAvailableTasks] = useState<any[]>([]);
    const [loadingTasksSearch, setLoadingTasksSearch] = useState<boolean>(false);
    const [linkingTaskId, setLinkingTaskId] = useState<string | null>(null);
    const [unlinkingTaskId, setUnlinkingTaskId] = useState<string | null>(null);

    // Members Management
    const [showAddMember, setShowAddMember] = useState<boolean>(false);
    const [searchUsers, setSearchUsers] = useState<string>("");
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [addingUser, setAddingUser] = useState<boolean>(false);
    const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
    const [makingAdmin, setMakingAdmin] = useState<string | null>(null);
    const [leavingChannel, setLeavingChannel] = useState<boolean>(false);

    // Edit Channel States
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editName, setEditName] = useState<string>("");
    const [editDescription, setEditDescription] = useState<string>("");
    const [editingChannel, setEditingChannel] = useState<boolean>(false);
    const [deletingChannel, setDeletingChannel] = useState<boolean>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    // Avatar Upload States
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Unified Custom Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<GenericConfirmModalState>({
        isOpen: false,
        title: "",
        description: "",
        confirmLabel: "Confirm",
        isDestructive: false,
        isLoading: false,
        onConfirm: async () => { },
    });

    // Refs
    const imageInputRef = useRef<HTMLInputElement>(null);
    const taskSearchInputRef = useRef<HTMLInputElement>(null);

    const isDirectMessage = useMemo(() => channelInfo?.type === "direct", [channelInfo]);

    const isAdmin = useMemo(() => {
        if (!channelInfo || !user) return false;
        if (channelInfo.type === "direct") return false;

        const creatorId = normalizeId(channelInfo.createdBy?._id);
        if (creatorId && creatorId === currentUserId) return true;

        return Boolean(
            channelInfo.members?.some((m: any) => normalizeId(m.userId) === currentUserId && m.role === "admin")
        );
    }, [channelInfo, user, currentUserId]);

    const closeConfirmModal = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
    };

    // Keep external props in sync
    useEffect(() => {
        if (externalMembers && externalMembers.length > 0) {
            setMembers(externalMembers);
        }
    }, [externalMembers]);

    useEffect(() => {
        if (typeof externalOnlineCount === "number") {
            setOnlineCount(externalOnlineCount);
        }
    }, [externalOnlineCount]);

    // ============================================================
    // API FETCHERS
    // ============================================================

    const fetchChannelDetails = useCallback(async () => {
        if (!channelId) return;
        try {
            const res = await api.get(`/channels/${channelId}`);
            if (res.data?.success) {
                const data = res.data.data;
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
        setLoadingMembers(true);
        try {
            const res = await api.get(`/channels/${channelId}/members`);
            if (res.data?.success) {
                const memberList = (res.data.data.members || []).map((m: any) => {
                    const uObj = typeof m.userId === "object" ? m.userId : { _id: m.userId };
                    return {
                        ...uObj,
                        _id: normalizeId(uObj._id || uObj),
                        role: m.role,
                    };
                });
                setMembers(memberList);
                if (typeof res.data.data.online === "number") {
                    setOnlineCount(res.data.data.online);
                }
            }
        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setLoadingMembers(false);
        }
    }, [channelId]);

    const fetchPinnedItems = useCallback(async () => {
        if (!channelId) return;
        setLoadingPinned(true);
        try {
            const res = await api.get(`/channels/${channelId}/pinned`);
            if (res.data?.success) {
                setPinnedItems(res.data.data || []);
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
        setLoadingTasks(true);
        try {
            const res = await api.get(`/channels/${channelId}/tasks`);
            if (res.data?.success) {
                setLinkedTasks(res.data.data || []);
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

    const fetchAvailableTasks = useCallback(async () => {
        setLoadingTasksSearch(true);
        try {
            const res = await api.get("/tasks");
            if (res.data?.success) {
                const allTasks = res.data.data || [];
                const linkedTaskIds = linkedTasks.map((t) => t.taskId);
                setAvailableTasks(allTasks.filter((task: any) => !linkedTaskIds.includes(task._id)));
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
            const res = await api.get("/users");
            if (res.data?.success) {
                const currentMemberIds = members.map((m) => normalizeId(m._id));
                setAvailableUsers(
                    (res.data.data || []).filter(
                        (u: any) => normalizeId(u._id) !== currentUserId && !currentMemberIds.includes(normalizeId(u._id))
                    )
                );
            }
        } catch (error) {
            console.error("Error fetching available users:", error);
        }
    }, [members, currentUserId]);

    useEffect(() => {
        if (channelId) {
            fetchChannelDetails();
            fetchChannelMembers();
            fetchPinnedItems();
            fetchLinkedTasks();
        }
    }, [channelId, fetchChannelDetails, fetchChannelMembers, fetchPinnedItems, fetchLinkedTasks]);

    useEffect(() => {
        fetchAvailableUsers();
    }, [fetchAvailableUsers]);

    // ============================================================
    // SOCKET LISTENERS & ONLINE STATUS SYNC
    // ============================================================

    useEffect(() => {
        if (!socket || !channelId) return;

        // Ask server for active online users
        socket.emit("users:get_online");

        const handleMemberAdded = (data: any) => {
            if (normalizeId(data.channelId) === normalizeId(channelId)) {
                fetchChannelMembers();
            }
        };

        const handleMemberRemoved = (data: any) => {
            if (normalizeId(data.channelId) === normalizeId(channelId)) {
                const removedId = normalizeId(data.userId);
                setMembers((prev) => prev.filter((m) => normalizeId(m._id) !== removedId));
                setOnlineMembers((prev) => prev.filter((id) => normalizeId(id) !== removedId));
            }
        };

        const handleUserOnline = (data: any) => {
            const uid = normalizeId(data?.userId || data);
            if (!uid) return;
            setOnlineMembers((prev) => (prev.some((id) => normalizeId(id) === uid) ? prev : [...prev, uid]));
            setMembers((prev) =>
                prev.map((m) => (normalizeId(m._id) === uid ? { ...m, onlineStatus: "online" } : m))
            );
        };

        const handleUserOffline = (data: any) => {
            const uid = normalizeId(data?.userId || data);
            if (!uid) return;
            setOnlineMembers((prev) => prev.filter((id) => normalizeId(id) !== uid));
            setMembers((prev) =>
                prev.map((m) => (normalizeId(m._id) === uid ? { ...m, onlineStatus: "offline" } : m))
            );
        };

        const handleOnlineUsersList = (data: any) => {
            const list = Array.isArray(data) ? data : data?.users || [];
            const normalized = list.map(normalizeId).filter(Boolean);
            setOnlineMembers((prev) => Array.from(new Set([...prev, ...normalized])));
        };

        const handleMemberUpdated = (data: any) => {
            if (normalizeId(data.channelId) === normalizeId(channelId)) {
                const uid = normalizeId(data.userId);
                setMembers((prev) =>
                    prev.map((m) => (normalizeId(m._id) === uid ? { ...m, role: data.role } : m))
                );
            }
        };

        const handlePinnedUpdated = (data: any) => {
            if (normalizeId(data.channelId) === normalizeId(channelId)) {
                fetchPinnedItems();
            }
        };

        const handleTaskLinked = (data: any) => {
            if (normalizeId(data.channelId) === normalizeId(channelId)) {
                fetchLinkedTasks();
            }
        };

        socket.on("channel:members_updated", handleMemberAdded);
        socket.on("channel:member_removed", handleMemberRemoved);
        socket.on("user:online", handleUserOnline);
        socket.on("user:offline", handleUserOffline);
        socket.on("users:online", handleOnlineUsersList);
        socket.on("channel:online_users", handleOnlineUsersList);
        socket.on("channel:member_updated", handleMemberUpdated);
        socket.on("pinned:updated", handlePinnedUpdated);
        socket.on("task:linked", handleTaskLinked);

        return () => {
            socket.off("channel:members_updated", handleMemberAdded);
            socket.off("channel:member_removed", handleMemberRemoved);
            socket.off("user:online", handleUserOnline);
            socket.off("user:offline", handleUserOffline);
            socket.off("users:online", handleOnlineUsersList);
            socket.off("channel:online_users", handleOnlineUsersList);
            socket.off("channel:member_updated", handleMemberUpdated);
            socket.off("pinned:updated", handlePinnedUpdated);
            socket.off("task:linked", handleTaskLinked);
        };
    }, [socket, channelId, fetchChannelMembers, fetchPinnedItems, fetchLinkedTasks]);

    // Robust Online Checker
    const isUserOnline = useCallback(
        (userId: any) => {
            const targetId = normalizeId(userId);
            if (!targetId) return false;

            // Current logged in user is always online if socket is connected
            if (isConnected && currentUserId && targetId === currentUserId) {
                return true;
            }

            // Check socket real-time presence array
            if (onlineMembers.some((id) => normalizeId(id) === targetId)) {
                return true;
            }

            // Check member's static property from API
            const found = members.find((m) => normalizeId(m._id) === targetId);
            return found?.onlineStatus === "online";
        },
        [isConnected, currentUserId, onlineMembers, members]
    );

    // Dynamic Online Count
    const resolvedOnlineCount = useMemo(() => {
        const activeOnlineSet = new Set<string>(onlineMembers.map(normalizeId));

        if (isConnected && currentUserId) {
            activeOnlineSet.add(currentUserId);
        }

        members.forEach((m) => {
            const mid = normalizeId(m._id);
            if (m.onlineStatus === "online" && mid) {
                activeOnlineSet.add(mid);
            }
        });

        if (members.length > 0) {
            const count = members.filter((m) => {
                const uid = normalizeId(m._id);
                return uid && activeOnlineSet.has(uid);
            }).length;
            return Math.max(count, onlineCount);
        }

        return onlineCount || (isConnected ? 1 : 0);
    }, [members, onlineMembers, onlineCount, isConnected, currentUserId]);

    // ============================================================
    // CHANNEL EDIT & AVATAR ACTIONS
    // ============================================================

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please upload a valid image file");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image file size must be less than 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64Data = reader.result as string;
            setImagePreview(base64Data);

            if (!channelId) return;
            setUploadingImage(true);
            try {
                const res = await api.put(`/channels/${channelId}`, { avatar: base64Data });
                if (res.data?.success) {
                    setChannelInfo((prev) => (prev ? { ...prev, avatar: base64Data } : null));
                    onChannelUpdated?.();
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to update channel avatar");
                setImagePreview(channelInfo?.avatar || null);
            } finally {
                setUploadingImage(false);
                if (imageInputRef.current) imageInputRef.current.value = "";
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        if (!channelId) return;

        setConfirmModal({
            isOpen: true,
            title: "Remove Avatar",
            description: "Are you sure you want to remove the channel avatar?",
            confirmLabel: "Remove",
            isDestructive: true,
            isLoading: false,
            onConfirm: async () => {
                setUploadingImage(true);
                try {
                    const res = await api.put(`/channels/${channelId}`, { avatar: null });
                    if (res.data?.success) {
                        setImagePreview(null);
                        setChannelInfo((prev) => (prev ? { ...prev, avatar: null } : null));
                        onChannelUpdated?.();
                        closeConfirmModal();
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to remove avatar");
                } finally {
                    setUploadingImage(false);
                }
            },
        });
    };

    const handleEditChannel = async () => {
        if (!channelId || !editName.trim()) {
            toast.error("Channel name cannot be empty");
            return;
        }

        setEditingChannel(true);
        try {
            const res = await api.put(`/channels/${channelId}`, {
                name: editName.trim(),
                description: editDescription.trim(),
            });
            if (res.data?.success) {
                setIsEditing(false);
                setChannelInfo(res.data.data);
                onChannelUpdated?.();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save channel details");
        } finally {
            setEditingChannel(false);
        }
    };

    const handleDeleteChannel = async () => {
        if (!channelId) return;
        setDeletingChannel(true);
        try {
            const res = await api.delete(`/channels/${channelId}`);
            if (res.data?.success) {
                setShowDeleteConfirm(false);
                onChannelDeleted?.();
                onChannelUpdated?.();
                onClose?.();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete channel");
        } finally {
            setDeletingChannel(false);
        }
    };

    const handleLeaveChannel = () => {
        if (!channelId) return;
        const channelTitle = channelInfo?.name || "this channel";

        setConfirmModal({
            isOpen: true,
            title: `Leave #${channelTitle}`,
            description: `Are you sure you want to leave #${channelTitle}? You won't receive new messages from this channel.`,
            confirmLabel: "Leave Channel",
            isDestructive: true,
            isLoading: false,
            onConfirm: async () => {
                setLeavingChannel(true);
                try {
                    const res = await api.post(`/channels/${channelId}/leave`);
                    if (res.data?.success) {
                        closeConfirmModal();
                        onClose?.();
                        onChannelUpdated?.();
                        onChannelDeleted?.();
                        onLeaveChannel?.();
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to leave channel");
                } finally {
                    setLeavingChannel(false);
                }
            },
        });
    };

    // ============================================================
    // MEMBERS ACTIONS
    // ============================================================

    const handleAddMember = async (userId: string) => {
        if (!channelId) return;
        setAddingUser(true);
        try {
            const res = await api.post(`/channels/${channelId}/invite`, { userIds: [userId] });
            if (res.data?.success) {
                setShowAddMember(false);
                fetchChannelMembers();
                fetchAvailableUsers();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add member");
        } finally {
            setAddingUser(false);
        }
    };

    const handleMakeAdmin = (userId: string, fullName: string, isCurrentlyAdmin: boolean) => {
        if (!channelId) return;
        const actionVerb = isCurrentlyAdmin ? "revoke admin status from" : "grant admin role to";

        setConfirmModal({
            isOpen: true,
            title: isCurrentlyAdmin ? "Demote Admin" : "Promote to Admin",
            description: `Are you sure you want to ${actionVerb} "${fullName}"?`,
            confirmLabel: isCurrentlyAdmin ? "Revoke Admin" : "Make Admin",
            isDestructive: false,
            isLoading: false,
            onConfirm: async () => {
                setMakingAdmin(userId);
                try {
                    const res = await api.patch(`/channels/${channelId}/members/${userId}/role`);
                    if (res.data?.success) {
                        fetchChannelMembers();
                        closeConfirmModal();
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to update role");
                } finally {
                    setMakingAdmin(null);
                }
            },
        });
    };

    const handleRemoveMember = (userId: string, fullName: string) => {
        if (!channelId) return;
        if (userId === user?._id) {
            handleLeaveChannel();
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: "Remove Member",
            description: `Are you sure you want to remove "${fullName}" from this channel?`,
            confirmLabel: "Remove",
            isDestructive: true,
            isLoading: false,
            onConfirm: async () => {
                try {
                    const res = await api.delete(`/channels/${channelId}/members/${userId}`);
                    if (res.data?.success) {
                        fetchChannelMembers();
                        fetchAvailableUsers();
                        closeConfirmModal();
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to remove member");
                }
            },
        });
    };

    // ============================================================
    // TASK ACTIONS
    // ============================================================

    const handleLinkTask = async (taskId: string, task: any) => {
        if (!channelId) return;
        setLinkingTaskId(taskId);

        try {
            const payload = {
                taskId,
                title: task.title,
                status: sanitizeStatus(task.status),
                priority: sanitizePriority(task.priority),
                progress: typeof task.progress === "number" ? Math.min(Math.max(task.progress, 0), 100) : 0,
                assignedTo: task.assignedTo
                    ? {
                        _id: normalizeId(task.assignedTo),
                        fullName: task.assignedTo.fullName || "Unknown",
                    }
                    : null,
            };

            const res = await api.post(`/channels/${channelId}/tasks`, payload);

            if (res.data?.success) {
                setShowLinkTask(false);
                setSearchTasks("");
                await fetchLinkedTasks();
            } else {
                toast.error(res.data?.message || "Failed to link task");
            }
        } catch (error: any) {
            console.error("Link task error:", error.response?.data || error);
            toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to link task");
        } finally {
            setLinkingTaskId(null);
        }
    };

    const handleUnlinkTask = (taskId: string, taskTitle: string) => {
        if (!channelId) return;

        setConfirmModal({
            isOpen: true,
            title: "Unlink Task",
            description: `Are you sure you want to unlink "${taskTitle}" from this channel?`,
            confirmLabel: "Unlink Task",
            isDestructive: true,
            isLoading: false,
            onConfirm: async () => {
                setUnlinkingTaskId(taskId);
                try {
                    const res = await api.delete(`/channels/${channelId}/tasks/${taskId}`);
                    if (res.data?.success) {
                        fetchLinkedTasks();
                        closeConfirmModal();
                    }
                } catch (error: any) {
                    toast.error(error.response?.data?.message || "Failed to unlink task");
                } finally {
                    setUnlinkingTaskId(null);
                }
            },
        });
    };

    const handleRemovePinnedItem = async (fileId: string) => {
        if (!channelId) return;
        try {
            const res = await api.delete(`/channels/${channelId}/pinned/${fileId}`);
            if (res.data?.success) {
                setPinnedItems((prev) => prev.filter((item) => item._id !== fileId));
                onPinnedUpdated?.();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to remove pinned item");
        }
    };

    if (!channelId) {
        return (
            <aside className="w-full h-full bg-slate-50 flex flex-col items-center justify-center border-l border-slate-200/80 p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs mb-3">
                    <Users className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-700">No channel selected</h4>
                <p className="text-xs text-slate-400 mt-1">Select a channel to view member details and resources</p>
            </aside>
        );
    }

    return (
        <aside className="w-full h-full bg-white flex flex-col overflow-hidden border-l border-slate-200 select-none">
            {/* Top Header */}
            <div className="h-14 px-4 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Details</h3>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {members.length}
                    </span>
                </div>

                <div className="flex items-center gap-0.5">
                    {!isDirectMessage && isAdmin && (
                        <button
                            type="button"
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
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition disabled:opacity-50 cursor-pointer"
                            title={isEditing ? "Save details" : "Edit channel"}
                        >
                            {editingChannel ? (
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            ) : isEditing ? (
                                <Save className="w-4 h-4 text-emerald-600" />
                            ) : (
                                <Edit2 className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    {!isDirectMessage && isAdmin && (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition cursor-pointer"
                            title="Delete channel"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}

                    {!isDirectMessage && isAdmin && (
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddMember(!showAddMember);
                                if (!showAddMember) fetchAvailableUsers();
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${showAddMember
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                            title="Add member"
                        >
                            <UserPlus className="w-4 h-4" />
                        </button>
                    )}

                    {!isDirectMessage && (
                        <button
                            type="button"
                            onClick={handleLeaveChannel}
                            disabled={leavingChannel}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition disabled:opacity-50 cursor-pointer"
                            title="Leave channel"
                        >
                            {leavingChannel ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Scrollable Canvas */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Channel Card */}
                {channelInfo && (
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0 group/avatar">
                                {imagePreview || channelInfo.avatar ? (
                                    <img
                                        src={imagePreview || channelInfo.avatar!}
                                        alt={channelInfo.name}
                                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                                        <Hash className="w-6 h-6" />
                                    </div>
                                )}

                                {!isDirectMessage && isAdmin && (
                                    <label className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            disabled={uploadingImage}
                                            className="hidden"
                                        />
                                        {uploadingImage ? (
                                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                                        ) : (
                                            <Camera className="w-4 h-4 text-white" />
                                        )}
                                    </label>
                                )}

                                {(imagePreview || channelInfo.avatar) && !isDirectMessage && isAdmin && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        disabled={uploadingImage}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-xs transition cursor-pointer"
                                        title="Remove avatar"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                {isEditing && !isDirectMessage && isAdmin ? (
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Channel Name"
                                            className="w-full text-black px-2.5 py-1 text-xs font-normal bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                        />
                                        <input
                                            type="text"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Add description..."
                                            className="w-full px-2.5 text-black py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5">
                                            {isDirectMessage ? (
                                                members.find((m) => normalizeId(m._id) !== currentUserId)?.fullName || "Direct Message"
                                            ) : (
                                                <span>{channelInfo.name}</span>
                                            )}
                                        </h4>
                                        {channelInfo.description && !isDirectMessage && (
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                                                {channelInfo.description}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                                            {isDirectMessage
                                                ? "Private 1-on-1 discussion"
                                                : `Created by ${channelInfo.createdBy?.fullName || "System"}`}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Member Inline Tray */}
                {!isDirectMessage && isAdmin && showAddMember && (
                    <div className="p-3 bg-slate-50 border border-indigo-100 rounded-2xl space-y-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search colleagues to invite..."
                                value={searchUsers}
                                onChange={(e) => setSearchUsers(e.target.value)}
                                className="w-full pl-8 pr-3 text-black py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                            {availableUsers
                                .filter((u) => u.fullName?.toLowerCase().includes(searchUsers.toLowerCase()))
                                .map((u) => (
                                    <div
                                        key={u._id}
                                        className="flex items-center justify-between p-1.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border ${getAvatarColor(
                                                    u._id
                                                )}`}
                                            >
                                                {getInitials(u.fullName)}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700 truncate">{u.fullName}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddMember(u._id)}
                                            disabled={addingUser}
                                            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-medium transition disabled:opacity-40 cursor-pointer"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            {availableUsers.length === 0 && (
                                <p className="text-center py-2 text-xs text-slate-400">All available members are in this channel</p>
                            )}
                        </div>
                    </div>
                )}

                {/* SECTION: Channel Members */}
                <section className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Members • {resolvedOnlineCount} Online
                        </h5>
                        <button
                            type="button"
                            onClick={fetchChannelMembers}
                            disabled={loadingMembers}
                            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                            <RefreshCw className={`w-3 h-3 ${loadingMembers ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {loadingMembers ? (
                        <div className="py-6 flex justify-center">
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {members.map((member) => {
                                const isOnline = isUserOnline(member._id);
                                const isCreator = normalizeId(channelInfo?.createdBy?._id) === normalizeId(member._id);
                                const isMemberAdmin = member.role === "admin" || isCreator;
                                const isSelf = normalizeId(member._id) === currentUserId;
                                const canManage = isAdmin && !isSelf && !isCreator;

                                return (
                                    <div
                                        key={member._id}
                                        className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="relative shrink-0">
                                                {member.avatar ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.fullName}
                                                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${getAvatarColor(
                                                            member._id
                                                        )}`}
                                                    >
                                                        {getInitials(member.fullName)}
                                                    </div>
                                                )}
                                                <span
                                                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${isOnline ? "bg-emerald-500" : "bg-slate-300"
                                                        }`}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-xs font-medium text-slate-700 truncate">
                                                        {member.fullName}
                                                        {isSelf && " (You)"}
                                                    </span>

                                                    {isCreator && (
                                                        <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                                                            <Crown className="w-2.5 h-2.5 text-amber-500" /> Host
                                                        </span>
                                                    )}

                                                    {!isCreator && isMemberAdmin && (
                                                        <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5">
                                                            <Shield className="w-2.5 h-2.5 text-indigo-500" /> Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {!isDirectMessage && canManage && (
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleMakeAdmin(member._id, member.fullName, isMemberAdmin)}
                                                    disabled={makingAdmin === member._id}
                                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                                    title={isMemberAdmin ? "Demote from admin" : "Promote to admin"}
                                                >
                                                    {makingAdmin === member._id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                                    ) : (
                                                        <UserCog className="w-3.5 h-3.5" />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(member._id, member.fullName)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                                    title="Remove user"
                                                >
                                                    <UserMinus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* SECTION: Pinned Items */}
                <section className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Pinned Items ({pinnedItems.length})
                        </h5>
                        <button
                            type="button"
                            onClick={fetchPinnedItems}
                            disabled={loadingPinned}
                            className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                            <RefreshCw className={`w-3 h-3 ${loadingPinned ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {loadingPinned ? (
                        <div className="py-6 flex justify-center">
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        </div>
                    ) : pinnedItems.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                            <Pin className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs text-slate-500">No pinned files or messages</p>
                            <p className="text-[10px] text-slate-400">Hover over messages or files to pin them</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {pinnedItems.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => {
                                        if (item.type === "message" && item.messageId) {
                                            onPinnedMessageClick?.(item.messageId);
                                            if (window.innerWidth < 1024) onClose?.();
                                        }
                                    }}
                                    className={`group flex items-center justify-between p-2 rounded-xl border border-slate-100 transition ${item.type === "message"
                                            ? "cursor-pointer bg-amber-50/30 hover:bg-amber-50/80 hover:border-amber-200"
                                            : "bg-white hover:bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                            {getFileIcon(item.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{item.uploadedBy?.fullName}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* SECTION: Linked Tasks */}
                <section className="space-y-2.5">
                    <div className="flex items-center justify-between">
                        <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Linked Tasks ({linkedTasks.length})
                        </h5>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLinkTask(!showLinkTask);
                                    if (!showLinkTask) {
                                        fetchAvailableTasks();
                                        setTimeout(() => taskSearchInputRef.current?.focus(), 100);
                                    }
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition cursor-pointer"
                                title="Link existing task"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={fetchLinkedTasks}
                                disabled={loadingTasks}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
                            >
                                <RefreshCw className={`w-3 h-3 ${loadingTasks ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {showLinkTask && (
                        <div className="p-3 bg-slate-50 border border-indigo-100 rounded-2xl space-y-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    ref={taskSearchInputRef}
                                    type="text"
                                    placeholder="Search workspace tasks..."
                                    value={searchTasks}
                                    onChange={(e) => setSearchTasks(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-black text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {loadingTasksSearch ? (
                                    <div className="py-3 flex justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    </div>
                                ) : availableTasks.filter((t) => t.title?.toLowerCase().includes(searchTasks.toLowerCase()))
                                    .length === 0 ? (
                                    <p className="text-center py-2 text-xs text-slate-400">No attachable tasks found</p>
                                ) : (
                                    availableTasks
                                        .filter((t) => t.title?.toLowerCase().includes(searchTasks.toLowerCase()))
                                        .map((task) => {
                                            const isLinkingThis = linkingTaskId === task._id;
                                            return (
                                                <div
                                                    key={task._id}
                                                    className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition"
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-xs font-semibold text-slate-800 truncate">{task.title}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span
                                                                className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getStatusColor(
                                                                    task.status
                                                                )}`}
                                                            >
                                                                {task.status || "Pending"}
                                                            </span>
                                                            <span
                                                                className={`text-[9px] px-1.5 py-0.2 rounded-full border ${getPriorityColor(
                                                                    task.priority
                                                                )}`}
                                                            >
                                                                {task.priority || "Normal"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleLinkTask(task._id, task)}
                                                        disabled={Boolean(linkingTaskId)}
                                                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 transition disabled:opacity-40 flex items-center justify-center min-w-[50px] cursor-pointer"
                                                    >
                                                        {isLinkingThis ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            "Link"
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    )}

                    {loadingTasks ? (
                        <div className="py-6 flex justify-center">
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        </div>
                    ) : linkedTasks.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
                            <ListTodo className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                            <p className="text-xs text-slate-500">No tasks connected</p>
                            <p className="text-[10px] text-slate-400">Link project tasks to collaborate directly</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {linkedTasks.map((task) => (
                                <div
                                    key={task._id || task.taskId}
                                    className="group p-2.5 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-2xs transition"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span
                                                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${getStatusColor(
                                                        task.status
                                                    )}`}
                                                >
                                                    {getStatusIcon(task.status)}
                                                    {task.status}
                                                </span>
                                                <span
                                                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${getPriorityColor(
                                                        task.priority
                                                    )}`}
                                                >
                                                    {task.priority}
                                                </span>
                                                {task.progress > 0 && (
                                                    <span className="text-[9px] font-bold text-slate-500">{task.progress}%</span>
                                                )}
                                            </div>

                                            <h6 className="text-xs font-semibold text-slate-800 truncate mt-1">{task.title}</h6>

                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 flex-wrap">
                                                {task.assignedTo?.fullName && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <UserIcon className="w-2.5 h-2.5" />
                                                        {task.assignedTo.fullName}
                                                    </span>
                                                )}
                                                {task.linkedAt && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Calendar className="w-2.5 h-2.5" />
                                                        {format(new Date(task.linkedAt), "MMM d")}
                                                    </span>
                                                )}
                                            </div>

                                            {task.progress > 0 && (
                                                <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(task.progress, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleUnlinkTask(task.taskId, task.title)}
                                            disabled={unlinkingTaskId === task.taskId}
                                            className="p-1 text-slate-400 hover:text-rose-500 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                            title="Unlink task"
                                        >
                                            {unlinkingTaskId === task.taskId ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
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

            {/* Delete Channel Modal */}
            {!isDirectMessage && isAdmin && showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Delete Channel?</h4>
                                <p className="text-[11px] text-slate-400">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-5">
                            Are you sure you want to permanently delete <strong>#{channelInfo?.name}</strong>? All conversations,
                            attachments, and tasks linked here will be discarded.
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deletingChannel}
                                className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteChannel}
                                disabled={deletingChannel}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                                {deletingChannel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Unified Action Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${confirmModal.isDestructive
                                        ? "bg-rose-50 border-rose-100 text-rose-600"
                                        : "bg-indigo-50 border-indigo-100 text-indigo-600"
                                    }`}
                            >
                                {confirmModal.isDestructive ? <AlertTriangle className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">{confirmModal.title}</h4>
                                <p className="text-[11px] text-slate-400">Action confirmation</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-5">{confirmModal.description}</p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={closeConfirmModal}
                                disabled={confirmModal.isLoading}
                                className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
                                    await confirmModal.onConfirm();
                                }}
                                disabled={confirmModal.isLoading}
                                className={`flex-1 py-2 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${confirmModal.isDestructive ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
                                    }`}
                            >
                                {confirmModal.isLoading ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <span>{confirmModal.confirmLabel}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}