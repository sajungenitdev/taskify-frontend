// components/chat/ChatMessages.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
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
    AtSign,
    ArrowUp,
    CornerDownRight,
    Smile,
    AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { format, isToday } from "date-fns";
import ChatNotificationService from "@/services/chatNotification.service";

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
    userId: string | { _id: string; fullName?: string };
}

export interface ReadReceipt {
    userId: string | { _id: string };
    readAt?: string;
}

export interface Mention {
    userId: string;
    name: string;
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
    mentions?: Mention[];
    reactions: Reaction[];
    readBy?: Array<ReadReceipt | string>;
    isRead?: boolean;
    isPinned?: boolean;
    createdAt: string;
    isEdited?: boolean;
    isDeleted?: boolean;
}

export interface ChannelMemberItem {
    userId:
    | {
        _id: string;
        fullName?: string;
        email?: string;
        avatar?: string;
        onlineStatus?: string;
    }
    | string;
    role?: string;
}

interface Task {
    _id: string;
    title: string;
    status: string;
    priority: string;
    progress: number;
    assignedTo?: {
        _id: string;
        fullName: string;
    };
}

interface ChatMessagesProps {
    channelId: string;
    channelName?: string;
    channelAvatar?: string;
    members?: ChannelMemberItem[];
    onlineCount?: number;
    onToggleDetails?: () => void;
    onPinnedUpdated?: () => void;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

const EMOJI_CATEGORIES = [
    { name: "Smileys", list: ["😀", "😂", "🤣", "😍", "🥳", "😎", "🤔", "🥺", "😇", "🤩"] },
    { name: "Gestures", list: ["👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "💪", "🙏", "👌"] },
    { name: "Reactions", list: ["❤️", "🔥", "🎉", "✨", "💯", "🚀", "💡", "👀", "⭐", "🚨"] },
];

// ============================================================
// UTILITIES & URL HELPERS
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
    if (!bytes || bytes < 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

// Seamless URL builder: checks if the path is relative or full URL
const resolveMediaUrl = (url?: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
        return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
};

// Reliable programmatic cross-origin file downloader
const triggerFileDownload = async (fileUrl: string, fileName: string) => {
    try {
        const resolved = resolveMediaUrl(fileUrl);
        const toastId = toast.loading(`Downloading ${fileName}...`);
        const response = await fetch(resolved);
        if (!response.ok) throw new Error("Network download failed");

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = fileName || "download";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(blobUrl);
        toast.dismiss(toastId);
        toast.success("Download complete");
    } catch (error) {
        console.error("Download error:", error);
        toast.error("Failed to download file directly. Opening in browser...");
        window.open(resolveMediaUrl(fileUrl), "_blank", "noopener,noreferrer");
    }
};

const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4 text-rose-500" />;
    if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv"))
        return <Table className="w-4 h-4 text-emerald-600" />;
    return <FileIcon className="w-4 h-4 text-slate-500" />;
};

const extractReaderId = (item: ReadReceipt | string): string => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item.userId === "string") return item.userId;
    if (typeof item.userId === "object" && item.userId?._id) return item.userId._id.toString();
    return "";
};

const normalizeUserId = (target: any): string => {
    if (!target) return "";
    if (typeof target === "string") return target;
    if (target._id) return target._id.toString();
    if (target.userId) return normalizeUserId(target.userId);
    return target.toString();
};

const isImageAttachment = (att: Attachment): boolean => {
    return (
        att.type === "image" ||
        Boolean(att.mimeType?.startsWith("image/")) ||
        Boolean(att.name?.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i))
    );
};

// ============================================================
// MEMOIZED MESSAGE BUBBLE
// ============================================================

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    currentUserId?: string;
    onReply: (msg: Message) => void;
    onDelete: (id: string) => void;
    onReaction: (id: string, emoji: string) => void;
    onPin: (id: string) => void;
    onScrollToMessage: (id: string) => void;
    onMentionClick: (userId: string, userName: string) => void;
    highlight?: boolean;
}

