// contexts/SocketContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

// ============================================================
// TYPES
// ============================================================

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
}

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinChannel: (channelId: string) => void;
    leaveChannel: (channelId: string) => void;
    markAsRead: (channelId: string) => void;
    sendMessage: (channelId: string, data: any) => void;
    editMessage: (messageId: string, content: string) => void;
    deleteMessage: (messageId: string) => void;
    addReaction: (messageId: string, emoji: string) => void;
    startTyping: (channelId: string) => void;
    stopTyping: (channelId: string) => void;
    // These now return unsubscribe functions
    onMessage: (callback: (data: { channelId: string; message: Message }) => void) => () => void;
    onTyping: (callback: (data: { channelId: string; userId: string; userName: string; type?: string }) => void) => () => void;
    onReaction: (callback: (data: { channelId: string; messageId: string; reactions: any[] }) => void) => () => void;
    onMessageDeleted: (callback: (data: { channelId: string; messageId: string }) => void) => () => void;
    onMessageUpdated: (callback: (data: { channelId: string; message: Message }) => void) => () => void;
    onUserOnline: (callback: (data: { userId: string }) => void) => () => void;
    onUserOffline: (callback: (data: { userId: string }) => void) => () => void;
    // ✅ NEW: Add pinned update listener
    onPinnedUpdated: (callback: (data: { channelId: string; messageId: string; isPinned: boolean }) => void) => () => void;
    removeAllListeners: () => void;
}

// ============================================================
// CONTEXT
// ============================================================

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    joinChannel: () => { },
    leaveChannel: () => { },
    markAsRead: () => { },
    sendMessage: () => { },
    editMessage: () => { },
    deleteMessage: () => { },
    addReaction: () => { },
    startTyping: () => { },
    stopTyping: () => { },
    onMessage: () => () => { },
    onTyping: () => () => { },
    onReaction: () => () => { },
    onMessageDeleted: () => () => { },
    onMessageUpdated: () => () => { },
    onUserOnline: () => () => { },
    onUserOffline: () => () => { },
    onPinnedUpdated: () => () => { }, // ✅ NEW
    removeAllListeners: () => { },
});

export const useSocket = () => useContext(SocketContext);

