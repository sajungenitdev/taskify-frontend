"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Search,
    Pin,
    Laptop,
    Check,
    SendHorizontal,
    Smile,
    Paperclip,
    Mic,
    Play,
    Pause,
    MoreVertical,
    Reply,
    Edit,
    Trash2,
    X,
    Loader2,
    CheckCheck,
    AtSign,
    File,
    Copy,
    MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { format } from "date-fns";

interface Message {
    _id: string;
    content: string;
    type: "text" | "voice" | "file" | "system";
    senderId: {
        _id: string;
        fullName: string;
        email: string;
        avatar?: string;
    };
    attachments?: Array<{
        name: string;
        url: string;
        size: number;
        mimeType: string;
        type: "image" | "file" | "voice";
    }>;
    linkedTask?: {
        taskId: string;
        title: string;
        status: string;
        priority: string;
        progress: number;
        assignedTo: {
            _id: string;
            fullName: string;
        };
    };
    mentions?: Array<{
        userId: string;
        name: string;
    }>;
    replyTo?: {
        _id: string;
        content: string;
        senderId: {
            _id: string;
            fullName: string;
        };
    };
    reactions: Array<{
        emoji: string;
        userId: string;
    }>;
    readBy: Array<{
        userId: string;
        readAt: string;
    }>;
    createdAt: string;
    isEdited: boolean;
    isDeleted: boolean;
    channelId: string;
}

