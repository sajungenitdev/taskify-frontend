// components/chat/ChatSidebar.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Building2,
    Laptop,
    Briefcase,
    Receipt,
    Box,
    FileText,
    MessageSquare,
    Search,
    X,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Trash2,
    Circle,
    Zap,
    Archive,
    RefreshCw,
    AlertTriangle,
    Hash,
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";

// ============================================================
// TYPES
// ============================================================

export interface ChannelItem {
    _id: string;
    name: string;
    type: "channel" | "project" | "direct";
    description?: string;
    topic?: string;
    avatar?: string;
    lastMessage?: {
        content: string;
        createdAt: string;
        senderId: {
            fullName: string;
        };
    };
    unreadCount?: number;
    iconType?: "building" | "laptop" | "briefcase" | "receipt" | "box" | "file";
    iconBg?: string;
    roleBadge?: string;
    members?: Array<{
        userId: {
            _id: string;
            fullName: string;
            email: string;
            avatar?: string;
            onlineStatus?: string;
            role?: string;
        };
        role: string;
        joinedAt: string;
    }>;
    createdBy?: {
        _id: string;
        fullName: string;
    };
    updatedAt?: string;
    createdAt?: string;
    isArchived?: boolean;
    archivedAt?: string;
    archivedBy?: string;
}

interface ChatSidebarProps {
    selectedChannelId: string | null;
    onSelectChannel: (channelId: string, channelName: string) => void;
    channels?: ChannelItem[];
    loading?: boolean;
    onOpenCreateModal?: () => void;
}

interface DeleteModalState {
    isOpen: boolean;
    channelId: string;
    channelName: string;
    isDM: boolean;
}

// ============================================================
// ICON MAP
// ============================================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    building: Building2,
    laptop: Laptop,
    briefcase: Briefcase,
    receipt: Receipt,
    box: Box,
    file: FileText,
};

