// services/followService.ts —— 关注/取关 + 状态查询（复用现有后端 /api/follows）

import { apiFetch } from '../utils/apiClient';

import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

// 切换关注，返回 { following, followerCount }
export async function toggleFollow(userId: string): Promise<{ following: boolean; followerCount: number }> {
  return apiFetch(`${BASE_URL}/follows/${userId}`, { method: 'POST' });
}

// 查询关注状态
export async function getFollowStatus(userId: string): Promise<{ following: boolean; isMutual: boolean }> {
  return apiFetch(`${BASE_URL}/follows/${userId}/status`);
}

export interface FollowUser {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

// 某用户的关注列表（分页，公开）
export async function getFollowing(
  userId: string,
  page = 1,
  limit = 20,
): Promise<{ following: FollowUser[]; total: number; page: number; limit: number }> {
  return apiFetch(`${BASE_URL}/follows/${userId}/following?page=${page}&limit=${limit}`);
}
