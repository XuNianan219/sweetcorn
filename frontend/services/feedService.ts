// Feed 流相关 API 封装（关注流 + 推荐流 + 点赞 toggle）

import { apiFetch } from '../utils/apiClient';

import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export interface FeedAuthor {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  type: string | null;
  category: string | null;
  hashtags: string[];
  mediaUrl: string | null;
  mediaUrls: string[];
  mediaType: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: FeedAuthor | null;
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
}

export interface FeedResponse {
  posts: FeedPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 关注流：必须带 token
export async function getFollowingFeed(page: number, limit: number): Promise<FeedResponse> {
  return apiFetch(`${BASE_URL}/feed/following?page=${page}&limit=${limit}`);
}

// 推荐流：可选 token（带了会返回 isLikedByMe）
export async function getDiscoverFeed(page: number, limit: number): Promise<FeedResponse> {
  return apiFetch(`${BASE_URL}/feed/discover?page=${page}&limit=${limit}`);
}

// 分区帖子流：latest | hot，可匿名
export async function getCategoryFeed(
  category: string,
  page: number,
  limit: number,
  sort: 'latest' | 'hot' = 'latest',
): Promise<FeedResponse> {
  const url = `${BASE_URL}/feed/category/${encodeURIComponent(
    category,
  )}?page=${page}&limit=${limit}&sort=${sort}`;
  return apiFetch(url);
}

// 分区本周 TOP：后端按点赞数排序，前端不展示数字/排名
export async function getCategoryTop(
  category: string,
  limit = 3,
): Promise<{ posts: FeedPost[] }> {
  const url = `${BASE_URL}/feed/category/${encodeURIComponent(category)}/top?limit=${limit}`;
  return apiFetch(url);
}

// 单个帖子详情（游客可看，带 token 返回 isLikedByMe）
export async function getPost(id: string): Promise<FeedPost> {
  return apiFetch(`${BASE_URL}/posts/${id}`);
}

// 点赞 toggle：后端返回 { liked, likeCount }（乐观更新场景，失败不弹 toast，交调用方回滚）
export async function toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
  return apiFetch(`${BASE_URL}/likes/${postId}`, { method: 'POST', silent: true });
}

// 删除帖子（软删除）：后端按调用者身份返回 deletedByRole = 'self' | 'admin'
export async function deletePost(
  postId: string,
): Promise<{ success: boolean; deletedByRole: 'self' | 'admin' }> {
  return apiFetch(`${BASE_URL}/posts/${postId}`, { method: 'DELETE' });
}
