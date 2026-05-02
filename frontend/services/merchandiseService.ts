const BASE_URL = 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('sweetcorn_jwt_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types ───────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  wantCount: number;
  createdAt: string;
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
  createdAt: string;
  author: IdeaAuthor;
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

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/merchandise/products`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取商品列表失败');
  const data = await res.json();
  return data.products as Product[];
}

export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${BASE_URL}/merchandise/products/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取商品详情失败');
  const data = await res.json();
  return data.product as Product;
}

export async function getIdeas(page = 1, limit = 20): Promise<IdeasResponse> {
  const res = await fetch(`${BASE_URL}/merchandise/ideas?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取创意列表失败');
  return res.json() as Promise<IdeasResponse>;
}

export async function getIdea(id: string): Promise<Idea> {
  const res = await fetch(`${BASE_URL}/merchandise/ideas/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('获取创意详情失败');
  const data = await res.json();
  return data.idea as Idea;
}

export async function submitIdea(data: SubmitIdeaData): Promise<Idea> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/merchandise/ideas`, {
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

export async function toggleWantIdea(
  id: string
): Promise<{ wanted: boolean; wantCount: number }> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/merchandise/ideas/${id}/want`, {
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
