// services/adminSupportService.ts —— 管理员客服后台：以「官方客服」身份收发消息
import { apiFetch } from '../utils/apiClient';
import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export interface SupportConversation {
  user: { id: string; nickname: string | null; avatarUrl: string | null };
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

export interface SupportMessage {
  id: string;
  content: string;
  msgType?: 'text' | 'image';
  imageUrl?: string | null;
  createdAt: string;
  fromSupport: boolean; // true=客服发出，false=用户发来
}

export async function getSupportConversations(): Promise<SupportConversation[]> {
  const r = await apiFetch<{ supportId: string; conversations: SupportConversation[] }>(
    `${BASE_URL}/admin/support/conversations`,
    { silent: true },
  );
  return r.conversations;
}

export async function getSupportThread(userId: string): Promise<SupportMessage[]> {
  const r = await apiFetch<{ messages: SupportMessage[] }>(
    `${BASE_URL}/admin/support/thread/${userId}`,
    { silent: true },
  );
  return r.messages;
}

export async function replyAsSupport(userId: string, content: string): Promise<SupportMessage> {
  const r = await apiFetch<{ message: SupportMessage }>(`${BASE_URL}/admin/support/reply/${userId}`, {
    method: 'POST',
    body: { content },
  });
  return r.message;
}
