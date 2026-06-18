// services/notificationService.ts —— 通知中心
import { apiFetch } from '../utils/apiClient';

import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export interface NotificationActor {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface NotificationItem {
  id: string;
  type: string; // like | comment | follow | event_approved | event_rejected | system
  title: string;
  content: string;
  link: string;
  isRead: boolean;
  postId: string | null;
  commentId: string | null;
  createdAt: string;
  actor: NotificationActor | null;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export async function getNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false,
): Promise<NotificationListResponse> {
  return apiFetch(
    `${BASE_URL}/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`,
  );
}

// 铃铛轮询：失败不弹 toast（silent）
export async function getUnreadCount(): Promise<number> {
  const r = await apiFetch<{ count: number }>(`${BASE_URL}/notifications/unread-count`, {
    silent: true,
  });
  return r.count;
}

export async function markAsRead(id: string): Promise<{ success: boolean }> {
  return apiFetch(`${BASE_URL}/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
  return apiFetch(`${BASE_URL}/notifications/mark-all-read`, { method: 'POST' });
}

export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  return apiFetch(`${BASE_URL}/notifications/${id}`, { method: 'DELETE' });
}
