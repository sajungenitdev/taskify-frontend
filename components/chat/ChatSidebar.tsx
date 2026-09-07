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
    Hash,
    Users,
    MessageSquare,
    Plus,
    Search,
    Settings,
    LogOut,
    UserPlus,
    X,
    Check,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Trash2,
    Crown,
    Shield,
    UserMinus,
    Circle,
    Zap,
    Clock,
    Archive,
    EyeOff,
    MoreVertical,
    Inbox,
    RefreshCw,
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

// ============================================================
// ICON MAP
// ============================================================

const iconMap: Record<string, any> = {
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
    const [archivingChannelId, setArchivingChannelId] = useState<string | null>(null);
    const [showDMActions, setShowDMActions] = useState<string | null>(null);

    const currentUserId = user?._id;

    // Refs
    const channelListRef = useRef<HTMLDivElement>(null);

    // ============================================================
    // UPDATE CHANNELS FROM EXTERNAL PROP
    // ============================================================
    useEffect(() => {
        if (externalChannels && externalChannels.length > 0) {
            setChannels(externalChannels);
            updateChannelCounts(externalChannels);
        }
    }, [externalChannels]);

    useEffect(() => {
        setLoading(externalLoading);
    }, [externalLoading]);

    // ============================================================
    // UPDATE CHANNEL COUNTS
    // ============================================================
    const updateChannelCounts = useCallback((channelList: ChannelItem[]) => {
        const counts = {
            total: channelList.length,
            channels: channelList.filter(c => c.type === "channel" && !c.isArchived).length,
            projects: channelList.filter(c => c.type === "project" && !c.isArchived).length,
            direct: channelList.filter(c => c.type === "direct" && !c.isArchived).length,
            archived: channelList.filter(c => c.isArchived).length,
            online: onlineMembers.length,
        };
        setChannelCounts(counts);
    }, [onlineMembers]);

    // ============================================================
    // FETCH USERS
    // ============================================================
    const fetchUsers = useCallback(async () => {
        try {
            const response = await api.get("/users");
            if (response.data.success) {
                const filteredUsers = response.data.data.filter((u: any) => u._id !== user?._id);
                setAllUsers(filteredUsers);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, [user?._id]);

    // ============================================================
    // UNARCHIVE CHANNEL
    // ============================================================
    const handleUnarchiveChannel = useCallback(async (channelId: string, channelName: string) => {
        try {
            const response = await api.patch(`/channels/${channelId}/archive`, { isArchived: false });
            if (response.data.success) {
                toast.success(`"${channelName}" restored from archive`);
                setChannels(prev => {
                    const updated = prev.map(ch =>
                        ch._id === channelId ? { ...ch, isArchived: false, archivedAt: undefined } : ch
                    );
                    updateChannelCounts(updated);
                    return updated;
                });
            } else {
                toast.error(response.data.message || "Failed to restore");
            }
        } catch (error: any) {
            console.error("Error unarchiving:", error);
            toast.error(error.response?.data?.message || "Failed to restore");
        }
    }, [updateChannelCounts]);

    // ============================================================
    // DELETE CHANNEL - FIXED with better error handling
    // ============================================================
    const handleDeleteChannel = useCallback(
        async (channelId: string, channelName: string) => {
            // Check if it's a DM
            const isDM = channels.find(c => c._id === channelId)?.type === "direct";

            const confirmMessage = isDM
                ? `This will permanently delete the conversation with "${channelName}". This cannot be undone!`
                : `Are you sure you want to delete "${channelName}"? This action cannot be undone.`;

            if (!confirm(confirmMessage)) return;

            setDeletingChannelId(channelId);
            try {
                console.log(`🗑️ [Sidebar] Deleting channel: ${channelId} (${channelName})`);

                const response = await api.delete(`/channels/${channelId}`);

                console.log("📥 [Sidebar] Delete response:", response.data);

                if (response.data?.success) {
                    toast.success(isDM ? `Conversation with "${channelName}" deleted` : `"${channelName}" deleted`);

                    // Remove from local state
                    setChannels((prev) => {
                        const filtered = prev.filter((c) => c._id !== channelId);
                        return filtered.sort((a, b) => {
                            const dateA = new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime();
                            const dateB = new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime();
                            return dateB - dateA;
                        });
                    });

                    // If the deleted channel was selected, switch to another
                    if (selectedChannelId === channelId) {
                        const remaining = channels.filter((c) => c._id !== channelId);
                        if (remaining.length > 0) {
                            const firstChannel = remaining[0];
                            const displayName = firstChannel.type === "direct"
                                ? firstChannel.members?.find((m) => m.userId?._id !== currentUserId)?.userId?.fullName || "Direct Message"
                                : firstChannel.name;
                            onSelectChannel(firstChannel._id, displayName);
                        } else {
                            onSelectChannel("", "");
                        }
                    }
                } else {
                    toast.error(response.data?.message || "Failed to delete channel");
                }
            } catch (err: any) {
                console.error("❌ [Sidebar] Delete error:", err);

                let errorMessage = "Failed to delete channel";

                if (err.response) {
                    console.error("❌ [Sidebar] Response data:", err.response.data);
                    console.error("❌ [Sidebar] Response status:", err.response.status);

                    if (err.response.status === 403) {
                        errorMessage = "You don't have permission to delete this channel";
                    } else if (err.response.status === 404) {
                        errorMessage = "Channel not found";
                    } else if (err.response.status === 400) {
                        errorMessage = err.response.data?.message || "Cannot delete this channel";
                    } else {
                        errorMessage = err.response.data?.message || "Server error";
                    }
                } else if (err.request) {
                    errorMessage = "No response from server. Please check your connection.";
                } else {
                    errorMessage = err.message || "Unknown error";
                }

                toast.error(errorMessage);
            } finally {
                setDeletingChannelId(null);
            }
        },
        [channels, selectedChannelId, currentUserId, onSelectChannel]
    );

    // ============================================================
    // REFRESH CHANNELS
    // ============================================================
    const refreshChannels = useCallback(async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            console.log("🔄 [Sidebar] Refreshing channels...");
            const response = await api.get("/channels");
            if (response.data.success) {
                const channelData = response.data.data || [];
                console.log(`📥 [Sidebar] Loaded ${channelData.length} channels`);
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
    // HANDLE START DIRECT MESSAGE
    // ============================================================
    const handleStartDirectMessage = useCallback(async (targetUserId: string) => {
        try {
            const existingChannel = channels.find(ch =>
                ch.type === "direct" &&
                ch.members?.some(m => m.userId._id === targetUserId) &&
                !ch.isArchived
            );

            if (existingChannel) {
                const displayName = existingChannel.members?.find(
                    m => m.userId._id !== user?._id
                )?.userId.fullName || "Direct";
                onSelectChannel(existingChannel._id, displayName);
                joinChannel(existingChannel._id);
                markAsRead(existingChannel._id);
                toast.success("Switched to existing conversation");
                return;
            }

            // Check if there's an archived DM with this user
            const archivedDM = channels.find(ch =>
                ch.type === "direct" &&
                ch.members?.some(m => m.userId._id === targetUserId) &&
                ch.isArchived
            );

            if (archivedDM) {
                await handleUnarchiveChannel(archivedDM._id, archivedDM.name);
                const displayName = archivedDM.members?.find(
                    m => m.userId._id !== user?._id
                )?.userId.fullName || "Direct";
                onSelectChannel(archivedDM._id, displayName);
                joinChannel(archivedDM._id);
                markAsRead(archivedDM._id);
                toast.success("Restored archived conversation");
                return;
            }

            const response = await api.post("/channels", {
                name: `dm-${user?._id}-${targetUserId}`,
                type: "direct",
                members: [targetUserId],
            });

            if (response.data.success) {
                toast.success("Direct message started!");
                const newChannel = response.data.data;
                const displayName = newChannel.members?.find(
                    (m: any) => m.userId._id !== user?._id
                )?.userId.fullName || "Direct";

                setChannels(prev => {
                    if (prev.some(c => c._id === newChannel._id)) return prev;
                    return [newChannel, ...prev];
                });
                updateChannelCounts([newChannel, ...channels]);

                onSelectChannel(newChannel._id, displayName);
                joinChannel(newChannel._id);
                markAsRead(newChannel._id);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to start direct message");
        }
    }, [channels, user, onSelectChannel, joinChannel, markAsRead, updateChannelCounts, handleUnarchiveChannel]);

    // ============================================================
    // IS USER ONLINE
    // ============================================================
    const isUserOnline = useCallback((userId: string) => {
        return onlineMembers.includes(userId);
    }, [onlineMembers]);

    // ============================================================
    // GET TIME AGO
    // ============================================================
    const getTimeAgo = useCallback((dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }, []);

    // ============================================================
    // FILTER CHANNELS BY SEARCH TERM
    // ============================================================
    const filteredChannels = useMemo(() => {
        if (!searchTerm.trim()) return channels;

        const term = searchTerm.toLowerCase().trim();
        return channels.filter(ch => {
            const name = ch.name?.toLowerCase() || "";
            const displayName = ch.type === "direct"
                ? ch.members?.find(m => m.userId._id !== user?._id)?.userId.fullName?.toLowerCase() || ""
                : name;
            const lastMessage = ch.lastMessage?.content?.toLowerCase() || "";

            return displayName.includes(term) ||
                name.includes(term) ||
                lastMessage.includes(term);
        });
    }, [channels, searchTerm, user?._id]);

    // ============================================================
    // RENDER ICON
    // ============================================================
    const renderIcon = useCallback((ch: ChannelItem) => {
        if (ch.type === "direct") {
            const member = ch.members?.find(m => m.userId._id !== user?._id);
            const displayName = member?.userId.fullName || "Unknown";
            const isOnline = isUserOnline(member?.userId._id || "");

            return (
                <div className="relative shrink-0">
                    {member?.userId.avatar ? (
                        <img
                            src={member.userId.avatar}
                            alt={displayName}
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(member?.userId._id || "")}`}>
                            {getInitials(displayName)}
                        </div>
                    )}
                    {isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                </div>
            );
        }

        const IconComponent = ch.iconType ? iconMap[ch.iconType] : Building2;
        const bgColor = ch.iconBg || "bg-indigo-100";
        const textColor = "text-white";

        return (
            <div className={`w-9 h-9 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
                <IconComponent className={`w-4 h-4 ${textColor}`} />
            </div>
        );
    }, [user?._id, isUserOnline]);

    // ============================================================
    // TOGGLE SECTION
    // ============================================================
    const toggleSection = useCallback((section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    }, []);

    // ============================================================
    // RENDER SECTION
    // ============================================================
    const renderSection = useCallback((title: string, type: "channel" | "project" | "direct", showArchived: boolean = false) => {
        const list = filteredChannels.filter((c) => {
            if (c.type !== type) return false;
            if (showArchived) return c.isArchived === true;
            return !c.isArchived;
        });
        const sectionKey = type === "channel" ? "channels" : type === "project" ? "projects" : "directMessages";
        const isExpanded = expandedSections[sectionKey as keyof typeof expandedSections];

        if (list.length === 0) return null;

        return (
            <div className="mb-2">
                <button
                    onClick={() => toggleSection(sectionKey as keyof typeof expandedSections)}
                    className="flex items-center justify-between w-full px-4 py-1 hover:bg-slate-50 rounded-lg transition group"
                >
                    <div className="flex items-center gap-1.5">
                        {isExpanded ? (
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                        ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                        )}
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {title}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {list.length}
                    </span>
                </button>

                {isExpanded && (
                    <div className="mt-0.5 space-y-0.5">
                        {list.map((ch) => {
                            const isSelected = selectedChannelId === ch._id;
                            const displayName = ch.type === "direct"
                                ? ch.members?.find(m => m.userId._id !== user?._id)?.userId.fullName || "Unknown"
                                : ch.name;
                            const hasUnread = ch.unreadCount && ch.unreadCount > 0;
                            const lastMessageTime = ch.lastMessage?.createdAt;
                            const isOnline = ch.type === "direct" && isUserOnline(
                                ch.members?.find(m => m.userId._id !== user?._id)?.userId._id || ""
                            );
                            const isDM = ch.type === "direct";
                            const isArchived = ch.isArchived || false;
                            const canDelete = isDM || (
                                ch.createdBy?._id === user?._id ||
                                ch.members?.some(m => m.userId._id === user?._id && m.role === "admin")
                            );
                            const isDeleting = deletingChannelId === ch._id;
                            const isArchiving = archivingChannelId === ch._id;

                            return (
                                <div
                                    key={ch._id}
                                    className={`relative flex items-center gap-3 px-3.5 py-2 cursor-pointer transition-all duration-200 rounded-lg mx-1 group/channel ${isSelected
                                        ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                                        : "hover:bg-slate-50 text-slate-700 hover:shadow-sm"
                                        } ${isArchived ? "opacity-60 hover:opacity-100" : ""}`}
                                >
                                    <div
                                        className="flex items-center gap-3 flex-1 min-w-0"
                                        onClick={() => {
                                            if (!isArchived) {
                                                onSelectChannel(ch._id, displayName);
                                                if (hasUnread) {
                                                    markAsRead(ch._id);
                                                    setChannels(prev =>
                                                        prev.map(c =>
                                                            c._id === ch._id ? { ...c, unreadCount: 0 } : c
                                                        )
                                                    );
                                                }
                                            }
                                        }}
                                    >
                                        {renderIcon(ch)}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-medium truncate flex items-center gap-1.5 ${isSelected ? "text-indigo-700" : "text-slate-800"
                                                    } ${isArchived ? "line-through text-slate-400" : ""}`}>
                                                    {ch.type === "channel" ? `# ${displayName}` : displayName}
                                                    {ch.type === "direct" && isOnline && !isArchived && (
                                                        <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                                                    )}
                                                    {ch.type === "project" && (
                                                        <Zap className="w-3 h-3 text-amber-500" />
                                                    )}
                                                    {isArchived && (
                                                        <Archive className="w-3 h-3 text-slate-400" />
                                                    )}
                                                </span>
                                                {lastMessageTime && !isArchived && (
                                                    <span className="text-[9px] text-slate-400 font-normal ml-2 shrink-0">
                                                        {getTimeAgo(lastMessageTime)}
                                                    </span>
                                                )}
                                                {isArchived && ch.archivedAt && (
                                                    <span className="text-[9px] text-slate-400 font-normal ml-2 shrink-0">
                                                        Archived {getTimeAgo(ch.archivedAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {ch.lastMessage?.senderId && !isArchived && (
                                                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                                            {ch.lastMessage.senderId.fullName.split(' ')[0]}:
                                                        </span>
                                                    )}
                                                    <p className={`text-[11px] truncate leading-tight ${isArchived ? "text-slate-400" : "text-slate-500"}`}>
                                                        {isArchived ? "Archived conversation" : (ch.lastMessage?.content || "No messages yet")}
                                                    </p>
                                                </div>
                                                {hasUnread && !isArchived && (
                                                    <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center px-1 animate-pulse">
                                                        {(ch.unreadCount ?? 0) > 9 ? '9+' : (ch.unreadCount ?? 0)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete button for DMs */}
                                    {isDM && !isArchived && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteChannel(ch._id, displayName);
                                            }}
                                            disabled={isDeleting}
                                            className={`p-1 rounded-lg transition-all duration-200 opacity-0 group-hover/channel:opacity-100 
                                                ${isDeleting ? 'opacity-100' : ''}
                                                ${isSelected
                                                    ? 'hover:bg-indigo-200 text-indigo-400 hover:text-red-600'
                                                    : 'hover:bg-slate-200 text-slate-400 hover:text-red-600'
                                                } shrink-0`}
                                            title="Delete conversation"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}

                                    {/* Delete button for non-DM channels */}
                                    {canDelete && !isDM && !isArchived && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteChannel(ch._id, displayName);
                                            }}
                                            disabled={isDeleting}
                                            className={`p-1 rounded-lg transition-all duration-200 opacity-0 group-hover/channel:opacity-100 
                                                ${isDeleting ? 'opacity-100' : ''}
                                                ${isSelected
                                                    ? 'hover:bg-indigo-200 text-indigo-400 hover:text-red-600'
                                                    : 'hover:bg-slate-200 text-slate-400 hover:text-red-600'
                                                } shrink-0`}
                                            title="Delete channel"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}

                                    {/* Unarchive button for archived items */}
                                    {isArchived && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnarchiveChannel(ch._id, displayName);
                                            }}
                                            className="p-1 hover:bg-emerald-100 rounded-lg text-slate-400 hover:text-emerald-600 opacity-0 group-hover/channel:opacity-100 transition shrink-0"
                                            title="Restore from archive"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }, [filteredChannels, expandedSections, selectedChannelId, user?._id, deletingChannelId, archivingChannelId, toggleSection, renderIcon, getTimeAgo, isUserOnline, onSelectChannel, markAsRead, handleDeleteChannel, handleUnarchiveChannel]);

    // ============================================================
    // FILTERED USERS
    // ============================================================
    const filteredUsers = allUsers.filter(u =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ============================================================
    // SOCKET EVENT LISTENERS - FIXED
    // ============================================================
    useEffect(() => {
        if (!socket) return;

        console.log("🔌 [Sidebar] Setting up socket listeners");

        const handleUserOnline = (data: any) => {
            setOnlineMembers(prev => {
                if (prev.includes(data.userId)) return prev;
                return [...prev, data.userId];
            });
        };

        const handleUserOffline = (data: any) => {
            setOnlineMembers(prev => prev.filter(id => id !== data.userId));
        };

        socket.on("user:online", handleUserOnline);
        socket.on("user:offline", handleUserOffline);

        const unsubscribeOnline = onUserOnline((data: any) => {
            setOnlineMembers(prev => {
                if (prev.includes(data.userId)) return prev;
                return [...prev, data.userId];
            });
        });

        const unsubscribeOffline = onUserOffline((data: any) => {
            setOnlineMembers(prev => prev.filter(id => id !== data.userId));
        });

        // 🔥 FIXED: Message handler with unread count and sorting
        const handleNewMessage = (data: any) => {
            const channelId = data.channelId || data.message?.channelId;
            if (!channelId) return;

            console.log(`📩 [Sidebar] New message in channel: ${channelId}`);

            setChannels(prev => {
                const isCurrentChannel = channelId === selectedChannelId;
                let updated = prev.map(ch => {
                    if (ch._id === channelId && !ch.isArchived) {
                        return {
                            ...ch,
                            lastMessage: {
                                content: data.message?.content || "New message",
                                createdAt: data.message?.createdAt || new Date().toISOString(),
                                senderId: {
                                    fullName: data.message?.senderId?.fullName || "Unknown",
                                },
                            },
                            // ✅ Only increment unread if not currently selected
                            unreadCount: isCurrentChannel ? 0 : (ch.unreadCount || 0) + 1,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return ch;
                });

                // ✅ Sort by updatedAt (newest first)
                return updated.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime();
                    const dateB = new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime();
                    return dateB - dateA;
                });
            });
        };

        const handleChannelCreated = (data: any) => {
            if (data.channel) {
                console.log(`🆕 [Sidebar] New channel created: ${data.channel.name}`);
                setChannels(prev => {
                    if (prev.some(c => c._id === data.channel._id)) return prev;
                    return [data.channel, ...prev];
                });
                updateChannelCounts([...channels, data.channel]);
                toast.success(`New channel: ${data.channel.name}`);
            }
        };

        const handleChannelAdded = (data: any) => {
            if (data.channel) {
                console.log(`➕ [Sidebar] Added to channel: ${data.channel.name}`);
                setChannels(prev => {
                    if (prev.some(c => c._id === data.channel._id)) return prev;
                    return [data.channel, ...prev];
                });
                updateChannelCounts([...channels, data.channel]);
                toast.success(`Added to channel: ${data.channel.name}`);
            }
        };

        const handleChannelUpdated = (data: any) => {
            setChannels(prev =>
                prev.map(ch =>
                    ch._id === data.channelId ? { ...ch, ...data.updates } : ch
                )
            );
        };

        const handleChannelDeleted = (data: any) => {
            console.log(`🗑️ [Sidebar] Channel deleted: ${data.channelName}`);
            setChannels(prev => {
                const filtered = prev.filter(ch => ch._id !== data.channelId);
                updateChannelCounts(filtered);
                return filtered;
            });
            if (selectedChannelId === data.channelId) {
                toast.success(`Channel "${data.channelName}" was deleted`);
                onSelectChannel("", "");
            }
        };

        socket.on("message:new", handleNewMessage);
        socket.on("channel:created", handleChannelCreated);
        socket.on("channel:added", handleChannelAdded);
        socket.on("channel:updated", handleChannelUpdated);
        socket.on("channel:deleted", handleChannelDeleted);

        return () => {
            console.log("🧹 [Sidebar] Cleaning up socket listeners");
            socket.off("user:online", handleUserOnline);
            socket.off("user:offline", handleUserOffline);
            socket.off("message:new", handleNewMessage);
            socket.off("channel:created", handleChannelCreated);
            socket.off("channel:added", handleChannelAdded);
            socket.off("channel:updated", handleChannelUpdated);
            socket.off("channel:deleted", handleChannelDeleted);
            unsubscribeOnline?.();
            unsubscribeOffline?.();
        };
    }, [socket, onUserOnline, onUserOffline, selectedChannelId, channels, updateChannelCounts, onSelectChannel]);

    // ============================================================
    // UPDATE COUNTS WHEN ONLINE MEMBERS CHANGE
    // ============================================================
    useEffect(() => {
        updateChannelCounts(channels);
    }, [channels, onlineMembers, updateChannelCounts]);

    // ============================================================
    // INITIAL FETCH
    // ============================================================
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ============================================================
    // RENDER
    // ============================================================

    if (loading) {
        return (
            <aside className="w-full h-full bg-white flex flex-col items-center justify-center border-r border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <p className="text-sm text-slate-400 mt-2">Loading channels...</p>
            </aside>
        );
    }

    if (error) {
        return (
            <aside className="w-full h-full bg-white flex flex-col items-center justify-center border-r border-slate-200 p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-slate-600 text-center">{error}</p>
                <button
                    onClick={refreshChannels}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                >
                    Retry
                </button>
            </aside>
        );
    }

    if (channels.length === 0 && !loading) {
        return (
            <aside className="w-full h-full bg-white flex flex-col items-center justify-center border-r border-slate-200 p-4">
                <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-700">No channels yet</p>
                <p className="text-xs text-slate-400 text-center mt-1">Create a channel to start collaborating</p>
                <button
                    onClick={onOpenCreateModal}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                >
                    Create Channel
                </button>
            </aside>
        );
    }

    return (
        <aside className="w-full h-full bg-white flex flex-col overflow-hidden border-r border-slate-200 select-none">
            {/* 🔥 GLOBAL SEARCH */}
            <div className="px-3 py-2 border-b border-slate-200 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search channels, users, messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full transition"
                        >
                            <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                    )}
                </div>
                {searchTerm && (
                    <div className="mt-1 text-[10px] text-slate-400">
                        Found {filteredChannels.length} channels, {filteredUsers.length} users
                    </div>
                )}
            </div>

            {/* Channel List */}
            <div ref={channelListRef} className="flex-1 overflow-y-auto py-2">
                {renderSection("CHANNELS", "channel")}
                {renderSection("PROJECTS", "project")}
                {renderSection("DIRECT MESSAGES", "direct")}

                {/* 🔥 ARCHIVED SECTION */}
                {channelCounts.archived > 0 && (
                    <div className="mb-2 border-t border-slate-100 pt-2">
                        <button
                            onClick={() => toggleSection("archived")}
                            className="flex items-center justify-between w-full px-4 py-1 hover:bg-slate-50 rounded-lg transition group"
                        >
                            <div className="flex items-center gap-1.5">
                                {expandedSections.archived ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                )}
                                <Archive className="w-3 h-3 text-slate-400" />
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Archived
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                {channelCounts.archived}
                            </span>
                        </button>

                        {expandedSections.archived && (
                            <div className="mt-0.5">
                                {filteredChannels.filter(c => c.isArchived).map((ch) => {
                                    const displayName = ch.type === "direct"
                                        ? ch.members?.find(m => m.userId._id !== user?._id)?.userId.fullName || "Unknown"
                                        : ch.name;
                                    const isDeleting = deletingChannelId === ch._id;

                                    return (
                                        <div
                                            key={ch._id}
                                            className="flex items-center gap-3 px-3.5 py-2 mx-1 rounded-lg hover:bg-slate-50 transition text-slate-500 opacity-70 hover:opacity-100 group/channel"
                                        >
                                            {renderIcon(ch)}
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium truncate line-through">
                                                    {displayName}
                                                </span>
                                                <p className="text-[10px] text-slate-400">Archived conversation</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUnarchiveChannel(ch._id, displayName);
                                                }}
                                                className="p-1 hover:bg-emerald-100 rounded-lg text-slate-400 hover:text-emerald-600 opacity-0 group-hover/channel:opacity-100 transition shrink-0"
                                                title="Restore from archive"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteChannel(ch._id, displayName);
                                                }}
                                                disabled={isDeleting}
                                                className="p-1 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-600 opacity-0 group-hover/channel:opacity-100 transition shrink-0"
                                                title="Delete permanently"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 🔥 ALL USERS */}
                <div className="mb-2">
                    <button
                        onClick={() => toggleSection("users")}
                        className="flex items-center justify-between w-full px-4 py-1 hover:bg-slate-50 rounded-lg transition group"
                    >
                        <div className="flex items-center gap-1.5">
                            {expandedSections.users ? (
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                            ) : (
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                            )}
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                All Users
                            </span>
                            <span className="text-[10px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                {onlineMembers.length} online
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                            {allUsers.length}
                        </span>
                    </button>

                    {expandedSections.users && (
                        <div className="mt-0.5">
                            <div className="overflow-y-auto space-y-0.5">
                                {filteredUsers.length === 0 ? (
                                    <div className="px-4 py-2 text-sm text-slate-400">
                                        {searchTerm ? "No users found" : "No users available"}
                                    </div>
                                ) : (
                                    filteredUsers.map((userItem) => {
                                        const isOnline = isUserOnline(userItem._id);
                                        const hasDirectChannel = channels.some(ch =>
                                            ch.type === "direct" &&
                                            ch.members?.some(m => m.userId._id === userItem._id) &&
                                            !ch.isArchived
                                        );

                                        return (
                                            <div
                                                key={userItem._id}
                                                className="group flex items-center gap-2 px-3.5 py-1.5 mx-1 rounded-lg cursor-pointer hover:bg-slate-50 transition text-slate-700"
                                                onClick={() => handleStartDirectMessage(userItem._id)}
                                            >
                                                <div className="relative shrink-0">
                                                    {userItem.avatar ? (
                                                        <img
                                                            src={userItem.avatar}
                                                            alt={userItem.fullName}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColor(userItem._id)}`}>
                                                            {getInitials(userItem.fullName)}
                                                        </div>
                                                    )}
                                                    {isOnline && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium truncate">{userItem.fullName}</span>
                                                        {hasDirectChannel && (
                                                            <span className="text-[10px] text-indigo-500 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-full">
                                                                DM
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[10px] ${isOnline ? "text-emerald-500" : "text-slate-400"}`}>
                                                            {isOnline ? "● Online" : "● Offline"}
                                                        </span>
                                                        {userItem.role && (
                                                            <span className="text-[9px] text-slate-400 px-1 bg-slate-100 rounded">
                                                                {userItem.role.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartDirectMessage(userItem._id);
                                                    }}
                                                    className="p-1 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-indigo-600 shrink-0"
                                                    title="Send message"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* User Profile Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        {user?.profilePhoto ? (
                            <img
                                src={user.profilePhoto}
                                alt={user?.fullName || "User"}
                                className="w-9 h-9 rounded-full object-cover"
                            />
                        ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${getAvatarColor(user?._id || "default")}`}>
                                {getInitials(user?.fullName || "U")}
                            </div>
                        )}
                        {isConnected && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                            {user?.fullName || "User"}
                        </p>
                        <p className="text-xs flex items-center gap-1.5">
                            {isConnected ? (
                                <>
                                    <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                                    <span className="text-emerald-500 font-medium">Online</span>
                                </>
                            ) : (
                                <>
                                    <Circle className="w-2 h-2 fill-slate-400 text-slate-400" />
                                    <span className="text-slate-400">Offline</span>
                                </>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = "/settings"}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition text-slate-400 hover:text-slate-600 shrink-0"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            window.location.href = "/login";
                        }}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition text-slate-400 hover:text-red-600 shrink-0"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}