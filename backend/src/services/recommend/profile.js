const prisma = require('../../config/prisma');
const cfg = require('./config');

// 时间衰减系数：0.5^(age_days / 半衰期)
function decay(createdAt, halflifeDays = cfg.BEHAVIOR_HALFLIFE_DAYS) {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return Math.pow(0.5, ageDays / halflifeDays);
}

// 帖子「应有阅读秒数」：正文字数/速度 + 图片数×每图秒
function expectedReadSec(post) {
  const chars = (post.content || '').length;
  const imgs = Array.isArray(post.mediaUrls) ? post.mediaUrls.length : 0;
  return Math.max(3, chars / cfg.READ_CHARS_PER_SEC + imgs * cfg.READ_SEC_PER_IMAGE);
}

function addScore(map, key, val) {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + val);
}

// 把一次「正向行为」按 权重×时间衰减 累加到 类目分 / 标签分
function accumulate(profile, post, baseWeight, at) {
  const w = baseWeight * decay(at);
  if (w <= 0) return;
  addScore(profile.categoryScores, post.category, w);
  for (const tag of post.hashtags || []) addScore(profile.tagScores, tag, w);
}

// 构建用户画像（仅帖子域：帖子软行为 + 帖子赞/评论 + 关注）
async function buildUserProfile(userId) {
  const profile = {
    followingAuthorIds: new Set(),
    categoryScores: new Map(),
    tagScores: new Map(),
    skipAuthorCounts: new Map(),
    skipCategoryCounts: new Map(),
  };
  if (!userId) return profile;

  const since = new Date(Date.now() - cfg.BEHAVIOR_WINDOW_DAYS * 86_400_000);
  const W = cfg.SIGNAL_WEIGHTS;

  // 关注作者
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  follows.forEach((f) => profile.followingAuthorIds.add(f.followingId));

  // 帖子点赞（likes 表）
  const likes = await prisma.like.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true, post: { select: { category: true, hashtags: true } } },
  });
  likes.forEach((l) => l.post && accumulate(profile, l.post, W.like, l.createdAt));

  // 帖子评论（comments 表）
  const comments = await prisma.comment.findMany({
    where: { authorId: userId, deletedAt: null, createdAt: { gte: since } },
    select: { createdAt: true, post: { select: { category: true, hashtags: true } } },
  });
  comments.forEach((c) => c.post && accumulate(profile, c.post, W.comment, c.createdAt));

  // 帖子软行为（user_events, target_type='post'）
  const events = await prisma.userEvent.findMany({
    where: { userId, targetType: 'post', createdAt: { gte: since } },
    select: { targetId: true, eventType: true, duration: true, createdAt: true },
  });
  if (events.length) {
    const ids = [...new Set(events.map((e) => e.targetId).filter(Boolean))];
    const posts = await prisma.post.findMany({
      where: { id: { in: ids } },
      select: { id: true, authorId: true, category: true, hashtags: true, content: true, mediaUrls: true },
    });
    const postMap = new Map(posts.map((p) => [p.id, p]));

    const penaltySince = Date.now() - cfg.PENALTY.windowDays * 86_400_000;
    for (const e of events) {
      const post = postMap.get(e.targetId);
      if (!post) continue;
      if (e.eventType === 'skip') {
        // 负反馈：进惩罚表，不进兴趣分。只看近期（PENALTY.windowDays），
        // 否则 60 天窗口会把 cap 轻易灌满，惩罚变成永久标签。
        if (new Date(e.createdAt).getTime() < penaltySince) continue;
        addScore(profile.skipAuthorCounts, post.authorId, 1);
        addScore(profile.skipCategoryCounts, post.category, 1);
        continue;
      }
      let baseWeight = W[e.eventType];
      if (baseWeight === undefined || baseWeight <= 0) continue; // impression 等中性跳过
      if (e.eventType === 'dwell') {
        // dwell 归一化：实际停留 / 应有阅读时长，封顶 1
        const ratio = Math.min(1, (e.duration || 0) / expectedReadSec(post));
        baseWeight *= ratio;
      }
      accumulate(profile, post, baseWeight, e.createdAt);
    }
  }

  return profile;
}

module.exports = { buildUserProfile, decay, expectedReadSec };
