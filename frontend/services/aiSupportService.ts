// services/aiSupportService.ts —— AI 客服（基于后端 FAQ 知识库的 Claude 问答）
import { apiFetch } from '../utils/apiClient';
import { API_BASE_URL } from '../config/api';

const BASE_URL = `${API_BASE_URL}/api`;

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 发送对话历史，返回 AI 回复。AI 生成较慢，超时放宽到 30s；
// 错误不走全局 toast，由客服面板内联展示。
export async function askAiSupport(messages: AiChatMessage[]): Promise<string> {
  const res = await apiFetch<{ reply: string }>(`${BASE_URL}/chat`, {
    method: 'POST',
    body: { messages },
    silent: true,
    timeoutMs: 30000,
  });
  return res.reply;
}