interface ChatMessagesProps {
    channelId: string;
    channelName: string;
    members?: any[];
    onlineCount?: number;
    onToggleDetails?: () => void;
    onPinnedUpdated?: () => void;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🎉", "🔥", "👏", "💯"];

export default function ChatMessages({
    channelId,
    channelName = "general",
    members = [],
    onlineCount = 0,
    onToggleDetails,
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
        startTyping,
        stopTyping,
        markAsRead,
        joinChannel
    } = useSocket();

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
    const [showMessageActions, setShowMessageActions] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [debugInfo, setDebugInfo] = useState<string>("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ============================================================
    // 1. FETCH MESSAGES ON CHANNEL CHANGE
    // ============================================================
    const fetchMessages = useCallback(async () => {
        if (!channelId) return;
        try {
            setLoading(true);
            const cleanId = channelId.toString();
            console.log(`📥 [ChatMessages] Fetching messages for channel: ${cleanId}`);

            const response = await api.get(`/messages/channel/${cleanId}?limit=50`);
            if (response.data.success) {
                console.log(`📥 [ChatMessages] Loaded ${response.data.data?.length || 0} messages`);
                setMessages(response.data.data || []);
                markAsRead(cleanId);
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("❌ [ChatMessages] Error fetching messages:", error);
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
        }
    }, [channelId, markAsRead]);

    useEffect(() => {
        if (channelId) {
            fetchMessages();
        }
    }, [channelId, fetchMessages]);

    // ============================================================
    // 2. 🔥 FIXED: SOCKET LISTENERS USING onMessage FROM CONTEXT
    // ============================================================
    useEffect(() => {
        if (!socket || !channelId) {
            console.log("⚠️ [ChatMessages] No socket or channelId, skipping listeners");
            return;
        }

        const cleanChannelId = channelId.toString();
        console.log(`========================================`);
        console.log(`📡 [ChatMessages] Setting up listeners for channel: ${cleanChannelId}`);
        console.log(`🔌 [ChatMessages] Socket connected: ${isConnected}`);
        console.log(`👤 [ChatMessages] User: ${user?.fullName || 'Unknown'}`);
        console.log(`========================================`);

        // Join the channel room
        joinChannel(cleanChannelId);
        socket.emit("channel:join", { channelId: cleanChannelId });

        // ============================================================
        // 🔥 FIX: Use onMessage from context (returns unsubscribe function)
        // ============================================================
        const unsubscribeMessage = onMessage((data) => {
            console.log(`========================================`);
            console.log(`📩 [ChatMessages] 🔔 MESSAGE RECEIVED via onMessage!`);
            console.log(`📩 [ChatMessages] Channel ID: ${data.channelId}`);
            console.log(`📩 [ChatMessages] Expected: ${cleanChannelId}`);
            console.log(`📩 [ChatMessages] Message content: ${data.message?.content}`);
            console.log(`📩 [ChatMessages] Sender: ${data.message?.senderId?.fullName}`);
            console.log(`📩 [ChatMessages] Message ID: ${data.message?._id}`);
            console.log(`========================================`);

            const incomingChannelId = data.channelId?.toString();

            if (incomingChannelId === cleanChannelId) {
                setMessages((prev:any) => {
                    const incomingMsgId = data.message?._id?.toString();
                    // Check for duplicates
                    if (prev.some((m:any) => m._id?.toString() === incomingMsgId)) {
                        console.log(`⚠️ [ChatMessages] Duplicate message detected, skipping: ${incomingMsgId}`);
                        return prev;
                    }
                    console.log(`✅ [ChatMessages] Adding message to state: ${data.message?.content}`);
                    return [...prev, data.message];
                });

                markAsRead(cleanChannelId);
                setTimeout(scrollToBottom, 50);
            } else {
                console.warn(`⚠️ [ChatMessages] Channel mismatch! Got: ${incomingChannelId}, Expected: ${cleanChannelId}`);
            }
        });

        // ============================================================
        // 🔥 FIX: Use onTyping from context
        // ============================================================
        const unsubscribeTyping = onTyping((data) => {
            const incChanId = data.channelId?.toString();
            const incUserId = data.userId?.toString();
            const myUserId = user?._id?.toString();

            if (incChanId === cleanChannelId && incUserId !== myUserId) {
                if (data.type === "start") {
                    console.log(`⌨️ [ChatMessages] ${data.userName} started typing`);
                    setTypingUsers((prev:any) => {
                        if (prev.some((u:any) => u.userId === incUserId)) return prev;
                        return [...prev, { userId: incUserId, name: data.userName || "Someone" }];
                    });
                } else {
                    console.log(`⌨️ [ChatMessages] ${data.userName} stopped typing`);
                    setTypingUsers((prev:any) => prev.filter((u:any) => u.userId !== incUserId));
                }
            }
        });

        // ============================================================
        // 🔥 FIX: Use onReaction from context
        // ============================================================
        const unsubscribeReaction = onReaction((data) => {
            console.log(`😊 [ChatMessages] Reaction update for message: ${data.messageId}`);
            if (data.channelId?.toString() === cleanChannelId) {
                setMessages((prev:any) =>
                    prev.map((m:any) =>
                        m._id?.toString() === data.messageId?.toString()
                            ? { ...m, reactions: data.reactions }
                            : m
                    )
                );
            }
        });

        // ============================================================
        // 🔥 FIX: Use onMessageDeleted from context
        // ============================================================
        const unsubscribeDeleted = onMessageDeleted((data) => {
            console.log(`🗑️ [ChatMessages] Message deleted: ${data.messageId}`);
            if (data.channelId?.toString() === cleanChannelId) {
                setMessages((prev:any) =>
                    prev.map((m:any) =>
                        m._id?.toString() === data.messageId?.toString()
                            ? { ...m, isDeleted: true }
                            : m
                    )
                );
            }
        });

        // ============================================================
        // 🔥 FIX: Use onMessageUpdated from context
        // ============================================================
        const unsubscribeUpdated = onMessageUpdated((data) => {
            console.log(`✏️ [ChatMessages] Message updated: ${data.message?._id}`);
            if (data.channelId?.toString() === cleanChannelId) {
                setMessages((prev:any) =>
                    prev.map((m:any) =>
                        m._id?.toString() === data.message?._id?.toString()
                            ? { ...m, content: data.message.content, isEdited: true }
                            : m
                    )
                );
            }
        });

        // ============================================================
        // CLEANUP: Unsubscribe all listeners
        // ============================================================
        return () => {
            console.log(`========================================`);
            console.log(`🧹 [ChatMessages] Cleaning up listeners for channel: ${cleanChannelId}`);
            console.log(`========================================`);

            unsubscribeMessage?.();
            unsubscribeTyping?.();
            unsubscribeReaction?.();
            unsubscribeDeleted?.();
            unsubscribeUpdated?.();

            socket.emit("channel:leave", { channelId: cleanChannelId });
        };
    }, [socket, channelId, user?._id, isConnected, joinChannel, markAsRead, onMessage, onTyping, onReaction, onMessageDeleted, onMessageUpdated]);

    // ============================================================
    // 3. DEBUG: Log when messages state changes
    // ============================================================
    useEffect(() => {
        console.log(`📊 [ChatMessages] Messages state updated: ${messages.length} messages`);
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            console.log(`📊 [ChatMessages] Last message: ${lastMsg?.content} from ${lastMsg?.senderId?.fullName}`);
        }
    }, [messages]);

    // ============================================================
    // 4. SEND MESSAGE
    // ============================================================
    const handleSendMessage = async () => {
        if (!inputText.trim() && attachments.length === 0 && !audioBlob) return;
        if (!channelId) {
            toast.error("No channel selected");
            return;
        }

        console.log(`📤 [ChatMessages] Sending message: "${inputText}" to channel: ${channelId}`);

        setSending(true);
        try {
            const cleanChannelId = channelId.toString();
            let response;

            if (attachments.length === 0 && !audioBlob) {
                response = await api.post(`/messages/channel/${cleanChannelId}`, {
                    content: inputText.trim(),
                    replyTo: replyingTo?._id || null,
                });
            } else {
                const formData = new FormData();
                formData.append("content", inputText.trim());
                if (replyingTo) formData.append("replyTo", replyingTo._id);

                attachments.forEach((file) => formData.append("attachments", file));

                if (audioBlob) {
                    const audioFile = new globalThis.File([audioBlob], `voice-${Date.now()}.webm`, {
                        type: "audio/webm",
                    });
                    formData.append("attachments", audioFile);
                }

                response = await api.post(`/messages/channel/${cleanChannelId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            if (response.data.success) {
                const newMessage = response.data.data;
                console.log(`✅ [ChatMessages] Message sent successfully:`, newMessage);

                // Optimistically add to sender UI
                setMessages((prev:any) => {
                    if (prev.some((m:any) => m._id?.toString() === newMessage._id?.toString())) return prev;
                    return [...prev, newMessage];
                });

                setInputText("");
                setAttachments([]);
                setAudioBlob(null);
                setReplyingTo(null);
                stopTyping(cleanChannelId);
                setTimeout(scrollToBottom, 50);
            }
        } catch (error: any) {
            console.error("❌ [ChatMessages] Error sending message:", error);
            toast.error(error.response?.data?.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        if (!channelId) return;

        if (e.target.value.trim()) {
            startTyping(channelId.toString());
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(channelId.toString());
            }, 2000);
        } else {
            stopTyping(channelId.toString());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        try {
            const response = await api.post(`/messages/${messageId}/reaction`, { emoji });
            if (response.data.success) {
                setMessages((prev:any) =>
                    prev.map((m:any) =>
                        m._id?.toString() === messageId ? { ...m, reactions: response.data.data } : m
                    )
                );
            }
        } catch (error) {
            console.error("Reaction error:", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            const res = await api.delete(`/messages/${messageId}`);
            if (res.data.success) {
                setMessages((prev:any) =>
                    prev.map((m:any) =>
                        m._id?.toString() === messageId ? { ...m, isDeleted: true } : m
                    )
                );
            }
        } catch (error) {
            toast.error("Failed to delete message");
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            setRecordingTime(0);

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
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
        } catch (error) {
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments((prev:any) => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || "?";
    const formatTime = (date: string) => format(new Date(date), "h:mm a");
    const formatDate = (date: string) => {
        const today = new Date();
        const msgDate = new Date(date);
        if (msgDate.toDateString() === today.toDateString()) return "Today";
        return format(msgDate, "MMM d, yyyy");
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <main className="w-full h-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-slate-200 px-4 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 hover:bg-slate-50 px-2 py-1 rounded-lg transition">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                            <Laptop className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 text-left">
                            <h2 className="text-sm font-bold text-slate-800 truncate"># {channelName}</h2>
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-2">
                                <span>{members.length} members · {onlineCount} online</span>
                                {isConnected ? (
                                    <span className="text-emerald-500">● Connected</span>
                                ) : (
                                    <span className="text-red-500">● Disconnected</span>
                                )}
                                {typingUsers.length > 0 && (
                                    <span className="text-indigo-600 font-medium animate-pulse">
                                        {typingUsers.map((u:any) => u.name).join(", ")} typing...
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-600">No messages yet</p>
                        <p className="text-xs text-slate-400">Send a message to start chatting</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwn = message.senderId?._id?.toString() === user?._id?.toString();
                        const showDate =
                            index === 0 ||
                            new Date(message.createdAt).toDateString() !==
                            new Date(messages[index - 1]?.createdAt).toDateString();

                        return (
                            <div key={message._id || index}>
                                {showDate && (
                                    <div className="flex items-center gap-3 my-3">
                                        <div className="flex-1 h-px bg-slate-200" />
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {formatDate(message.createdAt)}
                                        </span>
                                        <div className="flex-1 h-px bg-slate-200" />
                                    </div>
                                )}

                                <div className={`flex items-start gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        <div
                                            className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center ${isOwn ? "bg-indigo-600" : "bg-rose-500"
                                                }`}
                                        >
                                            {getInitials(isOwn ? "You" : message.senderId?.fullName || "User")}
                                        </div>
                                    </div>

                                    <div className={`max-w-[75%] ${isOwn ? "flex flex-col items-end" : ""}`}>
                                        {!isOwn && (
                                            <div className="text-[11px] text-slate-500 mb-0.5 flex items-center gap-1.5">
                                                <span className="font-medium">{message.senderId?.fullName || "Unknown"}</span>
                                                <span className="text-[9px] text-slate-400">{formatTime(message.createdAt)}</span>
                                            </div>
                                        )}

                                        <div className="relative group">
                                            {message.isDeleted ? (
                                                <div className="bg-slate-100 text-slate-400 rounded-lg px-3 py-1.5 text-sm italic">
                                                    Message deleted
                                                </div>
                                            ) : (
                                                <>
                                                    {message.replyTo && (
                                                        <div
                                                            className={`${isOwn ? "bg-indigo-500/30" : "bg-slate-100"
                                                                } rounded-t-lg px-3 py-1 text-xs border-l-2 border-indigo-500`}
                                                        >
                                                            <span className="text-indigo-600 font-medium">
                                                                {message.replyTo.senderId?.fullName || "Unknown"}
                                                            </span>
                                                            <p className="text-slate-500 truncate">{message.replyTo.content}</p>
                                                        </div>
                                                    )}

                                                    <div
                                                        className={`rounded-2xl px-3.5 py-2 ${isOwn
                                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
                                                            }`}
                                                    >
                                                        {message.content && (
                                                            <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                                                                {message.content}
                                                            </div>
                                                        )}

                                                        {message.attachments && message.attachments.length > 0 && (
                                                            <div className="mt-2 space-y-1.5">
                                                                {message.attachments.map((att, idx) => (
                                                                    <a
                                                                        key={idx}
                                                                        href={att.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`flex items-center gap-2 p-2 rounded-lg ${isOwn ? "bg-indigo-700" : "bg-slate-100"
                                                                            }`}
                                                                    >
                                                                        <File className="w-4 h-4" />
                                                                        <span className="text-sm truncate">{att.name}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div
                                                        className={`absolute top-0 ${isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"
                                                            } opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5 bg-white rounded-lg shadow-lg border border-slate-200 p-0.5`}
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(message);
                                                                inputRef.current?.focus();
                                                            }}
                                                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                                        >
                                                            <Reply className="w-3.5 h-3.5" />
                                                        </button>
                                                        {EMOJI_OPTIONS.slice(0, 3).map((emoji) => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => handleReaction(message._id, emoji)}
                                                                className="p-1 hover:bg-slate-100 rounded text-sm"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                        {isOwn && (
                                                            <button
                                                                onClick={() => handleDeleteMessage(message._id)}
                                                                className="p-1 hover:bg-slate-100 rounded text-red-500"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {message.reactions && message.reactions.length > 0 && (
                                                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                                                            {Object.entries(
                                                                message.reactions.reduce((acc, r) => {
                                                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                    return acc;
                                                                }, {} as Record<string, number>)
                                                            ).map(([emoji, count]) => (
                                                                <span
                                                                    key={emoji}
                                                                    className="text-xs bg-white border border-slate-200 rounded-full px-1.5 py-0.5"
                                                                >
                                                                    {emoji} {count > 1 && count}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <footer className="p-3 border-t border-slate-200 bg-white shrink-0">
                {replyingTo && (
                    <div className="bg-slate-50 rounded-lg p-2 mb-2 flex items-center justify-between border border-slate-200">
                        <span className="text-xs text-slate-600 truncate">
                            Replying to <strong>{replyingTo.senderId?.fullName || "User"}</strong>
                        </span>
                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-slate-200 rounded">
                            <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 focus-within:bg-white focus-within:border-indigo-500 transition">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-slate-400 hover:text-slate-600 p-1"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <textarea
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="flex-1 bg-transparent text-sm outline-none text-slate-800 placeholder-slate-400 resize-none min-h-[36px] max-h-32"
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={sending || (!inputText.trim() && attachments.length === 0 && !audioBlob)}
                        className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-40"
                    >
                        {sending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <SendHorizontal className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </footer>
        </main>
    );
}