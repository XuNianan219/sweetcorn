// 统一的 fetch 封装：断网检测、HTTP 状态友好提示、超时、统一 toast
import { showError } from './toast';
import { discoverApiBase } from '../config/api';

const TIMEOUT_MS = 10000;

// 把传入 URL 的 origin 替换为发现到的后端地址（端口可能不是 3000）
function withDiscoveredOrigin(url: string, base: string): string {
  try {
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url);
      const b = new URL(base);
      u.protocol = b.protocol;
      u.host = b.host; // 含 hostname:port
      return u.toString();
    }
    return `${base}${url.startsWith('/') ? url : `/${url}`}`;
  } catch {
    return url;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  // 关掉自动 toast（少数场景如点赞乐观更新失败想自行处理）
  silent?: boolean;
  // 覆盖默认 10s 超时（如 AI 客服回复较慢的接口）
  timeoutMs?: number;
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 状态码 → 友好文案
function friendlyByStatus(status: number, serverMsg?: string): string {
  switch (status) {
    case 401:
      return '请先登录';
    case 403:
      return '你没有权限执行此操作';
    case 404:
      return '内容不存在或已被删除';
    case 500:
    case 502:
    case 503:
      return '服务器出了小问题，请稍后再试';
    default:
      return serverMsg ? `操作失败：${serverMsg}` : '操作失败，请稍后再试';
  }
}

function redirectToLogin() {
  // HashRouter：避免在登录页重复跳转
  if (!window.location.hash.startsWith('#/login')) {
    window.location.hash = '#/login';
  }
}

/**
 * 统一请求：成功返回解析后的 JSON（无内容时返回 undefined）；
 * 失败抛 ApiError，并默认弹出友好 toast。
 */
export async function apiFetch<T = any>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, silent, headers, timeoutMs, ...rest } = options;

  // 断网直接拦截
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const msg = '网络已断开，请检查 Wi-Fi 或数据连接';
    if (!silent) showError(msg);
    throw new ApiError(msg);
  }

  // 动态发现后端端口，并把请求地址 origin 替换为真实后端
  const base = await discoverApiBase();
  const finalUrl = withDiscoveredOrigin(url, base);

  // 组装 headers / body
  const finalHeaders: Record<string, string> = { ...authHeader(), ...(headers as Record<string, string>) };
  let finalBody: BodyInit | undefined;
  if (body instanceof FormData) {
    finalBody = body; // 让浏览器自动带 multipart boundary
  } else if (body !== undefined && body !== null) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
    finalBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  // 超时控制
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(finalUrl, { ...rest, headers: finalHeaders, body: finalBody, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timer);
    // abort = 超时；其余多为网络异常
    const msg =
      err?.name === 'AbortError'
        ? '网络较慢，请稍后再试'
        : '网络连接失败，请稍后再试';
    if (!silent) showError(msg);
    throw new ApiError(msg);
  }
  clearTimeout(timer);

  if (!res.ok) {
    let serverMsg = '';
    try {
      const data = await res.json();
      serverMsg = data?.message || '';
    } catch {
      /* 非 JSON 响应，忽略 */
    }
    const msg = friendlyByStatus(res.status, serverMsg);
    if (!silent) showError(msg);
    if (res.status === 401) redirectToLogin();
    throw new ApiError(msg, res.status);
  }

  // 成功：可能无 body（204）
  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as T;
  }
}
