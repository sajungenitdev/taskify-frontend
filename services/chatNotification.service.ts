// src/services/chatNotification.service.ts

class ChatNotificationService {
    /**
     * Request permission for desktop notifications
     */
    static async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Send a desktop notification for a new message
     */
    static sendMessageNotification(
        senderName: string,
        messageContent: string,
        channelName: string,
        senderAvatar?: string,
        channelId?: string,
        messageId?: string
    ): Notification | null {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return null;
        }

        if (Notification.permission !== 'granted') {
            console.log('Notification permission not granted');
            return null;
        }

        try {
            const truncatedContent = messageContent.length > 100
                ? messageContent.substring(0, 100) + '...'
                : messageContent;

            const notification = new Notification(
                `💬 ${senderName} in #${channelName}`,
                {
                    body: truncatedContent || '📎 Sent an attachment',
                    icon: senderAvatar || '/favicon.ico',
                    tag: `chat-${channelId || 'global'}`,
                    data: {
                        channelId: channelId,
                        messageId: messageId,
                        type: 'chat-message',
                    },
                    requireInteraction: false,
                    silent: false,
                }
            );

            setTimeout(() => {
                notification.close();
            }, 5000);

            notification.onclick = () => {
                window.focus();
                notification.close();
                if (channelId) {
                    window.dispatchEvent(new CustomEvent('focus-channel', {
                        detail: { channelId }
                    }));
                }
            };

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    }

    /**
     * Play a notification sound
     */
    static playNotificationSound(): void {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 880;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            // Silently fail if audio is not supported
        }
    }

    /**
     * Check if the page is visible
     */
    static isPageVisible(): boolean {
        return !document.hidden;
    }

    /**
     * Send notification only if page is not visible
     */
    static sendNotificationIfAway(
        senderName: string,
        messageContent: string,
        channelName: string,
        senderAvatar?: string,
        channelId?: string,
        messageId?: string
    ): boolean {
        if (!this.isPageVisible()) {
            this.sendMessageNotification(
                senderName,
                messageContent,
                channelName,
                senderAvatar,
                channelId,
                messageId
            );
            this.playNotificationSound();
            return true;
        }
        return false;
    }
}

export default ChatNotificationService;