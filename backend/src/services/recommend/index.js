const prisma = require('../../config/prisma');
const { hotScore, rankScore } = require('./scoring');

const RECALL_DAYS = 7; // 召回时间窗
const RECALL_LIMIT = 500; // 召回上限，防止全表扫描
const RESULT_LIMIT = 20; // 最终返回条数

// 多样性打散：同一作者在结果里重复出现时，对靠后的那几条降权，
// 再重新排序。简单实现：同作者第 2 条 ×0.5、第 3 条 ×0.25…（按当前分数高低顺序遍历）。
function diversify(scored) {
  const seen = new Map();
  for (const item of scored) {
    const n = seen.get(item.post.authorId) || 0;
    item.score *= Math.pow(0.5, n);
    seen.set(item.post.authorId, n + 1);
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// 根据 userId 返回排序后的推荐帖子列表
async function getRecommendations(userId) {
  // ── 1. 构建用户画像 ─────────────────────────────
  // 关注的作者
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingAuthorIds = new Set(follows.map((f) => f.followingId));

  // 常看分类：取用户最近点赞过的帖子分类里出现最多的前 3 个
  const liked = await prisma.like.findMany({
    where: { userId },
    select: { post: { select: { category: true } } },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  const catCount = {};
  for (const l of liked) {
    const c = l.post && l.post.category;
    if (c) catCount[c] = (catCount[c] || 0) + 1;
  }
  const favoriteCategories = new Set(
    Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c)
  );

  const userProfile = { followingAuthorIds, favoriteCategories };

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

  // ── 2. 召回：近 7 天的帖子 + 关注作者的帖子（OR 天然去重）──
  const since = new Date(Date.now() - RECALL_DAYS * 24 * 3600 * 1000);
  let rawPosts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      OR: [{ createdAt: { gte: since } }, { authorId: { in: [...followingAuthorIds] } }],
    },
    select: postSelect,
    orderBy: { createdAt: 'desc' },
    take: RECALL_LIMIT,
  });

  // 兜底流量池（仿抖音）：主召回池不足时，用最新帖子回填，保证任何情况下都有内容可推。
  if (rawPosts.length < RESULT_LIMIT) {
    const have = new Set(rawPosts.map((p) => p.id));
    const backfill = await prisma.post.findMany({
      where: { deletedAt: null, id: { notIn: [...have] } },
      select: postSelect,
      orderBy: { createdAt: 'desc' },
      take: RESULT_LIMIT * 3 - rawPosts.length,
    });
    rawPosts = rawPosts.concat(backfill);
  }
  if (rawPosts.length === 0) return [];

  // ── 3. 归一化 _count → likeCount / commentCount 字段（供打分函数读）──
  const posts = rawPosts.map((p) => ({
    ...p,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
  }));

  // ── 4. 候选集内的归一化基准 ──────────────────────
  const ctx = {
    maxLikes: Math.max(1, ...posts.map((p) => p.likeCount)),
    maxComments: Math.max(1, ...posts.map((p) => p.commentCount)),
    maxHotScore: Math.max(...posts.map((p) => hotScore(p))) || 1,
  };

  // ── 5. 打分 ──────────────────────────────────────
  let scored = posts.map((post) => ({ post, score: rankScore(userProfile, post, ctx) }));

  // ── 6. 排序 ──────────────────────────────────────
  scored.sort((a, b) => b.score - a.score);

  // ── 7. 多样性打散 ────────────────────────────────
  scored = diversify(scored);

  // ── 8. 取前 20，剥掉内部 _count，附带 score ────────
  return scored.slice(0, RESULT_LIMIT).map(({ post, score }) => {
    const { _count, ...rest } = post;
    return { ...rest, score: Number(score.toFixed(4)) };
  });
}

module.exports = { getRecommendations };
