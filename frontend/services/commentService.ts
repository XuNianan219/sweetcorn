// services/commentService.ts —— 评论系统

import { apiFetch } from '../utils/apiClient';

import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export interface CommentAuthor {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface CommentItem {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  likeCount: number;
  isLikedByMe: boolean;
  author: CommentAuthor | null;
  replyCount: number;
  replies: CommentItem[];
}

export interface CommentListResponse {
  comments: CommentItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type CommentSort = 'latest' | 'hot';

export async function getComments(
  postId: string,
  sort: CommentSort = 'latest',
  page = 1,
  limit = 20
): Promise<CommentListResponse> {
  return apiFetch(`${BASE_URL}/comments/post/${postId}?sort=${sort}&page=${page}&limit=${limit}`);
}

export async function getReplies(commentId: string, page = 1, limit = 20): Promise<CommentListResponse> {
  return apiFetch(`${BASE_URL}/comments/${commentId}/replies?page=${page}&limit=${limit}`);
}

export async function postComment(input: {
  postId: string;
  content: string;
  parentId?: string;
}): Promise<CommentItem> {
  const data = await apiFetch<{ comment: CommentItem }>(`${BASE_URL}/comments`, {
    method: 'POST',
    body: input,
  });
  return data.comment;
}

export async function deleteComment(id: string): Promise<{ success: boolean }> {
  return apiFetch(`${BASE_URL}/comments/${id}`, { method: 'DELETE' });
}

export async function toggleCommentLike(id: string): Promise<{ liked: boolean; likeCount: number }> {
  // 乐观更新场景：失败不弹 toast，由调用方回滚
  return apiFetch(`${BASE_URL}/comments/${id}/like`, { method: 'POST', silent: true });
}

// 时间 → 「X 分钟前 / X 小时前 / X 天前」
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
