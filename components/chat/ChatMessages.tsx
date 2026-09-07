// components/chat/ChatMessages.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
    Laptop,
    SendHorizontal,
    Paperclip,
    Mic,
    Square,
    Reply,
    Trash2,
    X,
    Loader2,
    File as FileIcon,
    MessageSquare,
    Users,
    Circle,
    Download,
    Check,
    CheckCheck,
    Search,
    Pin,
    PinOff,
    Image as ImageIcon,
    FileText,
    Table,
    Link as LinkIcon,
    ChevronDown,
    ChevronUp,
    FolderOpen,
    ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { format, isToday } from "date-fns";

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface MessageSender {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
}

export interface Attachment {
    name: string;
    url: string;
    size?: number;
    mimeType?: string;
    type?: "image" | "file" | "voice";
}

export interface Reaction {
    emoji: string;
    userId: string;
}

export interface ReadReceipt {
    userId: string | { _id: string };
    readAt?: string;
}

export interface Message {
    _id: string;
    content: string;
    type?: "text" | "voice" | "file" | "system";
    senderId: MessageSender;
    attachments?: Attachment[];
    replyTo?: {
        _id: string;
        content: string;
        senderId: {
            _id: string;
            fullName: string;
        };
    };
    reactions: Reaction[];
    readBy?: Array<ReadReceipt | string>;
    isRead?: boolean;
    isPinned?: boolean;
    createdAt: string;
    isEdited?: boolean;
    isDeleted?: boolean;
}

export interface ChannelMemberItem {
    userId: {
        _id: string;
        fullName?: string;
        email?: string;
        avatar?: string;
    } | string;
    role?: string;
}

interface PinnedFile {
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

interface ChatMessagesProps {
    channelId: string;
    channelName?: string;
    members?: ChannelMemberItem[];
    onlineCount?: number;
    onToggleDetails?: () => void;
    onPinnedUpdated?: () => void; // ✅ Add this
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

// ============================================================
// UTILITIES
// ============================================================

const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
};

const formatMessageTime = (dateStr: string): string => {
    try {
        return format(new Date(dateStr), "h:mm a");
    } catch {
        return "";
    }
};

const formatGroupDate = (dateStr: string): string => {
    try {
        const d = new Date(dateStr);
        if (isToday(d)) return "Today";
        return format(d, "MMM d, yyyy");
    } catch {
        return "";
    }
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
};

const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <Table className="w-4 h-4" />;
    return <FileIcon className="w-4 h-4" />;
};

const extractReaderId = (item: ReadReceipt | string): string => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item.userId === "string") return item.userId;
    if (typeof item.userId === "object" && item.userId?._id) return item.userId._id.toString();
    return "";
};

// ============================================================
// MEMOIZED MESSAGE BUBBLE COMPONENT
// ============================================================

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    currentUserId?: string;
    onReply: (msg: Message) => void;
    onDelete: (id: string) => void;
    onReaction: (id: string, emoji: string) => void;
    onPin: (id: string) => void;
}

