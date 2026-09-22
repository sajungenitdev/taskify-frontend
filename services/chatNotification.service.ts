// services/chatNotification.service.ts

type TenderNotifyOpts = {
  senderName: string;
  messageContent: string;
  tenderTitle?: string;
  tenderId: string;
  messageId: string;
};

class ChatNotificationService {
  static _recentlyNotified = new Set<string>();

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

  /* ============================================================
   * TEAM CHAT
   * ============================================================ */

  static sendMessageNotification(
    senderName: string,
    messageContent: string,
    channelName: string,
    senderAvatar?: string,
    channelId?: string,
    messageId?: string,
  ): Notification | null {
    if (!('Notification' in window)) return null;
    if (Notification.permission !== 'granted') return null;

    try {
      const truncatedContent =
        messageContent.length > 100
          ? messageContent.substring(0, 100) + '...'
          : messageContent;

      const notification = new Notification(
        `💬 ${senderName} in #${channelName}`,
        {
          body: truncatedContent || '📎 Sent an attachment',
          icon: senderAvatar || '/images/default-avatar.png',
          tag: `chat-${channelId || 'global'}`,
          data: { channelId, messageId, type: 'chat-message' },
          requireInteraction: false,
          silent: false,
        },
      );

      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (channelId && window.location) {
          window.dispatchEvent(
            new CustomEvent('focus-channel', { detail: { channelId } }),
          );
        }
      };

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  static playNotificationSound(): void {
    try {
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();

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
      console.log('Audio notification not supported');
    }
  }

  static isPageVisible(): boolean {
    return !document.hidden;
  }

  static sendNotificationIfAway(
    senderName: string,
    messageContent: string,
    channelName: string,
    senderAvatar?: string,
    channelId?: string,
    messageId?: string,
  ): boolean {
    if (!this.isPageVisible()) {
      this.sendMessageNotification(
        senderName,
        messageContent,
        channelName,
        senderAvatar,
        channelId,
        messageId,
      );
      this.playNotificationSound();
      return true;
    }
    return false;
  }

  /* ============================================================
   * TENDER CHAT
   * ============================================================ */

  static sendTenderNotification(
    opts: TenderNotifyOpts,
  ): Notification | null {
    const { senderName, messageContent, tenderTitle, tenderId, messageId } =
      opts;

    if (!('Notification' in window)) return null;
    if (Notification.permission !== 'granted') return null;
    if (!tenderId || !messageId) return null;

    try {
      const truncated =
        (messageContent || '').length > 100
          ? messageContent.slice(0, 100) + '...'
          : messageContent || '📎 Sent an attachment';

      const notification = new Notification(
        `💬 ${senderName} — Tender Support`,
        {
          body: tenderTitle ? `${tenderTitle}\n${truncated}` : truncated,
          icon: '/images/tender-icon.png',
          tag: `tender-chat-${tenderId}`,
          data: { tenderId, messageId, type: 'tender-chat' },
          requireInteraction: false,
          silent: true,
        },
      );

      setTimeout(() => notification.close(), 6000);

      notification.onclick = () => {
        window.focus();
        notification.close();
        window.dispatchEvent(
          new CustomEvent('tender-chat:focus', { detail: { tenderId } }),
        );
      };

      return notification;
    } catch (err) {
      console.error('[notif] tender notification failed:', err);
      return null;
    }
  }

  static notifyTenderIfAway(opts: TenderNotifyOpts): boolean {
    if (this.isPageVisible()) return false;

    const messageId = opts && opts.messageId;
    if (messageId) {
      if (this._recentlyNotified.has(messageId)) return false;
      this._recentlyNotified.add(messageId);
      if (this._recentlyNotified.size > 100) {
        this._recentlyNotified.clear();
      }
    }

    this.sendTenderNotification(opts);
    this.playNotificationSound();
    return true;
  }
}

export default ChatNotificationService;