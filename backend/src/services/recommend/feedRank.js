const prisma = require('../../config/prisma');
const cfg = require('./config');
const { buildUserProfile } = require('./profile');
const { computeQuality } = require('./quality');

const postSelect = {
  id: true,
  authorId: true,
  category: true,
  hashtags: true,
  title: true,
  content: true,
  mediaType: true,
  mediaUrls: true,
  createdAt: true,
  author: { select: { id: true, nickname: true, avatarUrl: true } },
  _count: { select: { likes: true, comments: { where: { deletedAt: null } } } },
};

// ① 用户匹配度（含冷启动保底），可 >1
function interest(profile, post, norm) {
  let s = cfg.INTEREST_BASE;
  if (profile.followingAuthorIds.has(post.authorId)) s += cfg.INTEREST_FOLLOW;
  if (post.category && norm.maxCat > 0) {
    s += cfg.INTEREST_CATEGORY * ((profile.categoryScores.get(post.category) || 0) / norm.maxCat);
  }
  if (norm.maxTag > 0 && post.hashtags && post.hashtags.length) {
    const best = Math.max(0, ...post.hashtags.map((t) => profile.tagScores.get(t) || 0));
    s += cfg.INTEREST_TAG * (best / norm.maxTag);
  }
  return s;
}

// ② 新鲜度时间衰减（有下限）
function freshness(post) {
  const halflife = cfg.FRESHNESS_HALFLIFE_HOURS[post.category] || cfg.FRESHNESS_HALFLIFE_HOURS._default;
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000;
  return cfg.FRESHNESS_FLOOR + (1 - cfg.FRESHNESS_FLOOR) * Math.pow(0.5, ageHours / halflife);
}

// ③ 近期负反馈惩罚
function penalty(profile, post) {
  const cap = cfg.PENALTY.cap;
  const a = Math.min(profile.skipAuthorCounts.get(post.authorId) || 0, cap) / cap;
  const c = Math.min(profile.skipCategoryCounts.get(post.category) || 0, cap) / cap;
  return cfg.PENALTY.skipAuthor * a + cfg.PENALTY.skipCategory * c;
}

