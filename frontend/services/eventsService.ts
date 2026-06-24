// services/eventsService.ts —— 嗑学情报站

import { getApiBase } from '../config/api';

export type EventType = 'performance' | 'merchandise' | 'endorsement';
export type EventStatus = 'pending' | 'approved' | 'rejected';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  coverImage: string;
  location: string;
  startAt: string;
  endAt: string | null;
  externalUrl: string;
  celebrities: string[];
  isPinned: boolean;
  status: EventStatus;
  submittedBy: string;
  reviewedBy: string | null;
  rejectReason: string | null;
  createdAt: string;
  submitter?: { id: string; nickname: string | null; phone: string };
}

export interface EventListResponse {
  events: EventItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function authHeaders() {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `请求失败 (${res.status})`);
  }
  return res.json();
}

export async function getEvents(
  type: EventType | 'all' = 'all',
  page = 1,
  limit = 20
): Promise<EventListResponse> {
  const res = await fetch(`${getApiBase()}/api/events?type=${type}&page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  return parse<EventListResponse>(res);
}

export async function getUpcomingEvents(limit = 5): Promise<EventItem[]> {
  const res = await fetch(`${getApiBase()}/api/events/upcoming?limit=${limit}`, { headers: authHeaders() });
  const data = await parse<{ events: EventItem[] }>(res);
  return data.events;
}

export async function getPinnedEvents(): Promise<EventItem[]> {
  const res = await fetch(`${getApiBase()}/api/events/pinned`, { headers: authHeaders() });
  const data = await parse<{ events: EventItem[] }>(res);
  return data.events;
}

export async function getMyEvents(): Promise<EventItem[]> {
  const res = await fetch(`${getApiBase()}/api/events/mine`, { headers: authHeaders() });
  const data = await parse<{ events: EventItem[] }>(res);
  return data.events;
}

export interface SubmitEventInput {
  title: string;
  description: string;
  eventType: EventType;
  coverImage: string;
  location: string;
  startAt: string;
  endAt?: string;
  externalUrl: string;
  celebrities: string[];
}

export async function submitEvent(input: SubmitEventInput): Promise<EventItem> {
  const res = await fetch(`${getApiBase()}/api/events`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await parse<{ event: EventItem }>(res);
  return data.event;
}

// 管理员
export async function getPendingEvents(): Promise<EventItem[]> {
  const res = await fetch(`${getApiBase()}/api/events/admin/pending`, { headers: authHeaders() });
  const data = await parse<{ events: EventItem[] }>(res);
  return data.events;
}

export async function approveEvent(id: string): Promise<EventItem> {
  const res = await fetch(`${getApiBase()}/api/events/${id}/approve`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const data = await parse<{ event: EventItem }>(res);
  return data.event;
}

export async function rejectEvent(id: string, rejectReason: string): Promise<EventItem> {
  const res = await fetch(`${getApiBase()}/api/events/${id}/reject`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ rejectReason }),
  });
  const data = await parse<{ event: EventItem }>(res);
  return data.event;
}

export async function pinEvent(id: string, isPinned: boolean): Promise<EventItem> {
  const res = await fetch(`${getApiBase()}/api/events/${id}/pin`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ isPinned }),
  });
  const data = await parse<{ event: EventItem }>(res);
  return data.event;
}

// ─── 展示辅助 ────────────────────────────────────────────────

export const EVENT_TYPE_META: Record<EventType, { label: string; emoji: string; cta: string }> = {
  performance: { label: '演出', emoji: '🎤', cta: '购票' },
  merchandise: { label: '周边', emoji: '🛍️', cta: '购买' },
  endorsement: { label: '代言', emoji: '📢', cta: '查看详情' },
};

// 英文映射（供 lang === 'en' 时使用）
export const EVENT_TYPE_META_EN: Record<EventType, { label: string; cta: string }> = {
  performance: { label: 'Show', cta: 'Buy tickets' },
  merchandise: { label: 'Merch', cta: 'Buy' },
  endorsement: { label: 'Deal', cta: 'View details' },
};

// 类型徽章配色（黄绿色系内）：演出=绿、周边=黄、代言=橙
export const EVENT_TYPE_BADGE: Record<EventType, string> = {
  performance: 'bg-green-100 text-green-700',
  merchandise: 'bg-yellow-100 text-yellow-700',
  endorsement: 'bg-orange-100 text-orange-600',
};

export function formatEventDate(iso: string, lang: 'zh' | 'en' = 'zh'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (lang === 'en') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${hh}:${mm}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
}

// 返回距开始的倒计时文本；已开始返回「进行中/已结束」
export function countdownText(startIso: string, lang: 'zh' | 'en' = 'zh'): string {
  const diff = new Date(startIso).getTime() - Date.now();
  if (diff <= 0) return lang === 'en' ? 'Started' : '已开始';
  const days = Math.floor(diff / (24 * 3600 * 1000));
  const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
  if (days > 0) return lang === 'en' ? `in ${days}d ${hours}h` : `距开始 ${days} 天 ${hours} 时`;
  const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
  return lang === 'en' ? `in ${hours}h ${mins}m` : `距开始 ${hours} 时 ${mins} 分`;
}