const MessageBubble = memo(
    ({
        message,
        isOwn,
        currentUserId,
        onReply,
        onDelete,
        onReaction,
        onPin,
        onScrollToMessage,
        onMentionClick,
        highlight = false,
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

        const uniqueUserReactions = useMemo(() => {
            if (!message.reactions || !Array.isArray(message.reactions)) return [];

            const seenUsers = new Set<string>();
            const result: Reaction[] = [];

            for (let i = message.reactions.length - 1; i >= 0; i--) {
                const r = message.reactions[i];
                const uid = normalizeUserId(r.userId);
                if (uid && !seenUsers.has(uid)) {
                    seenUsers.add(uid);
                    result.unshift(r);
                }
            }
            return result;
        }, [message.reactions]);

        const reactionTotals = useMemo(() => {
            if (uniqueUserReactions.length === 0) return null;
            return uniqueUserReactions.reduce((acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        }, [uniqueUserReactions]);

        const hasUserReacted = useCallback(
            (emoji: string) => {
                if (!currentUserId) return false;
                return uniqueUserReactions.some(
                    (r) => r.emoji === emoji && normalizeUserId(r.userId) === currentUserId.toString()
                );
            },
            [uniqueUserReactions, currentUserId]
        );

        const hasMention = useMemo(() => {
            if (!message.mentions || !currentUserId) return false;
            return message.mentions.some((m) => m.userId?.toString() === currentUserId.toString());
        }, [message.mentions, currentUserId]);

        return (
            <div
                data-message-id={message._id}
                data-sender-id={message.senderId?._id}
                className={`group relative flex items-start gap-2.5 my-2 transition-all duration-300 ${isOwn ? "flex-row-reverse" : "flex-row"
                    } ${hasMention ? "bg-indigo-50/40 -mx-4 px-4 py-1.5 rounded-2xl border-l-4 border-indigo-500" : ""} ${highlight ? "ring-2 ring-indigo-500 ring-offset-2 bg-indigo-50/70 rounded-2xl animate-pulse" : ""
                    }`}
            >
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 select-none shadow-xs mt-0.5">
                    {message.senderId?.avatar ? (
                        <img
                            src={resolveMediaUrl(message.senderId.avatar)}
                            alt={message.senderId.fullName || "User"}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            loading="lazy"
                        />
                    ) : (
                        <div
                            className={`w-8 h-8 rounded-full text-white font-medium text-xs flex items-center justify-center ${isOwn ? "bg-indigo-600" : "bg-slate-700"
                                }`}
                        >
                            {getInitials(isOwn ? "You" : message.senderId?.fullName)}
                        </div>
                    )}
                </div>

                {/* Message Container */}
                <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    {!isOwn && (
                        <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5 px-1 font-medium">
                            <span>{message.senderId?.fullName || "Member"}</span>
                            {isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />}
                            {hasMention && (
                                <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full font-semibold">
                                    @mentioned
                                </span>
                            )}
                        </div>
                    )}

                    <div className="relative group/bubble">
                        {isDeleted ? (
                            <div className="bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl px-4 py-2 text-xs italic select-none">
                                This message was deleted
                            </div>
                        ) : (
                            <div
                                className={`rounded-2xl px-4 py-2.5 shadow-xs transition-colors ${isOwn
                                        ? "bg-indigo-600 text-white rounded-tr-xs"
                                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs hover:border-slate-300"
                                    } ${isPinned ? "ring-1 ring-amber-400" : ""}`}
                            >
                                {isPinned && (
                                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold mb-1 select-none">
                                        <Pin className="w-3 h-3 fill-amber-500" /> Pinned
                                    </div>
                                )}

                                {/* Quoted Reply */}
                                {message.replyTo && (
                                    <button
                                        type="button"
                                        onClick={() => message.replyTo && onScrollToMessage(message.replyTo._id)}
                                        className={`w-full text-left mb-2 p-2 rounded-xl text-xs border-l-[3px] transition cursor-pointer flex flex-col gap-0.5 ${isOwn
                                                ? "bg-indigo-700/60 border-indigo-300 text-indigo-100 hover:bg-indigo-700"
                                                : "bg-slate-50 border-indigo-600 text-slate-600 hover:bg-slate-100"
                                            }`}
                                    >
                                        <div className="flex items-center gap-1 font-semibold text-[11px]">
                                            <CornerDownRight className="w-3 h-3 opacity-70" />
                                            <span>
                                                {typeof message.replyTo.senderId === "object" && message.replyTo.senderId !== null
                                                    ? (message.replyTo.senderId as any)?.fullName || "User"
                                                    : "User"}
                                            </span>
                                        </div>
                                        <p className="truncate opacity-90 text-[11px] pl-4">
                                            {message.replyTo.content || "Attachment"}
                                        </p>
                                    </button>
                                )}

                                {/* Text Body */}
                                {message.content && (
                                    <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words select-text cursor-text">
                                        {message.content.split(/(@\w+(?:\s\w+)?)/g).map((part, idx) => {
                                            if (part.startsWith("@")) {
                                                const rawName = part.slice(1);
                                                const matchedMention = message.mentions?.find(
                                                    (m) =>
                                                        m.name.toLowerCase() === rawName.toLowerCase() ||
                                                        m.name.split(" ")[0].toLowerCase() === rawName.toLowerCase()
                                                );

                                                if (matchedMention) {
                                                    return (
                                                        <span
                                                            key={idx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onMentionClick(matchedMention.userId, matchedMention.name);
                                                            }}
                                                            className={`font-semibold cursor-pointer underline underline-offset-2 px-1 py-0.5 rounded transition ${isOwn
                                                                    ? "text-indigo-200 hover:bg-indigo-700"
                                                                    : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                                                }`}
                                                            title={`Jump to ${matchedMention.name}'s messages`}
                                                        >
                                                            {part}
                                                        </span>
                                                    );
                                                }
                                            }
                                            return <span key={idx}>{part}</span>;
                                        })}
                                    </p>
                                )}

                                {/* Attachments Section */}
                                {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2.5 space-y-2">
                                        {message.attachments.map((att, idx) => {
                                            const fullFileUrl = resolveMediaUrl(att.url);
                                            const isVoice = att.type === "voice" || att.name?.endsWith(".webm");

                                            // Voice Player
                                            if (isVoice) {
                                                return (
                                                    <div key={idx} className="pt-1">
                                                        <audio controls className="h-8 max-w-full rounded-md">
                                                            <source src={fullFileUrl} type="audio/webm" />
                                                            Audio playback not supported.
                                                        </audio>
                                                    </div>
                                                );
                                            }

                                            // Image Attachment Preview
                                            if (isImageAttachment(att)) {
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="relative rounded-xl overflow-hidden max-w-[280px] border border-slate-200/80 bg-slate-100 shadow-2xs group/image"
                                                    >
                                                        <img
                                                            src={fullFileUrl}
                                                            alt={att.name}
                                                            className="max-h-72 w-full object-cover hover:scale-101 transition duration-200 cursor-pointer"
                                                            loading="lazy"
                                                            onClick={() => window.open(fullFileUrl, "_blank")}
                                                        />
                                                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/image:opacity-100 transition duration-150">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    triggerFileDownload(att.url, att.name);
                                                                }}
                                                                className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg shadow-md transition cursor-pointer"
                                                                title="Download image"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // General File Attachments (PDF, Documents, etc.)
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-center justify-between gap-3 p-2.5 rounded-xl text-xs transition border ${isOwn
                                                            ? "bg-indigo-700/50 border-indigo-400/40 text-white hover:bg-indigo-700"
                                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {getFileIcon(att.type || "file")}
                                                        <span className="truncate max-w-[140px] sm:max-w-[200px] font-medium">
                                                            {att.name}
                                                        </span>
                                                        {att.size && (
                                                            <span className="text-[10px] opacity-60">({formatFileSize(att.size)})</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => triggerFileDownload(att.url, att.name)}
                                                        className="p-1 hover:bg-white/20 rounded transition opacity-80 hover:opacity-100 cursor-pointer shrink-0"
                                                        title="Download file"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Hover Action Bar */}
                        {!isDeleted && (
                            <div
                                className={`absolute top-0 ${isOwn ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"
                                    } hidden group-hover/bubble:flex items-center gap-0.5 z-20`}
                            >
                                <div className="flex items-center gap-0.5 bg-white border border-slate-200 shadow-lg rounded-xl p-1 text-slate-500 backdrop-blur-md">
                                    <button
                                        type="button"
                                        onClick={() => onReply(message)}
                                        className="p-1.5 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition cursor-pointer"
                                        title="Reply"
                                    >
                                        <Reply className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => onPin(message._id)}
                                        className="p-1.5 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition cursor-pointer"
                                        title={isPinned ? "Unpin message" : "Pin message"}
                                    >
                                        {isPinned ? <PinOff className="w-3.5 h-3.5 text-amber-500" /> : <Pin className="w-3.5 h-3.5" />}
                                    </button>

                                    <div className="h-3 w-px bg-slate-200 mx-0.5" />

                                    {EMOJI_OPTIONS.slice(0, 3).map((emoji) => {
                                        const isReacted = hasUserReacted(emoji);
                                        return (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => onReaction(message._id, emoji)}
                                                className={`p-1.5 hover:bg-slate-100 rounded-lg text-xs transition cursor-pointer ${isReacted ? "bg-indigo-50 text-indigo-600" : ""
                                                    }`}
                                                title={isReacted ? `Remove ${emoji}` : `React ${emoji}`}
                                            >
                                                {emoji}
                                            </button>
                                        );
                                    })}

                                    {isOwn && (
                                        <>
                                            <div className="h-3 w-px bg-slate-200 mx-0.5" />
                                            <button
                                                type="button"
                                                onClick={() => onDelete(message._id)}
                                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reaction Badges */}
                    {reactionTotals && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {Object.entries(reactionTotals).map(([emoji, count]) => {
                                const isReacted = hasUserReacted(emoji);
                                return (
                                    <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => onReaction(message._id, emoji)}
                                        className={`inline-flex items-center gap-1 text-[11px] border px-2 py-0.5 rounded-full transition shadow-2xs cursor-pointer ${isReacted
                                                ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-medium"
                                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span>{emoji}</span>
                                        {count > 1 && <span className="text-[10px] font-semibold">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Message Timestamp & Seen Status */}
                    <div
                        className={`flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400 select-none ${isOwn ? "justify-end" : "justify-start"
                            }`}
                    >
                        <span>{formatMessageTime(message.createdAt)}</span>
                        {message.isEdited && <span>(edited)</span>}
                        {isOwn && !isDeleted && (
                            <span>
                                {isSeenByRecipient ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-indigo-500" aria-label="Seen" />
                                ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-400" aria-label="Delivered" />
                                )}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

MessageBubble.displayName = "MessageBubble";

// ============================================================
// MAIN MESSAGES COMPONENT
// ============================================================

export default function ChatMessages({
    channelId,
    channelName = "general",
    channelAvatar,
    members = [],
    onlineCount = 0,
    onToggleDetails,
    onPinnedUpdated: parentOnPinnedUpdated,
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
        onPinnedUpdated,
        startTyping,
        stopTyping,
        markAsRead,
        joinChannel,
    } = useSocket();

    const currentUserId = user?._id?.toString();
    const cleanChannelId = useMemo(() => channelId?.toString() || "", [channelId]);

    // States
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [typingDots, setTypingDots] = useState("");
    const [users, setUsers] = useState<any[]>([]);

    // Search States
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

    // Pinned States
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
    const [showPinnedBar, setShowPinnedBar] = useState(false);

    // Mention States
    const [showMentionPopup, setShowMentionPopup] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(-1);

    // Emoji States
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Notification States
    const [notificationPermission, setNotificationPermission] = useState<boolean>(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

    // Delete Modal State
    const [deleteMessageModal, setDeleteMessageModal] = useState<{
        isOpen: boolean;
        messageId: string;
        isDeleting: boolean;
    }>({
        isOpen: false,
        messageId: "",
        isDeleting: false,
    });

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback((smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }, []);

    // Fetch users for mention tagging
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get("/users");
                if (response.data.success) {
                    setUsers(response.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    // Initialize notifications
    useEffect(() => {
        const initNotifications = async () => {
            try {
                const granted = await ChatNotificationService.requestPermission();
                setNotificationPermission(granted);
            } catch (error) {
                console.error("Failed to request notification permission:", error);
            }
        };
        initNotifications();
    }, []);

    // Typing animation
    useEffect(() => {
        if (typingUsers.length === 0) {
            setTypingDots("");
            return;
        }
        const interval = setInterval(() => {
            setTypingDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 400);
        return () => clearInterval(interval);
    }, [typingUsers.length]);

    // Click outside listener for emoji picker
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiPicker]);

    // Unmount timeout cleanup
    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        };
    }, []);

    // ============================================================
    // FETCH ROUTINES
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

    const fetchPinnedMessages = useCallback(async () => {
        if (!cleanChannelId) return;
        try {
            const response = await api.get(`/messages/channel/${cleanChannelId}/pinned`);
            if (response.data?.success) {
                const pinnedMsgs = response.data.data || [];
                setPinnedMessages(pinnedMsgs);
                setShowPinnedBar(pinnedMsgs.length > 0);
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setPinnedMessages([]);
                setShowPinnedBar(false);
            }
        }
    }, [cleanChannelId]);

    useEffect(() => {
        fetchMessages();
        fetchPinnedMessages();
    }, [fetchMessages, fetchPinnedMessages]);

    const scrollToMessage = useCallback((messageId: string) => {
        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }

        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedMessageId(messageId);
            highlightTimeoutRef.current = setTimeout(() => {
                setHighlightedMessageId(null);
            }, 2500);
        } else {
            toast.error("Message is too far back in conversation history");
        }
    }, []);

    const handleMentionClick = useCallback((userId: string, userName: string) => {
        const userMessages = document.querySelectorAll(`[data-sender-id="${userId}"]`);
        if (userMessages.length > 0) {
            const lastMsg = userMessages[userMessages.length - 1];
            lastMsg.scrollIntoView({ behavior: "smooth", block: "center" });
            const msgId = lastMsg.getAttribute("data-message-id");
            if (msgId) {
                setHighlightedMessageId(msgId);
                setTimeout(() => setHighlightedMessageId(null), 2500);
            }
        } else {
            toast.error(`No recent messages found from ${userName}`);
        }
    }, []);

    // Search routine
    useEffect(() => {
        const trimmed = searchQuery.trim().toLowerCase();
        if (!trimmed) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const delay = setTimeout(() => {
            const results = messages.filter((msg) => {
                if (msg.isDeleted) return false;
                if (msg.content?.toLowerCase().includes(trimmed)) return true;
                if (msg.senderId?.fullName?.toLowerCase().includes(trimmed)) return true;
                return msg.attachments?.some((att) => att.name?.toLowerCase().includes(trimmed));
            });
            setSearchResults(results);
            setIsSearching(false);
        }, 250);

        return () => clearTimeout(delay);
    }, [searchQuery, messages]);

    const clearSearch = useCallback(() => {
        setSearchQuery("");
        setSearchResults([]);
        setIsSearchOpen(false);
    }, []);

    // Mentions
    const mentionableUsers = useMemo(() => {
        return members
            .map((m) => {
                const userId = normalizeUserId(m.userId);
                const fullName = typeof m.userId === "object" ? m.userId?.fullName : "";
                return { _id: userId, fullName: fullName || "Unknown" };
            })
            .filter((u) => u._id && u._id !== currentUserId);
    }, [members, currentUserId]);

    const filteredMentionUsers = useMemo(() => {
        if (!mentionSearch) return mentionableUsers;
        return mentionableUsers.filter((u) => u.fullName.toLowerCase().includes(mentionSearch.toLowerCase()));
    }, [mentionableUsers, mentionSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputText(value);

        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

        if (!cleanChannelId) return;

        if (value.trim()) {
            startTyping(cleanChannelId);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => stopTyping(cleanChannelId), 2000);
        } else {
            stopTyping(cleanChannelId);
        }

        const cursorPos = e.target.selectionStart || 0;
        const textBeforeCursor = value.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
            const afterAt = textBeforeCursor.slice(lastAtIndex + 1);
            if (!afterAt.includes(" ")) {
                setMentionSearch(afterAt.toLowerCase());
                setShowMentionPopup(true);
                setSelectedMentionIndex(-1);
                return;
            }
        }
        setShowMentionPopup(false);
    };

    const handleSelectMention = (userToMention: { _id: string; fullName: string }) => {
        const cursorPos = inputRef.current?.selectionStart || 0;
        const lastAtIndex = inputText.slice(0, cursorPos).lastIndexOf("@");

        if (lastAtIndex !== -1) {
            const beforeAt = inputText.slice(0, lastAtIndex);
            const afterAt = inputText.slice(cursorPos);
            const newText = `${beforeAt}@${userToMention.fullName} ${afterAt}`;
            setInputText(newText);

            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    const targetIndex = lastAtIndex + userToMention.fullName.length + 2;
                    inputRef.current.setSelectionRange(targetIndex, targetIndex);
                }
            }, 20);
        }
        setShowMentionPopup(false);
        setMentionSearch("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentionPopup && filteredMentionUsers.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedMentionIndex((prev) => (prev < filteredMentionUsers.length - 1 ? prev + 1 : 0));
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : filteredMentionUsers.length - 1));
                return;
            }
            if (e.key === "Enter" && selectedMentionIndex >= 0) {
                e.preventDefault();
                handleSelectMention(filteredMentionUsers[selectedMentionIndex]);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setShowMentionPopup(false);
                return;
            }
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEmojiClick = (emoji: string) => {
        const cursorPos = inputRef.current?.selectionStart ?? inputText.length;
        const newText = inputText.slice(0, cursorPos) + emoji + inputText.slice(cursorPos);
        setInputText(newText);

        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const nextPos = cursorPos + emoji.length;
                inputRef.current.setSelectionRange(nextPos, nextPos);
            }
        }, 10);
    };

    // ============================================================
    // SOCKET SUBSCRIPTIONS & ONLINE TRACKING
    // ============================================================

    useEffect(() => {
        if (!socket || !cleanChannelId) return;

        joinChannel(cleanChannelId);
        socket.emit("channel:join", { channelId: cleanChannelId });
        socket.emit("users:get_online");

        const handleUserOnlineEvent = (data: any) => {
            const uid = normalizeUserId(data?.userId || data);
            if (!uid) return;
            setOnlineUsers((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
        };

        const handleUserOfflineEvent = (data: any) => {
            const uid = normalizeUserId(data?.userId || data);
            if (!uid) return;
            setOnlineUsers((prev) => prev.filter((id) => id !== uid));
        };

        const handleOnlineUsersList = (data: any) => {
            const list = Array.isArray(data) ? data : data?.users || [];
            const normalized = list.map(normalizeUserId).filter(Boolean);
            setOnlineUsers((prev) => Array.from(new Set([...prev, ...normalized])));
        };

        socket.on("user:online", handleUserOnlineEvent);
        socket.on("user:offline", handleUserOfflineEvent);
        socket.on("users:online", handleOnlineUsersList);
        socket.on("channel:online_users", handleOnlineUsersList);

        const unsubscribeMessage = onMessage((data: { channelId?: string; message: Message }) => {
            const incomingChannel = (data.channelId || (data.message as any)?.channelId)?.toString();
            if (incomingChannel === cleanChannelId && data.message) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id?.toString() === data.message._id?.toString())) return prev;
                    return [...prev, data.message];
                });
                markAsRead(cleanChannelId);
                setTimeout(() => scrollToBottom(true), 50);

                // Desktop Notification
                const senderId = data.message.senderId?._id?.toString();
                if (
                    senderId !== currentUserId &&
                    notificationPermission &&
                    notificationsEnabled &&
                    document.hidden
                ) {
                    const senderName = data.message.senderId?.fullName || "Someone";
                    const messageContent = data.message.content || "📎 Attachment";

                    ChatNotificationService.sendNotificationIfAway(
                        senderName,
                        messageContent,
                        channelName,
                        data.message.senderId?.avatar,
                        cleanChannelId,
                        data.message._id
                    );
                }
            }
        });

        const handleMessageRead = (data: any) => {
            const incomingChan =
                (data.channelId || data.channel)?._id?.toString() || (data.channelId || data.channel)?.toString();
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

        const unsubscribeTyping = onTyping(
            (data: { channelId: string; userId: string; userName: string; type?: string }) => {
                if (data.channelId?.toString() === cleanChannelId && data.userId !== currentUserId) {
                    if (data.type === "start") {
                        setTypingUsers((prev) =>
                            prev.some((u) => u.userId === data.userId)
                                ? prev
                                : [...prev, { userId: data.userId, name: data.userName }]
                        );
                    } else {
                        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
                    }
                }
            }
        );

        const unsubscribeReaction = onReaction(
            (data: { channelId?: string; messageId: string; reactions: Reaction[] }) => {
                if (data.channelId?.toString() === cleanChannelId) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m._id?.toString() === data.messageId?.toString() ? { ...m, reactions: data.reactions } : m
                        )
                    );
                }
            }
        );

        const unsubscribeDeleted = onMessageDeleted((data: { channelId?: string; messageId: string }) => {
            if (data.channelId?.toString() === cleanChannelId) {
                setMessages((prev) =>
                    prev.map((m) => (m._id?.toString() === data.messageId?.toString() ? { ...m, isDeleted: true } : m))
                );
            }
        });

        const unsubscribeUpdated = onMessageUpdated(
            (data: { channelId?: string; message: { _id: string; content: string } }) => {
                if (data.channelId?.toString() === cleanChannelId) {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m._id?.toString() === data.message?._id?.toString()
                                ? { ...m, content: data.message.content, isEdited: true }
                                : m
                        )
                    );
                }
            }
        );

        const unsubscribePinned = onPinnedUpdated?.((data: any) => {
            if (data.channelId === cleanChannelId && data.messageId) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg._id?.toString() === data.messageId ? { ...msg, isPinned: data.isPinned ?? false } : msg
                    )
                );

                if (data.isPinned === false) {
                    setPinnedMessages((prev) => {
                        const filtered = prev.filter((msg) => msg._id?.toString() !== data.messageId);
                        if (filtered.length === 0) setShowPinnedBar(false);
                        return filtered;
                    });
                } else {
                    fetchPinnedMessages();
                }

                parentOnPinnedUpdated?.();
            }
        });

        const unsubscribeUserOnline = onUserOnline?.((data: any) => {
            handleUserOnlineEvent(data);
        });

        const unsubscribeUserOffline = onUserOffline?.((data: any) => {
            handleUserOfflineEvent(data);
        });

        return () => {
            unsubscribeMessage?.();
            unsubscribeTyping?.();
            unsubscribeReaction?.();
            unsubscribeDeleted?.();
            unsubscribeUpdated?.();
            unsubscribePinned?.();
            unsubscribeUserOnline?.();
            unsubscribeUserOffline?.();

            socket.off("user:online", handleUserOnlineEvent);
            socket.off("user:offline", handleUserOfflineEvent);
            socket.off("users:online", handleOnlineUsersList);
            socket.off("channel:online_users", handleOnlineUsersList);
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
        onPinnedUpdated,
        onUserOnline,
        onUserOffline,
        fetchPinnedMessages,
        parentOnPinnedUpdated,
        notificationPermission,
        notificationsEnabled,
        channelName,
    ]);

    // ============================================================
    // SEND MESSAGE (Complete FormData & Multer Alignment)
    // ============================================================

    const handleSendMessage = async () => {
        if (!inputText.trim() && attachments.length === 0 && !audioBlob) {
            toast.error("Please enter a message or attach a file");
            return;
        }
        if (!channelId) {
            toast.error("No channel selected");
            return;
        }

        setSending(true);
        try {
            const mentionRegex = /@(\w+)/g;
            const mentions: string[] = [];
            let match;
            while ((match = mentionRegex.exec(inputText)) !== null) {
                const mentionedUser = users.find((u) =>
                    u.fullName?.toLowerCase().includes(match[1].toLowerCase())
                );
                if (mentionedUser) {
                    mentions.push(mentionedUser._id);
                }
            }

            const formData = new FormData();
            formData.append("content", inputText.trim());

            if (replyingTo) {
                formData.append("replyTo", replyingTo._id);
            }

            if (mentions.length > 0) {
                formData.append("mentions", JSON.stringify(mentions));
            }

            if (selectedTask) {
                formData.append("linkedTaskId", selectedTask._id);
            }

            // Append files to both "files" and "attachments" to ensure Multer parses correctly
            attachments.forEach((file) => {
                formData.append("files", file);
                formData.append("attachments", file);
            });

            if (audioBlob) {
                const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, {
                    type: "audio/webm",
                });
                formData.append("files", audioFile);
                formData.append("attachments", audioFile);
            }

            const response = await api.post(`/messages/channel/${channelId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data?.success) {
                const newMessage = response.data.data;
                setMessages((prev) => (prev.some((m) => m._id === newMessage._id) ? prev : [...prev, newMessage]));

                setInputText("");
                setAttachments([]);
                setAudioBlob(null);
                setReplyingTo(null);
                setSelectedTask(null);
                stopTyping(cleanChannelId);
                markAsRead(channelId);

                if (inputRef.current) inputRef.current.style.height = "auto";
                setTimeout(() => scrollToBottom(true), 100);
            } else {
                toast.error(response.data?.message || "Failed to send message");
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            toast.error(error.response?.data?.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    // ============================================================
    // PIN MESSAGE
    // ============================================================

    const handlePinMessage = useCallback(
        async (messageId: string) => {
            try {
                const response = await api.post(`/messages/${messageId}/pin`);
                if (response.data?.success) {
                    setMessages((prev) =>
                        prev.map((m) => (m._id?.toString() === messageId ? { ...m, isPinned: !m.isPinned } : m))
                    );
                    await fetchPinnedMessages();
                    parentOnPinnedUpdated?.();
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to pin message");
            }
        },
        [fetchPinnedMessages, parentOnPinnedUpdated]
    );

    // ============================================================
    // SINGLE REACTION PER USER
    // ============================================================

    const handleReaction = useCallback(
        async (messageId: string, emoji: string) => {
            if (!currentUserId) return;
            const targetMsg = messages.find((m) => m._id === messageId);
            if (!targetMsg) return;

            const currentReaction = targetMsg.reactions?.find(
                (r) => normalizeUserId(r.userId) === currentUserId.toString()
            );
            const isRemovingCurrent = currentReaction?.emoji === emoji;

            // Optimistically update reactions
            setMessages((prev) =>
                prev.map((m) => {
                    if (m._id === messageId) {
                        const cleanReactions = (m.reactions || []).filter(
                            (r) => normalizeUserId(r.userId) !== currentUserId.toString()
                        );
                        return {
                            ...m,
                            reactions: isRemovingCurrent
                                ? cleanReactions
                                : [...cleanReactions, { emoji, userId: currentUserId }],
                        };
                    }
                    return m;
                })
            );

            try {
                const res = await api.post(`/messages/${messageId}/reaction`, { emoji });
                if (res.data?.success && Array.isArray(res.data.data)) {
                    setMessages((prev) =>
                        prev.map((m) => (m._id === messageId ? { ...m, reactions: res.data.data } : m))
                    );
                }
            } catch (error) {
                fetchMessages();
                toast.error("Failed to update reaction");
            }
        },
        [currentUserId, messages, fetchMessages]
    );

    // ============================================================
    // DELETE MESSAGE
    // ============================================================

    const handleDeleteMessage = useCallback((messageId: string) => {
        setDeleteMessageModal({
            isOpen: true,
            messageId,
            isDeleting: false,
        });
    }, []);

    const closeDeleteMessageModal = useCallback(() => {
        setDeleteMessageModal({
            isOpen: false,
            messageId: "",
            isDeleting: false,
        });
    }, []);

    const confirmDeleteMessage = useCallback(async () => {
        const { messageId } = deleteMessageModal;
        if (!messageId) return;

        setDeleteMessageModal((prev) => ({ ...prev, isDeleting: true }));
        try {
            const res = await api.delete(`/messages/${messageId}`);
            if (res.data?.success) {
                setMessages((prev) =>
                    prev.map((m) => (m._id?.toString() === messageId ? { ...m, isDeleted: true } : m))
                );
                closeDeleteMessageModal();
            } else {
                toast.error(res.data?.message || "Failed to delete message");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete message");
        } finally {
            setDeleteMessageModal((prev) => ({ ...prev, isDeleting: false }));
        }
    }, [deleteMessageModal, closeDeleteMessageModal]);

    // ============================================================
    // VOICE RECORDING
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
    // FILE SELECT
    // ============================================================

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments((prev) => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ============================================================
    // RESOLVED ONLINE COUNT
    // ============================================================

    const resolvedOnlineCount = useMemo(() => {
        const activeOnlineSet = new Set<string>(onlineUsers.map(normalizeUserId));

        if (isConnected && currentUserId) {
            activeOnlineSet.add(currentUserId);
        }

        members.forEach((m) => {
            if (typeof m.userId === "object" && m.userId?.onlineStatus === "online") {
                activeOnlineSet.add(m.userId._id.toString());
            }
        });

        if (members.length > 0) {
            const calculatedCount = members.filter((m) => {
                const uid = normalizeUserId(m.userId);
                return uid && activeOnlineSet.has(uid);
            }).length;

            return Math.max(calculatedCount, onlineCount);
        }

        return onlineCount || (isConnected ? 1 : 0);
    }, [members, onlineUsers, onlineCount, isConnected, currentUserId]);

    const typingSummary = useMemo(() => {
        if (typingUsers.length === 0) return null;
        const names = typingUsers.map((u) => u.name);
        if (names.length === 1) return `${names[0]} is typing`;
        if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
        return `${names[0]} and ${names.length - 1} others are typing`;
    }, [typingUsers]);

    // ============================================================
    // LOADING STATE
    // ============================================================

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-2" />
                <span className="text-xs font-medium text-slate-400">Loading conversation...</span>
            </div>
        );
    }

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <main className="w-full h-full flex flex-col bg-slate-50 overflow-hidden text-slate-800">
            {/* Header */}
            <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0 z-10">
                <div className="h-14 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={onToggleDetails}
                            className="flex items-center gap-3 min-w-0 text-left hover:opacity-90 transition cursor-pointer"
                        >
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 overflow-hidden shadow-2xs select-none">
                                {(() => {
                                    let avatarUrl = channelAvatar;

                                    if (!avatarUrl && members.length === 2) {
                                        const partner = members.find((m) => {
                                            const uid = normalizeUserId(m.userId);
                                            return uid !== currentUserId;
                                        });
                                        if (partner && typeof partner.userId === "object" && partner.userId?.avatar) {
                                            avatarUrl = partner.userId.avatar;
                                        }
                                    }

                                    if (avatarUrl) {
                                        return (
                                            <img
                                                src={resolveMediaUrl(avatarUrl)}
                                                alt={channelName}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        );
                                    }

                                    const isDirect = members.length === 2;
                                    return isDirect ? getInitials(channelName) : "#";
                                })()}
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-sm font-bold text-slate-900 truncate flex items-center gap-2">
                                    {channelName}
                                    <Circle
                                        className={`w-2 h-2 ${isConnected ? "fill-emerald-500 text-emerald-500" : "fill-slate-300 text-slate-300"
                                            }`}
                                    />
                                </h2>
                                <div className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {members.length} members
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                        <Circle className="w-1.5 h-1.5 fill-emerald-500 text-emerald-500" />
                                        {resolvedOnlineCount} online
                                    </span>
                                    {pinnedMessages.length > 0 && (
                                        <>
                                            <span>•</span>
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowPinnedBar(!showPinnedBar);
                                                }}
                                                className="flex items-center gap-0.5 text-amber-600 hover:underline transition font-medium"
                                            >
                                                <Pin className="w-3 h-3 fill-amber-500" />
                                                {pinnedMessages.length} pinned
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Search conversation"
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Pinned Messages Bar */}
                {showPinnedBar && pinnedMessages.length > 0 && (
                    <div className="px-4 py-2 border-t border-amber-200/60 bg-amber-50/70 flex items-center gap-2 overflow-x-auto">
                        <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                        <span className="text-[11px] font-semibold text-amber-700 shrink-0">Pinned</span>
                        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                            {pinnedMessages.slice(0, 4).map((msg) => (
                                <button
                                    key={msg._id}
                                    type="button"
                                    onClick={() => scrollToMessage(msg._id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-200 rounded-full text-[11px] text-slate-700 hover:bg-amber-100/50 hover:border-amber-300 transition shrink-0 max-w-[220px] cursor-pointer"
                                >
                                    <span className="truncate">
                                        <strong>{msg.senderId?.fullName}:</strong> {msg.content || "Attachment"}
                                    </span>
                                    <ArrowUp className="w-3 h-3 text-amber-500" />
                                </button>
                            ))}
                            {pinnedMessages.length > 4 && (
                                <span className="text-[10px] text-slate-400 shrink-0">+{pinnedMessages.length - 4} more</span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPinnedBar(false)}
                            className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Search Bar */}
                {isSearchOpen && (
                    <div className="px-4 py-2.5 border-t border-slate-200/80 bg-slate-100/70">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search in conversation..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {searchQuery && (
                            <div className="mt-2 max-h-48 overflow-y-auto space-y-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-md">
                                {isSearching ? (
                                    <div className="flex items-center justify-center py-3 text-xs text-slate-400 gap-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                        Searching...
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="text-center py-3 text-xs text-slate-400">No results found for "{searchQuery}"</div>
                                ) : (
                                    searchResults.map((msg) => (
                                        <button
                                            key={msg._id}
                                            type="button"
                                            onClick={() => {
                                                clearSearch();
                                                scrollToMessage(msg._id);
                                            }}
                                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-left transition cursor-pointer"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                                                {getInitials(msg.senderId?.fullName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-slate-800 truncate font-medium">{msg.content || "Attachment"}</p>
                                                <p className="text-[10px] text-slate-400">
                                                    {msg.senderId?.fullName} • {formatMessageTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Messages Canvas */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-white">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center mb-3">
                            <MessageSquare className="w-7 h-7 text-indigo-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No messages yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">Send a message to break the ice</p>
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
                                    <div className="flex items-center gap-3 my-5">
                                        <div className="flex-1 h-px bg-slate-200/80" />
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200/50">
                                            {formatGroupDate(message.createdAt)}
                                        </span>
                                        <div className="flex-1 h-px bg-slate-200/80" />
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
                                    onScrollToMessage={scrollToMessage}
                                    onMentionClick={handleMentionClick}
                                    highlight={highlightedMessageId === message._id}
                                />
                            </React.Fragment>
                        );
                    })
                )}

                {typingUsers.length > 0 && (
                    <div className="flex items-start gap-2.5 my-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold shrink-0">
                            ...
                        </div>
                        <div className="bg-slate-100 border border-slate-200/80 rounded-2xl rounded-tl-xs px-4 py-2 text-xs flex items-center gap-1.5 text-slate-600">
                            <span>{typingSummary}</span>
                            <span className="font-bold tracking-widest text-indigo-600">{typingDots}</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Modern Input Deck */}
            <footer className="p-3 border-t border-slate-200/80 bg-white/95 backdrop-blur-sm shrink-0 relative z-10">
                {replyingTo && (
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl px-3.5 py-2 mb-2.5 flex items-center justify-between text-xs shadow-2xs animate-in fade-in slide-in-from-bottom-1 duration-150">
                        <div className="min-w-0 pr-3 border-l-2 border-indigo-600 pl-2.5">
                            <div className="flex items-center gap-1.5 leading-tight">
                                <span className="text-[11px] text-slate-500 font-normal">Replying to</span>
                                <span className="font-semibold text-indigo-600 truncate">
                                    {typeof replyingTo.senderId === "object" && replyingTo.senderId !== null
                                        ? (replyingTo.senderId as any)?.fullName || "User"
                                        : "User"}
                                </span>
                            </div>
                            <p className="text-slate-600 truncate text-xs mt-0.5 font-normal">
                                {replyingTo.content || "Attachment"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="p-1 hover:bg-indigo-100/60 text-slate-400 hover:text-slate-600 rounded-lg transition shrink-0 cursor-pointer"
                            title="Cancel reply"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Selected Attachments Badge Deck */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2.5 max-h-28 overflow-y-auto pr-1">
                        {attachments.map((file, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 bg-slate-50/90 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs"
                            >
                                <span className="truncate max-w-[140px] font-medium">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
                                    title="Remove attachment"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {isRecording ? (
                    <div className="flex items-center justify-between bg-rose-50/80 border border-rose-200/80 rounded-2xl px-4 py-2 shadow-2xs animate-in fade-in duration-150">
                        <div className="flex items-center gap-2.5 text-rose-600 text-xs font-medium">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                            </span>
                            <span>Recording audio message ({recordingTime}s)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={cancelRecording}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-100/60 rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="p-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl transition shadow-xs cursor-pointer"
                                title="Save & Attach"
                            >
                                <Square className="w-3.5 h-3.5 fill-current" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 border border-slate-200/90 bg-slate-50/60 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 rounded-2xl px-2.5 py-1.5 transition-all shadow-2xs relative">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-2 rounded-xl transition shrink-0 cursor-pointer"
                            title="Attach file"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />

                        {/* Emoji Picker */}
                        <div className="relative shrink-0" ref={emojiPickerRef}>
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                                className={`p-2 rounded-xl transition cursor-pointer ${showEmojiPicker
                                        ? "text-indigo-600 bg-indigo-50"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                                    }`}
                                title="Add emoji"
                            >
                                <Smile className="w-4 h-4" />
                            </button>

                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-3 w-64 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Emojis</span>
                                        <span className="text-[10px] font-normal text-slate-300">Click to insert</span>
                                    </div>
                                    <div className="mt-2 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                                        {EMOJI_CATEGORIES.map((cat) => (
                                            <div key={cat.name}>
                                                <p className="text-[10px] font-semibold text-slate-400 mb-1">{cat.name}</p>
                                                <div className="grid grid-cols-5 gap-1">
                                                    {cat.list.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            type="button"
                                                            onClick={() => handleEmojiClick(emoji)}
                                                            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg transition active:scale-90 cursor-pointer"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input & Mentions */}
                        <div className="relative flex-1 min-w-0">
                            <textarea
                                ref={inputRef}
                                placeholder="Write a message... Type @ to mention"
                                value={inputText}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                className="w-full bg-transparent text-xs sm:text-sm outline-none text-slate-800 placeholder-slate-400 resize-none py-1.5 max-h-32 min-h-[32px] leading-relaxed block select-text cursor-text"
                            />

                            {showMentionPopup && filteredMentionUsers.length > 0 && (
                                <div className="absolute bottom-full left-0 mb-3 w-72 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-indigo-600">
                                            <AtSign className="w-3 h-3" /> Mention Member
                                        </span>
                                        <span>{filteredMentionUsers.length}</span>
                                    </div>
                                    <div className="p-1">
                                        {filteredMentionUsers.map((u, idx) => (
                                            <button
                                                key={u._id}
                                                type="button"
                                                onClick={() => handleSelectMention(u)}
                                                onMouseEnter={() => setSelectedMentionIndex(idx)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer ${selectedMentionIndex === idx
                                                        ? "bg-indigo-50 text-indigo-600 font-semibold"
                                                        : "text-slate-700 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {getInitials(u.fullName)}
                                                </div>
                                                <span className="truncate flex-1">{u.fullName}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Audio Indicator or Mic Button */}
                        {audioBlob ? (
                            <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl shrink-0 font-medium">
                                <span>Audio attached</span>
                                <button
                                    type="button"
                                    onClick={() => setAudioBlob(null)}
                                    className="text-emerald-500 hover:text-rose-500 p-0.5 transition cursor-pointer"
                                    title="Remove audio"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            !inputText.trim() &&
                            attachments.length === 0 && (
                                <button
                                    type="button"
                                    onClick={startRecording}
                                    className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200/50 p-2 rounded-xl transition shrink-0 cursor-pointer"
                                    title="Record voice note"
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            )
                        )}

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={sending || (!inputText.trim() && attachments.length === 0 && !audioBlob)}
                            className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:hover:bg-indigo-600 disabled:active:scale-100 text-white rounded-xl flex items-center justify-center transition disabled:opacity-30 shrink-0 shadow-xs cursor-pointer"
                            title="Send message"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </footer>

            {/* Delete Message Confirmation Modal */}
            {deleteMessageModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">Delete Message?</h4>
                                <p className="text-[11px] text-slate-400">This action cannot be undone</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-5">
                            Are you sure you want to delete this message? It will be permanently removed for everyone in this channel.
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={closeDeleteMessageModal}
                                disabled={deleteMessageModal.isDeleting}
                                className="flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteMessage}
                                disabled={deleteMessageModal.isDeleting}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {deleteMessageModal.isDeleting ? (
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
        </main>
    );
}