const MessageBubble = memo(({
    message,
    isOwn,
    currentUserId,
    onReply,
    onDelete,
    onReaction,
    onPin,
}: MessageBubbleProps) => {
    const isDeleted = Boolean(message.isDeleted);
    const isPinned = Boolean(message.isPinned);

    const isSeenByRecipient = useMemo(() => {
        if (!isOwn) return false;
        if (message.isRead === true) return true;
        if (!message.readBy || !Array.isArray(message.readBy)) return false;

        const cleanCurrentUserId = currentUserId?.toString();
        return message.readBy.some((receipt) => {
            const readerId = extractReaderId(receipt);
            return readerId !== "" && readerId !== cleanCurrentUserId;
        });
    }, [message.readBy, message.isRead, isOwn, currentUserId]);

    const reactionTotals = useMemo(() => {
        if (!message.reactions || message.reactions.length === 0) return null;
        return message.reactions.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [message.reactions]);

    return (
        <div className={`group relative flex items-start gap-2.5 my-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 select-none">
                {message.senderId?.avatar ? (
                    <img
                        src={message.senderId.avatar}
                        alt={message.senderId.fullName || "User"}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        loading="lazy"
                    />
                ) : (
                    <div
                        className={`w-8 h-8 rounded-full text-white font-semibold text-xs flex items-center justify-center shadow-xs ${isOwn ? "bg-indigo-600" : "bg-slate-700"
                            }`}
                    >
                        {getInitials(isOwn ? "You" : message.senderId?.fullName)}
                    </div>
                )}
            </div>

            {/* Bubble & Metadata */}
            <div className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                    <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5 px-1">
                        <span className="font-semibold text-slate-700">{message.senderId?.fullName || "Member"}</span>
                        {isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                    </div>
                )}

                <div className="relative">
                    {isDeleted ? (
                        <div className="bg-slate-100/90 border border-slate-200 text-slate-400 rounded-2xl px-3.5 py-2 text-xs italic">
                            This message was deleted
                        </div>
                    ) : (
                        <div
                            className={`rounded-2xl px-4 py-2.5 shadow-xs ${isOwn
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-none"
                                } ${isPinned ? "ring-1 ring-amber-400/50" : ""}`}
                        >
                            {isPinned && (
                                <div className="flex items-center gap-1 text-[9px] text-amber-500 font-medium mb-1">
                                    <Pin className="w-3 h-3" /> Pinned
                                </div>
                            )}

                            {message.replyTo && (
                                <div
                                    className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${isOwn
                                        ? "bg-indigo-700/60 border-indigo-300 text-indigo-100"
                                        : "bg-slate-50 border-indigo-500 text-slate-600"
                                        }`}
                                >
                                    <span className="font-semibold block mb-0.5">
                                        {message.replyTo.senderId?.fullName || "User"}
                                    </span>
                                    <p className="truncate opacity-90">{message.replyTo.content}</p>
                                </div>
                            )}

                            {message.content && (
                                <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words selection:bg-indigo-200 selection:text-indigo-900">
                                    {message.content}
                                </p>
                            )}

                            {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    {message.attachments.map((att, idx) => {
                                        const isVoice = att.type === "voice" || att.name?.endsWith(".webm");
                                        if (isVoice) {
                                            return (
                                                <div key={idx} className="pt-1">
                                                    <audio controls className="h-8 max-w-full">
                                                        <source src={att.url} type="audio/webm" />
                                                        Your browser does not support audio playback.
                                                    </audio>
                                                </div>
                                            );
                                        }

                                        return (
                                            <a
                                                key={idx}
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`flex items-center justify-between gap-3 p-2 rounded-lg text-xs transition ${isOwn
                                                    ? "bg-indigo-700/70 text-white hover:bg-indigo-700"
                                                    : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {getFileIcon(att.type || "file")}
                                                    <span className="truncate max-w-[150px] sm:max-w-[200px]">
                                                        {att.name}
                                                    </span>
                                                    {att.size && (
                                                        <span className="text-[9px] opacity-60">{formatFileSize(att.size)}</span>
                                                    )}
                                                </div>
                                                <Download className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hover Toolbar */}
                    {!isDeleted && (
                        <div
                            className={`absolute top-0 ${isOwn ? "left-0 -translate-x-full pr-1.5" : "right-0 translate-x-full pl-1.5"
                                } hidden group-hover:flex items-center gap-0.5 z-10`}
                        >
                            <div className="flex items-center gap-0.5 bg-white border border-slate-200 shadow-md rounded-lg p-0.5 text-slate-500">
                                <button
                                    type="button"
                                    onClick={() => onReply(message)}
                                    className="p-1 hover:bg-slate-100 hover:text-slate-800 rounded transition"
                                    title="Reply"
                                >
                                    <Reply className="w-3.5 h-3.5" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onPin(message._id)}
                                    className="p-1 hover:bg-amber-50 hover:text-amber-600 rounded transition"
                                    title={isPinned ? "Unpin" : "Pin"}
                                >
                                    {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                </button>

                                {EMOJI_OPTIONS.slice(0, 3).map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => onReaction(message._id, emoji)}
                                        className="p-1 hover:bg-slate-100 rounded text-xs transition"
                                        title={`React with ${emoji}`}
                                    >
                                        {emoji}
                                    </button>
                                ))}

                                {isOwn && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(message._id)}
                                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Reaction Badges */}
                {reactionTotals && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(reactionTotals).map(([emoji, count]) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => onReaction(message._id, emoji)}
                                className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 shadow-2xs text-slate-700 px-2 py-0.5 rounded-full hover:bg-slate-50 transition"
                            >
                                <span>{emoji}</span>
                                {count > 1 && <span className="font-semibold text-slate-500">{count}</span>}
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp & Read Status */}
                <div className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 select-none ${isOwn ? "justify-end" : "justify-start"}`}>
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isOwn && !isDeleted && (
                        <span className="flex items-center">
                            {isSeenByRecipient ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" aria-label="Seen" />
                            ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" aria-label="Delivered" />
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});

MessageBubble.displayName = "MessageBubble";

// ============================================================
// MAIN MESSAGES COMPONENT
// ============================================================

export default function ChatMessages({
    channelId,
    channelName = "general",
    members = [],
    onlineCount = 0,
    onToggleDetails,
    onPinnedUpdated,
}: ChatMessagesProps) {
    const { user } = useAuth();
    const {
        socket,
        isConnected,
        onMessage,
        onTyping,
        onReaction,
        onMessageDeleted,
        onMessageUpdated,
        onUserOnline,
        onUserOffline,
        startTyping,
        stopTyping,
        markAsRead,
        joinChannel,
    } = useSocket();

    const currentUserId = user?._id;
    const cleanChannelId = useMemo(() => channelId?.toString() || "", [channelId]);

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [typingDots, setTypingDots] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [pinnedFiles, setPinnedFiles] = useState<PinnedFile[]>([]);
    const [showPinnedFiles, setShowPinnedFiles] = useState(false);
    const [loadingPinned, setLoadingPinned] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }, []);

    // Typing dots animation
    useEffect(() => {
        if (typingUsers.length === 0) {
            setTypingDots("");
            return;
        }

        const interval = setInterval(() => {
            setTypingDots((prev) => {
                if (prev === "") return ".";
                if (prev === ".") return "..";
                if (prev === "..") return "...";
                return "";
            });
        }, 400);

        return () => clearInterval(interval);
    }, [typingUsers.length]);

    // ============================================================
    // FETCH FUNCTIONS
    // ============================================================

    const fetchMessages = useCallback(async () => {
        if (!cleanChannelId) return;
        setLoading(true);
        try {
            const response = await api.get(`/messages/channel/${cleanChannelId}?limit=50`);
            if (response.data?.success) {
                setMessages(response.data.data || []);
                markAsRead(cleanChannelId);
                setTimeout(() => scrollToBottom(false), 50);
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            toast.error("Failed to load channel history");
        } finally {
            setLoading(false);
        }
    }, [cleanChannelId, markAsRead, scrollToBottom]);

    const fetchPinnedFiles = useCallback(async () => {
        if (!cleanChannelId) return;
        setLoadingPinned(true);
        try {
            const response = await api.get(`/channels/${cleanChannelId}/pinned`);
            if (response.data?.success) {
                setPinnedFiles(response.data.data || []);
                // Also show pinned files section if there are any
                if (response.data.data.length > 0) {
                    setShowPinnedFiles(true);
                }
            }
        } catch (error) {
            console.error("Failed to fetch pinned files:", error);
        } finally {
            setLoadingPinned(false);
        }
    }, [cleanChannelId]);

    useEffect(() => {
        fetchMessages();
        fetchPinnedFiles();
    }, [fetchMessages, fetchPinnedFiles]);

    // ============================================================
    // SEARCH FUNCTION
    // ============================================================

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim() || !cleanChannelId) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get(`/messages/channel/${cleanChannelId}/search`, {
                params: { q: searchQuery.trim() },
            });
            if (response.data?.success) {
                setSearchResults(response.data.data || []);
                if (response.data.data.length === 0) {
                    toast.success("No messages found");
                }
            }
        } catch (error) {
            console.error("Search failed:", error);
            toast.error("Failed to search messages");
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, cleanChannelId]);

    useEffect(() => {
        const delay = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delay);
    }, [searchQuery, handleSearch]);

    // ============================================================
    // SOCKET EVENTS
    // ============================================================

    useEffect(() => {
        if (!socket || !cleanChannelId) return;

        joinChannel(cleanChannelId);
        socket.emit("channel:join", { channelId: cleanChannelId });

        const unsubscribeMessage = onMessage((data: { channelId?: string; message: Message }) => {
            const incomingChannel = (data.channelId || (data.message as any)?.channelId)?.toString();
            if (incomingChannel === cleanChannelId && data.message) {
                setMessages((prev) => {
                    const msgId = data.message._id?.toString();
                    if (prev.some((m) => m._id?.toString() === msgId)) return prev;
                    return [...prev, data.message];
                });
                markAsRead(cleanChannelId);
                setTimeout(() => scrollToBottom(true), 50);
            }
        });

        const handleMessageRead = (data: any) => {
            const incomingChan = (data.channelId || data.channel)?._id?.toString() || (data.channelId || data.channel)?.toString();
            const readerId = data.userId?.toString() || data.readerId?.toString();

            if (incomingChan === cleanChannelId && readerId && readerId !== currentUserId?.toString()) {
                setMessages((prev) =>
                    prev.map((msg) => {
                        if (msg.senderId?._id?.toString() === currentUserId?.toString()) {
                            const currentReads = Array.isArray(msg.readBy) ? msg.readBy : [];
                            const alreadyPresent = currentReads.some((r) => extractReaderId(r) === readerId);

                            if (!alreadyPresent) {
                                return {
                                    ...msg,
                                    isRead: true,
                                    readBy: [...currentReads, { userId: readerId, readAt: new Date().toISOString() }],
                                };
                            }
                            return { ...msg, isRead: true };
                        }
                        return msg;
                    })
                );
            }
        };

        socket.on("message:read", handleMessageRead);
        socket.on("messages:read", handleMessageRead);
        socket.on("channel:read", handleMessageRead);

        const unsubscribeTyping = onTyping((data: { channelId: string; userId: string; userName: string; type: "start" | "stop" }) => {
            const incChanId = data.channelId?.toString();
            const incUserId = data.userId?.toString();

            if (incChanId === cleanChannelId && incUserId !== currentUserId) {
                if (data.type === "start") {
                    setTypingUsers((prev) => {
                        if (prev.some((u) => u.userId === incUserId)) return prev;
                        return [...prev, { userId: incUserId, name: data.userName || "Someone" }];
                    });
                } else {
                    setTypingUsers((prev) => prev.filter((u) => u.userId !== incUserId));
                }
            }
        });

        const unsubscribeReaction = onReaction((data: { channelId?: string; messageId: string; reactions: Reaction[] }) => {
            if (data.channelId?.toString() === cleanChannelId) {
                setMessages((prev) =>
                    prev.map((m) => (m._id?.toString() === data.messageId?.toString() ? { ...m, reactions: data.reactions } : m))
                );
            }
        });

        const unsubscribeDeleted = onMessageDeleted((data: { channelId?: string; messageId: string }) => {
            if (data.channelId?.toString() === cleanChannelId) {
                setMessages((prev) =>
                    prev.map((m) => (m._id?.toString() === data.messageId?.toString() ? { ...m, isDeleted: true } : m))
                );
            }
        });

        const unsubscribeUpdated = onMessageUpdated((data: { channelId?: string; message: { _id: string; content: string } }) => {
            if (data.channelId?.toString() === cleanChannelId) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m._id?.toString() === data.message?._id?.toString()
                            ? { ...m, content: data.message.content, isEdited: true }
                            : m
                    )
                );
            }
        });

        const unsubscribeUserOnline = onUserOnline((data: { userId: string }) => {
            setOnlineUsers((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
        });

        const unsubscribeUserOffline = onUserOffline((data: { userId: string }) => {
            setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
        });

        return () => {
            unsubscribeMessage?.();
            unsubscribeTyping?.();
            unsubscribeReaction?.();
            unsubscribeDeleted?.();
            unsubscribeUpdated?.();
            unsubscribeUserOnline?.();
            unsubscribeUserOffline?.();
            socket.off("message:read", handleMessageRead);
            socket.off("messages:read", handleMessageRead);
            socket.off("channel:read", handleMessageRead);
            socket.emit("channel:leave", { channelId: cleanChannelId });
        };
    }, [
        socket,
        cleanChannelId,
        currentUserId,
        joinChannel,
        markAsRead,
        scrollToBottom,
        onMessage,
        onTyping,
        onReaction,
        onMessageDeleted,
        onMessageUpdated,
        onUserOnline,
        onUserOffline,
    ]);

    // ============================================================
    // MESSAGE ACTIONS
    // ============================================================

    const handleSendMessage = useCallback(async () => {
        const text = inputText.trim();
        if (!text && attachments.length === 0 && !audioBlob) return;
        if (!cleanChannelId) {
            toast.error("No channel active");
            return;
        }

        setSending(true);
        try {
            let response;
            if (attachments.length === 0 && !audioBlob) {
                response = await api.post(`/messages/channel/${cleanChannelId}`, {
                    content: text,
                    replyTo: replyingTo?._id || null,
                });
            } else {
                const formData = new FormData();
                formData.append("content", text);
                if (replyingTo?._id) formData.append("replyTo", replyingTo._id);

                attachments.forEach((file) => formData.append("attachments", file));

                if (audioBlob) {
                    const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
                    formData.append("attachments", audioFile);
                }

                response = await api.post(`/messages/channel/${cleanChannelId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            if (response.data?.success) {
                const newMsg: Message = response.data.data;
                setMessages((prev) => {
                    if (prev.some((m) => m._id?.toString() === newMsg._id?.toString())) return prev;
                    return [...prev, newMsg];
                });

                setInputText("");
                setAttachments([]);
                setAudioBlob(null);
                setReplyingTo(null);
                stopTyping(cleanChannelId);

                if (inputRef.current) {
                    inputRef.current.style.height = "auto";
                }

                setTimeout(() => scrollToBottom(true), 50);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    }, [inputText, attachments, audioBlob, cleanChannelId, replyingTo, stopTyping, scrollToBottom]);

    // In ChatMessages.tsx - Update the pin handler

    const handlePinMessage = useCallback(async (messageId: string) => {
        try {
            console.log("📤 [ChatMessages] Pinning message:", messageId);
            const response = await api.post(`/messages/${messageId}/pin`);
            console.log("📥 [ChatMessages] Pin response:", response.data);

            if (response.data?.success) {
                toast.success(response.data.message || "Message pinned/unpinned");
                setMessages((prev) =>
                    prev.map((m) =>
                        m._id?.toString() === messageId
                            ? { ...m, isPinned: !m.isPinned }
                            : m
                    )
                );
                // Refresh pinned files in the message header
                await fetchPinnedFiles();

                // ✅ Notify parent component (TeamChatPage) to refresh sidebar
                if (onPinnedUpdated) {
                    onPinnedUpdated();
                }
            } else {
                toast.error(response.data?.message || "Failed to pin message");
            }
        } catch (error: any) {
            console.error("❌ [ChatMessages] Pin error:", error);
            toast.error(error.response?.data?.message || "Failed to pin message");
        }
    }, [fetchPinnedFiles, onPinnedUpdated]);

    const handleReaction = useCallback(async (messageId: string, emoji: string) => {
        try {
            const response = await api.post(`/messages/${messageId}/reaction`, { emoji });
            if (response.data?.success) {
                setMessages((prev) =>
                    prev.map((m) => (m._id?.toString() === messageId ? { ...m, reactions: response.data.data } : m))
                );
            }
        } catch (error) {
            console.error("Reaction failed:", error);
        }
    }, []);

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await api.delete(`/messages/${messageId}`);
            if (res.data?.success) {
                setMessages((prev) =>
                    prev.map((m) => (m._id?.toString() === messageId ? { ...m, isDeleted: true } : m))
                );
            }
        } catch (error) {
            toast.error("Failed to delete message");
        }
    }, []);

    // ============================================================
    // RECORDING
    // ============================================================

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            setRecordingTime(0);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                setIsRecording(false);
                if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            recordingTimerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
        } catch {
            toast.error("Microphone permission denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setAudioBlob(null);
        setIsRecording(false);
    };

    // ============================================================
    // TYPING HANDLERS
    // ============================================================

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputText(value);

        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;

        if (!cleanChannelId) return;

        if (value.trim()) {
            startTyping(cleanChannelId);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(cleanChannelId);
            }, 2000);
        } else {
            stopTyping(cleanChannelId);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // ============================================================
    // FILE HANDLING
    // ============================================================

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments((prev) => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ============================================================
    // MEMOIZED VALUES
    // ============================================================

    const resolvedOnlineCount = useMemo(() => {
        if (!members.length) return onlineCount;
        return members.filter((m) => {
            const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
            return uid && onlineUsers.includes(uid);
        }).length;
    }, [members, onlineUsers, onlineCount]);

    const typingSummary = useMemo(() => {
        if (typingUsers.length === 0) return null;
        const names = typingUsers.map((u) => u.name);
        if (names.length === 1) return `${names[0]} is typing`;
        if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
        return `${names[0]} and ${names.length - 1} others are typing`;
    }, [typingUsers]);

    // ============================================================
    // RENDER
    // ============================================================

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs text-slate-400">Loading conversation...</span>
            </div>
        );
    }

    return (
        <main className="w-full h-full flex flex-col bg-white overflow-hidden text-slate-800">
            {/* Header */}
            <header className="border-b border-slate-100 bg-white shrink-0">
                <div className="h-14 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={onToggleDetails}
                            className="flex items-center gap-3 min-w-0 text-left hover:opacity-85 transition"
                        >
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <Laptop className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                                    # {channelName}
                                    <Circle
                                        className={`w-2 h-2 ${isConnected ? "fill-emerald-500 text-emerald-500" : "fill-slate-300 text-slate-300"
                                            }`}
                                    />
                                </h2>
                                <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {members.length} members
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                        <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                                        {resolvedOnlineCount} online
                                    </span>
                                    {pinnedFiles.length > 0 && (
                                        <>
                                            <span>•</span>
                                            <button
                                                onClick={() => setShowPinnedFiles(!showPinnedFiles)}
                                                className="flex items-center gap-0.5 text-amber-600 hover:text-amber-700 transition"
                                            >
                                                <Pin className="w-3 h-3" />
                                                {pinnedFiles.length}
                                            </button>
                                        </>
                                    )}
                                </p>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
                            title="Search messages"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 🔥 Expandable Search Bar */}
                {isSearchOpen && (
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/80">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    autoFocus
                                />
                            </div>
                            <button
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery("");
                                    setSearchResults([]);
                                }}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search Results */}
                        {searchQuery && (
                            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                                {isSearching ? (
                                    <div className="flex items-center justify-center py-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                        <span className="text-xs text-slate-400 ml-2">Searching...</span>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="text-center py-2 text-xs text-slate-400">No messages found</div>
                                ) : (
                                    searchResults.map((msg) => (
                                        <div
                                            key={msg._id}
                                            className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setSearchResults([]);
                                                setIsSearchOpen(false);
                                            }}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold shrink-0">
                                                {getInitials(msg.senderId?.fullName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-slate-700 truncate">{msg.content || "File attachment"}</p>
                                                <p className="text-[9px] text-slate-400">
                                                    {msg.senderId?.fullName} · {formatMessageTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Pinned Files Toggle */}
                {showPinnedFiles && pinnedFiles.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-100 bg-amber-50/50">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                                <Pin className="w-3 h-3" /> Pinned Files
                            </span>
                            <button
                                onClick={() => setShowPinnedFiles(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {pinnedFiles.map((file) => (
                                <a
                                    key={file._id}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs hover:bg-slate-50 transition"
                                >
                                    {getFileIcon(file.type)}
                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                    <span className="text-[9px] text-slate-400">{formatFileSize(file.size)}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-white">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                            <MessageSquare className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No messages here yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">Start the conversation below</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwn = message.senderId?._id?.toString() === currentUserId?.toString();
                        const prevDate = index > 0 ? messages[index - 1]?.createdAt : null;
                        const showDateSeparator =
                            index === 0 ||
                            (prevDate && new Date(message.createdAt).toDateString() !== new Date(prevDate).toDateString());

                        return (
                            <React.Fragment key={message._id || index}>
                                {showDateSeparator && (
                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-slate-100" />
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md">
                                            {formatGroupDate(message.createdAt)}
                                        </span>
                                        <div className="flex-1 h-px bg-slate-100" />
                                    </div>
                                )}

                                <MessageBubble
                                    message={message}
                                    isOwn={isOwn}
                                    currentUserId={currentUserId}
                                    onReply={setReplyingTo}
                                    onDelete={handleDeleteMessage}
                                    onReaction={handleReaction}
                                    onPin={handlePinMessage}
                                />
                            </React.Fragment>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex items-start gap-2.5 my-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                            ...
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs flex items-center gap-1.5 text-slate-600">
                            <span>{typingSummary}</span>
                            <span className="font-bold tracking-widest text-indigo-600">{typingDots}</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <footer className="p-3 border-t border-slate-100 bg-white shrink-0">
                {/* Reply Preview */}
                {replyingTo && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5 mb-2 flex items-center justify-between text-xs">
                        <div className="truncate pr-2">
                            <span className="text-slate-500">Replying to </span>
                            <span className="font-semibold text-indigo-600">{replyingTo.senderId?.fullName}</span>
                            <p className="text-slate-400 truncate text-[11px] mt-0.5">{replyingTo.content}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Attachments Preview */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {attachments.map((file, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-700"
                            >
                                <span className="truncate max-w-[120px]">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                                    className="text-slate-400 hover:text-rose-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                {isRecording ? (
                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                        <div className="flex items-center gap-2 text-rose-600 text-xs font-medium">
                            <span className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse" />
                            Recording voice message ({recordingTime}s)
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={cancelRecording}
                                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-rose-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
                                title="Stop & Save"
                            >
                                <Square className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-end gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus-within:bg-white focus-within:border-indigo-500 transition shadow-2xs">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition shrink-0"
                            title="Attach File"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <textarea
                            ref={inputRef}
                            placeholder="Write a message..."
                            value={inputText}
                            onChange={handleTyping}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            className="flex-1 bg-transparent text-xs sm:text-sm outline-none text-slate-800 placeholder-slate-400 resize-none py-1.5 max-h-32 min-h-[34px]"
                        />

                        {audioBlob ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1 shrink-0">
                                <span>Audio ready</span>
                                <button
                                    type="button"
                                    onClick={() => setAudioBlob(null)}
                                    className="text-slate-400 hover:text-rose-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            !inputText.trim() &&
                            attachments.length === 0 && (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded-lg transition shrink-0"
                                    title="Voice Message"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            )
                        )}

                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={sending || (!inputText.trim() && attachments.length === 0 && !audioBlob)}
                            className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-30 shrink-0 mb-0.5"
                        >
                            {sending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <SendHorizontal className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                )}
            </footer>
        </main>
    );
}