// ============================================================
// PROVIDER
// ============================================================

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // ============================================================
    // 🔥 FIX: Use refs to store callbacks (prevents duplicate listeners)
    // ============================================================
    const messageCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const typingCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const reactionCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const messageDeletedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const messageUpdatedCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const userOnlineCallbacks = useRef<Set<(data: any) => void>>(new Set());
    const userOfflineCallbacks = useRef<Set<(data: any) => void>>(new Set());
    // ✅ NEW: Pinned updated callbacks
    const pinnedUpdatedCallbacks = useRef<Set<(data: any) => void>>(new Set());

    // ============================================================
    // SOCKET INITIALIZATION
    // ============================================================
    useEffect(() => {
        // console.log("🔄 [SOCKET] Initializing...", {
        //     hasToken: !!token,
        //     hasUser: !!user,
        //     tokenLength: token?.length || 0
        // });

        if (!token || !user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // Clean up existing socket
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://taskify-server-5gat.onrender.com";

        

        const socketInstance = io(SOCKET_URL, {
            auth: { token },
            query: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 30000,
            forceNew: true,
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        // ============================================================
        // SOCKET EVENT HANDLERS
        // ============================================================

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", (reason) => {
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {

            if (error.message?.includes("Authentication") || error.message?.includes("token")) {
                console.error("❌ [SOCKET] Authentication failed! Check your token.");
                console.error("❌ [SOCKET] Token exists:", !!token);
                console.error("❌ [SOCKET] Token preview:", token?.substring(0, 20));
            }
            setIsConnected(false);
        });

        socketInstance.on("reconnect", (attempt) => {
            setIsConnected(true);
        });

        socketInstance.on("reconnect_error", (error) => {
            console.error("❌ [SOCKET] Reconnect error:", error);
        });

        // ============================================================
        // 🔥 FIX: Single event handlers that call all registered callbacks
        // ============================================================

        const handleNewMessage = (data: any) => {
            // console.log("📩 [SOCKET] 🔔 GLOBAL: message:new received!", {
            //     channelId: data.channelId,
            //     content: data.message?.content,
            //     sender: data.message?.senderId?.fullName,
            //     callbacksCount: messageCallbacks.current.size
            // });

            messageCallbacks.current.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("❌ [SOCKET] Error in message callback:", error);
                }
            });
        };

        const handleTypingStart = (data: any) => {
            typingCallbacks.current.forEach((callback) => {
                try {
                    callback({ ...data, type: "start" });
                } catch (error) {
                    console.error("❌ [SOCKET] Error in typing callback:", error);
                }
            });
        };

        const handleTypingStop = (data: any) => {

            typingCallbacks.current.forEach((callback) => {
                try {
                    callback({ ...data, type: "stop" });
                } catch (error) {
                    console.error("❌ [SOCKET] Error in typing callback:", error);
                }
            });
        };

        const handleReaction = (data: any) => {

            reactionCallbacks.current.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("❌ [SOCKET] Error in reaction callback:", error);
                }
            });
        };

        const handleMessageDeleted = (data: any) => {
            messageDeletedCallbacks.current.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("❌ [SOCKET] Error in delete callback:", error);
                }
            });
        };

        const handleMessageUpdated = (data: any) => {
            messageUpdatedCallbacks.current.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("❌ [SOCKET] Error in update callback:", error);
                }
            });
        };

        const handleUserOnline = (data: any) => {
            userOnlineCallbacks.current.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("❌ [SOCKET] Error in user online callback:", error);
                }
            });
        };

        const handleUserOffline = (data: any) => {
            userOfflineCallbacks.current.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("❌ [SOCKET] Error in user offline callback:", error);
                }
            });
        };

        // ✅ NEW: Handle pinned:updated events
        const handlePinnedUpdated = (data: any) => {

            pinnedUpdatedCallbacks.current.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    console.error("❌ [SOCKET] Error in pinned updated callback:", error);
                }
            });
        };

        // Register global handlers
        socketInstance.on("message:new", handleNewMessage);
        socketInstance.on("typing:start", handleTypingStart);
        socketInstance.on("typing:stop", handleTypingStop);
        socketInstance.on("message:reaction", handleReaction);
        socketInstance.on("message:deleted", handleMessageDeleted);
        socketInstance.on("message:updated", handleMessageUpdated);
        socketInstance.on("user:online", handleUserOnline);
        socketInstance.on("user:offline", handleUserOffline);
        socketInstance.on("pinned:updated", handlePinnedUpdated); // ✅ NEW

        // Log all incoming events for debugging (skip ping/pong)
        socketInstance.onAny((event, ...args) => {
            if (!event.includes("ping") && !event.includes("pong")) {
                console.log(`📩 [SOCKET] Any event: ${event}`, args);
            }
        });

        // ============================================================
        // CLEANUP
        // ============================================================
        return () => {

            // Remove global handlers
            socketInstance.off("message:new", handleNewMessage);
            socketInstance.off("typing:start", handleTypingStart);
            socketInstance.off("typing:stop", handleTypingStop);
            socketInstance.off("message:reaction", handleReaction);
            socketInstance.off("message:deleted", handleMessageDeleted);
            socketInstance.off("message:updated", handleMessageUpdated);
            socketInstance.off("user:online", handleUserOnline);
            socketInstance.off("user:offline", handleUserOffline);
            socketInstance.off("pinned:updated", handlePinnedUpdated); // ✅ NEW

            // Clear all callbacks
            messageCallbacks.current.clear();
            typingCallbacks.current.clear();
            reactionCallbacks.current.clear();
            messageDeletedCallbacks.current.clear();
            messageUpdatedCallbacks.current.clear();
            userOnlineCallbacks.current.clear();
            userOfflineCallbacks.current.clear();
            pinnedUpdatedCallbacks.current.clear(); // ✅ NEW

            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setSocket(null);
            setIsConnected(false);
        };
    }, [token, user]);

    // ============================================================
    // SOCKET ACTION METHODS
    // ============================================================

    const joinChannel = useCallback((channelId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("channel:join", { channelId });
        } else {
            console.warn(`⚠️ [SOCKET] Cannot join channel ${channelId} - Socket not connected`);
        }
    }, [isConnected]);

    const leaveChannel = useCallback((channelId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("channel:leave", { channelId });
        }
    }, [isConnected]);

    const markAsRead = useCallback((channelId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("channel:read", { channelId });
        }
    }, [isConnected]);

    const sendMessage = useCallback((channelId: string, data: any) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("message:send", { channelId, ...data });
        }
    }, [isConnected]);

    const editMessage = useCallback((messageId: string, content: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("message:edit", { messageId, content });
        }
    }, [isConnected]);

    const deleteMessage = useCallback((messageId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("message:delete", { messageId });
        }
    }, [isConnected]);

    const addReaction = useCallback((messageId: string, emoji: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("message:reaction", { messageId, emoji });
        }
    }, [isConnected]);

    const startTyping = useCallback((channelId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("typing:start", { channelId });
        }
    }, [isConnected]);

    const stopTyping = useCallback((channelId: string) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit("typing:stop", { channelId });
        }
    }, [isConnected]);

    // ============================================================
    // 🔥 FIX: These now return unsubscribe functions
    // ============================================================

    const onMessage = useCallback((callback: (data: { channelId: string; message: Message }) => void) => {
        messageCallbacks.current.add(callback);
        return () => {

            messageCallbacks.current.delete(callback);
        };
    }, []);

    const onTyping = useCallback((callback: (data: { channelId: string; userId: string; userName: string; type?: string }) => void) => {

        typingCallbacks.current.add(callback);
        return () => {
            typingCallbacks.current.delete(callback);
        };
    }, []);

    const onReaction = useCallback((callback: (data: { channelId: string; messageId: string; reactions: any[] }) => void) => {
        reactionCallbacks.current.add(callback);
        return () => {
            reactionCallbacks.current.delete(callback);
        };
    }, []);

    const onMessageDeleted = useCallback((callback: (data: { channelId: string; messageId: string }) => void) => {
        messageDeletedCallbacks.current.add(callback);
        return () => {
            messageDeletedCallbacks.current.delete(callback);
        };
    }, []);

    const onMessageUpdated = useCallback((callback: (data: { channelId: string; message: Message }) => void) => {
        messageUpdatedCallbacks.current.add(callback);
        return () => {
            messageUpdatedCallbacks.current.delete(callback);
        };
    }, []);

    const onUserOnline = useCallback((callback: (data: { userId: string }) => void) => {
        userOnlineCallbacks.current.add(callback);
        return () => {
            userOnlineCallbacks.current.delete(callback);
        };
    }, []);

    const onUserOffline = useCallback((callback: (data: { userId: string }) => void) => {
        userOfflineCallbacks.current.add(callback);
        return () => {
            userOfflineCallbacks.current.delete(callback);
        };
    }, []);

    // ✅ NEW: Pinned updated listener
    const onPinnedUpdated = useCallback((callback: (data: { channelId: string; messageId: string; isPinned: boolean }) => void) => {

        pinnedUpdatedCallbacks.current.add(callback);
        return () => {
            pinnedUpdatedCallbacks.current.delete(callback);
        };
    }, []);

    const removeAllListeners = useCallback(() => {
        messageCallbacks.current.clear();
        typingCallbacks.current.clear();
        reactionCallbacks.current.clear();
        messageDeletedCallbacks.current.clear();
        messageUpdatedCallbacks.current.clear();
        userOnlineCallbacks.current.clear();
        userOfflineCallbacks.current.clear();
        pinnedUpdatedCallbacks.current.clear(); // ✅ NEW
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
        }
    }, []);

    // ============================================================
    // CONTEXT VALUE
    // ============================================================

    const contextValue: SocketContextType = {
        socket,
        isConnected,
        joinChannel,
        leaveChannel,
        markAsRead,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        startTyping,
        stopTyping,
        onMessage,
        onTyping,
        onReaction,
        onMessageDeleted,
        onMessageUpdated,
        onUserOnline,
        onUserOffline,
        onPinnedUpdated, // ✅ NEW
        removeAllListeners,
    };

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
}