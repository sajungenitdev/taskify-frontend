// app/(dashboard)/team-chat/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import ChatSidebar, { ChannelItem } from "@/components/chat/ChatSidebar";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatDetailsSidebar from "@/components/chat/ChatDetailsSidebar";
import CreateRoomModal from "@/components/chat/CreateRoomModal";
import { Plus, Loader2, MessageSquare, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function TeamChatPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { socket, isConnected, joinChannel, leaveChannel, markAsRead } = useSocket();

    // Channel Selection States
    const [selectedChannelId, setSelectedChannelId] = useState<string>("");
    const [selectedChannelName, setSelectedChannelName] = useState<string>("");
    const [selectedChannelAvatar, setSelectedChannelAvatar] = useState<string | undefined>(undefined);
    const [channels, setChannels] = useState<ChannelItem[]>([]);
    const [loadingChannels, setLoadingChannels] = useState<boolean>(true);
    const [channelMembers, setChannelMembers] = useState<any[]>([]);
    const [onlineCount, setOnlineCount] = useState<number>(0);

    // UI Panels State
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [showDetailsSidebar, setShowDetailsSidebar] = useState<boolean>(true);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [hasLeftChannel, setHasLeftChannel] = useState<boolean>(false);

    // ============================================================
    // CHANNEL DISPLAY & AVATAR RESOLUTION
    // ============================================================

    const getChannelDisplayName = useCallback(
        (channel: ChannelItem): string => {
            if (channel.type === "direct") {
                const partner = channel.members?.find((m) => {
                    const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                    return uid?.toString() !== user?._id?.toString();
                });
                const partnerObj = typeof partner?.userId === "object" ? partner.userId : null;
                return partnerObj?.fullName || "Direct Message";
            }
            return channel.name || "channel";
        },
        [user?._id]
    );

    const getChannelAvatar = useCallback(
        (channel: ChannelItem): string | undefined => {
            if (channel.type === "direct") {
                const partner = channel.members?.find((m) => {
                    const uid = typeof m.userId === "string" ? m.userId : m.userId?._id;
                    return uid?.toString() !== user?._id?.toString();
                });
                const partnerObj = typeof partner?.userId === "object" ? partner.userId : null;
                return partnerObj?.avatar;
            }
            return channel.avatar;
        },
        [user?._id]
    );

    const fetchChannelMembers = useCallback(async (channelId: string) => {
        if (!channelId) return;
        try {
            const response = await api.get(`/channels/${channelId}/members`);
            if (response.data?.success) {
                const membersList = response.data.data?.members || [];
                const liveOnline = response.data.data?.online ?? 0;
                setChannelMembers(membersList);
                setOnlineCount(liveOnline > 0 ? liveOnline : 1);
            }
        } catch (err) {
            console.error("Failed to fetch channel members:", err);
        }
    }, []);

    const fetchChannels = useCallback(async () => {
        try {
            setLoadingChannels(true);
            const response = await api.get("/channels");

            if (response.data?.success) {
                const channelData: ChannelItem[] = response.data.data || [];
                setChannels(channelData);

                if (channelData.length > 0 && !selectedChannelId && !hasLeftChannel) {
                    const firstChannel = channelData[0];
                    const displayName = getChannelDisplayName(firstChannel);
                    const displayAvatar = getChannelAvatar(firstChannel);

                    setSelectedChannelId(firstChannel._id);
                    setSelectedChannelName(displayName);
                    setSelectedChannelAvatar(displayAvatar);
                    joinChannel(firstChannel._id);
                    markAsRead(firstChannel._id);
                    fetchChannelMembers(firstChannel._id);
                }
            } else {
                toast.error(response.data.message || "Failed to load channels");
            }
        } catch (err: any) {
            console.error("Error loading channels:", err);
            toast.error(err.response?.data?.message || "Failed to load conversations");
        } finally {
            setLoadingChannels(false);
        }
    }, [
        selectedChannelId,
        hasLeftChannel,
        getChannelDisplayName,
        getChannelAvatar,
        joinChannel,
        markAsRead,
        fetchChannelMembers,
    ]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchChannels();
        }
    }, [isAuthenticated, fetchChannels]);

    // ============================================================
    // CHANNEL CREATION
    // ============================================================

    const handleCreateRoom = async (roomData: {
        name: string;
        type: "channel" | "project" | "direct";
        description?: string;
        members: string[];
        projectId?: string;
    }) => {
        if (!roomData.name || !roomData.name.trim()) {
            toast.error("Channel name is required");
            return;
        }

        try {
            const payload: any = {
                name: roomData.name.trim(),
                type: roomData.type || "channel",
                description: roomData.description?.trim() || "",
                members: roomData.members || [],
            };

            if (roomData.type === "project" && roomData.projectId) {
                payload.projectId = roomData.projectId;
            }

            const response = await api.post("/channels", payload);

            if (response.data?.success) {
                const newChannel: ChannelItem = {
                    ...response.data.data,
                    type: response.data.data.type || roomData.type || "channel",
                };

                setIsModalOpen(false);

                if (newChannel?._id) {
                    setChannels((prev) => [newChannel, ...prev.filter((c) => c._id !== newChannel._id)]);

                    const displayName = getChannelDisplayName(newChannel);
                    const displayAvatar = getChannelAvatar(newChannel);

                    setHasLeftChannel(false);
                    setSelectedChannelId(newChannel._id);
                    setSelectedChannelName(displayName);
                    setSelectedChannelAvatar(displayAvatar);
                    joinChannel(newChannel._id);
                    markAsRead(newChannel._id);
                    fetchChannelMembers(newChannel._id);
                }
                return response.data;
            } else {
                throw new Error(response.data?.message || "Failed to create channel");
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || "Failed to create room";
            toast.error(msg);
            throw err;
        }
    };

    // ============================================================
    // CHANNEL SELECTION & NAVIGATION
    // ============================================================

    const handleSelectChannel = (id: string, name: string) => {
        if (!id || id === selectedChannelId) return;

        if (selectedChannelId) {
            leaveChannel(selectedChannelId);
        }

        const targetChannel = channels.find((c) => c._id === id);
        const avatar = targetChannel ? getChannelAvatar(targetChannel) : undefined;

        setHasLeftChannel(false);
        setSelectedChannelId(id);
        setSelectedChannelName(name);
        setSelectedChannelAvatar(avatar);

        joinChannel(id);
        markAsRead(id);
        fetchChannelMembers(id);

        setChannels((prev) =>
            prev.map((ch) => (ch._id === id ? { ...ch, unreadCount: 0 } : ch))
        );
    };

    const handleLeaveChannel = useCallback(() => {
        if (selectedChannelId) {
            leaveChannel(selectedChannelId);
        }

        setSelectedChannelId("");
        setSelectedChannelName("");
        setSelectedChannelAvatar(undefined);
        setChannelMembers([]);
        setOnlineCount(0);
        setHasLeftChannel(true);

        fetchChannels();
    }, [selectedChannelId, leaveChannel, fetchChannels]);

    // ============================================================
    // PINNED MESSAGE AUTO-SCROLL
    // ============================================================

    const handlePinnedMessageClick = useCallback(
        async (messageId: string) => {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);

            if (messageElement) {
                messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
                messageElement.classList.add("ring-2", "ring-indigo-500", "bg-indigo-50/70", "animate-pulse");
                setTimeout(() => {
                    messageElement.classList.remove("ring-2", "ring-indigo-500", "bg-indigo-50/70", "animate-pulse");
                }, 2500);
                return;
            }

            try {
                const loadingId = toast.loading("Locating message...");
                const response = await api.get(`/messages/${messageId}`).catch(() => null);

                if (response?.data?.success) {
                    const message = response.data.data;
                    toast.dismiss(loadingId);

                    if (message.channelId && message.channelId !== selectedChannelId) {
                        const channel = channels.find((c) => c._id === message.channelId);
                        if (channel) {
                            const displayName = getChannelDisplayName(channel);
                            handleSelectChannel(channel._id, displayName);
                        }
                    } else {
                        toast.error("Pinned message is further up in conversation history");
                    }
                } else {
                    toast.dismiss(loadingId);
                }
            } catch {
                toast.error("Could not fetch pinned message");
            }
        },
        [selectedChannelId, channels, getChannelDisplayName]
    );

    const handlePinnedUpdated = useCallback(() => {
        setRefreshKey((prev) => prev + 1);
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
                            unreadCount: ch._id === selectedChannelId ? 0 : (ch.unreadCount || 0) + 1,
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

        const handleChannelAdded = (data: { channelId: string; channel: ChannelItem }) => {
            if (data.channel) {
                setChannels((prev) => (prev.some((c) => c._id === data.channel._id) ? prev : [data.channel, ...prev]));
                joinChannel(data.channel._id);
            }
        };

        const handleChannelCreated = (data: { channel: ChannelItem }) => {
            if (data.channel) {
                setChannels((prev) => (prev.some((c) => c._id === data.channel._id) ? prev : [data.channel, ...prev]));
            }
        };

        const handleChannelUpdated = (data: { channelId: string; updates: Partial<ChannelItem> }) => {
            setChannels((prev) =>
                prev.map((ch) => (ch._id === data.channelId ? { ...ch, ...data.updates } : ch))
            );
            if (selectedChannelId === data.channelId) {
                if (data.updates.name) setSelectedChannelName(data.updates.name);
                if (data.updates.avatar !== undefined) setSelectedChannelAvatar(data.updates.avatar);
            }
        };

        const handleChannelDeleted = (data: { channelId: string; channelName?: string }) => {
            setChannels((prev) => prev.filter((ch) => ch._id !== data.channelId));
            if (selectedChannelId === data.channelId) {
                setSelectedChannelId("");
                setSelectedChannelName("");
                setSelectedChannelAvatar(undefined);
                setHasLeftChannel(true);
            }
        };

        const handleMembersUpdated = (data: { channelId: string; newMembers: any[]; online?: number }) => {
            if (data.channelId === selectedChannelId) {
                setChannelMembers((prev) => [...prev, ...data.newMembers]);
                if (typeof data.online === "number") {
                    setOnlineCount(data.online);
                } else {
                    setOnlineCount((prev) => prev + data.newMembers.length);
                }
            }
        };

        const handleMemberRemoved = (data: { channelId: string; userId: string }) => {
            if (data.channelId === selectedChannelId) {
                setChannelMembers((prev) => prev.filter((m) => m.userId?._id !== data.userId));
                setOnlineCount((prev) => Math.max(1, prev - 1));
            }
        };

        const handleUserOnlinePresence = (data: { userId: string; channelId?: string }) => {
            if (selectedChannelId && (!data.channelId || data.channelId === selectedChannelId)) {
                setOnlineCount((prev) => Math.max(1, prev + 1));
            }
        };

        const handleUserOfflinePresence = (data: { userId: string; channelId?: string }) => {
            if (selectedChannelId && (!data.channelId || data.channelId === selectedChannelId)) {
                setOnlineCount((prev) => Math.max(1, prev - 1));
            }
        };

        socket.on("message:new", handleGlobalNewMessage);
        socket.on("channel:added", handleChannelAdded);
        socket.on("channel:created", handleChannelCreated);
        socket.on("channel:updated", handleChannelUpdated);
        socket.on("channel:deleted", handleChannelDeleted);
        socket.on("channel:members_updated", handleMembersUpdated);
        socket.on("channel:member_removed", handleMemberRemoved);
        socket.on("user:online", handleUserOnlinePresence);
        socket.on("user:offline", handleUserOfflinePresence);

        return () => {
            socket.off("message:new", handleGlobalNewMessage);
            socket.off("channel:added", handleChannelAdded);
            socket.off("channel:created", handleChannelCreated);
            socket.off("channel:updated", handleChannelUpdated);
            socket.off("channel:deleted", handleChannelDeleted);
            socket.off("channel:members_updated", handleMembersUpdated);
            socket.off("channel:member_removed", handleMemberRemoved);
            socket.off("user:online", handleUserOnlinePresence);
            socket.off("user:offline", handleUserOfflinePresence);
        };
    }, [socket, selectedChannelId, joinChannel]);

    if (isLoading || loadingChannels) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-slate-400 text-xs font-medium">Connecting to workspace chat...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center p-8 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-sm">
                    <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <ShieldAlert className="w-7 h-7" />
                    </div>
                    <h2 className="text-base font-bold text-slate-800 mb-1">Session Required</h2>
                    <p className="text-xs text-slate-400">Please sign in with your workspace credentials to access team chat.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full min-w-0 bg-white overflow-hidden font-sans">
            {/* Top Header */}
            <header className="h-14 border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        #
                    </div>
                    <h1 className="text-sm font-bold text-slate-900 tracking-tight">Team Chating</h1>
                    <div className="flex items-center gap-1.5 ml-2 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full">
                        <span
                            className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                        />
                        <span className="text-[10px] text-slate-500 font-medium">
                            {isConnected ? "Connected" : "Reconnecting"}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="px-3 flex py-1.5 cursor-pointer text-xs font-medium rounded bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="ps-2">New Channel</span>
                </button>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-12 flex-1 w-full min-h-0 overflow-hidden bg-slate-50">
                {/* Left Sidebar */}
                <div className="col-span-3 h-full min-h-0 overflow-hidden border-r border-slate-200/80 bg-white">
                    <ChatSidebar
                        selectedChannelId={selectedChannelId}
                        onSelectChannel={handleSelectChannel}
                        channels={channels}
                        loading={loadingChannels}
                        onOpenCreateModal={() => setIsModalOpen(true)}
                    />
                </div>

                {/* Center Messages Panel */}
                <div
                    className={`${showDetailsSidebar ? "col-span-6 lg:col-span-6 xl:col-span-7" : "col-span-9"
                        } h-full min-h-0 overflow-hidden transition-all duration-300 bg-white`}
                >
                    {selectedChannelId ? (
                        <ChatMessages
                            channelId={selectedChannelId}
                            channelName={selectedChannelName || "general"}
                            channelAvatar={selectedChannelAvatar}
                            members={channelMembers}
                            onlineCount={onlineCount}
                            onToggleDetails={() => setShowDetailsSidebar((prev) => !prev)}
                            onPinnedUpdated={handlePinnedUpdated}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-slate-50/50 p-6 text-center">
                            <div className="flex flex-col items-center gap-4 max-w-sm">
                                <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                                    <MessageSquare className="w-8 h-8 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">No conversation selected</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Choose a channel or team member from the sidebar to view chat history and start collaborating.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-2xs flex items-center gap-2 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4 text-indigo-600" />
                                    Create a new channel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Details Panel */}
                {showDetailsSidebar && (
                    <div className="col-span-3 lg:col-span-3 xl:col-span-2 h-full min-h-0 overflow-hidden border-l border-slate-200/80 bg-white">
                        <ChatDetailsSidebar
                            key={refreshKey}
                            channelId={selectedChannelId}
                            members={channelMembers}
                            onlineCount={onlineCount}
                            onClose={() => setShowDetailsSidebar(false)}
                            onChannelUpdated={fetchChannels}
                            onPinnedMessageClick={handlePinnedMessageClick}
                            onPinnedUpdated={handlePinnedUpdated}
                            onLeaveChannel={handleLeaveChannel}
                        />
                    </div>
                )}
            </div>

            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreateRoom={handleCreateRoom}
            />
        </div>
    );
}