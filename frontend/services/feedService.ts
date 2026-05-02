// Feed 流相关 API 封装（关注流 + 推荐流 + 点赞 toggle）

const BASE_URL = 'http://localhost:3000/api';

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
  isLikedByMe: boolean;
}

export interface FeedResponse {
  posts: FeedPost[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function getToken(): string | null {
  return localStorage.getItem('sweetcorn_jwt_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(res: Response, fallback: string): Promise<never> {
  let msg = fallback;
  try {
    const body = await res.json();
    if (body && typeof body.message === 'string') msg = body.message;
  } catch {
    // ignore
  }
  throw new Error(msg);
}

// 关注流：必须带 token
export async function getFollowingFeed(page: number, limit: number): Promise<FeedResponse> {
  const res = await fetch(`${BASE_URL}/feed/following?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await parseError(res, '获取关注流失败');
  return res.json();
}

// 推荐流：可选 token（带了会返回 isLikedByMe）
export async function getDiscoverFeed(page: number, limit: number): Promise<FeedResponse> {
  const res = await fetch(`${BASE_URL}/feed/discover?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) await parseError(res, '获取推荐流失败');
  return res.json();
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
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) await parseError(res, '获取分区帖子失败');
  return res.json();
}

// 分区本周 TOP：后端按点赞数排序，前端不展示数字/排名
export async function getCategoryTop(
  category: string,
  limit = 3,
): Promise<{ posts: FeedPost[] }> {
  const url = `${BASE_URL}/feed/category/${encodeURIComponent(category)}/top?limit=${limit}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) await parseError(res, '获取本周推荐失败');
  return res.json();
}

// 点赞 toggle：后端返回 { liked, likeCount }
export async function toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`${BASE_URL}/likes/${postId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) await parseError(res, '点赞失败');
  return res.json();
}
