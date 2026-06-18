// services/postsApi.ts

import { getApiBase } from '../config/api';

function getToken(): string | null {
  return localStorage.getItem('sweetcorn_jwt_token');
}

export function saveToken(token: string) {
  localStorage.setItem('sweetcorn_jwt_token', token);
}

export function clearToken() {
  localStorage.removeItem('sweetcorn_jwt_token');
}

const USER_KEY = 'sweetcorn_user';

export function saveUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// 手机号 + 密码登录
export async function loginWithPassword(
  phone: string,
  password: string
): Promise<{ token: string; user: any }> {
  const res = await fetch(`${getApiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '登录失败');
  }
  return res.json();
}

// 注册
export async function register(
  phone: string,
  password: string,
  nickname?: string
): Promise<{ token: string; user: any }> {
  const res = await fetch(`${getApiBase()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password, nickname }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '注册失败');
  }
  return res.json();
}

// 已废弃：旧的无密码登录（兼容旧代码，勿新增调用）
export async function loginDev(phone: string): Promise<{ token: string; user: any }> {
  return loginWithPassword(phone, '');
}

// 获取帖子列表
export async function fetchPosts(category = 'life'): Promise<any[]> {
  const res = await fetch(`${getApiBase()}/api/posts?category=${category}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取帖子失败');
  return res.json();
}

// 创建帖子
export async function createPost(data: {
  content: string;
  category: string;
  hashtags?: string[];
  title?: string;
  mediaUrls?: string[];
  mediaType?: string;
}): Promise<any> {
  const hashtags =
    data.hashtags ??
    (data.content.match(/#([^\s#]+)/g)?.map((t) => t.slice(1)) || []);

  const mediaUrls = data.mediaUrls ?? [];
  const mediaType = mediaUrls.length > 0 ? (data.mediaType ?? 'image') : 'none';

  const res = await fetch(`${getApiBase()}/api/posts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      title: data.title ?? '',
      content: data.content,
      type: 'text',
      category: data.category,
      hashtags,
      mediaUrls,
      mediaType,
    }),
  });
  if (!res.ok) throw new Error('发布失败');
  return res.json();
}

// 不感兴趣（轻量反馈）
export async function uninterestPost(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${getApiBase()}/api/posts/${id}/uninterest`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('操作失败');
  return res.json();
}

// 举报帖子
export async function reportPost(id: string, reason: string): Promise<{ success: boolean }> {
  const res = await fetch(`${getApiBase()}/api/posts/${id}/report`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error('举报失败');
  return res.json();
}

// 删除帖子
export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/posts/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('删除失败');
}


export async function updatePost(id: string, data: {
  title?: string;
  content?: string;
  hashtags?: string[];
}): Promise<any> {
  const res = await fetch(`${getApiBase()}/api/posts/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('更新失败');
  return res.json();
}