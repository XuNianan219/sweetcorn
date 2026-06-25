// services/messageService.ts —— 用户私信
import { apiFetch } from '../utils/apiClient';
import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export type MessageKind = 'social' | 'commerce';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  kind?: MessageKind;
  msgType?: 'text' | 'image';
  imageUrl?: string | null;
  createdAt: string;
  isMine: boolean;
}

export interface Conversation {
  user: { id: string; nickname: string | null; avatarUrl: string | null };
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

export async function getConversations(kind: MessageKind = 'social'): Promise<Conversation[]> {
  const res = await apiFetch<{ conversations: Conversation[] }>(`${BASE_URL}/messages?kind=${kind}`);
  return res.conversations;
}

export async function getThread(userId: string, kind: MessageKind = 'social'): Promise<ChatMessage[]> {
  const res = await apiFetch<{ messages: ChatMessage[] }>(`${BASE_URL}/messages/${userId}?kind=${kind}`);
  return res.messages;
}

export async function sendMessage(
  userId: string,
  content: string,
  kind: MessageKind = 'social',
  opts?: { imageUrl?: string },
): Promise<ChatMessage> {
  const body: { content: string; kind: MessageKind; imageUrl?: string; msgType?: 'image' } = {
    content,
    kind,
  };
  if (opts?.imageUrl) {
    body.imageUrl = opts.imageUrl;
    body.msgType = 'image';
  }
  const res = await apiFetch<{ message: ChatMessage }>(`${BASE_URL}/messages/${userId}`, {
    method: 'POST',
    body,
  });
  return res.message;
}

export async function getMessageUnreadCount(): Promise<number> {
  const r = await apiFetch<{ count: number }>(`${BASE_URL}/messages/unread-count`, { silent: true });
  return r.count;
}

export interface SupportContact {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

// 官方客服账号（商品页“咨询客服”用，走 commerce 不受私信限制）
export async function getSupportContact(): Promise<SupportContact> {
  const r = await apiFetch<{ support: SupportContact }>(`${BASE_URL}/support/contact`);
  return r.support;
}
