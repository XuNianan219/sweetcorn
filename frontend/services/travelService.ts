import { getApiBase } from '../config/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Types ───────────────────────────────────────────────────
export interface TravelExperience {
  id: string;
  celebrity: string;
  title: string;
  category: string;
  location: string;
  duration: string;
  description: string;
  coverImage: string;
  vlogUrl: string;
  detailUrl: string;
  orderNum: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TravelRoute {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  detailUrl: string;
  orderNum: number;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ExperienceInput = Omit<TravelExperience, 'id' | 'createdAt' | 'updatedAt'>;
export type RouteInput = Omit<TravelRoute, 'id' | 'createdAt' | 'updatedAt'>;

// ─── 体验卡片 ────────────────────────────────────────────────
export async function getExperiences(all = false): Promise<TravelExperience[]> {
  const res = await fetch(`${getApiBase()}/api/travel/experiences${all ? '?all=1' : ''}`, {
    headers: all ? authHeaders() : {},
  });
  if (!res.ok) throw new Error('获取体验失败');
  return (await res.json()).experiences as TravelExperience[];
}

export async function getExperience(id: string): Promise<TravelExperience> {
  const res = await fetch(`${getApiBase()}/api/travel/experiences/${id}`);
  if (!res.ok) throw new Error('获取体验失败');
  return (await res.json()).experience as TravelExperience;
}

export async function createExperience(data: ExperienceInput): Promise<TravelExperience> {
  const res = await fetch(`${getApiBase()}/api/travel/experiences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || '发布失败');
  return (await res.json()).experience as TravelExperience;
}

export async function updateExperience(id: string, data: Partial<ExperienceInput>): Promise<TravelExperience> {
  const res = await fetch(`${getApiBase()}/api/travel/experiences/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || '保存失败');
  return (await res.json()).experience as TravelExperience;
}

export async function deleteExperience(id: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/travel/experiences/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('删除失败');
}

// ─── 精选线路 ────────────────────────────────────────────────
export async function getRoutes(all = false): Promise<TravelRoute[]> {
  const res = await fetch(`${getApiBase()}/api/travel/routes${all ? '?all=1' : ''}`, {
    headers: all ? authHeaders() : {},
  });
  if (!res.ok) throw new Error('获取线路失败');
  return (await res.json()).routes as TravelRoute[];
}

export async function createRoute(data: RouteInput): Promise<TravelRoute> {
  const res = await fetch(`${getApiBase()}/api/travel/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || '发布失败');
  return (await res.json()).route as TravelRoute;
}

export async function updateRoute(id: string, data: Partial<RouteInput>): Promise<TravelRoute> {
  const res = await fetch(`${getApiBase()}/api/travel/routes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || '保存失败');
  return (await res.json()).route as TravelRoute;
}

export async function deleteRoute(id: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/travel/routes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('删除失败');
}
