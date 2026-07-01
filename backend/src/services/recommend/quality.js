const prisma = require('../../config/prisma');
const cfg = require('./config');

// 计算候选帖子的「内容质量基础分」，与用户无关，并在类目内归一化到 [0,1]。
// 输入 posts: [{ id, category, likeCount, commentCount, ... }]
// 返回 Map<postId, qualityNorm(0~1)>
async function computeQuality(posts) {
  const result = new Map();
  if (!posts.length) return result;

  // 聚合每条帖子的软行为计数（impression/view/skip/video_5s/video_complete）
  const ids = posts.map((p) => p.id);
  const grouped = await prisma.userEvent.groupBy({
    by: ['targetId', 'eventType'],
    where: { targetType: 'post', targetId: { in: ids } },
    _count: { _all: true },
  });
  const counts = new Map(); // postId -> { impression, view, skip, video_5s, video_complete }
  for (const g of grouped) {
    if (!counts.has(g.targetId)) counts.set(g.targetId, {});
    counts.get(g.targetId)[g.eventType] = g._count._all;
  }

  const Q = cfg.QUALITY;
  const raw = new Map(); // postId -> qRaw
  for (const p of posts) {
    const c = counts.get(p.id) || {};
    const imp = (c.impression || 0) + Q.smoothing; // 平滑分母
    const ctr = (c.view || 0) / imp;
    const completion = c.video_5s ? (c.video_complete || 0) / c.video_5s : 0;
    const engagement = ((p.likeCount || 0) + (p.commentCount || 0)) / imp;
    const skipRate = (c.skip || 0) / imp;
    const qRaw =
      Q.ctr * ctr + Q.completion * completion + Q.engagement * engagement - Q.skipPenalty * skipRate;
    raw.set(p.id, qRaw);
  }

  // 类目内 min-max 归一化：视频的高完播、图文的高点击各自比各自
  const byCat = new Map();
  for (const p of posts) {
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category).push(p.id);
  }
  for (const idsInCat of byCat.values()) {
    const vals = idsInCat.map((id) => raw.get(id));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min;
    for (const id of idsInCat) {
      // 类目内全相等（或只有一条）→ 给中性 0.5，避免除零
      result.set(id, span > 1e-9 ? (raw.get(id) - min) / span : 0.5);
    }
  }
  return result;
}

module.exports = { computeQuality };
