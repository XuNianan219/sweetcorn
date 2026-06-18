// services/mediaVideoService.ts —— 嗑学影像沉浸式视频流
import type { FeedResponse } from './feedService';

import { getApiBase } from '../config/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// 获取嗑学影像视频帖（mediaType=video），按 createdAt 降序
export async function getMediaVideos(page: number, limit: number): Promise<FeedResponse> {
  const res = await fetch(`${getApiBase()}/api/feed/category/media/videos?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '获取视频流失败');
  }
  return res.json();
}
