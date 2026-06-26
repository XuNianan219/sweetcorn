import { getApiBase, API_BASE_URL } from '../config/api';
import { apiFetch } from '../utils/apiClient';

function getToken(): string | null {
  return localStorage.getItem('sweetcorn_jwt_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types ───────────────────────────────────────────────────

export interface ProductSeller {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  videoUrl?: string;
  wantCount: number;
  sellerId?: string | null;
  seller?: ProductSeller | null;
  createdAt: string;
  likeCount?: number;
  isLikedByMe?: boolean;
}

export interface IdeaAuthor {
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export interface Idea {
  id: string;
  authorId: string;
  name: string;
  description: string;
  designImages: string[];
  estimatedCost: number;
  targetPeople: number;
  wantCount: number;
  status?: 'pending' | 'approved' | 'rejected';
  rejectReason?: string | null;
  createdAt: string;
  author: IdeaAuthor & { phone?: string | null };
  isWantedByMe: boolean;
}

export interface IdeasResponse {
  ideas: Idea[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SubmitIdeaData {
  name: string;
  description: string;
  designImages: string[];
  estimatedCost: number;
  targetPeople: number;
}

// ─── API calls ───────────────────────────────────────────────

export interface SubmitProductData {
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  videoUrl?: string;
}

export async function submitProduct(data: SubmitProductData): Promise<Product> {
  const token = getToken();
  const res = await fetch(`${getApiBase()}/api/merchandise/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '上传失败' }));
    throw new Error((err as { message?: string }).message || '上传失败');
  }
  const result = await res.json();
  return result.product as Product;
}

// 我发布的商品（个人主页用）
export async function getMyProducts(): Promise<Product[]> {
  const res = await fetch(`${getApiBase()}/api/merchandise/products/mine`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取我的商品失败');
  const data = await res.json();
  return data.products as Product[];
}

// 下架商品（仅卖家本人或管理员）
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`${API_BASE_URL}/api/merchandise/products/${id}`, { method: 'DELETE' });
}

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${getApiBase()}/api/merchandise/products`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取商品列表失败');
  const data = await res.json();
  return data.products as Product[];
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${getApiBase()}/api/merchandise/products/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取商品详情失败');
  const data = await res.json();
  return data.product as Product;
}

// 商品点赞 toggle（乐观更新：失败不弹 toast，交调用方回滚）
export async function toggleProductLike(
  productId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  return apiFetch(`${API_BASE_URL}/api/merchandise/products/${productId}/like`, {
    method: 'POST',
    silent: true,
  });
}

export async function getIdeas(page = 1, limit = 20): Promise<IdeasResponse> {
  const res = await fetch(`${getApiBase()}/api/merchandise/ideas?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取创意列表失败');
  return res.json() as Promise<IdeasResponse>;
}

export async function getIdea(id: string): Promise<Idea> {
  const res = await fetch(`${getApiBase()}/api/merchandise/ideas/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取创意详情失败');
  const data = await res.json();
  return data.idea as Idea;
}

export async function submitIdea(data: SubmitIdeaData): Promise<Idea> {
  const token = getToken();
  const res = await fetch(`${getApiBase()}/api/merchandise/ideas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '提交失败' }));
    throw new Error((err as { message?: string }).message || '提交失败');
  }
  const result = await res.json();
  return result.idea as Idea;
}

// 我提交的创意（含待审核/被拒）
export async function getMyIdeas(): Promise<Idea[]> {
  const res = await fetch(`${getApiBase()}/api/merchandise/ideas/mine`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取我的创意失败');
  const data = await res.json();
  return data.ideas as Idea[];
}

// ─── 管理员：创意审核 ─────────────────────────────────────────
export async function getPendingIdeas(): Promise<Idea[]> {
  const res = await fetch(`${getApiBase()}/api/merchandise/ideas/admin/pending`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取待审核创意失败');
  const data = await res.json();
  return data.ideas as Idea[];
}

export async function approveIdea(id: string): Promise<Idea> {
  const res = await fetch(`${getApiBase()}/api/merchandise/ideas/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '操作失败' }));
    throw new Error((err as { message?: string }).message || '操作失败');
  }
  return (await res.json()).idea as Idea;
}

export async function rejectIdea(id: string, rejectReason: string): Promise<Idea> {
  const res = await fetch(`${getApiBase()}/api/merchandise/ideas/${id}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ rejectReason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '操作失败' }));
    throw new Error((err as { message?: string }).message || '操作失败');
  }
  return (await res.json()).idea as Idea;
}

export async function toggleWantIdea(
  id: string
): Promise<{ wanted: boolean; wantCount: number }> {
  const token = getToken();
  const res = await fetch(`${getApiBase()}/api/merchandise/ideas/${id}/want`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '操作失败' }));
    throw new Error((err as { message?: string }).message || '操作失败');
  }
  return res.json() as Promise<{ wanted: boolean; wantCount: number }>;
}
