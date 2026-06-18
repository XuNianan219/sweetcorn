// services/recycleService.ts —— 回收站（软删除的帖子，按分区分组）

import { apiFetch } from '../utils/apiClient';

import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export interface DeletedPost {
  id: string;
  title: string;
  content: string;
  category: string; // discussion | media | article | travel
  coverImage: string | null;
  deletedAt: string;
  createdAt: string;
}

export interface RecycledPosts {
  discussion: DeletedPost[];
  media: DeletedPost[];
  article: DeletedPost[];
  travel: DeletedPost[];
  counts: { discussion: number; media: number; article: number; travel: number };
}

export async function getRecycledPosts(): Promise<RecycledPosts> {
  return apiFetch(`${BASE_URL}/recycle/posts`);
}

export async function restorePost(id: string): Promise<{ success: boolean; post: { id: string; category: string } }> {
  return apiFetch(`${BASE_URL}/recycle/posts/${id}/restore`, { method: 'POST' });
}

export async function permanentDeletePost(id: string): Promise<{ success: boolean }> {
  return apiFetch(`${BASE_URL}/recycle/posts/${id}`, { method: 'DELETE' });
}
