import { API_BASE_URL } from '../config/api';
import { apiFetch } from '../utils/apiClient';
import { type Product } from './merchandiseService';

export type EventType = 'view' | 'click' | 'favorite' | 'assist' | 'group_join' | 'purchase';

// 「即将成团 / 帮 TA 助力」：进行中的团购，按紧迫分排序
export async function getGroupBuyToAssist(limit = 20): Promise<Product[]> {
  const data = await apiFetch<{ products: Product[] }>(
    `${API_BASE_URL}/api/recommendation/group-buy?limit=${limit}`,
  );
  return data.products;
}

// 行为埋点：在 浏览/点击/收藏/助力/参团/购买 时调用（静默，失败不打扰用户）
export async function trackEvent(productId: string, eventType: EventType): Promise<void> {
  try {
    await apiFetch(`${API_BASE_URL}/api/recommendation/track`, {
      method: 'POST',
      body: { productId, eventType },
      silent: true,
    });
  } catch {
    // 埋点失败不影响主流程
  }
}

// 帖子软行为埋点：曝光/点开/停留/视频完播（静默）。未登录直接跳过。
export type PostEventType =
  | 'impression'
  | 'view'
  | 'dwell'
  | 'video_complete'
  | 'video_5s'
  | 'skip';

export async function trackPostEvent(
  postId: string,
  eventType: PostEventType,
  durationSec?: number,
): Promise<void> {
  if (!localStorage.getItem('sweetcorn_jwt_token')) return; // 只记登录用户
  try {
    await apiFetch(`${API_BASE_URL}/api/recommendation/track`, {
      method: 'POST',
      body: { targetType: 'post', targetId: postId, eventType, duration: durationSec },
      silent: true,
    });
  } catch {
    // 埋点失败不影响主流程
  }
}
