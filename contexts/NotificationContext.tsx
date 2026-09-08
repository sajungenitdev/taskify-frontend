// contexts/NotificationContext.tsx
"use client";

import ChatNotificationService from '@/services/chatNotification.service';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';


interface NotificationContextType {
    permission: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    sendNotification: (
        senderName: string,
        messageContent: string,
        channelName: string,
        senderAvatar?: string,
        channelId?: string,
        messageId?: string
    ) => void;
    playSound: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
    permission: 'default',
    requestPermission: async () => false,
    sendNotification: () => {},
    playSound: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    const requestPermission = useCallback(async () => {
        const granted = await ChatNotificationService.requestPermission();
        const newPermission = granted ? 'granted' : 'denied';
        setPermission(newPermission);
        return granted;
    }, []);

    const sendNotification = useCallback((
        senderName: string,
        messageContent: string,
        channelName: string,
        senderAvatar?: string,
        channelId?: string,
        messageId?: string
    ) => {
        ChatNotificationService.sendNotificationIfAway(
            senderName,
            messageContent,
            channelName,
            senderAvatar,
            channelId,
            messageId
        );
    }, []);

    const playSound = useCallback(() => {
        ChatNotificationService.playNotificationSound();
    }, []);

    // Request permission on mount
    useEffect(() => {
        requestPermission();
    }, [requestPermission]);

    return (
        <NotificationContext.Provider
            value={{
                permission,
                requestPermission,
                sendNotification,
                playSound,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}