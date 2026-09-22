// hooks/tender/useTenderChatSocket.ts
"use client";

import { useEffect, useRef } from "react";

/**
 * Subscribe to tender chat events on your app's existing shared socket.
 *
 * @param socket    The socket instance from your SocketProvider / useSocket() hook.
 *                  Pass `socket?.socket ?? socket` if your provider wraps it.
 * @param key       A tenderId string, or the literal "inbox" for the global channel.
 * @param onMessage Called for every `tender:chat:new` event.
 */
export function useTenderChatSocket(
    socket: any | null | undefined,
    key: string | null | undefined,
    onMessage: (msg: any) => void,
) {
    const handlerRef = useRef(onMessage);

    // Update the ref inside an effect — never during render
    useEffect(() => {
        handlerRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!socket || !key) return;
        if (typeof socket.on !== "function") {
            console.warn(
                "[useTenderChatSocket] Provided value is not a socket instance:",
                socket,
            );
            return;
        }

        const isInbox = key === "inbox";
        const joinEvent = isInbox ? "tender:chat:inbox:join" : "tender:chat:join";
        const leaveEvent = isInbox
            ? "tender:chat:inbox:leave"
            : "tender:chat:leave";
        const joinPayload = isInbox ? undefined : key;

        const join = () => socket.emit(joinEvent, joinPayload);

        if (socket.connected) join();
        socket.on("connect", join);

        const listener = (msg: any) => handlerRef.current(msg);
        socket.on("tender:chat:new", listener);

        return () => {
            socket.emit(leaveEvent, joinPayload);
            socket.off("connect", join);
            socket.off("tender:chat:new", listener);
        };
    }, [socket, key]);
}