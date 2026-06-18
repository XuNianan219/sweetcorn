// 明星宣传页（梓渝 / 田栩宁 / 恋爱史）内容服务
import { getApiBase } from '../config/api';

export type SectionType = 'text' | 'image' | 'image-text';

export interface CelebritySection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  imageUrl?: string;
  order: number;
}

export interface CelebrityPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  bannerImage: string;
  bannerColor: string;
  sections: CelebritySection[];
  updatedAt: string;
}

function authHeaders() {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle(res: Response): Promise<CelebrityPage> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || '操作失败');
  }
  return res.json();
}

export async function getCelebrityPage(slug: string): Promise<CelebrityPage> {
  const res = await fetch(`${getApiBase()}/api/celebrity-pages/${slug}`);
  return handle(res);
}

export async function updateCelebrityPage(
  slug: string,
  data: Partial<Pick<CelebrityPage, 'title' | 'subtitle' | 'bannerImage' | 'bannerColor' | 'sections'>>,
): Promise<CelebrityPage> {
  const res = await fetch(`${getApiBase()}/api/celebrity-pages/${slug}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function addSection(
  slug: string,
  section: { type: SectionType; title: string; content: string; imageUrl?: string },
): Promise<CelebrityPage> {
  const res = await fetch(`${getApiBase()}/api/celebrity-pages/${slug}/sections`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(section),
  });
  return handle(res);
}

export async function updateSection(
  slug: string,
  sectionId: string,
  data: Partial<Pick<CelebritySection, 'type' | 'title' | 'content' | 'imageUrl' | 'order'>>,
): Promise<CelebrityPage> {
  const res = await fetch(`${getApiBase()}/api/celebrity-pages/${slug}/sections/${sectionId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function deleteSection(slug: string, sectionId: string): Promise<CelebrityPage> {
  const res = await fetch(`${getApiBase()}/api/celebrity-pages/${slug}/sections/${sectionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handle(res);
}