// ============================================================
// AVATAR UTILITIES
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
    const index = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ChatSidebar({
    selectedChannelId,
    onSelectChannel,
    channels: externalChannels = [],
    loading: externalLoading = false,
    onOpenCreateModal,
}: ChatSidebarProps) {
    const { user } = useAuth();
    const { socket, isConnected, joinChannel, markAsRead, onUserOnline, onUserOffline } = useSocket();

    // State
    const [channels, setChannels] = useState<ChannelItem[]>(externalChannels);
    const [loading, setLoading] = useState(externalLoading);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedSections, setExpandedSections] = useState({
        channels: true,
        projects: true,
        directMessages: true,
        archived: false,
        users: true,
    });
    const [onlineMembers, setOnlineMembers] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [channelCounts, setChannelCounts] = useState({
        total: 0,
        channels: 0,
        projects: 0,
        direct: 0,
        archived: 0,
        online: 0,
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);

    // Custom Delete Confirmation Modal State
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
        isOpen: false,
        channelId: "",
        channelName: "",
        isDM: false,
    });

    const currentUserId = user?._id?.toString();
    const channelListRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoading(externalLoading);
    }, [externalLoading]);

    // ============================================================
    // UPDATE CHANNELS FROM EXTERNAL PROP
    // ============================================================
    const updateChannelCounts = useCallback(
        (channelList: ChannelItem[]) => {
            const counts = {
                total: channelList.length,
                channels: channelList.filter((c) => c.type === "channel" && !c.isArchived).length,
                projects: channelList.filter((c) => c.type === "project" && !c.isArchived).length,
                direct: channelList.filter((c) => c.type === "direct" && !c.isArchived).length,
                archived: channelList.filter((c) => c.isArchived).length,
                online: onlineMembers.length,
            };
            setChannelCounts(counts);
        },
        [onlineMembers.length]
    );

    useEffect(() => {
        if (externalChannels) {
            setChannels(externalChannels);
            updateChannelCounts(externalChannels);
        }
    }, [externalChannels, updateChannelCounts]);

    // ============================================================
    // FETCH USERS
    // ============================================================
    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get("/users");
            if (response.data?.success) {
                const filteredUsers = (response.data.data || []).filter(
                    (u: any) => u._id?.toString() !== currentUserId
                );
                setAllUsers(filteredUsers);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    }, [currentUserId]);

    // ============================================================
    // UNARCHIVE CHANNEL
    // ============================================================
    const handleUnarchiveChannel = useCallback(
        async (channelId: string) => {
            try {
                const response = await api.patch(`/channels/${channelId}/archive`, { isArchived: false });
                if (response.data?.success) {
                    toast.success("Channel restored from archive");
                    setChannels((prev) => {
                        const updated = prev.map((ch) =>
                            ch._id === channelId ? { ...ch, isArchived: false, archivedAt: undefined } : ch
                        );
                        updateChannelCounts(updated);
                        return updated;
                    });
                } else {
                    toast.error(response.data?.message || "Failed to restore channel");
                }
            } catch (err: any) {
                console.error("Error unarchiving channel:", err);
                toast.error(err.response?.data?.message || "Failed to restore channel");
            }
        },
        [updateChannelCounts]
    );

    // ============================================================
    // OPEN DELETE CONFIRMATION MODAL
    // ============================================================
    const openDeleteModal = useCallback((channelId: string, channelName: string, isDM: boolean) => {
        setDeleteModal({
            isOpen: true,
            channelId,
            channelName,
            isDM,
        });
    }, []);

    const closeDeleteModal = useCallback(() => {
        setDeleteModal({
            isOpen: false,
            channelId: "",
            channelName: "",
            isDM: false,
        });
    }, []);

    // ============================================================
    // EXECUTE DELETE CHANNEL (API)
    // ============================================================
    const executeDeleteChannel = useCallback(async () => {
        const { channelId, channelName } = deleteModal;
        if (!channelId) return;

        setDeletingChannelId(channelId);
        try {
            const response = await api.delete(`/channels/${channelId}`);

            if (response.data?.success) {
                toast.success(`"${channelName}" deleted`);
                closeDeleteModal();

                setChannels((prev) => {
                    const filtered = prev.filter((c) => c._id !== channelId);
                    updateChannelCounts(filtered);

                    if (selectedChannelId === channelId) {
                        if (filtered.length > 0) {
                            const nextChannel = filtered[0];
                            const displayName =
                                nextChannel.type === "direct"
                                    ? nextChannel.members?.find((m) => {
                                        const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                                        return uid?.toString() !== currentUserId;
                                    })?.userId?.fullName || "Direct Message"
                                    : nextChannel.name;
                            onSelectChannel(nextChannel._id, displayName);
                        } else {
                            onSelectChannel("", "");
                        }
                    }

                    return filtered;
                });
            } else {
                toast.error(response.data?.message || "Failed to delete channel");
            }
        } catch (err: any) {
            console.error("Failed to delete channel:", err);
            toast.error(
                err.response?.data?.message ||
                (err.response?.status === 403
                    ? "You lack permissions to delete this channel"
                    : "Failed to delete channel")
            );
        } finally {
            setDeletingChannelId(null);
        }
    }, [deleteModal, selectedChannelId, currentUserId, onSelectChannel, updateChannelCounts, closeDeleteModal]);

    // ============================================================
    // REFRESH CHANNELS
    // ============================================================
    const refreshChannels = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            const response = await api.get("/channels");
            if (response.data?.success) {
                const channelData = response.data.data || [];
                setChannels(channelData);
                updateChannelCounts(channelData);
                setError(null);
            }
        } catch (err: any) {
            console.error("Error refreshing channels:", err);
            setError(err.response?.data?.message || "Failed to refresh channels");
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing, updateChannelCounts]);

    // ============================================================
    // START DIRECT MESSAGE
    // ============================================================
    const handleStartDirectMessage = useCallback(
        async (targetUserId: string) => {
            try {
                const existingChannel = channels.find((ch) => {
                    if (ch.type !== "direct" || ch.isArchived) return false;
                    return ch.members?.some((m) => {
                        const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                        return uid?.toString() === targetUserId;
                    });
                });

                if (existingChannel) {
                    const partner = existingChannel.members?.find((m) => {
                        const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                        return uid?.toString() !== currentUserId;
                    });
                    const displayName = partner?.userId?.fullName || "Direct";
                    onSelectChannel(existingChannel._id, displayName);
                    joinChannel(existingChannel._id);
                    markAsRead(existingChannel._id);
                    return;
                }

                const archivedDM = channels.find((ch) => {
                    if (ch.type !== "direct" || !ch.isArchived) return false;
                    return ch.members?.some((m) => {
                        const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                        return uid?.toString() === targetUserId;
                    });
                });

                if (archivedDM) {
                    await handleUnarchiveChannel(archivedDM._id);
                    const partner = archivedDM.members?.find((m) => {
                        const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                        return uid?.toString() !== currentUserId;
                    });
                    const displayName = partner?.userId?.fullName || "Direct";
                    onSelectChannel(archivedDM._id, displayName);
                    joinChannel(archivedDM._id);
                    markAsRead(archivedDM._id);
                    return;
                }

                const response = await api.post("/channels", {
                    name: `dm-${currentUserId}-${targetUserId}`,
                    type: "direct",
                    members: [targetUserId],
                });

                if (response.data?.success) {
                    const newChannel = response.data.data;
                    const partner = newChannel.members?.find((m: any) => {
                        const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                        return uid?.toString() !== currentUserId;
                    });
                    const displayName = partner?.userId?.fullName || "Direct";

                    setChannels((prev) => {
                        if (prev.some((c) => c._id === newChannel._id)) return prev;
                        const updated = [newChannel, ...prev];
                        updateChannelCounts(updated);
                        return updated;
                    });

                    onSelectChannel(newChannel._id, displayName);
                    joinChannel(newChannel._id);
                    markAsRead(newChannel._id);
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to start direct message");
            }
        },
        [channels, currentUserId, onSelectChannel, joinChannel, markAsRead, updateChannelCounts, handleUnarchiveChannel]
    );

    const isUserOnline = useCallback(
        (userId: string) => onlineMembers.includes(userId),
        [onlineMembers]
    );

    const getTimeAgo = useCallback((dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }, []);

    // Filter channels by user search term
    const filteredChannels = useMemo(() => {
        if (!searchTerm.trim()) return channels;

        const term = searchTerm.toLowerCase().trim();
        return channels.filter((ch) => {
            const name = ch.name?.toLowerCase() || "";
            const partner = ch.members?.find((m) => {
                const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                return uid?.toString() !== currentUserId;
            });
            const displayName = ch.type === "direct" ? partner?.userId?.fullName?.toLowerCase() || "" : name;
            const lastMessage = ch.lastMessage?.content?.toLowerCase() || "";

            return displayName.includes(term) || name.includes(term) || lastMessage.includes(term);
        });
    }, [channels, searchTerm, currentUserId]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return allUsers;
        const term = searchTerm.toLowerCase().trim();
        return allUsers.filter(
            (u) => u.fullName?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
        );
    }, [allUsers, searchTerm]);

    // ============================================================
    // RENDER ICON - FIXED WITH CHANNEL/GROUP & USER AVATARS
    // ============================================================
    const renderIcon = useCallback(
        (ch: ChannelItem) => {
            // 1. DIRECT MESSAGE AVATAR (Partner's avatar)
            if (ch.type === "direct") {
                const member = ch.members?.find((m) => {
                    const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                    return uid?.toString() !== currentUserId;
                });
                const partnerUser = typeof member?.userId === "object" ? member.userId : null;
                const displayName = partnerUser?.fullName || "Unknown";
                const partnerAvatar = partnerUser?.avatar;
                const targetOnline = isUserOnline(partnerUser?._id || "");

                return (
                    <div className="relative shrink-0 select-none">
                        {partnerAvatar ? (
                            <img
                                src={partnerAvatar}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                        ) : (
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${getAvatarColor(
                                    partnerUser?._id || ""
                                )}`}
                            >
                                {getInitials(displayName)}
                            </div>
                        )}
                        {targetOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                        )}
                    </div>
                );
            }

            // 2. CHANNEL / PROJECT / GROUP CUSTOM AVATAR (Uploaded Image)
            if (ch.avatar) {
                return (
                    <div className="relative shrink-0 select-none">
                        <img
                            src={ch.avatar}
                            alt={ch.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                    </div>
                );
            }

            // 3. FALLBACK ICON OR INITIAL BADGE
            const IconComponent = ch.iconType ? iconMap[ch.iconType] || Building2 : null;
            const bgColor =
                ch.iconBg ||
                (ch.type === "project"
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-indigo-50 text-indigo-600 border border-indigo-100");

            return (
                <div className={`w-8 h-8 rounded-xl ${bgColor} flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs`}>
                    {IconComponent ? <IconComponent className="w-4 h-4" /> : ch.type === "channel" ? <Hash className="w-4 h-4" /> : getInitials(ch.name)}
                </div>
            );
        },
        [currentUserId, isUserOnline]
    );

    const toggleSection = useCallback((section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    }, []);

    // Section list renderer
    const renderSection = useCallback(
        (title: string, type: "channel" | "project" | "direct", showArchived: boolean = false) => {
            const list = filteredChannels.filter((c) => {
                if (c.type !== type) return false;
                if (showArchived) return c.isArchived === true;
                return !c.isArchived;
            });

            const sectionKey =
                type === "channel" ? "channels" : type === "project" ? "projects" : "directMessages";
            const isExpanded = expandedSections[sectionKey as keyof typeof expandedSections];

            if (list.length === 0) return null;

            return (
                <div className="mb-2">
                    <button
                        type="button"
                        onClick={() => toggleSection(sectionKey as keyof typeof expandedSections)}
                        className="flex items-center justify-between w-full px-3 py-1 hover:bg-slate-100/60 rounded-xl transition group text-left cursor-pointer"
                    >
                        <div className="flex items-center gap-1.5">
                            {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {title}
                            </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {list.length}
                        </span>
                    </button>

                    {isExpanded && (
                        <div className="mt-0.5 space-y-0.5">
                            {list.map((ch) => {
                                const isSelected = selectedChannelId === ch._id;
                                const partner = ch.members?.find((m) => {
                                    const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                                    return uid?.toString() !== currentUserId;
                                });
                                const displayName = ch.type === "direct" ? partner?.userId?.fullName || "Direct Message" : ch.name;
                                const hasUnread = (ch.unreadCount ?? 0) > 0;
                                const lastMessageTime = ch.lastMessage?.createdAt;
                                const isDM = ch.type === "direct";
                                const isArchived = ch.isArchived || false;
                                const canDelete =
                                    isDM ||
                                    ch.createdBy?._id === currentUserId ||
                                    ch.members?.some((m) => {
                                        const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                                        return uid?.toString() === currentUserId && m.role === "admin";
                                    });

                                return (
                                    <div
                                        key={ch._id}
                                        onClick={() => {
                                            if (!isArchived) {
                                                onSelectChannel(ch._id, displayName);
                                                if (hasUnread) {
                                                    markAsRead(ch._id);
                                                    setChannels((prev) =>
                                                        prev.map((c) => (c._id === ch._id ? { ...c, unreadCount: 0 } : c))
                                                    );
                                                }
                                            }
                                        }}
                                        className={`relative flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl mx-1 transition-all cursor-pointer group/channel ${isSelected
                                                ? "bg-indigo-50/80 text-indigo-950 font-medium shadow-2xs ring-1 ring-indigo-200/80"
                                                : "hover:bg-slate-100/60 text-slate-700 hover:text-slate-900"
                                            } ${isArchived ? "opacity-60 hover:opacity-100" : ""}`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            {renderIcon(ch)}

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-1">
                                                    <span
                                                        className={`text-xs font-semibold truncate flex items-center gap-1 ${isSelected ? "text-indigo-700" : "text-slate-800"
                                                            } ${isArchived ? "line-through text-slate-400" : ""}`}
                                                    >
                                                        {ch.type === "channel" ? `# ${displayName}` : displayName}
                                                        {ch.type === "project" && <Zap className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />}
                                                    </span>

                                                    {lastMessageTime && !isArchived && (
                                                        <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                                                            {getTimeAgo(lastMessageTime)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                                    <p
                                                        className={`text-[11px] truncate leading-tight ${hasUnread ? "text-slate-900 font-medium" : "text-slate-400"
                                                            } ${isArchived ? "italic" : ""}`}
                                                    >
                                                        {isArchived ? "Archived channel" : ch.lastMessage?.content || "No messages yet"}
                                                    </p>

                                                    {!isArchived && hasUnread && (
                                                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-indigo-600 rounded-full shadow-xs shrink-0">
                                                            {(ch.unreadCount ?? 0) > 99 ? "99+" : ch.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {canDelete && !isArchived && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteModal(ch._id, displayName, isDM);
                                                }}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition opacity-0 group-hover/channel:opacity-100 shrink-0 cursor-pointer"
                                                title={isDM ? "Delete chat" : "Delete channel"}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        },
        [
            filteredChannels,
            expandedSections,
            selectedChannelId,
            currentUserId,
            toggleSection,
            renderIcon,
            getTimeAgo,
            onSelectChannel,
            markAsRead,
            openDeleteModal,
        ]
    );

    // ============================================================
    // WEBSOCKET LISTENERS
    // ============================================================
    useEffect(() => {
        if (!socket) return;

        const handleUserOnlineEvent = (data: any) => {
            setOnlineMembers((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
        };

        const handleUserOfflineEvent = (data: any) => {
            setOnlineMembers((prev) => prev.filter((id) => id !== data.userId));
        };

        const handleNewMessage = (data: any) => {
            const channelId = data.channelId || data.message?.channelId;
            if (!channelId) return;

            setChannels((prev) => {
                const isCurrentChannel = channelId === selectedChannelId;
                const updated = prev.map((ch) => {
                    if (ch._id === channelId && !ch.isArchived) {
                        return {
                            ...ch,
                            lastMessage: {
                                content: data.message?.content || (data.message?.attachments?.length ? "Attachment" : "New message"),
                                createdAt: data.message?.createdAt || new Date().toISOString(),
                                senderId: {
                                    fullName: data.message?.senderId?.fullName || "Unknown",
                                },
                            },
                            unreadCount: isCurrentChannel ? 0 : (ch.unreadCount || 0) + 1,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return ch;
                });

                return updated.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime();
                    const dateB = new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime();
                    return dateB - dateA;
                });
            });
        };

        const handleChannelCreated = (data: any) => {
            if (data.channel) {
                setChannels((prev) => {
                    if (prev.some((c) => c._id === data.channel._id)) return prev;
                    const updated = [data.channel, ...prev];
                    updateChannelCounts(updated);
                    return updated;
                });
            }
        };

        const handleChannelAdded = (data: any) => {
            if (data.channel) {
                setChannels((prev) => {
                    if (prev.some((c) => c._id === data.channel._id)) return prev;
                    const updated = [data.channel, ...prev];
                    updateChannelCounts(updated);
                    return updated;
                });
            }
        };

        // ✅ Listens to channel updates (such as when avatar is changed)
        const handleChannelUpdated = (data: any) => {
            setChannels((prev) =>
                prev.map((ch) => (ch._id === data.channelId ? { ...ch, ...data.updates } : ch))
            );
        };

        const handleChannelDeleted = (data: any) => {
            setChannels((prev) => {
                const filtered = prev.filter((ch) => ch._id !== data.channelId);
                updateChannelCounts(filtered);
                return filtered;
            });
            if (selectedChannelId === data.channelId) {
                onSelectChannel("", "");
            }
        };

        socket.on("user:online", handleUserOnlineEvent);
        socket.on("user:offline", handleUserOfflineEvent);
        socket.on("message:new", handleNewMessage);
        socket.on("channel:created", handleChannelCreated);
        socket.on("channel:added", handleChannelAdded);
        socket.on("channel:updated", handleChannelUpdated);
        socket.on("channel:deleted", handleChannelDeleted);

        const unsubOnline = onUserOnline?.((data: any) => {
            setOnlineMembers((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
        });

        const unsubOffline = onUserOffline?.((data: any) => {
            setOnlineMembers((prev) => prev.filter((id) => id !== data.userId));
        });

        return () => {
            socket.off("user:online", handleUserOnlineEvent);
            socket.off("user:offline", handleUserOfflineEvent);
            socket.off("message:new", handleNewMessage);
            socket.off("channel:created", handleChannelCreated);
            socket.off("channel:added", handleChannelAdded);
            socket.off("channel:updated", handleChannelUpdated);
            socket.off("channel:deleted", handleChannelDeleted);
            unsubOnline?.();
            unsubOffline?.();
        };
    }, [socket, onUserOnline, onUserOffline, selectedChannelId, updateChannelCounts, onSelectChannel]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    if (loading) {
        return (
            <aside className="w-full h-full bg-white flex flex-col items-center justify-center border-r border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <p className="text-xs font-medium text-slate-400 mt-2">Loading channels...</p>
            </aside>
        );
    }

    if (error) {
        return (
            <aside className="w-full h-full bg-white flex flex-col items-center justify-center border-r border-slate-200 p-6 text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">{error}</p>
                <button
                    type="button"
                    onClick={refreshChannels}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer"
                >
                    Retry
                </button>
            </aside>
        );
    }

    return (
        <aside className="w-full h-full bg-white flex flex-col overflow-hidden border-r border-slate-200 select-none">
            {/* Search Header */}
            <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search channels & users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md transition"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Channel & Conversation Lists */}
            <div ref={channelListRef} className="flex-1 overflow-y-auto py-2.5">
                {renderSection("Channels", "channel")}
                {renderSection("Projects", "project")}
                {renderSection("Direct Messages", "direct")}

                {/* Archived Section */}
                {channelCounts.archived > 0 && (
                    <div className="mb-2 border-t border-slate-100 pt-2">
                        <button
                            type="button"
                            onClick={() => toggleSection("archived")}
                            className="flex items-center justify-between w-full px-3 py-1 hover:bg-slate-100/60 rounded-xl transition text-left cursor-pointer"
                        >
                            <div className="flex items-center gap-1.5">
                                {expandedSections.archived ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <Archive className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Archived
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                {channelCounts.archived}
                            </span>
                        </button>

                        {expandedSections.archived && (
                            <div className="mt-0.5 space-y-0.5">
                                {filteredChannels
                                    .filter((c) => c.isArchived)
                                    .map((ch) => {
                                        const partner = ch.members?.find((m) => {
                                            const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                                            return uid?.toString() !== currentUserId;
                                        });
                                        const displayName = ch.type === "direct" ? partner?.userId?.fullName || "Unknown" : ch.name;

                                        return (
                                            <div
                                                key={ch._id}
                                                className="flex items-center justify-between gap-2 px-3 py-2 mx-1 rounded-2xl hover:bg-slate-50 transition text-slate-500 opacity-70 hover:opacity-100 group/archived"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {renderIcon(ch)}
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-semibold truncate block line-through text-slate-400">
                                                            {displayName}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block">Archived chat</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUnarchiveChannel(ch._id)}
                                                        className="p-1 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition opacity-0 group-hover/archived:opacity-100 cursor-pointer"
                                                        title="Restore channel"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(ch._id, displayName, ch.type === "direct")}
                                                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition opacity-0 group-hover/archived:opacity-100 cursor-pointer"
                                                        title="Delete permanently"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {/* Directory of Teammates */}
                <div className="mb-2">
                    <button
                        type="button"
                        onClick={() => toggleSection("users")}
                        className="flex items-center justify-between w-full px-3 py-1 hover:bg-slate-100/60 rounded-xl transition text-left cursor-pointer"
                    >
                        <div className="flex items-center gap-1.5">
                            {expandedSections.users ? (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Teammates
                            </span>
                            <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-full">
                                {onlineMembers.length} online
                            </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {allUsers.length}
                        </span>
                    </button>

                    {expandedSections.users && (
                        <div className="mt-0.5 space-y-0.5">
                            {filteredUsers.length === 0 ? (
                                <div className="px-4 py-2 text-xs text-slate-400 text-center">
                                    {searchTerm ? "No colleagues found" : "No users in workspace"}
                                </div>
                            ) : (
                                filteredUsers.map((userItem) => {
                                    const targetOnline = isUserOnline(userItem._id);
                                    const hasDirectChannel = channels.some(
                                        (ch) =>
                                            ch.type === "direct" &&
                                            ch.members?.some((m) => {
                                                const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                                                return uid?.toString() === userItem._id;
                                            }) &&
                                            !ch.isArchived
                                    );

                                    return (
                                        <div
                                            key={userItem._id}
                                            onClick={() => handleStartDirectMessage(userItem._id)}
                                            className="group flex items-center justify-between px-3 py-1.5 mx-1 rounded-2xl cursor-pointer hover:bg-slate-100/70 transition text-slate-700"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="relative shrink-0">
                                                    {userItem.avatar ? (
                                                        <img
                                                            src={userItem.avatar}
                                                            alt={userItem.fullName}
                                                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                                        />
                                                    ) : (
                                                        <div
                                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${getAvatarColor(
                                                                userItem._id
                                                            )}`}
                                                        >
                                                            {getInitials(userItem.fullName)}
                                                        </div>
                                                    )}
                                                    {targetOnline && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <span className="text-xs font-semibold text-slate-800 truncate block">
                                                        {userItem.fullName}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] block leading-tight ${targetOnline ? "text-emerald-600 font-medium" : "text-slate-400"
                                                            }`}
                                                    >
                                                        {targetOnline ? "Online" : "Offline"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                {hasDirectChannel && (
                                                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                                                        DM
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                    title="Open direct message"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* User Session Footer Card */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                        {user?.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={user?.fullName || "User"}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                        ) : (
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(
                                    user?._id || "default"
                                )}`}
                            >
                                {getInitials(user?.fullName || "U")}
                            </div>
                        )}
                        {isConnected && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                            {user?.fullName || "Team Member"}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Circle
                                className={`w-1.5 h-1.5 ${isConnected ? "fill-emerald-500 text-emerald-500" : "fill-slate-300 text-slate-300"
                                    }`}
                            />
                            <span>{isConnected ? "Connected" : "Disconnected"}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">
                                    {deleteModal.isDM ? "Delete Conversation?" : "Delete Channel?"}
                                </h4>
                                <p className="text-[11px] text-slate-400">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-5">
                            {deleteModal.isDM
                                ? `Are you sure you want to delete your conversation with "${deleteModal.channelName}"? All shared messages will be removed permanently.`
                                : `Are you sure you want to delete "#${deleteModal.channelName}"? All messages, task links, and pinned assets will be erased.`}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                disabled={Boolean(deletingChannelId)}
                                className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={executeDeleteChannel}
                                disabled={Boolean(deletingChannelId)}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {deletingChannelId ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}