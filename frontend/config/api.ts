/**
 * 后端 API 基础地址 —— 智能动态发现
 * - 优先用环境变量 VITE_API_BASE_URL（生产部署时配置）
 * - 否则按当前访问域名 + 探测后端端口段自动发现后端
 * - 发现失败兜底到段首端口（不崩溃）
 *
 * 端口约定（前后端分家，避免互相抢占导致探测错乱）：
 * - 前端 Vite dev server 用 2004（见 vite.config.ts）
 * - 后端用 4000 段（见 backend/.env PORT=4000，被占则自动 +1）
 * 探测只扫后端段，永远扫不到前端，从源头杜绝“探到 Vite 端口”的 bug。
 */

// 后端端口段：与 backend/server.js 的自动 +1 上限保持一致
const BACKEND_PORT_START = 4000;
const BACKEND_PORT_END = 4009;

let cachedApiBase: string | null = null;
let discoveryPromise: Promise<string> | null = null;

function fallbackBase(): string {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${BACKEND_PORT_START}`;
  }
  return `http://localhost:${BACKEND_PORT_START}`;
}

async function probePort(hostname: string, port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const protocol = window.location.protocol;
    const res = await fetch(`${protocol}//${hostname}:${port}/api/health`, {
      signal: controller.signal,
      method: 'GET',
    });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    // 必须是真后端的健康 JSON（{status:'ok'}）。Vite dev server 对任意路径都回
    // 200+HTML，只看 res.ok 会被它骗过，导致把前端端口误判成后端端口。
    const data = await res.json().catch(() => null);
    return !!data && data.status === 'ok';
  } catch {
    return false;
  }
}

export async function discoverApiBase(): Promise<string> {
  if (cachedApiBase) return cachedApiBase;
  if (discoveryPromise) return discoveryPromise;

  discoveryPromise = (async () => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      cachedApiBase = envUrl;
      return envUrl;
    }

    if (typeof window === 'undefined' || !window.location) {
      cachedApiBase = `http://localhost:${BACKEND_PORT_START}`;
      return cachedApiBase;
    }

    const { protocol, hostname } = window.location;

    // 只探测后端端口段（4000~4009）
    for (let port = BACKEND_PORT_START; port <= BACKEND_PORT_END; port++) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await probePort(hostname, port);
      if (ok) {
        const base = `${protocol}//${hostname}:${port}`;
        cachedApiBase = base;
        // eslint-disable-next-line no-console
        console.log(`🎯 Discovered API base: ${base}`);
        return base;
      }
    }

    const fallback = fallbackBase();
    cachedApiBase = fallback;
    // eslint-disable-next-line no-console
    console.warn(`⚠️  Could not discover backend, falling back to ${fallback}`);
    return fallback;
  })();

  return discoveryPromise;
}

// 同步获取：已发现则返回缓存，否则返回兜底（供未走 apiClient 的请求在调用时取）
export function getApiBase(): string {
  return cachedApiBase || fallbackBase();
}

// 重置发现缓存（手动重连用）
export function resetApiBase() {
  cachedApiBase = null;
  discoveryPromise = null;
}

// 向后兼容：走 apiClient 的 service 仍可引用此常量构造 URL，
// apiClient 会在请求时把其 origin 替换为发现到的真实地址。
export const API_BASE_URL: string = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl;
  return fallbackBase();
})();
