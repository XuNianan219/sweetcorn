// services/postsApi.ts

const BASE_URL = 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('sweetcorn_jwt_token');
}

export function saveToken(token: string) {
  localStorage.setItem('sweetcorn_jwt_token', token);
}

export function clearToken() {
  localStorage.removeItem('sweetcorn_jwt_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// 登录（开发环境直接用手机号，不需要验证码）
export async function loginDev(phone: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) throw new Error('登录失败');
  return res.json();
}

// 获取帖子列表
export async function fetchPosts(category = 'life'): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/posts?category=${category}`, {
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

  const res = await fetch(`${BASE_URL}/posts`, {
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

// 删除帖子
export async function deletePost(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
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
  const res = await fetch(`${BASE_URL}/posts/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('更新失败');
  return res.json();
}