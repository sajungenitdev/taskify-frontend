// lib/api/tenderChat.api.ts
import api from "@/lib/axios";

export interface ChatAttachment {
  name: string;
  url: string;
  size: number;
  mimeType: string;
  kind: "image" | "file" | "audio" | "video" | "";
}

export interface ChatMessage {
  _id: string;
  tenderId: string;
  sender: string;
  senderRole: "user" | "management";
  senderName: string;
  senderPhoto?: string;
  body: string;
  attachments: ChatAttachment[];
  readByUser: boolean;
  readByMgmt: boolean;
  createdAt: string;
}

export interface InboxRow {
  tenderId: string;
  tenderer: string;
  title: string;
  stage: string;
  owner: {
    _id: string;
    fullName: string;
    email: string;
    profilePhoto?: string;
  } | null;
  total: number;
  unread: number;
  lastMessage: {
    _id: string;
    senderRole: "user" | "management";
    senderName: string;
    body: string;
    attachments: ChatAttachment[];
    createdAt: string;
  };
}

export const tenderChatApi = {
  /** List messages for a tender. Pass `after` (ISO) for polling new-only. */
  list: async (tenderId: string, after?: string) => {
    const { data } = await api.get(`/tenders/${tenderId}/chat`, {
      params: after ? { after } : undefined,
    });
    return data.data as ChatMessage[];
  },

  /** Send a message (text + optional attachments). */
  send: async (
    tenderId: string,
    payload: { body?: string; attachments?: ChatAttachment[] },
  ) => {
    const { data } = await api.post(`/tenders/${tenderId}/chat`, payload);
    return data.data as ChatMessage;
  },

  /** Upload one file, returns a public URL ready to attach to a message. */
  upload: async (tenderId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post(
      `/tenders/${tenderId}/chat/upload`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data as ChatAttachment;
  },

  /** Unread count for the current viewer on this tender. */
  unread: async (tenderId: string) => {
    const { data } = await api.get(`/tenders/${tenderId}/chat/unread`);
    return data.data.count as number;
  },

  /** Inbox — every tender that has chat activity. */
  inbox: async () => {
    const { data } = await api.get(`/tenders/chat/inbox`);
    return data.data as InboxRow[];
  },
};