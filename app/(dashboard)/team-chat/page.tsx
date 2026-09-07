// app/(dashboard)/team-chat/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatDetailsSidebar from "@/components/chat/ChatDetailsSidebar";
import CreateRoomModal from "@/components/chat/CreateRoomModal";
import { Plus, Loader2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function TeamChatPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { socket, isConnected, joinChannel, leaveChannel, markAsRead } = useSocket();

    const [selectedChannelId, setSelectedChannelId] = useState<string>("");
    const [selectedChannelName, setSelectedChannelName] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [loadingChannels, setLoadingChannels] = useState(true);
    const [channelMembers, setChannelMembers] = useState<any[]>([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // ============================================================
    // FETCH CHANNELS
    // ============================================================
    const fetchChannels = useCallback(async () => {
        try {
            setLoadingChannels(true);
            setError(null);

            const response = await api.get("/channels");

            if (response.data.success) {
                const channelData = response.data.data || [];
                setChannels(channelData);

                if (channelData.length > 0 && !selectedChannelId) {
                    const firstChannel = channelData[0];
                    const displayName =
                        firstChannel.type === "direct"
                            ? firstChannel.members?.find((m: any) => m.userId?._id !== user?._id)?.userId?.fullName || "Direct"
                            : firstChannel.name;

                    setSelectedChannelId(firstChannel._id);
                    setSelectedChannelName(displayName);
                    joinChannel(firstChannel._id);
                    markAsRead(firstChannel._id);
                    fetchChannelMembers(firstChannel._id);
                }
            } else {
                toast.error(response.data.message || "Failed to load channels");
            }
        } catch (err: any) {
            console.error("Error fetching channels:", err);
            const errorMessage = err.response?.data?.message || err.message || "Failed to load channels";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoadingChannels(false);
        }
    }, [selectedChannelId, joinChannel, markAsRead, user?._id]);

    // ============================================================
    // FETCH CHANNEL MEMBERS
    // ============================================================
    const fetchChannelMembers = useCallback(async (channelId: string) => {
        if (!channelId) return;
        try {
            const response = await api.get(`/channels/${channelId}/members`);
            if (response.data.success) {
                setChannelMembers(response.data.data?.members || []);
                setOnlineCount(response.data.data?.online || 0);
            }
        } catch (err) {
            console.error("Error fetching channel members:", err);
        }
    }, []);

    // ============================================================
    // CREATE CHANNEL / ROOM
    // ============================================================
    const handleCreateRoom = async (roomData: {
        name: string;
        type: "channel" | "project" | "direct";
        description?: string;
        members: string[];
        projectId?: string;
    }) => {
        try {
            console.log("📤 [TeamChat] Creating room with data:", roomData);

            if (!roomData.name || roomData.name.trim() === "") {
                toast.error("Channel name is required");
                return;
            }

            const payload: any = {
                name: roomData.name.trim(),
                type: roomData.type || "channel",
                description: roomData.description || "",
                members: roomData.members || [],
            };

            if (roomData.type === "project" && roomData.projectId) {
                payload.projectId = roomData.projectId;
            }

            console.log("📤 [TeamChat] Sending payload:", payload);

            const response = await api.post("/channels", payload);

            console.log("📥 [TeamChat] Response:", response.data);

            if (response.data.success) {
                toast.success(
                    roomData.type === "project" 
                        ? "Project channel created successfully!" 
                        : "Channel created successfully!"
                );
                setIsModalOpen(false);

                const newChannel = response.data.data;
                if (newChannel?._id) {
                    setChannels((prev) => {
                        if (prev.some((c) => c._id === newChannel._id)) return prev;
                        return [newChannel, ...prev];
                    });

                    const displayName =
                        newChannel.type === "direct"
                            ? newChannel.members?.find((m: any) => m.userId?._id !== user?._id)?.userId?.fullName || "Direct"
                            : newChannel.name;

                    setSelectedChannelId(newChannel._id);
                    setSelectedChannelName(displayName);
                    joinChannel(newChannel._id);
                    markAsRead(newChannel._id);
                    fetchChannelMembers(newChannel._id);
                }
                return response.data;
            } else {
                throw new Error(response.data.message || "Failed to create channel");
            }
        } catch (err: any) {
            console.error("❌ [TeamChat] Error creating channel:", err);
            
            let errorMessage = "Failed to create channel";
            
            if (err.response) {
                console.error("❌ [TeamChat] Response data:", err.response.data);
                console.error("❌ [TeamChat] Response status:", err.response.status);
                errorMessage = err.response.data?.message || 
                              err.response.data?.error || 
                              `Server error: ${err.response.status}`;
            } else if (err.request) {
                console.error("❌ [TeamChat] No response received:", err.request);
                errorMessage = "No response from server. Please check your connection.";
            } else {
                console.error("❌ [TeamChat] Request setup error:", err.message);
                errorMessage = err.message;
            }

            toast.error(errorMessage);
            throw err;
        }
    };

    // ============================================================
    // HANDLE SELECT CHANNEL
    // ============================================================
    const handleSelectChannel = (id: string, name: string) => {
        if (selectedChannelId && selectedChannelId !== id) {
            leaveChannel(selectedChannelId);
        }

        setSelectedChannelId(id);
        setSelectedChannelName(name);

        if (id) {
            joinChannel(id);
            markAsRead(id);
            fetchChannelMembers(id);

            setChannels((prev) =>
                prev.map((ch) => (ch._id === id ? { ...ch, unreadCount: 0 } : ch))
            );
        }
    };

    // ============================================================
    // HANDLE PINNED UPDATED - Refresh sidebar
    // ============================================================
    const handlePinnedUpdated = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    // ============================================================
    // SOCKET LISTENERS
    // ============================================================
    useEffect(() => {
        if (!socket) return;

        const handleGlobalNewMessage = (data: { channelId: string; message: any }) => {
            setChannels((prev) => {
                const updated = prev.map((ch) => {
                    if (ch._id === data.channelId) {
                        return {
                            ...ch,
                            lastMessage: {
                                content: data.message.content || (data.message.attachments?.length ? "Attachment" : ""),
                                createdAt: data.message.createdAt,
                                senderId: {
                                    fullName: data.message.senderId?.fullName || "Unknown",
                                },
                            },
                            unreadCount:
                                ch._id === selectedChannelId ? 0 : (ch.unreadCount || 0) + 1,
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return ch;
                });

                return [...updated].sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.lastMessage?.createdAt || 0).getTime();
                    const dateB = new Date(b.updatedAt || b.lastMessage?.createdAt || 0).getTime();
                    return dateB - dateA;
                });
            });
        };

        const handleChannelAdded = (data: { channelId: string; channel: any }) => {
            if (data.channel) {
                setChannels((prev) => {
                    if (prev.some((c) => c._id === data.channel._id)) return prev;
                    return [data.channel, ...prev];
                });
                joinChannel(data.channel._id);
                toast.success(`Added to channel: ${data.channel.name}`);
            }
        };

        const handleChannelCreated = (data: any) => {
            if (data.channel) {
                setChannels((prev) => {
                    if (prev.some((c) => c._id === data.channel._id)) return prev;
                    return [data.channel, ...prev];
                });
                toast.success(`New channel created: ${data.channel.name}`);
            }
        };

        const handleChannelUpdated = (data: any) => {
            setChannels((prev) =>
                prev.map((ch) =>
                    ch._id === data.channelId ? { ...ch, ...data.updates } : ch
                )
            );
        };

        const handleChannelDeleted = (data: any) => {
            setChannels((prev) => prev.filter((ch) => ch._id !== data.channelId));
            if (selectedChannelId === data.channelId) {
                setSelectedChannelId("");
                setSelectedChannelName("");
            }
            toast.success(`Channel "${data.channelName}" was deleted`);
        };

        const handleMembersUpdated = (data: any) => {
            if (data.channelId === selectedChannelId) {
                setChannelMembers((prev) => [...prev, ...data.newMembers]);
                setOnlineCount((prev) => prev + data.newMembers.length);
            }
        };

        const handleMemberRemoved = (data: any) => {
            if (data.channelId === selectedChannelId) {
                setChannelMembers((prev) => prev.filter((m) => m.userId?._id !== data.userId));
                setOnlineCount((prev) => Math.max(0, prev - 1));
            }
        };

        socket.on("message:new", handleGlobalNewMessage);
        socket.on("channel:added", handleChannelAdded);
        socket.on("channel:created", handleChannelCreated);
        socket.on("channel:updated", handleChannelUpdated);
        socket.on("channel:deleted", handleChannelDeleted);
        socket.on("channel:members_updated", handleMembersUpdated);
        socket.on("channel:member_removed", handleMemberRemoved);

        return () => {
            socket.off("message:new", handleGlobalNewMessage);
            socket.off("channel:added", handleChannelAdded);
            socket.off("channel:created", handleChannelCreated);
            socket.off("channel:updated", handleChannelUpdated);
            socket.off("channel:deleted", handleChannelDeleted);
            socket.off("channel:members_updated", handleMembersUpdated);
            socket.off("channel:member_removed", handleMemberRemoved);
        };
    }, [socket, selectedChannelId, joinChannel]);

    // Initial Load
    useEffect(() => {
        if (isAuthenticated) {
            fetchChannels();
        }
    }, [isAuthenticated, fetchChannels]);

    // Loading Screen
    if (isLoading || loadingChannels) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-gray-400 text-sm">Loading chat...</p>
                </div>
            </div>
        );
    }

    // Not Authenticated
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Please Login</h2>
                    <p className="text-gray-400">You need to be logged in to access the chat</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full min-w-0 bg-white select-none overflow-hidden">
            {/* Top Header */}
            <header className="h-14 border-b border-slate-200 px-6 flex items-center justify-between shrink-0 bg-white z-10">
                <div className="flex items-center gap-3">
                    <h1 className="text-base font-bold text-slate-900 tracking-tight">Team Chat</h1>
                    <div
                        className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                    />
                    {isConnected && (
                        <span className="text-[8px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                            Live
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Room</span>
                </button>
            </header>

            {/* Main Chat Layout */}
            <div className="grid grid-cols-12 flex-1 w-full min-h-0 overflow-hidden">
                {/* Left Sidebar */}
                <div className="col-span-3 h-full min-h-0 overflow-hidden border-r border-slate-200">
                    <ChatSidebar
                        selectedChannelId={selectedChannelId}
                        onSelectChannel={handleSelectChannel}
                        channels={channels}
                        loading={loadingChannels}
                        onOpenCreateModal={() => setIsModalOpen(true)}
                    />
                </div>

                {/* Center Messages */}
                <div className="col-span-7 h-full min-h-0 overflow-hidden">
                    {selectedChannelId ? (
                        <ChatMessages
                            channelId={selectedChannelId}
                            channelName={selectedChannelName || "general"}
                            members={channelMembers}
                            onlineCount={onlineCount}
                            onToggleDetails={() => {}}
                            onPinnedUpdated={handlePinnedUpdated}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                            <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
                            <span>Select or create a channel to start messaging</span>
                        </div>
                    )}
                </div>

                {/* Right Details */}
                <div className="col-span-2 h-full min-h-0 overflow-hidden border-l border-slate-200">
                    <ChatDetailsSidebar
                        key={refreshKey}
                        channelId={selectedChannelId}
                        members={channelMembers}
                        onlineCount={onlineCount}
                        onClose={() => {}}
                        onChannelUpdated={fetchChannels}
                    />
                </div>
            </div>

            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreateRoom={handleCreateRoom}
            />
        </div>
    );
}