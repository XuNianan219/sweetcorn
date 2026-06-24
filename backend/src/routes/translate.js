// 翻译代理：前端不再直连第三方，统一走后端。
// 使用 MyMemory 免费翻译 API（无需 key；配置邮箱可提高额度）。
// 帖子（Post）翻译做数据库缓存：每篇帖子的标题/正文译文翻译一次后存库，之后直接读库。
const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

// 邮箱可选：配了额度更高（匿名 ~5000 字/天，带邮箱 ~50000 字/天）
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || '';

// 调用 MyMemory，把中文翻成目标语言；失败时通过 res 设置状态码后抛错
async function translateViaMyMemory(text, targetLang, res) {
  const langpair = `zh|${targetLang}`;
  const params = new URLSearchParams({ q: text, langpair });
  if (MYMEMORY_EMAIL) params.set('de', MYMEMORY_EMAIL);
  const url = `https://api.mymemory.translated.net/get?${params.toString()}`;

  let mmRes;
  try {
    mmRes = await fetch(url);
  } catch (netErr) {
    res.status(502);
    throw new Error(`翻译服务请求失败：${netErr.message}`);
  }
  if (!mmRes.ok) {
    res.status(502);
    throw new Error(`翻译服务返回异常（HTTP ${mmRes.status}）`);
  }
  const data = await mmRes.json().catch(() => null);
  const translatedText = data?.responseData?.translatedText;
  const status = data?.responseStatus; // 200 成功；其它为限额/报错等
  if (!translatedText || (status && Number(status) !== 200)) {
    res.status(502);
    throw new Error(data?.responseDetails || '翻译失败，请稍后再试');
  }
  return translatedText;
}

// 可缓存译文的资源类型 → { 取 Prisma 模型, 文字字段 → 英文缓存列 }
// 各模型英文缓存列统一用 <字段>En（与帖子风格一致）。
const CACHE_CONFIG = {
  post: { model: () => prisma.post, fields: { title: 'titleEn', content: 'contentEn' } },
  timeline: { model: () => prisma.timelineEntry, fields: { title: 'titleEn', content: 'contentEn' } },
  product: { model: () => prisma.product, fields: { name: 'nameEn', description: 'descriptionEn' } },
  idea: { model: () => prisma.idea, fields: { name: 'nameEn', description: 'descriptionEn' } },
  travelExperience: {
    model: () => prisma.travelExperience,
    fields: { title: 'titleEn', category: 'categoryEn', location: 'locationEn', description: 'descriptionEn' },
  },
  travelRoute: {
    model: () => prisma.travelRoute,
    fields: { title: 'titleEn', subtitle: 'subtitleEn', description: 'descriptionEn' },
  },
};

// POST /api/translate  body: { text, targetLang?, type?, id?, postId?, field? }
// - type ∈ CACHE_CONFIG 的键（post/timeline/product/idea/travelExperience/travelRoute）
// - field ∈ 该 type 支持的文字字段；为兼容旧调用，postId 等价于 type='post'+id=postId
// 命中条件满足且 targetLang='en' 时启用译文缓存（先读库，未命中翻译后写回）
router.post('/', async (req, res, next) => {
  try {
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    const targetLang =
      typeof req.body.targetLang === 'string' && req.body.targetLang.trim()
        ? req.body.targetLang.trim()
        : 'en';
    const field = typeof req.body.field === 'string' ? req.body.field : '';

    // 兼容旧的 postId 调用，同时支持通用的 type + id
    const postId = typeof req.body.postId === 'string' ? req.body.postId.trim() : '';
    let type = typeof req.body.type === 'string' ? req.body.type : '';
    let id = typeof req.body.id === 'string' ? req.body.id.trim() : '';
    if (postId) {
      type = 'post';
      id = postId;
    }

    if (!text) {
      res.status(400);
      throw new Error('翻译内容不能为空');
    }

    // ── 译文缓存（仅英文）：先读库，命中直接返回；未命中翻译后写回 ──
    const conf = CACHE_CONFIG[type];
    const cacheColumn = conf && field ? conf.fields[field] : undefined;
    const canCache = !!conf && !!id && !!cacheColumn && targetLang === 'en';
    if (canCache) {
      const model = conf.model();
      let record = null;
      try {
        record = await model.findUnique({
          where: { id },
          select: { id: true, [cacheColumn]: true },
        });
      } catch (_) {
        record = null; // 查询异常则退化为不缓存翻译
      }

      if (record) {
        const cached = record[cacheColumn];
        if (cached && cached.trim()) {
          return res.json({ translatedText: cached, cached: true });
        }
        const translatedText = await translateViaMyMemory(text, targetLang, res);
        // 写回缓存（失败不影响返回译文）
        try {
          await model.update({ where: { id }, data: { [cacheColumn]: translatedText } });
        } catch (_) {
          /* 忽略写库失败 */
        }
        return res.json({ translatedText, cached: false });
      }
      // 记录不存在则退化为普通翻译
    }

    // ── 普通翻译（无缓存）：未带可缓存标识的场景走这里 ──
    const translatedText = await translateViaMyMemory(text, targetLang, res);
    res.json({ translatedText });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
