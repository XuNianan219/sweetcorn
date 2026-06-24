
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { getApiBase } from "../config/api";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || '';

export class GeminiService {
  // 不在构造时创建客户端：无 API key 时 GoogleGenAI 会抛错，导致整个模块加载崩溃。
  // 各方法在调用时各自创建客户端（并自行校验 key）。

  async generateVeoVideo(prompt: string, base64Image?: string) {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: base64Image ? {
        imageBytes: base64Image,
        mimeType: 'image/png',
      } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // 把中文文本翻译成自然英文（用于帖子/日记「看英文」）
  // 改为走自家后端代理（/api/translate → MyMemory 免费翻译），不再前端直连第三方。
  // 可选传入缓存标识：
  //   - 帖子：{ postId, field }
  //   - 日记：{ type:'timeline', id, field }
  // 后端据此把译文缓存进数据库（翻译一次后存库，之后读库）。不传则仅做普通翻译。
  async translateToEnglish(
    text: string,
    opts?: {
      postId?: string;
      type?: 'post' | 'timeline' | 'product' | 'idea' | 'travelExperience' | 'travelRoute';
      id?: string;
      field?: string;
    },
  ): Promise<string> {
    if (!text.trim()) return '';
    const res = await fetch(`${getApiBase()}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetLang: 'en',
        ...(opts?.postId ? { postId: opts.postId } : {}),
        ...(opts?.type ? { type: opts.type } : {}),
        ...(opts?.id ? { id: opts.id } : {}),
        ...(opts?.field ? { field: opts.field } : {}),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({} as { message?: string }));
      throw new Error((err as { message?: string }).message || '翻译失败');
    }
    const data = await res.json();
    return (data.translatedText || '').trim();
  }

  async editImage(prompt: string, base64Image: string) {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: prompt },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  }
}

export const geminiService = new GeminiService();
