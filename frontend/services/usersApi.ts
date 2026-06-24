// services/usersApi.ts —— 当前用户资料 + 管理员用户管理

import { apiFetch } from '../utils/apiClient';

import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export interface ApiUser {
  id: string;
  phone: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio?: string;
  role: 'user' | 'admin' | 'super_admin';
  status?: 'active' | 'banned';
  createdAt?: string;
}

// 当前用户
export async function getMe(): Promise<ApiUser> {
  return apiFetch(`${BASE_URL}/users/me`);
}

export async function updateMe(data: { nickname?: string; avatarUrl?: string; bio?: string }): Promise<ApiUser> {
  return apiFetch(`${BASE_URL}/users/me`, { method: 'PUT', body: data });
}

// 管理员
export interface AdminUsersResponse {
  users: ApiUser[];
  total: number;
  page: number;
  limit: number;
}

export async function adminListUsers(page = 1, limit = 20): Promise<AdminUsersResponse> {
  return apiFetch(`${BASE_URL}/admin/users?page=${page}&limit=${limit}`);
}

export async function adminSetRole(id: string, role: ApiUser['role']): Promise<ApiUser> {
  return apiFetch(`${BASE_URL}/admin/users/${id}/role`, { method: 'PATCH', body: { role } });
}

export async function adminSetStatus(id: string, status: 'active' | 'banned'): Promise<ApiUser> {
  return apiFetch(`${BASE_URL}/admin/users/${id}/status`, { method: 'PATCH', body: { status } });
}
