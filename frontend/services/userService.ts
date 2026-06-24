// services/userService.ts —— 用户公开主页
import { apiFetch } from '../utils/apiClient';
import { API_BASE_URL } from '../config/api';
import type { FeedResponse } from './feedService';

const BASE_URL = `${API_BASE_URL}/api`;

export interface PublicUser {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByMe: boolean;
}

export async function getUserPublic(userId: string): Promise<PublicUser> {
  return apiFetch(`${BASE_URL}/users/${userId}/public`);
}

export async function getUserPosts(
  userId: string,
  page = 1,
  limit = 20,
): Promise<FeedResponse> {
  return apiFetch(`${BASE_URL}/users/${userId}/posts?page=${page}&limit=${limit}`);
}