// 多样性打散：同作者靠后条降权后重排。
// 注意负分（被负反馈罚成负数）不能乘 0.5——负数乘 0.5 反而变大等于提权，改为除。
function diversify(scored) {
  const seen = new Map();
  for (const it of scored) {
    const n = seen.get(it.post.authorId) || 0;
    const f = Math.pow(0.5, n);
    it.score = it.score > 0 ? it.score * f : it.score / f;
    seen.set(it.post.authorId, n + 1);
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// 新内容强曝光（gap 3）：结果里强制留 NEW_CONTENT_RATIO 名额给「发布 < 24h」的内容，
// 防止新帖永远沉底。先按分数取头部，再从剩余候选里挑最新的补足新内容配额。
function reserveFreshContent(scored, limit) {
  const now = Date.now();
  const isFresh = (it) =>
    (now - new Date(it.post.createdAt).getTime()) / 3_600_000 < cfg.NEW_CONTENT_MAX_AGE_HOURS;

  const freshQuota = Math.floor(limit * cfg.NEW_CONTENT_RATIO);
  const head = scored.slice(0, limit); // 按分数的原始头部
  const freshInHead = head.filter(isFresh).length;
  const need = Math.max(0, freshQuota - freshInHead);
  if (need === 0) return head;

  // 从头部之外的候选里，按发布时间挑最新的新内容补进来（替换头部尾端最低分的非新内容）
  const tailFresh = scored
    .slice(limit)
    .filter(isFresh)
    .sort((a, b) => new Date(b.post.createdAt) - new Date(a.post.createdAt))
    .slice(0, need);
  if (tailFresh.length === 0) return head;

  // 从头部末尾往前替换「非新内容」，保住高分新内容
  const result = [...head];
  let replaced = 0;
  for (let i = result.length - 1; i >= 0 && replaced < tailFresh.length; i--) {
    if (!isFresh(result[i])) {
      result[i] = tailFresh[replaced++];
    }
  }
  return result;
}

// 对「已归一化的候选帖子」打分排序（步骤 2~5），供 /api/recommend/feed 和首页 /api/feed/discover 复用。
// posts: [{ ...post, likeCount, commentCount }]；limit 控制新内容配额的窗口（传 posts.length 表示全量重排）。
// 返回 [{ post, score, parts }]。
async function rankCandidates(profile, posts, limit) {
  // 内容质量（类目内归一化）
  const qualityMap = await computeQuality(posts);

  // 兴趣归一化基准
  const norm = {
    maxCat: Math.max(0, ...profile.categoryScores.values()),
    maxTag: Math.max(0, ...profile.tagScores.values()),
  };

  // 综合打分：质量 × 匹配度 × 新鲜度 − 负反馈
  let scored = posts.map((post) => {
    const q = qualityMap.get(post.id) ?? 0.5;
    const it = interest(profile, post, norm);
    const fr = freshness(post);
    const pen = penalty(profile, post);
    const score = q * it * fr - pen;
    return { post, score, parts: { q, it, fr, pen } };
  });

  // 排序 → 打散 → 新内容配额
  scored.sort((a, b) => b.score - a.score);
  scored = diversify(scored);
  scored = reserveFreshContent(scored, limit);
  return scored;
}

// userId + 可选 { mediaType, limit }。返回 { items, reason }。
async function getFeedRecommendations(userId, opts = {}) {
  const limit = opts.limit || cfg.RESULT_LIMIT;
  const mediaFilter = opts.mediaType ? { mediaType: opts.mediaType } : {};

  // 1. 召回：近 7 天 + 关注作者，不足则最新帖子兜底
  const since = new Date(Date.now() - cfg.RECALL_DAYS * 86_400_000);
  const profile = await buildUserProfile(userId);
  let raw = await prisma.post.findMany({
    where: {
      deletedAt: null,
      ...mediaFilter,
      OR: [{ createdAt: { gte: since } }, { authorId: { in: [...profile.followingAuthorIds] } }],
    },
    select: postSelect,
    orderBy: { createdAt: 'desc' },
    take: cfg.RECALL_LIMIT,
  });
  if (raw.length < limit) {
    const have = new Set(raw.map((p) => p.id));
    const backfill = await prisma.post.findMany({
      where: { deletedAt: null, ...mediaFilter, id: { notIn: [...have] } },
      select: postSelect,
      orderBy: { createdAt: 'desc' },
      take: limit * 3 - raw.length,
    });
    raw = raw.concat(backfill);
  }
  if (raw.length === 0) return { items: [], reason: 'empty' };

  const posts = raw.map((p) => ({ ...p, likeCount: p._count.likes, commentCount: p._count.comments }));

  // 冷启动判定（gap 4）：偏好标签太少 → 走热度路径（此处即"按质量+新鲜度"，兴趣项自然退化）
  const reason =
    profile.categoryScores.size < cfg.COLD_START_MIN_TAGS ? 'cold_start' : 'personalized';

  // 2~5. 打分 → 排序 → 打散 → 新内容配额 → 截断
  const scored = await rankCandidates(profile, posts, limit);

  const items = scored.slice(0, limit).map(({ post, score, parts }) => {
    const { _count, ...rest } = post;
    return {
      ...rest,
      score: Number(score.toFixed(4)),
      _parts: {
        quality: Number(parts.q.toFixed(3)),
        interest: Number(parts.it.toFixed(3)),
        freshness: Number(parts.fr.toFixed(3)),
        penalty: Number(parts.pen.toFixed(3)),
      },
    };
  });
  return { items, reason };
}

module.exports = { getFeedRecommendations, rankCandidates };
