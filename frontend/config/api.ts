/**
 * 后端 API 基础地址 —— 智能动态发现
 * - 优先用环境变量 VITE_API_BASE_URL（生产部署时配置）
 * - 否则按当前访问域名 + 探测 3000~3009 端口自动发现后端
 * - 发现失败兜底到 :3000（不崩溃）
 */

let cachedApiBase: string | null = null;
let discoveryPromise: Promise<string> | null = null;

function fallbackBase(): string {
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:3000`;
  }
  return 'http://localhost:3000';
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
    return res.ok;
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
      cachedApiBase = 'http://localhost:3000';
      return cachedApiBase;
    }

    const { protocol, hostname } = window.location;

    // 探测 3000~3009
    for (let port = 3000; port <= 3009; port++) {
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
