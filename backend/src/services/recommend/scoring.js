// 推荐打分工具：三个纯函数，不查库、无副作用。
// 输入的 post 是「已归一化」的普通对象（计数已由上游从 Prisma _count 映射成字段）：
//   { id, authorId, category, likeCount, commentCount, createdAt }
// 输入的 user 是「已构建好的画像」对象（由步骤 2 组装）：
//   { followingAuthorIds: Set<string>, favoriteCategories: Set<string> }

// (a) 热度分：高互动 + 时间衰减。本项目无分享字段，故去掉 分享*5 那一项。
function hotScore(post) {
  const likes = post.likeCount || 0;
  const comments = post.commentCount || 0;
  const numerator = likes * 1 + comments * 3;
  const hours = (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000;
  const denominator = Math.pow(hours + 2, 1.5); // +2 防止刚发的帖分母过小爆分
  return numerator / denominator;
}

// (b) 兴趣匹配分：0~1。先用简单规则。
function interestScore(user, post) {
  let score = 0.2; // 基础分
  if (user.followingAuthorIds && user.followingAuthorIds.has(post.authorId)) {
    score += 0.5; // 关注了该作者
  }
  if (user.favoriteCategories && post.category && user.favoriteCategories.has(post.category)) {
    score += 0.3; // 该分类是用户常看的
  }
  return Math.min(1, score);
}

// (c) 综合分：乘法保底 + 加法加成。
// 最终分 = 核心分(兴趣) × 互动加成 × 归一化热度权重
// ctx 提供候选集内的归一化基准（由步骤 2 算好传入），避免纯函数自己去扫全量：
//   { maxLikes, maxComments, maxHotScore }
function rankScore(user, post, ctx = {}) {
  const core = interestScore(user, post); // 不匹配 → core 小 → 整体崩塌（保底）

  const maxLikes = ctx.maxLikes || 1;
  const maxComments = ctx.maxComments || 1;
  const normLikes = Math.min(1, (post.likeCount || 0) / maxLikes);
  const normComments = Math.min(1, (post.commentCount || 0) / maxComments);
  const engagementBoost = 1 + 0.3 * normLikes + 0.5 * normComments; // 鼓励高互动

  const maxHot = ctx.maxHotScore || 1;
  const normHot = Math.min(1, hotScore(post) / maxHot); // 归一化到 0~1 的热度权重
  // 冷启动保底（仿抖音流量池）：零互动新帖不判死刑，保留 10% 探索权重，
  // 让匹配用户兴趣的新内容也能拿到小流量试探，而不是被热度直接乘成 0。
  const hotWeight = 0.1 + 0.9 * normHot;

  return core * engagementBoost * hotWeight;
}

module.exports = { hotScore, interestScore, rankScore };
